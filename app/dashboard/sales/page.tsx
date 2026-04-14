'use client';

import React, { useEffect, useMemo, useRef, useState } from "react";
import { format, subDays, parseISO, isWeekend, startOfWeek, startOfMonth } from "date-fns";
import { id } from "date-fns/locale";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Line,
  LineChart,
  Legend,
} from "recharts";
import { Clock, Ticket, DollarSign, Calendar, AlertTriangle, Clock4, ArrowUp, ArrowDown, FileDown } from 'lucide-react';
import { DateRangeFilter } from '@/components/filters/date-range-filter';
import { Button } from '@/components/ui/button';

import {
  getCities,
  getCinemaBreakdown,
  getSystemHealth,
  getSalesAnalyticsBundle,
  type CinemaBreakdownResponse,
  type SalesAnalyticsBundlePayload,
} from "@/lib/cinetrack-api";
import { useDashboardUrlFilters } from "@/hooks/use-dashboard-url-filters";

// ===========================
// TYPE DEFININTS
// ===========================

type SalesPayload = {
  overview: SalesAnalyticsBundlePayload["overview"] | null;
  revenueByCinema: SalesAnalyticsBundlePayload["revenue_by_cinema"] | null;
  revenueByMovie: SalesAnalyticsBundlePayload["revenue_by_movie"] | null;
  timeSlots: SalesAnalyticsBundlePayload["time_slots"] | null;
  trend: SalesAnalyticsBundlePayload["trend"] | null;
  weekendWeekday: SalesAnalyticsBundlePayload["weekend_vs_weekday"] | null;
  payment: SalesAnalyticsBundlePayload["payment"] | null;
  operationalRisk: SalesAnalyticsBundlePayload["operational_risk"] | null;
};

// ===========================
// STYLE HELPERS & UTILS
// ===========================

const formatCurrency = (value: number | undefined | null) => {
    if (value == null) return "-";
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
}

const normalizeRecommendation = (text: string) => {
    return text
        .replace(
            /Demand bagus,\s*evaluasi harga dan alokasi studio agar monetisasi naik\./gi,
            "Demand is strong, evaluate pricing and studio allocation to increase monetization."
        )
        .replace(/Demand bagus/gi, "Demand is strong")
        .replace(/evaluasi harga/gi, "review pricing")
        .replace(/alokasi studio/gi, "studio allocation")
        .replace(/monetisasi naik/gi, "increase monetization")
        .replace(/\s+/g, " ")
        .trim();
};

// ===========================
// PAGE COMPONENT
// ===========================

