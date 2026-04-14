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
    const [filtersLoading, setFiltersLoading] = useState(true);
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
            setFiltersLoading(true);
            const [citiesResult, cinemaResult, healthResult] = await Promise.allSettled([
                getCities(),
                getCinemaBreakdown(),
                getSystemHealth(),
            ]);

            if (cancelled) return;

            if (citiesResult.status === "fulfilled") setCities(citiesResult.value);
            if (cinemaResult.status === "fulfilled") setCinemas(cinemaResult.value.breakdown);

            if (
                healthResult.status === "fulfilled" &&
                healthResult.value.last_data_in &&
                !dateRangeRef.current?.from
            ) {
                const endDate = new Date(healthResult.value.last_data_in);
                const startDate = subDays(endDate, 6);
                setDateRange({ from: startDate, to: endDate });
            }
            setFiltersLoading(false);
        };

        loadFilters();
        return () => { cancelled = true; };
    }, [setDateRange]);

    // Load Data
    useEffect(() => {
        if (filtersLoading) return;
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
    }, [query, filtersLoading]);

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
            
            // Hari
            dayMap.set(dateObj.getTime(), {
                name: format(dateObj, "d MMM", { locale: id }),
                tickets: tickets,
                isWeekend: isWeekend(dateObj)
            });

            // Minggu
            const weekKey = format(startOfWeek(dateObj, { weekStartsOn: 1 }), "w-yyyy");
            const weekName = `Mg ${format(dateObj, "w")}, ${format(dateObj, "MMM")}`;
            if (!weekMap.has(weekKey)) weekMap.set(weekKey, { name: weekName, tickets: 0 });
            weekMap.get(weekKey).tickets += tickets;

            // Bulan
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
            name: row.day_type === "weekend" ? "Akhir pekan" : "Hari kerja",
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
    const peakHourRecommendation =
        dashboardData.timeSlots?.peak_sales_hour?.recommendation ?? "";

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
        : "periode aktif";

    const insightBanners: { icon: React.ReactNode; text: string; color: string }[] = [];

    if (topMovie)
        insightBanners.push({
            icon: <ArrowUp className="h-3.5 w-3.5" />,
            text: `Film penghasil revenue tertinggi selama ${dateLabel}: ${topMovie.name} (${topMovie.contribution.toFixed(1)}% dari total).`,
            color: "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400",
        });

    if (winnerPeriod && revGap != null)
        insightBanners.push({
            icon: winnerPeriod === "weekend" ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />,
            text: `${winnerPeriod === "weekend" ? "Akhir pekan unggul" : "Hari kerja unggul"} selisih ${formatCurrency(revGap)} dibanding sisi satunya.`,
            color: winnerPeriod === "weekend"
                ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400"
                : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400",
        });

    if (topPayment)
        insightBanners.push({
            icon: <DollarSign className="h-3.5 w-3.5" />,
            text: `Metode pembayaran terpopuler: ${topPayment.payment_type} (${topPayment.usage_rate.toFixed(1)}% transaksi).`,
            color: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400",
        });

    if (lowOccupancy.length > 0)
        insightBanners.push({
            icon: <AlertTriangle className="h-3.5 w-3.5" />,
            text: `${lowOccupancy.length} bioskop dengan okupansi <40%: ${lowOccupancy.slice(0,2).map(c => c.name).join(", ")}. Pertimbangkan promo lokal.`,
            color: "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400",
        });

    if (loading && !dashboardData.overview) {
        return <div className="flex h-64 items-center justify-center text-muted-foreground">Memuat data penjualan...</div>;
    }

    return (
        <div className="space-y-8">

            {/* ── PAGE HEADER ─────────────────────────────────────────── */}
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between text-foreground">
                <div>
                    <h1 className="text-2xl font-bold">Sales Analytics</h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Kinerja penjualan tiket, pendapatan, dan okupansi — {dateLabel}
                    </p>
                </div>
                <div className="flex flex-col gap-2 md:flex-row md:items-center">
                    <div className="w-full md:w-64">
                        <DateRangeFilter value={dateRange} onApply={setDateRange} triggerLabel="Pilih Periode" />
                    </div>
                    <div className="w-full md:w-[150px]">
                        <Select value={selectedCity} onValueChange={setCity}>
                            <SelectTrigger><SelectValue placeholder="Semua Kota" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Kota</SelectItem>
                                {cities.map((city) => <SelectItem key={city} value={city}>{city}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="w-full md:w-[180px]">
                        <Select value={selectedCinema} onValueChange={setCinema}>
                            <SelectTrigger><SelectValue placeholder="Semua Bioskop" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Bioskop</SelectItem>
                                {cinemas
                                    .filter((c) => selectedCity === "all" || c.city === selectedCity)
                                    .map((c) => <SelectItem key={c.cinema_id} value={c.cinema_id}>{c.cinema_name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <Button variant="outline" className="w-full md:w-auto">
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

            {/* ── SECTION 1 — RINGKASAN KPI ────────────────────────────── */}
            <section className="space-y-4 text-foreground">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-base font-semibold">Ringkasan Penjualan</h2>
                        <p className="text-xs text-muted-foreground">KPI utama untuk periode terpilih.</p>
                    </div>
                    {avgOccupancy != null && (
                        <Badge variant="outline" className={`text-xs ${avgOccupancy >= 70 ? "border-green-300 text-green-700" : avgOccupancy >= 40 ? "border-amber-300 text-amber-700" : "border-red-300 text-red-700"}`}>
                            Avg. Okupansi: {avgOccupancy.toFixed(1)}%
                        </Badge>
                    )}
                </div>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {[
                        { label: "Total Tiket Terjual", value: totalTickets.toLocaleString("id-ID"), sub: `Rata-rata ${avgTicketsPerDay.toFixed(0)} tiket/hari`, icon: <Ticket className="h-4 w-4" /> },
                        { label: "Total Revenue", value: formatCurrency(totalRevenue), sub: "Pendapatan kotor periode ini", icon: <DollarSign className="h-4 w-4" /> },
                        { label: "Rata-rata per Hari", value: `${avgTicketsPerDay.toFixed(0)} tiket`, sub: `Dalam ${Math.round(diffDays)} hari aktif`, icon: <Calendar className="h-4 w-4" /> },
                        { label: "Avg. Harga Tiket", value: formatCurrency(avgTicketPrice), sub: "Harga rata-rata per tiket", icon: <DollarSign className="h-4 w-4" /> },
                    ].map((card) => (
                        <Card key={card.label}>
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between text-muted-foreground">
                                    <CardTitle className="text-sm font-medium text-foreground">{card.label}</CardTitle>
                                    {card.icon}
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{card.value}</div>
                                <p className="mt-1 text-xs text-muted-foreground">{card.sub}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Trend Chart */}
                <Card>
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-sm font-medium">Tren Tiket Terjual</CardTitle>
                                <CardDescription>Pergerakan penjualan per hari, minggu, dan bulan.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-2">
                        <Tabs defaultValue="hari" className="w-full">
                            <TabsList>
                                <TabsTrigger value="hari">Harian</TabsTrigger>
                                <TabsTrigger value="minggu">Mingguan</TabsTrigger>
                                <TabsTrigger value="bulan">Bulanan</TabsTrigger>
                            </TabsList>
                            {[
                                { value: "hari", data: ticketsPerDay, note: "● = akhir pekan" },
                                { value: "minggu", data: ticketsPerWeek, note: null },
                                { value: "bulan", data: ticketsPerMonth, note: null },
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
                                                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => value === "hari" ? `${v}` : `${Math.round(Number(v) / 1000)}k`} />
                                                <Tooltip
                                                    contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))" }}
                                                    formatter={(v: number) => [v.toLocaleString("id-ID"), "Tiket"]}
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
                                            Data tren belum tersedia untuk periode ini.
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
                            <h2 className="text-base font-semibold">Revenue Tahunan</h2>
                            <p className="text-xs text-muted-foreground">Tren komprehensif pendapatan franchise selama 12 bulan terakhir.</p>
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

            {/* ── SECTION 3 — REVENUE & OKUPANSI ──────────────────────── */}
            <section className="space-y-4 text-foreground">
                <div>
                    <h2 className="text-base font-semibold">Revenue &amp; Okupansi</h2>
                    <p className="text-xs text-muted-foreground">
                        Pendapatan per film (top 7) dan keterisian kursi per bioskop.
                        {topMovie && ` ${topMovie.name} memimpin dengan kontribusi ${topMovie.contribution.toFixed(1)}%.`}
                    </p>
                </div>
                <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-5">
                    <div className="lg:col-span-3">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Revenue per Film (Top 7)</CardTitle>
                                <CardDescription>Hover bar untuk melihat detail kontribusi.</CardDescription>
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
                                    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Belum ada data revenue per film.</div>
                                )}
                            </CardContent>
                            {revenuePerMovie.length > 0 && (
                                <CardContent className="border-t pt-4">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Film</TableHead>
                                                <TableHead className="text-right hidden sm:table-cell">Tiket</TableHead>
                                                <TableHead className="text-right">Revenue</TableHead>
                                                <TableHead className="text-right">Kontribusi</TableHead>
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
                                <CardTitle className="text-sm font-medium">Okupansi per Bioskop</CardTitle>
                                <CardDescription>
                                    {avgOccupancy != null ? `Rata-rata ${avgOccupancy.toFixed(1)}% — ${lowOccupancy.length > 0 ? `${lowOccupancy.length} bioskop di bawah 40%` : "semua bioskop di level aman"}` : "Keterisian kursi tiap bioskop."}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {occupancyPerCinema.length > 0 ? (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Bioskop</TableHead>
                                                <TableHead className="text-right">Okupansi</TableHead>
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
                                    <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">Belum ada data okupansi.</div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>

            <Separator />

            {/* ── SECTION 4 — AKHIR PEKAN vs HARI KERJA ───────────────── */}
            {weekendWeekdayChart.length > 0 && (
                <>
                    <section className="space-y-4 text-foreground">
                        <div>
                            <h2 className="text-base font-semibold">Akhir Pekan vs Hari Kerja</h2>
                            <p className="text-xs text-muted-foreground">
                                {winnerPeriod === "weekend" ? "Akhir pekan unggul" : "Hari kerja unggul"}
                                {revGap != null ? ` dengan selisih ${formatCurrency(revGap)}.` : "."}
                                {" "}Gunakan data ini untuk strategi jadwal dan promo.
                            </p>
                        </div>
                        <div className="grid gap-6 md:grid-cols-3">
                            {weekendWeekdayChart.map((row) => (
                                <Card key={row.name} className={winnerPeriod === "weekend" && row.name === "Akhir pekan" ? "border-primary/30 bg-primary/5" : winnerPeriod === "weekday" && row.name === "Hari kerja" ? "border-primary/30 bg-primary/5" : ""}>
                                    <CardHeader className="pb-2">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-sm font-medium">{row.name}</CardTitle>
                                            {((winnerPeriod === "weekend" && row.name === "Akhir pekan") || (winnerPeriod !== "weekend" && row.name === "Hari kerja")) && (
                                                <Badge className="bg-primary text-primary-foreground text-[10px]">Unggul</Badge>
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
                                                <p className="text-[10px] text-muted-foreground uppercase">Tiket</p>
                                                <p className="text-sm font-semibold">{row.tickets.toLocaleString("id-ID")}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-muted-foreground uppercase">Okupansi</p>
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
                                    <CardTitle className="text-sm font-medium">Distribusi Chart</CardTitle>
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

            {/* ── SECTION 5 — METODE PEMBAYARAN ────────────────────────── */}
            {paymentBreakdownRows.length > 0 && (
                <>
                    <section className="space-y-4 text-foreground">
                        <div>
                            <h2 className="text-base font-semibold">Metode Pembayaran</h2>
                            <p className="text-xs text-muted-foreground">
                                Proporsi transaksi dan profitabilitas bersih.
                                {topPayment && ` Metode dominan: ${topPayment.payment_type} (${topPayment.usage_rate.toFixed(1)}%).`}
                            </p>
                        </div>
                        <Card>
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-sm font-medium">Mix Pembayaran</CardTitle>
                                    <CardDescription>Total transaksi: {(dashboardData.payment?.total_transactions ?? 0).toLocaleString("id-ID")}</CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Metode</TableHead>
                                            <TableHead className="text-right">Transaksi</TableHead>
                                            <TableHead className="text-right">% Pakai</TableHead>
                                            <TableHead className="text-right hidden md:table-cell">Revenue Kotor</TableHead>
                                            <TableHead className="text-right">Profit Bersih</TableHead>
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

            {/* ── SECTION 6 — JAM PUNCAK ───────────────────────────────── */}
            <section className="space-y-4 text-foreground">
                <div>
                    <h2 className="text-base font-semibold">Jam Puncak (Peak Hours)</h2>
                    <p className="text-xs text-muted-foreground">
                        Distribusi penjualan per slot waktu. Jam tersibuk: <strong>{busiestHour}</strong> — jam sepi: <strong>{quietestHour}</strong>.
                    </p>
                </div>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Tiket per Slot Waktu</CardTitle>
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
                                        formatter={(v: number) => [v.toLocaleString("id-ID"), "Tiket"]}
                                    />
                                    <Bar dataKey="tickets" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Data jam belum tersedia.</div>
                        )}
                    </CardContent>
                </Card>
                <div className="grid gap-4 md:grid-cols-3">
                    {[
                        { label: "Jam Tersibuk", value: busiestHour, sub: "Volume tiket tertinggi", icon: <Clock4 className="h-4 w-4 text-green-500" />, accentClass: "border-l-4 border-l-green-500" },
                        { label: "Jam Sepi", value: quietestHour, sub: "Volume tiket terendah", icon: <Clock className="h-4 w-4 text-amber-500" />, accentClass: "border-l-4 border-l-amber-500" },
                        { label: "Rekomendasi Slot", value: null, sub: null, icon: <AlertTriangle className="h-4 w-4 text-muted-foreground" />, accentClass: "border-l-4 border-l-muted" },
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
                                            {peakHourRecommendation || `Promo jam ${quietestHour} untuk menaikkan volume di slot sepi.`}
                                        </p>
                                        <p className="mt-1 text-xs text-muted-foreground">Jam sibuk: {busiestHour} · Jam sepi: {quietestHour}</p>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </section>

            {/* ── SECTION 7 — JADWAL BERMASALAH ────────────────────────── */}
            {sortedSchedules.length > 0 && (
                <>
                    <Separator />
                    <section className="space-y-4 text-foreground">
                        <div>
                            <h2 className="text-base font-semibold">Jadwal Bermasalah</h2>
                            <p className="text-xs text-muted-foreground">
                                {cancelledShows} dibatalkan · {delayedShows} ditunda · rata-rata penundaan {Math.round(avgDelay)} menit.
                            </p>
                        </div>
                        <div className="grid gap-4 md:grid-cols-3">
                            {[
                                { label: "Jadwal Batal", value: `${cancelledShows}`, sub: "jadwal batal", icon: <AlertTriangle className="h-4 w-4 text-red-500" />, cls: "border-l-4 border-l-red-500" },
                                { label: "Jadwal Tunda", value: `${delayedShows}`, sub: "jadwal tertunda", icon: <Clock className="h-4 w-4 text-amber-500" />, cls: "border-l-4 border-l-amber-500" },
                                { label: "Rata-rata Penundaan", value: `${Math.round(avgDelay)} mnt`, sub: "per jadwal bermasalah", icon: <Clock4 className="h-4 w-4 text-muted-foreground" />, cls: "" },
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
                                <CardTitle className="text-sm font-medium">Daftar Jadwal Bermasalah</CardTitle>
                                <CardDescription>{sortedSchedules.length} jadwal terdeteksi.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Film</TableHead>
                                            <TableHead>Bioskop</TableHead>
                                            <TableHead>Jadwal Awal</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Ket.</TableHead>
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
                                                    {s.status.toLowerCase() === "delayed" ? `${s.delayMinutes} mnt` : s.status.toLowerCase() === "cancelled" ? "Dibatalkan" : "—"}
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