export default function SalesAnalyticsPage() {
    const {
        selectedCity,
        selectedCinema,
        dateRange,
        setCity,
        setCinema,
        setDateRange,
        apiQuery: query,
    } = useDashboardUrlFilters();

    const dateRangeRef = useRef(dateRange);
    dateRangeRef.current = dateRange;

    const [cities, setCities] = useState<string[]>([]);
    const [cinemas, setCinemas] = useState<CinemaBreakdownResponse["breakdown"]>([]);
    const [loading, setLoading] = useState(true);
    
    const [dashboardData, setDashboardData] = useState<SalesPayload>({
        overview: null,
        revenueByCinema: null,
        revenueByMovie: null,
        timeSlots: null,
        trend: null,
        weekendWeekday: null,
        payment: null,
        operationalRisk: null,
    });

    useEffect(() => {
        if (selectedCinema === "all") return;
        const valid = cinemas.some(
            (c) => c.cinema_id === selectedCinema && (selectedCity === "all" || c.city === selectedCity)
        );
        if (!valid) setCinema("all");
    }, [cinemas, selectedCinema, selectedCity, setCinema]);

    // Initial Filter Setup
    useEffect(() => {
        let cancelled = false;

        const loadFilters = async () => {
            const [citiesResult, cinemaResult] = await Promise.allSettled([
                getCities(),
                getCinemaBreakdown(),
            ]);

            if (cancelled) return;

            if (citiesResult.status === "fulfilled") setCities(citiesResult.value);
            if (cinemaResult.status === "fulfilled") setCinemas(cinemaResult.value.breakdown);

            // Keep health fetch async so dashboard data can load immediately.
            if (!dateRangeRef.current?.from) {
                getSystemHealth()
                    .then((health) => {
                        if (cancelled || !health.last_data_in || dateRangeRef.current?.from) return;
                        const endDate = new Date(health.last_data_in);
                        const startDate = subDays(endDate, 6);
                        setDateRange({ from: startDate, to: endDate });
                    })
                    .catch(() => {});
            }
        };

        loadFilters();
        return () => { cancelled = true; };
    }, [setDateRange]);

    // Load Data
    useEffect(() => {
        let cancelled = false;

        const loadDashboard = async () => {
            setLoading(true);
            try {
                const bundle = await getSalesAnalyticsBundle({
                    ...query,
                    cinema_top_n: "10",
                    movie_top_n: "7",
                });
                if (cancelled) return;
                setDashboardData({
                    overview: bundle.overview,
                    revenueByCinema: bundle.revenue_by_cinema,
                    revenueByMovie: bundle.revenue_by_movie,
                    timeSlots: bundle.time_slots,
                    trend: bundle.trend,
                    weekendWeekday: bundle.weekend_vs_weekday,
                    payment: bundle.payment,
                    operationalRisk: bundle.operational_risk,
                });
            } catch {
                if (cancelled) return;
                setDashboardData({
                    overview: null,
                    revenueByCinema: null,
                    revenueByMovie: null,
                    timeSlots: null,
                    trend: null,
                    weekendWeekday: null,
                    payment: null,
                    operationalRisk: null,
                });
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        loadDashboard();
        return () => { cancelled = true; };
    }, [query]);

    // Data Processing
    const totalTickets = dashboardData.overview?.total_tickets ?? 0;
    const totalRevenue = dashboardData.overview?.total_revenue ?? 0;
    const avgTicketPrice = dashboardData.overview?.avg_ticket_price ?? 35000;
    
    // Average tickets per day based on date filter length
    const diffDays =
        dateRange?.from && dateRange?.to
            ? Math.max(
                  1,
                  (dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24) + 1
              )
            : 7;
    const avgTicketsPerDay = totalTickets / diffDays;

    // Tickets per day trend
    const { ticketsPerDay, ticketsPerWeek, ticketsPerMonth } = useMemo(() => {
        if (!dashboardData.trend?.breakdown) return { ticketsPerDay: [], ticketsPerWeek: [], ticketsPerMonth: [] };
        
        const dayMap = new Map();
        const weekMap = new Map();
        const monthMap = new Map();

        dashboardData.trend.breakdown.forEach(t => {
            let dateObj;
            try { dateObj = parseISO(t.time_group); } catch { dateObj = new Date(); }
            
            const tickets = t.total_tickets ?? 0;
            
            // Day
            dayMap.set(dateObj.getTime(), {
                name: format(dateObj, "d MMM", { locale: id }),
                tickets: tickets,
                isWeekend: isWeekend(dateObj)
            });

            // Week
            const weekKey = format(startOfWeek(dateObj, { weekStartsOn: 1 }), "w-yyyy");
            const weekName = `Mg ${format(dateObj, "w")}, ${format(dateObj, "MMM")}`;
            if (!weekMap.has(weekKey)) weekMap.set(weekKey, { name: weekName, tickets: 0 });
            weekMap.get(weekKey).tickets += tickets;

            // Month
            const monthKey = format(startOfMonth(dateObj), "yyyy-MM");
            const monthName = format(dateObj, "MMM yyyy", { locale: id });
            if (!monthMap.has(monthKey)) monthMap.set(monthKey, { name: monthName, tickets: 0 });
            monthMap.get(monthKey).tickets += tickets;
        });

        return {
            ticketsPerDay: Array.from(dayMap.values()),
            ticketsPerWeek: Array.from(weekMap.values()),
            ticketsPerMonth: Array.from(monthMap.values()),
        };
    }, [dashboardData.trend, avgTicketPrice]);

    const monthlyRevenueData = useMemo(() => {
        if (!dashboardData.trend?.yearly_breakdown) return [];
        return dashboardData.trend.yearly_breakdown;
    }, [dashboardData.trend]);

    const revenuePerMovie = useMemo(() => {
        if (!dashboardData.revenueByMovie?.breakdown) return [];
        return dashboardData.revenueByMovie.breakdown
            .map((m) => ({
                name: m.title,
                revenue: m.total_revenue,
                contribution: m.contribution ?? 0,
                totalTickets: m.total_tickets ?? 0,
            }))
            .sort((a, b) => b.revenue - a.revenue);
    }, [dashboardData.revenueByMovie]);

    const weekendWeekdayChart = useMemo(() => {
        if (!dashboardData.weekendWeekday?.breakdown?.length) return [];
        return dashboardData.weekendWeekday.breakdown.map((row) => ({
            name: row.day_type === "weekend" ? "Weekend" : "Weekday",
            revenue: row.total_revenue,
            tickets: row.total_tickets ?? 0,
            occupancy: row.occupancy ?? 0,
        }));
    }, [dashboardData.weekendWeekday]);

    const paymentBreakdownRows = useMemo(() => {
        if (!dashboardData.payment?.breakdown?.length) return [];
        return [...dashboardData.payment.breakdown].sort(
            (a, b) => (b.usage_rate ?? 0) - (a.usage_rate ?? 0)
        );
    }, [dashboardData.payment]);

    const occupancyPerCinema = useMemo(() => {
        if (!dashboardData.revenueByCinema?.breakdown) return [];
        return dashboardData.revenueByCinema.breakdown.map(c => ({
            name: c.cinema_name,
            city: c.city,
            occupancy: c.occupancy ?? c.metrics?.occupancy ?? 0
        })).sort((a,b) => b.occupancy - a.occupancy);
    }, [dashboardData.revenueByCinema]);

    const ticketsByHour = useMemo(() => {
        if (!dashboardData.timeSlots?.breakdown) return [];
        return dashboardData.timeSlots.breakdown.map(s => ({
            hour: s.time_slot,
            tickets: Math.floor(s.revenue / avgTicketPrice)
        }));
    }, [dashboardData.timeSlots, avgTicketPrice]);

    const busiestHour = dashboardData.timeSlots?.peak_sales_hour?.time_slot ?? "-";
    const quietestHour = dashboardData.timeSlots?.quiet_hour?.time_slot ?? "-";
    const peakHourRecommendation = normalizeRecommendation(
        dashboardData.timeSlots?.peak_sales_hour?.recommendation ?? ""
    );

    const cancelledShows = dashboardData.operationalRisk?.summary?.cancelled ?? 0;
    const delayedShows = dashboardData.operationalRisk?.summary?.delayed ?? 0;
    const avgDelay = dashboardData.operationalRisk?.summary?.avg_delay_minutes ?? 0;
    
    const sortedSchedules = React.useMemo(() => {
        if (!dashboardData.operationalRisk?.problematic_schedules) return [];
        return dashboardData.operationalRisk.problematic_schedules.map((s) => {
            let parsedDate = new Date();
            try {
                const dateStr = s.show_date
                    ? String(s.show_date).slice(0, 10)
                    : null;
                if (dateStr && s.start_time) {
                    const t = String(s.start_time).trim();
                    const timePart = t.length <= 8 ? t : t.split(" ")[1] ?? t;
                    parsedDate = parseISO(`${dateStr}T${timePart}`);
                } else if (s.start_time) {
                    if (s.start_time.length <= 8) {
                        const [h, m] = s.start_time.split(":");
                        parsedDate = new Date();
                        parsedDate.setHours(parseInt(h, 10), parseInt(m, 10), 0, 0);
                    } else {
                        parsedDate = new Date(s.start_time);
                    }
                }
            } catch {
                parsedDate = new Date();
            }
            return {
                id: s.schedule_id,
                movieTitle: s.movie?.title ?? s.title ?? "Unknown Movie",
                cinemaName: s.cinema?.cinema_name ?? s.cinema_name ?? "Unknown Cinema",
                scheduledTime: parsedDate,
                status: s.status,
                delayMinutes: s.delay_minutes ?? 0,
            };
        });
    }, [dashboardData.operationalRisk]);

    // ── Auto-computed insights ──────────────────────────────────────────────
    const topMovie = revenuePerMovie[0];
    const winnerPeriod = dashboardData.weekendWeekday?.summary?.winning_period;
    const revGap = dashboardData.weekendWeekday?.summary?.revenue_gap;
    const topPayment = paymentBreakdownRows[0];
    const avgOccupancy = occupancyPerCinema.length
        ? occupancyPerCinema.reduce((s, c) => s + c.occupancy, 0) / occupancyPerCinema.length
        : null;
    const lowOccupancy = occupancyPerCinema.filter(c => c.occupancy < 40);
    const dateLabel = dateRange?.from && dateRange?.to
        ? `${format(dateRange.from, "d MMM")}–${format(dateRange.to, "d MMM yyyy")}`
        : "active period";

    const insightBanners: { icon: React.ReactNode; text: string; color: string }[] = [];

    if (topMovie)
        insightBanners.push({
            icon: <ArrowUp className="h-3.5 w-3.5" />,
            text: `Top revenue film during ${dateLabel}: ${topMovie.name} (${topMovie.contribution.toFixed(1)}% of total).`,
            color: "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400",
        });

    if (winnerPeriod && revGap != null)
        insightBanners.push({
            icon: winnerPeriod === "weekend" ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />,
            text: `${winnerPeriod === "weekend" ? "Weekend leads" : "Weekday unggul"} selisih ${formatCurrency(revGap)} dibanding sisi satunya.`,
            color: winnerPeriod === "weekend"
                ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400"
                : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400",
        });

    if (topPayment)
        insightBanners.push({
            icon: <DollarSign className="h-3.5 w-3.5" />,
            text: `Most used payment method: ${topPayment.payment_type} (${topPayment.usage_rate.toFixed(1)}% transactions).`,
            color: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400",
        });

    if (lowOccupancy.length > 0)
        insightBanners.push({
            icon: <AlertTriangle className="h-3.5 w-3.5" />,
            text: `${lowOccupancy.length} cinemas with occupancy <40%: ${lowOccupancy.slice(0,2).map(c => c.name).join(", ")}. Consider local promotions.`,
            color: "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400",
        });

    const handleExportData = () => {
        const rows = (dashboardData.revenueByCinema?.breakdown ?? [])
            .map((item) => ({
                rank: item.rank ?? "-",
                cinema_id: item.cinema_id ?? "-",
                cinema_name: item.cinema_name ?? "-",
                city: item.city ?? "-",
                total_tickets: item.total_tickets ?? 0,
                total_revenue: item.total_revenue ?? 0,
                occupancy: item.occupancy ?? 0,
            }));

        if (rows.length === 0) {
            window.alert("No data available to export.");
            return;
        }

        const headers = Object.keys(rows[0]);
        const csvLines = [
            headers.join(","),
            ...rows.map((row) =>
                headers
                    .map((header) => {
                        const value = row[header as keyof typeof row];
                        const escaped = String(value).replace(/"/g, '""');
                        return `"${escaped}"`;
                    })
                    .join(",")
            ),
        ];

        const blob = new Blob([csvLines.join("\n")], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `sales-analytics-${format(new Date(), "yyyy-MM-dd-HHmm")}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const isInitialLoading = loading && !dashboardData.overview;

    return (
        <div className="space-y-8">

            {/* ── PAGE HEADER ─────────────────────────────────────────── */}
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between text-foreground">
                <div>
                    <h1 className="text-2xl font-bold">Sales Analytics</h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Ticket sales, revenue, and occupancy performance — {dateLabel}
                    </p>
                </div>
                <div className="flex flex-col gap-2 md:flex-row md:items-center">
                    <div className="w-full md:w-64">
                        <DateRangeFilter value={dateRange} onApply={setDateRange} triggerLabel="Select Period" />
                    </div>
                    <div className="w-full md:w-[150px]">
                        <Select value={selectedCity} onValueChange={setCity}>
                            <SelectTrigger><SelectValue placeholder="All Cities" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Cities</SelectItem>
                                {cities.map((city) => <SelectItem key={city} value={city}>{city}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="w-full md:w-[180px]">
                        <Select value={selectedCinema} onValueChange={setCinema}>
                            <SelectTrigger><SelectValue placeholder="All Cinemas" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Cinemas</SelectItem>
                                {cinemas
                                    .filter((c) => selectedCity === "all" || c.city === selectedCity)
                                    .map((c) => <SelectItem key={c.cinema_id} value={c.cinema_id}>{c.cinema_name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <Button variant="outline" className="w-full md:w-auto" onClick={handleExportData}>
                        <FileDown className="mr-2 h-4 w-4" />
                        <span>Export Data</span>
                    </Button>
                </div>
            </div>

            {/* ── AUTO INSIGHT BANNERS ───────────────────────────────────
            {insightBanners.length > 0 && (
                <div className="grid gap-2 sm:grid-cols-2">
                    {insightBanners.map((b, i) => (
                        <div key={i} className={`flex items-start gap-2 rounded-xl border px-4 py-3 text-sm font-medium ${b.color}`}>
                            <span className="mt-0.5 shrink-0">{b.icon}</span>
                            <span>{b.text}</span>
                        </div>
                    ))}
                </div>
            )}

            <Separator /> */}

            {/* ── SECTION 1 — KPI SUMMARY ─────────────────────────────── */}
            <section className="space-y-4 text-foreground">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-base font-semibold">Sales Summary</h2>
                        <p className="text-xs text-muted-foreground">Key KPIs for the selected period.</p>
                    </div>
                    {avgOccupancy != null && (
                        <Badge variant="outline" className={`text-xs ${avgOccupancy >= 70 ? "border-green-300 text-green-700" : avgOccupancy >= 40 ? "border-amber-300 text-amber-700" : "border-red-300 text-red-700"}`}>
                            Avg. Occupancy: {avgOccupancy.toFixed(1)}%
                        </Badge>
                    )}
                </div>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {[
                        { label: "Total Tickets Sold", value: totalTickets.toLocaleString("id-ID"), sub: `Average ${avgTicketsPerDay.toFixed(0)} tickets/day`, icon: <Ticket className="h-4 w-4" /> },
                        { label: "Total Revenue", value: formatCurrency(totalRevenue), sub: "Gross revenue in this period", icon: <DollarSign className="h-4 w-4" /> },
                        { label: "Average per Day", value: `${avgTicketsPerDay.toFixed(0)} tickets`, sub: `Across ${Math.round(diffDays)} active days`, icon: <Calendar className="h-4 w-4" /> },
                        { label: "Avg. Ticket Price", value: formatCurrency(avgTicketPrice), sub: "Average price per ticket", icon: <DollarSign className="h-4 w-4" /> },
                    ].map((card) => (
                        <Card key={card.label}>
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between text-muted-foreground">
                                    <CardTitle className="text-sm font-medium text-foreground">{card.label}</CardTitle>
                                    {card.icon}
                                </div>
                            </CardHeader>
                            <CardContent>
                                {isInitialLoading ? (
                                    <div className="space-y-2">
                                        <Skeleton className="h-8 w-28" />
                                        <Skeleton className="h-4 w-40" />
                                    </div>
                                ) : (
                                    <>
                                        <div className="text-2xl font-bold">{card.value}</div>
                                        <p className="mt-1 text-xs text-muted-foreground">{card.sub}</p>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Trend Chart */}
                <Card>
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-sm font-medium">Ticket Sales Trend</CardTitle>
                                <CardDescription>Sales movement by day, week, and month.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-2">
                        <Tabs defaultValue="day" className="w-full">
                            <TabsList>
                                <TabsTrigger value="day">Daily</TabsTrigger>
                                <TabsTrigger value="week">Weekly</TabsTrigger>
                                <TabsTrigger value="month">Monthly</TabsTrigger>
                            </TabsList>
                            {[
                                { value: "day", data: ticketsPerDay, note: "● = weekend" },
                                { value: "week", data: ticketsPerWeek, note: null },
                                { value: "month", data: ticketsPerMonth, note: null },
                            ].map(({ value, data, note }) => (
                                <TabsContent key={value} value={value} className="h-[260px] pt-4">
                                    {data.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={data}>
                                                <defs>
                                                    <filter id={`glow-${value}`}>
                                                        <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                                                        <feMerge>
                                                            <feMergeNode in="coloredBlur" />
                                                            <feMergeNode in="SourceGraphic" />
                                                        </feMerge>
                                                    </filter>
                                                </defs>
                                                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                                                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => value === "day" ? `${v}` : `${Math.round(Number(v) / 1000)}k`} />
                                                <Tooltip
                                                    contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))" }}
                                                    formatter={(v: number) => [v.toLocaleString("id-ID"), "Tickets"]}
                                                />
                                                {note && (
                                                    <Legend verticalAlign="top" align="right"
                                                        content={() => (
                                                            <div className="text-right text-[10px] text-muted-foreground -mt-3 mb-1">
                                                                <span className="inline-block align-middle w-2.5 h-2.5 rounded-full border-2 border-primary bg-background mr-1" />
                                                                {note}
                                                            </div>
                                                        )}
                                                    />
                                                )}
                                                <Line
                                                    type="monotone" dataKey="tickets"
                                                    stroke="hsl(var(--primary))" strokeWidth={2.5}
                                                    style={{ filter: `url(#glow-${value})` }}
                                                    activeDot={{ r: 6 }}
                                                    dot={(props: any) => {
                                                        const { cx, cy, payload } = props;
                                                        if (payload.isWeekend)
                                                            return <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={4} stroke="hsl(var(--primary))" strokeWidth={2} fill="hsl(var(--background))" />;
                                                        return <></>;
                                                    }}
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                                            Trend data is not available for this period.
                                        </div>
                                    )}
                                </TabsContent>
                            ))}
                        </Tabs>
                    </CardContent>
                </Card>
            </section>

            <Separator />

            {/* ── SECTION 2 — REVENUE TAHUNAN ─────────────────────────── */}
            {monthlyRevenueData.length > 0 && (
                <>
                    <section className="space-y-4 text-foreground">
                        <div>
                            <h2 className="text-base font-semibold">Yearly Revenue</h2>
                            <p className="text-xs text-muted-foreground">Comprehensive franchise revenue trend over the last 12 months.</p>
                        </div>
                        <Card>
                            <CardContent className="h-[260px] pt-6">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={monthlyRevenueData}>
                                        <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `Rp${Math.round(v / 1_000_000)}M`} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))" }}
                                            cursor={{ fill: "hsl(var(--secondary))" }}
                                            formatter={(v) => [formatCurrency(Number(v)), "Revenue"]}
                                        />
                                        <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </section>
                    <Separator />
                </>
            )}

            {/* ── SECTION 3 — REVENUE & OCCUPANCY ─────────────────────── */}
            <section className="space-y-4 text-foreground">
                <div>
                    <h2 className="text-base font-semibold">Revenue &amp; Occupancy</h2>
                    <p className="text-xs text-muted-foreground">
                        Revenue per movie (top 7) and seat occupancy per cinema.
                        {topMovie && ` ${topMovie.name} leads with a contribution of ${topMovie.contribution.toFixed(1)}%.`}
                    </p>
                </div>
                <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-5">
                    <div className="lg:col-span-3">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Revenue per Film (Top 7)</CardTitle>
                                <CardDescription>Hover bars to view contribution details.</CardDescription>
                            </CardHeader>
                            <CardContent className="h-[320px]">
                                {revenuePerMovie.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={revenuePerMovie} layout="vertical">
                                            <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `Rp${Number(v) / 1_000_000}jt`} />
                                            <YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} width={110} />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))" }}
                                                cursor={{ fill: "hsl(var(--secondary))" }}
                                                formatter={(value, _name, props: { payload?: (typeof revenuePerMovie)[0] }) => {
                                                    const p = props?.payload;
                                                    const share = p != null ? ` · ${p.contribution.toFixed(1)}% kontribusi` : "";
                                                    return [`${formatCurrency(Number(value))}${share}`, "Revenue"];
                                                }}
                                            />
                                            <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={18} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No revenue-by-movie data yet.</div>
                                )}
                            </CardContent>
                            {revenuePerMovie.length > 0 && (
                                <CardContent className="border-t pt-4">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Film</TableHead>
                                                <TableHead className="text-right hidden sm:table-cell">Tickets</TableHead>
                                                <TableHead className="text-right">Revenue</TableHead>
                                                <TableHead className="text-right">Contribution</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {revenuePerMovie.map((row, i) => (
                                                <TableRow key={row.name}>
                                                    <TableCell className="font-medium max-w-[140px] truncate" title={row.name}>
                                                        {i === 0 && <span className="mr-1 text-amber-500">🏆</span>}
                                                        {row.name}
                                                    </TableCell>
                                                    <TableCell className="text-right hidden sm:table-cell">{row.totalTickets.toLocaleString("id-ID")}</TableCell>
                                                    <TableCell className="text-right">{formatCurrency(row.revenue)}</TableCell>
                                                    <TableCell className="text-right font-medium">{row.contribution.toFixed(1)}%</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            )}
                        </Card>
                    </div>
                    <div className="lg:col-span-2">
                        <Card className="h-full">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Occupancy by Cinema</CardTitle>
                                <CardDescription>
                                    {avgOccupancy != null ? `Average ${avgOccupancy.toFixed(1)}% — ${lowOccupancy.length > 0 ? `${lowOccupancy.length} cinemas below 40%` : "all cinemas are in a healthy range"}` : "Seat occupancy for each cinema."}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {occupancyPerCinema.length > 0 ? (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Cinema</TableHead>
                                                <TableHead className="text-right">Occupancy</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {occupancyPerCinema.map((f, i) => (
                                                <TableRow key={i}>
                                                    <TableCell>
                                                        <div className="font-medium">{f.name}</div>
                                                        <div className="text-xs text-muted-foreground">{f.city}</div>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <span className={`text-sm font-bold ${f.occupancy >= 70 ? "text-green-600" : f.occupancy >= 40 ? "text-amber-600" : "text-red-600"}`}>
                                                                {f.occupancy.toFixed(1)}%
                                                            </span>
                                                            <Progress
                                                                value={f.occupancy}
                                                                className={`h-2 w-20 [&>div]:${f.occupancy >= 70 ? "bg-green-500" : f.occupancy >= 40 ? "bg-amber-500" : "bg-red-500"}`}
                                                            />
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                ) : (
                                    <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">No occupancy data yet.</div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>

            <Separator />

            {/* ── SECTION 4 — WEEKEND vs WEEKDAY ──────────────────────── */}
            {weekendWeekdayChart.length > 0 && (
                <>
                    <section className="space-y-4 text-foreground">
                        <div>
                            <h2 className="text-base font-semibold">Weekend vs Weekday</h2>
                            <p className="text-xs text-muted-foreground">
                                {winnerPeriod === "weekend" ? "Weekend leads" : "Weekday unggul"}
                                {revGap != null ? ` with a gap of ${formatCurrency(revGap)}.` : "."}
                                {" "}Use this data for scheduling and promotions strategy.
                            </p>
                        </div>
                        <div className="grid gap-6 md:grid-cols-3">
                            {weekendWeekdayChart.map((row) => (
                                <Card key={row.name} className={winnerPeriod === "weekend" && row.name === "Weekend" ? "border-primary/30 bg-primary/5" : winnerPeriod === "weekday" && row.name === "Weekday" ? "border-primary/30 bg-primary/5" : ""}>
                                    <CardHeader className="pb-2">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-sm font-medium">{row.name}</CardTitle>
                                            {((winnerPeriod === "weekend" && row.name === "Weekend") || (winnerPeriod !== "weekend" && row.name === "Weekday")) && (
                                                <Badge className="bg-primary text-primary-foreground text-[10px]">Leading</Badge>
                                            )}
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-2">
                                        <div>
                                            <p className="text-[10px] text-muted-foreground uppercase">Revenue</p>
                                            <p className="text-lg font-bold">{formatCurrency(row.revenue)}</p>
                                        </div>
                                        <div className="flex gap-4">
                                            <div>
                                                <p className="text-[10px] text-muted-foreground uppercase">Tickets</p>
                                                <p className="text-sm font-semibold">{row.tickets.toLocaleString("id-ID")}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-muted-foreground uppercase">Occupancy</p>
                                                <p className={`text-sm font-semibold ${row.occupancy >= 70 ? "text-green-600" : row.occupancy >= 40 ? "text-amber-600" : "text-red-600"}`}>
                                                    {row.occupancy.toFixed(1)}%
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                            {/* Summary card */}
                            <Card className="border-dashed">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium">Distribution Chart</CardTitle>
                                </CardHeader>
                                <CardContent className="h-[120px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={weekendWeekdayChart} barGap={8}>
                                            <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                                            <YAxis hide />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))" }}
                                                formatter={(v: number) => [formatCurrency(v), "Revenue"]}
                                            />
                                            <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        </div>
                    </section>
                    <Separator />
                </>
            )}

            {/* ── SECTION 5 — PAYMENT METHODS ─────────────────────────── */}
            {paymentBreakdownRows.length > 0 && (
                <>
                    <section className="space-y-4 text-foreground">
                        <div>
                            <h2 className="text-base font-semibold">Payment Methods</h2>
                            <p className="text-xs text-muted-foreground">
                                Transaction proportion and net profitability.
                                {topPayment && ` Top method: ${topPayment.payment_type} (${topPayment.usage_rate.toFixed(1)}%).`}
                            </p>
                        </div>
                        <Card>
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-sm font-medium">Payment Mix</CardTitle>
                                    <CardDescription>Total transactions: {(dashboardData.payment?.total_transactions ?? 0).toLocaleString("id-ID")}</CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Method</TableHead>
                                            <TableHead className="text-right">Transactions</TableHead>
                                            <TableHead className="text-right">% Usage</TableHead>
                                            <TableHead className="text-right hidden md:table-cell">Gross Revenue</TableHead>
                                            <TableHead className="text-right">Net Profit</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {paymentBreakdownRows.map((row, i) => (
                                            <TableRow key={row.payment_type}>
                                                <TableCell className="font-medium capitalize">
                                                    {i === 0 && <span className="mr-1">⭐</span>}
                                                    {row.payment_type}
                                                </TableCell>
                                                <TableCell className="text-right">{(row.total_transactions ?? 0).toLocaleString("id-ID")}</TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <span>{row.usage_rate.toFixed(1)}%</span>
                                                        <Progress value={row.usage_rate} className="h-1.5 w-16" />
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right hidden md:table-cell">{formatCurrency(row.gross_revenue ?? 0)}</TableCell>
                                                <TableCell className="text-right font-medium">{formatCurrency(row.net_profitability)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </section>
                    <Separator />
                </>
            )}

            {/* ── SECTION 6 — PEAK HOURS ───────────────────────────────── */}
            <section className="space-y-4 text-foreground">
                <div>
                    <h2 className="text-base font-semibold">Peak Hours (Peak Hours)</h2>
                    <p className="text-xs text-muted-foreground">
                        Sales distribution by time slot. Busiest hour: <strong>{busiestHour}</strong> — quiet hour: <strong>{quietestHour}</strong>.
                    </p>
                </div>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Tickets per Time Slot</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[260px]">
                        {ticketsByHour.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={ticketsByHour}>
                                    <XAxis dataKey="hour" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))" }}
                                        cursor={{ fill: "hsl(var(--secondary))" }}
                                        formatter={(v: number) => [v.toLocaleString("id-ID"), "Tickets"]}
                                    />
                                    <Bar dataKey="tickets" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Hourly data is not available yet.</div>
                        )}
                    </CardContent>
                </Card>
                <div className="grid gap-4 md:grid-cols-3">
                    {[
                        { label: "Busiest Hour", value: busiestHour, sub: "Highest ticket volume", icon: <Clock4 className="h-4 w-4 text-green-500" />, accentClass: "border-l-4 border-l-green-500" },
                        { label: "Quiet Hour", value: quietestHour, sub: "Lowest ticket volume", icon: <Clock className="h-4 w-4 text-amber-500" />, accentClass: "border-l-4 border-l-amber-500" },
                        { label: "Slot Recommendation", value: null, sub: null, icon: <AlertTriangle className="h-4 w-4 text-muted-foreground" />, accentClass: "border-l-4 border-l-muted" },
                    ].map((card) => (
                        <Card key={card.label} className={card.accentClass}>
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-sm font-medium">{card.label}</CardTitle>
                                    {card.icon}
                                </div>
                            </CardHeader>
                            <CardContent>
                                {card.value ? (
                                    <>
                                        <div className="text-2xl font-bold">{card.value}</div>
                                        <p className="mt-1 text-xs text-muted-foreground">{card.sub}</p>
                                    </>
                                ) : (
                                    <>
                                        <p className="text-sm font-medium leading-snug">
                                            {peakHourRecommendation || `Run promos at ${quietestHour} to increase low-demand slot volume.`}
                                        </p>
                                        <p className="mt-1 text-xs text-muted-foreground">Busiest hour: {busiestHour} · Quiet hour: {quietestHour}</p>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </section>

            {/* ── SECTION 7 — PROBLEMATIC SCHEDULES ───────────────────── */}
            {sortedSchedules.length > 0 && (
                <>
                    <Separator />
                    <section className="space-y-4 text-foreground">
                        <div>
                            <h2 className="text-base font-semibold">Problematic Schedules</h2>
                            <p className="text-xs text-muted-foreground">
                                {cancelledShows} cancelled · {delayedShows} delayed · average delay {Math.round(avgDelay)} minutes.
                            </p>
                        </div>
                        <div className="grid gap-4 md:grid-cols-3">
                            {[
                                { label: "Cancelled Schedules", value: `${cancelledShows}`, sub: "cancelled schedules", icon: <AlertTriangle className="h-4 w-4 text-red-500" />, cls: "border-l-4 border-l-red-500" },
                                { label: "Delayed Schedules", value: `${delayedShows}`, sub: "delayed schedules", icon: <Clock className="h-4 w-4 text-amber-500" />, cls: "border-l-4 border-l-amber-500" },
                                { label: "Average Penundaan", value: `${Math.round(avgDelay)} mnt`, sub: "per problematic schedule", icon: <Clock4 className="h-4 w-4 text-muted-foreground" />, cls: "" },
                            ].map((c) => (
                                <Card key={c.label} className={c.cls}>
                                    <CardHeader className="pb-2">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-sm font-medium">{c.label}</CardTitle>
                                            {c.icon}
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{c.value}</div>
                                        <p className="mt-1 text-xs text-muted-foreground">{c.sub}</p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Daftar Problematic Schedules</CardTitle>
                                <CardDescription>{sortedSchedules.length} schedules detected.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Film</TableHead>
                                            <TableHead>Cinema</TableHead>
                                            <TableHead>Original Schedule</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Note</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {sortedSchedules.slice(0, 10).map((s) => (
                                            <TableRow key={s.id}>
                                                <TableCell className="font-medium truncate max-w-40">{s.movieTitle}</TableCell>
                                                <TableCell className="truncate max-w-40 text-sm text-muted-foreground">{s.cinemaName}</TableCell>
                                                <TableCell className="whitespace-nowrap text-sm">{format(s.scheduledTime, "d MMM yyyy HH:mm", { locale: id })}</TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant={s.status.toLowerCase() === "cancelled" ? "destructive" : "secondary"}
                                                        className={s.status.toLowerCase() === "delayed" ? "bg-amber-100 text-amber-800" : s.status.toLowerCase() !== "cancelled" ? "bg-green-100 text-green-800" : ""}
                                                    >
                                                        {s.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right text-sm">
                                                    {s.status.toLowerCase() === "delayed" ? `${s.delayMinutes} mnt` : s.status.toLowerCase() === "cancelled" ? "Cancelled" : "—"}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </section>
                </>
            )}
        </div>
    );
}
