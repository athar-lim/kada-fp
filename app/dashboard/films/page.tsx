"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
  Pie,
  PieChart
} from "recharts";
import {
  Film,
  Ticket,
  Clapperboard,
  Star,
  TrendingUp,
  TrendingDown,
  Award,
  Crown,
  Medal,
  AlertTriangle,
  CalendarClock,
} from "lucide-react";
import { DateRangeFilter } from "@/components/filters/date-range-filter";
import { format, subDays } from "date-fns";
import { id as localeId } from "date-fns/locale";

import {
  getCinemaBreakdown,
  getCities,
  getFilmsAnalyticsBundle,
  getSystemHealth,
  type CinemaBreakdownResponse,
  type FilmsAnalyticsBundlePayload,
} from "@/lib/cinetrack-api";
import { useDashboardUrlFilters } from "@/hooks/use-dashboard-url-filters";

type FilmsPayload = {
  overview: FilmsAnalyticsBundlePayload["overview"] | null;
  performance: FilmsAnalyticsBundlePayload["performance"] | null;
  schedules: FilmsAnalyticsBundlePayload["schedules"] | null;
  occupancy: FilmsAnalyticsBundlePayload["occupancy"] | null;
  distribution: FilmsAnalyticsBundlePayload["distribution"] | null;
  risk: FilmsAnalyticsBundlePayload["operational_risk"] | null;
};

// ===========================
// STYLE HELPERS & UTILS
// ===========================

const formatCurrency = (value: number) => 
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);

const GENRE_CHART_COLORS = [
    "hsl(var(--primary))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
    "hsl(var(--muted-foreground))",
];

const RATING_COLORS: Record<string, string> = {
    "SU": 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    "R13": 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
    "D17": 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    "default": 'bg-secondary text-secondary-foreground'
};

const PodiumIcon = ({ rank }: { rank: number }) => {
    if (rank === 1) return <Crown className="h-6 w-6 text-yellow-500" />;
    if (rank === 2) return <Award className="h-6 w-6 text-slate-500" />;
    if (rank === 3) return <Medal className="h-6 w-6 text-amber-700" />;
    return null;
}

// ===========================
// PAGE COMPONENT
// ===========================

export default function FilmPerformancePage() {
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
    
    const [data, setData] = useState<FilmsPayload>({
        overview: null,
        performance: null,
        schedules: null,
        occupancy: null,
        distribution: null,
        risk: null,
    });

    useEffect(() => {
        let cancelled = false;

        const loadFilters = async () => {
            const [citiesResult, cinemaResult] = await Promise.allSettled([
                getCities(),
                getCinemaBreakdown(),
            ]);

            if (cancelled) return;

            if (citiesResult.status === "fulfilled") {
                setCities(citiesResult.value);
            }
            if (cinemaResult.status === "fulfilled") {
                setCinemas(cinemaResult.value.breakdown);
            }

            // Do not block first dashboard load on health request.
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

    useEffect(() => {
        if (selectedCinema === "all") return;
        const valid = cinemas.some(
            (c) =>
                c.cinema_id === selectedCinema &&
                (selectedCity === "all" || c.city === selectedCity)
        );
        if (!valid) setCinema("all");
    }, [cinemas, selectedCinema, selectedCity, setCinema]);

    // Load Data
    useEffect(() => {
        let cancelled = false;

        const loadFilmsDashboard = async () => {
            setLoading(true);
            try {
                const bundle = await getFilmsAnalyticsBundle({ ...query, top_n: "20" });
                if (cancelled) return;
                setData({
                    overview: bundle.overview,
                    performance: bundle.performance,
                    schedules: bundle.schedules,
                    occupancy: bundle.occupancy,
                    distribution: bundle.distribution,
                    risk: bundle.operational_risk,
                });
            } catch {
                if (cancelled) return;
                setData({
                    overview: null,
                    performance: null,
                    schedules: null,
                    occupancy: null,
                    distribution: null,
                    risk: null,
                });
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        loadFilmsDashboard();

        return () => { cancelled = true; };
    }, [query]);

    const scheduleRows = useMemo(() => {
        const rows = data.schedules?.schedule_performance ?? [];
        return [...rows]
            .sort((a, b) => b.total_tickets - a.total_tickets)
            .slice(0, 15);
    }, [data.schedules?.schedule_performance]);


    // Construct UI Variables from API Data
    const totalFilms = data.overview?.active_films ?? 0;
    const topFilmLaris = data.performance?.top_movie ?? { title: "-" };
    const totalTicketsSold = data.overview?.tickets_sold ?? 0;
    const rawTopGenre = data.distribution?.genre_popularity?.summary?.top_genre?.genre;
    const topGenreText = rawTopGenre === "Unknown" ? "Others" : (rawTopGenre ?? "-");

    const filmPerformance = useMemo(() => {
        if (!data.performance?.breakdown) return [];
        return data.performance.breakdown.map((film) => {
            const occEntry = data.occupancy?.by_movie?.find((o) => o.movie_id === film.movie_id);
            let genresLabel =
                film.genres && film.genres.length > 0
                    ? film.genres.join(", ")
                    : film.genre ?? "—";
            
            if (genresLabel === "Unknown") genresLabel = "Others";
            return {
                id: film.movie_id,
                title: film.title,
                tickets: film.total_tickets,
                revenue: film.total_revenue,
                avgPrice: film.total_tickets > 0 ? film.total_revenue / film.total_tickets : 0,
                occupancy: occEntry ? occEntry.occupancy : 0,
                genresLabel,
                ratingUsia: film.rating_usia ?? film.rating ?? "—",
                shareOfTickets: film.share_of_tickets ?? 0,
                shareOfRevenue: film.share_of_revenue ?? 0,
            };
        }).sort((a, b) => b.tickets - a.tickets);
    }, [data.performance, data.occupancy]);

    const topFilmsByTickets = filmPerformance.slice(0, 3);
    const filmsByRevenue = [...filmPerformance].sort((a, b) => b.revenue - a.revenue);
    const filmsByOccupancy = [...filmPerformance].sort((a, b) => b.occupancy - a.occupancy);

    const genrePerformance = useMemo(() => {
        if (!data.distribution?.genre_popularity?.breakdown) return [];
        return data.distribution.genre_popularity.breakdown.map(g => ({
            name: g.genre === "Unknown" ? "Others" : g.genre,
            tickets: g.total_tickets,
        })).sort((a, b) => b.tickets - a.tickets);
    }, [data.distribution]);

    const totalTicketsForGenreStack = genrePerformance.reduce((sum, g) => sum + g.tickets, 0);
    const stackedGenreData = [{
        name: 'genres',
        ...genrePerformance.reduce((obj, genre) => {
            obj[genre.name] = genre.tickets;
            return obj;
        }, {} as Record<string, number>)
    }];

    const ratingPerformance = useMemo(() => {
        if (!data.distribution?.genre_popularity?.breakdown_rating_usia) return [];
        return data.distribution.genre_popularity.breakdown_rating_usia.map(r => {
            return {
                name: r.rating_usia,
                tickets: r.total_tickets_sold,
            };
        });
    }, [data.distribution]);

    // ── Auto-computed insights ─────────────────────────────────────────────
    const topByTickets = filmPerformance[0];
    const topByOccupancy = filmsByOccupancy[0];
    const lowestOccupancy = filmsByOccupancy[filmsByOccupancy.length - 1];
    const topGenreData = genrePerformance[0];
    const avgOccupancyFilms = filmPerformance.length
        ? filmPerformance.reduce((s, f) => s + f.occupancy, 0) / filmPerformance.length
        : null;
    const dateLabel = dateRange?.from && dateRange?.to
        ? `${format(dateRange.from, "d MMM")}–${format(dateRange.to, "d MMM yyyy")}`
        : "active period";

    const insightBanners: { icon: React.ReactNode; text: string; color: string }[] = [];

    if (topByTickets)
        insightBanners.push({
            icon: <Crown className="h-3.5 w-3.5" />,
            text: `Top-selling movie: ${topByTickets.title} (${topByTickets.tickets.toLocaleString("id-ID")} tickets · ${topByTickets.shareOfTickets.toFixed(1)}% share).`,
            color: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400",
        });

    if (topByOccupancy && topByOccupancy.occupancy > 0)
        insightBanners.push({
            icon: <TrendingUp className="h-3.5 w-3.5" />,
            text: `Highest occupancy: ${topByOccupancy.title} — ${topByOccupancy.occupancy.toFixed(1)}%. This showtime is highly demanded.`,
            color: "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400",
        });

    if (lowestOccupancy && lowestOccupancy.occupancy < 40 && filmsByOccupancy.length > 1)
        insightBanners.push({
            icon: <AlertTriangle className="h-3.5 w-3.5" />,
            text: `${lowestOccupancy.title} has the lowest occupancy (${lowestOccupancy.occupancy.toFixed(1)}%). Consider promotions or reducing show frequency.`,
            color: "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400",
        });

    if (topGenreData && totalTicketsForGenreStack > 0)
        insightBanners.push({
            icon: <Clapperboard className="h-3.5 w-3.5" />,
            text: `Dominant genre: ${topGenreData.name} (${((topGenreData.tickets / totalTicketsForGenreStack) * 100).toFixed(1)}% of total tickets).`,
            color: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400",
        });

    const isInitialLoading = loading && !data.overview;

    return (
        <div className="space-y-8">

            {/* ── PAGE HEADER ─────────────────────────────────────────── */}
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between text-foreground">
                <div>
                    <h1 className="text-2xl font-bold">Film Performance</h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Film rankings and analytics by tickets, revenue, and occupancy — {dateLabel}
                    </p>
                </div>
                <div className="flex flex-col gap-2 md:flex-row md:items-center">
                    <div className="w-full md:w-56">
                        <DateRangeFilter value={dateRange} onApply={setDateRange} triggerLabel="Select Period" />
                    </div>
                    <div className="w-full md:w-44">
                        <Select value={selectedCity} onValueChange={setCity}>
                            <SelectTrigger><SelectValue placeholder="All Cities" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Cities</SelectItem>
                                {cities.map((city) => <SelectItem key={city} value={city}>{city}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="w-full md:w-52">
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

            {/* ── SECTION 1 — KPI CARDS ────────────────────────────────── */}
            <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-base font-semibold">Film Summary</h2>
                        <p className="text-xs text-muted-foreground">Key KPIs for the selected period.</p>
                    </div>
                    {avgOccupancyFilms != null && (
                        <Badge variant="outline" className={`text-xs ${avgOccupancyFilms >= 70 ? "border-green-300 text-green-700" : avgOccupancyFilms >= 40 ? "border-amber-300 text-amber-700" : "border-red-300 text-red-700"}`}>
                            Avg. Film Occupancy: {avgOccupancyFilms.toFixed(1)}%
                        </Badge>
                    )}
                </div>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between text-muted-foreground">
                                <CardTitle className="text-sm font-medium text-foreground">Total Movies Showing</CardTitle>
                                <Film className="h-4 w-4" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            {isInitialLoading ? (
                                <div className="space-y-2">
                                    <Skeleton className="h-8 w-24" />
                                    <Skeleton className="h-4 w-40" />
                                </div>
                            ) : (
                                <>
                                    <div className="text-2xl font-bold">{totalFilms}</div>
                                    <p className="mt-1 text-xs text-muted-foreground">Active movies in this period</p>
                                </>
                            )}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between text-muted-foreground">
                                <CardTitle className="text-sm font-medium text-foreground">Top-selling Movie</CardTitle>
                                <Star className="h-4 w-4 text-amber-500" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            {isInitialLoading ? (
                                <div className="space-y-2">
                                    <Skeleton className="h-7 w-full" />
                                    <Skeleton className="h-4 w-44" />
                                </div>
                            ) : (
                                <>
                                    <div className="text-xl font-bold truncate max-w-full leading-tight" title={topFilmLaris.title}>{topFilmLaris.title}</div>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        {topByTickets ? `${topByTickets.tickets.toLocaleString("id-ID")} tickets sold` : "—"}
                                    </p>
                                </>
                            )}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between text-muted-foreground">
                                <CardTitle className="text-sm font-medium text-foreground">Total Tickets Sold</CardTitle>
                                <Ticket className="h-4 w-4" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            {isInitialLoading ? (
                                <div className="space-y-2">
                                    <Skeleton className="h-8 w-28" />
                                    <Skeleton className="h-4 w-32" />
                                </div>
                            ) : (
                                <>
                                    <div className="text-2xl font-bold">{totalTicketsSold.toLocaleString("id-ID")}</div>
                                    <p className="mt-1 text-xs text-muted-foreground">All active movies</p>
                                </>
                            )}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between text-muted-foreground">
                                <CardTitle className="text-sm font-medium text-foreground">Most Popular Genre</CardTitle>
                                <Clapperboard className="h-4 w-4" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            {isInitialLoading ? (
                                <div className="space-y-2">
                                    <Skeleton className="h-8 w-32" />
                                    <Skeleton className="h-4 w-44" />
                                </div>
                            ) : (
                                <>
                                    <div className="text-2xl font-bold">{topGenreText}</div>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        {topGenreData && totalTicketsForGenreStack > 0
                                            ? `${topGenreData.tickets.toLocaleString("id-ID")} tickets (${((topGenreData.tickets / totalTicketsForGenreStack) * 100).toFixed(1)}%)`
                                            : "Based on tickets sold"}
                                    </p>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </section>

            <Separator />

            {/* ── SECTION 2 — TOP MOVIES BY TICKETS ───────────────────── */}
            <section className="space-y-4">
                <div>
                    <h2 className="text-base font-semibold">Top Movies — Tickets Sold</h2>
                    <p className="text-xs text-muted-foreground">
                        Movie ranking by ticket volume.
                        {topByTickets && ` ${topByTickets.title} leads with ${topByTickets.shareOfTickets.toFixed(1)}% share.`}
                    </p>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Top 10 Movies (Tickets)</CardTitle>
                                <CardDescription>Highlighted bars indicate top 3. Hover for share details.</CardDescription>
                            </CardHeader>
                            <CardContent className="h-[440px] pt-2 pr-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={filmPerformance.slice(0, 10)} layout="vertical" margin={{ left: 0, right: 12 }}>
                                        <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis type="category" dataKey="title" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} width={140} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))" }}
                                            cursor={{ fill: "hsl(var(--secondary))" }}
                                            formatter={(value, _name, props: { payload?: (typeof filmPerformance)[0] }) => {
                                                const payload = props?.payload;
                                                const share = payload?.shareOfTickets != null ? ` (${payload.shareOfTickets.toFixed(1)}% share)` : "";
                                                return [`${(value as number).toLocaleString("id-ID")} tickets${share}`, "Volume"];
                                            }}
                                        />
                                        <Bar dataKey="tickets" barSize={14} radius={[0, 4, 4, 0]}>
                                            {filmPerformance.slice(0, 10).map((_, index) => (
                                                <Cell key={`cell-${index}`} fill={index === 0 ? "hsl(var(--primary))" : index < 3 ? "hsl(var(--chart-2))" : "hsl(var(--border))"} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>
                    <div className="space-y-4">
                        {topFilmsByTickets.map((film, index) => (
                            <Card key={film.id} className={index === 0 ? "border-amber-300/50 bg-amber-50/30 dark:bg-amber-900/10" : ""}>
                                <CardHeader className="pb-2">
                                    <div className="flex items-start justify-between">
                                        <PodiumIcon rank={index + 1} />
                                        <Badge variant="outline" className="text-[10px]">
                                            {film.ratingUsia}
                                        </Badge>
                                    </div>
                                    <CardTitle className="text-base pt-1 leading-snug">{film.title}</CardTitle>
                                    <p className="text-xs text-muted-foreground line-clamp-1">{film.genresLabel}</p>
                                </CardHeader>
                                <CardContent className="space-y-1.5 pt-0">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Tickets</span>
                                        <span className="font-bold">{film.tickets.toLocaleString("id-ID")}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Revenue</span>
                                        <span className="font-semibold">{formatCurrency(film.revenue)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Revenue share</span>
                                        <span className="font-medium">{film.shareOfRevenue.toFixed(1)}%</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Occupancy</span>
                                        <span className={`font-bold ${film.occupancy >= 70 ? "text-green-600" : film.occupancy >= 40 ? "text-amber-600" : "text-red-600"}`}>
                                            {film.occupancy.toFixed(1)}%
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            <Separator />

            {/* ── SECTION 3 — REVENUE PER FILM ─────────────────────────── */}
            <section className="space-y-4 text-foreground">
                <div>
                    <h2 className="text-base font-semibold">Revenue per Film</h2>
                    <p className="text-xs text-muted-foreground">Movie ranking by total revenue (top 15).</p>
                </div>
                <Card>
                    <CardContent className="h-[320px] pt-6 pr-4">
                        {filmsByRevenue.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={filmsByRevenue.slice(0, 15)}>
                                    <XAxis dataKey="title" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} angle={-40} textAnchor="end" height={72} />
                                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `Rp${Math.round(value / 1_000_000)}M`} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))" }}
                                        cursor={{ fill: "hsl(var(--secondary))" }}
                                        formatter={(value, _name, props: { payload?: (typeof filmsByRevenue)[0] }) => {
                                            const payload = props?.payload;
                                            const share = payload?.shareOfRevenue != null ? ` · ${payload.shareOfRevenue.toFixed(1)}% share` : "";
                                            return [`${formatCurrency(Number(value))}${share}`, "Revenue"];
                                        }}
                                    />
                                    <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                                        {filmsByRevenue.slice(0, 15).map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={index === 0 ? "hsl(var(--primary))" : "hsl(var(--chart-2))"} fillOpacity={index === 0 ? 1 : 0.7} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No revenue-by-movie data yet.</div>
                        )}
                    </CardContent>
                    {filmsByRevenue.length > 0 && (
                        <CardContent className="border-t pt-4">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>#</TableHead>
                                        <TableHead>Film</TableHead>
                                        <TableHead className="hidden sm:table-cell">Genre</TableHead>
                                        <TableHead className="text-right">Tickets</TableHead>
                                        <TableHead className="text-right hidden md:table-cell">% Tickets</TableHead>
                                        <TableHead className="text-right">Revenue</TableHead>
                                        <TableHead className="text-right hidden md:table-cell">% Rev</TableHead>
                                        <TableHead className="text-right">Avg. Price</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filmsByRevenue.slice(0, 7).map((film, i) => (
                                        <TableRow key={film.id}>
                                            <TableCell className="text-muted-foreground font-medium w-6">{i === 0 ? "🏆" : i + 1}</TableCell>
                                            <TableCell className="font-medium max-w-[140px] truncate" title={film.title}>{film.title}</TableCell>
                                            <TableCell className="hidden sm:table-cell text-muted-foreground text-sm max-w-[120px] truncate" title={film.genresLabel}>{film.genresLabel}</TableCell>
                                            <TableCell className="text-right">{film.tickets.toLocaleString("id-ID")}</TableCell>
                                            <TableCell className="text-right hidden md:table-cell">{film.shareOfTickets.toFixed(1)}%</TableCell>
                                            <TableCell className="text-right font-semibold">{formatCurrency(film.revenue)}</TableCell>
                                            <TableCell className="text-right hidden md:table-cell">{film.shareOfRevenue.toFixed(1)}%</TableCell>
                                            <TableCell className="text-right">{formatCurrency(film.avgPrice)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    )}
                </Card>
            </section>

            <Separator />

            {/* ── SECTION 4 — OCCUPANCY BY MOVIE ──────────────────────── */}
            <section className="space-y-4 text-foreground">
                <div>
                    <h2 className="text-base font-semibold">Occupancy by Movie</h2>
                    <p className="text-xs text-muted-foreground">
                        Seat fill percentage against studio capacity.
                        {topByOccupancy && ` Highest: ${topByOccupancy.title} (${topByOccupancy.occupancy.toFixed(1)}%).`}
                    </p>
                </div>
                <Card>
                    <CardContent className="h-[440px] pt-6 pr-4">
                        {filmsByOccupancy.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={filmsByOccupancy.slice(0, 10)} layout="vertical" margin={{ left: 0, right: 12 }}>
                                    <XAxis type="number" domain={[0, 100]} stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                                    <YAxis type="category" dataKey="title" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} width={140} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))" }}
                                        cursor={{ fill: "hsl(var(--secondary))" }}
                                        formatter={(value) => [`${Number(value).toFixed(1)}%`, "Occupancy"]}
                                    />
                                    <Bar dataKey="occupancy" barSize={14} radius={[0, 4, 4, 0]}>
                                        {filmsByOccupancy.slice(0, 10).map((entry, index) => {
                                            const color = entry.occupancy >= 70 ? "hsl(var(--chart-2))" : entry.occupancy >= 40 ? "hsl(var(--primary))" : "hsl(var(--destructive))";
                                            return <Cell key={`cell-${index}`} fill={color} />;
                                        })}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No occupancy data yet.</div>
                        )}
                    </CardContent>
                </Card>
                {filmsByOccupancy.length > 1 && (
                    <div className="grid gap-4 md:grid-cols-2">
                        <Card className="border-l-4 border-l-green-500">
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-sm font-medium">Occupancy Highest</CardTitle>
                                    <TrendingUp className="h-4 w-4 text-green-500" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-base font-bold leading-snug">{filmsByOccupancy[0]?.title}</p>
                                <p className="text-2xl font-bold text-green-600 mt-1">{(filmsByOccupancy[0]?.occupancy || 0).toFixed(1)}%</p>
                                <p className="text-xs text-muted-foreground mt-1">This showtime has the highest audience demand.</p>
                            </CardContent>
                        </Card>
                        <Card className="border-l-4 border-l-red-400">
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-sm font-medium">Needs Attention</CardTitle>
                                    <TrendingDown className="h-4 w-4 text-red-500" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-base font-bold leading-snug">{filmsByOccupancy[filmsByOccupancy.length - 1]?.title}</p>
                                <p className="text-2xl font-bold text-red-500 mt-1">{(filmsByOccupancy[filmsByOccupancy.length - 1]?.occupancy || 0).toFixed(1)}%</p>
                                <p className="text-xs text-muted-foreground mt-1">Consider promotions or reducing show frequency.</p>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </section>

            <Separator />

            {/* ── SECTION 5 — SCHEDULE & OPERATIONS ───────────────────── */}
            <section className="space-y-4 text-foreground">
                <div>
                    <h2 className="text-base font-semibold">Schedule &amp; Operations</h2>
                    <p className="text-xs text-muted-foreground">
                        Showtime slots with the highest ticket volume. {scheduleRows.length > 0 ? `${scheduleRows.length} schedules detected.` : ""}
                    </p>
                </div>
                <Card>
                    <CardHeader className="pb-2">
                        <div className="flex items-center gap-2">
                            <CalendarClock className="h-4 w-4 text-muted-foreground" />
                            <CardTitle className="text-sm font-medium">Performance by Showtime</CardTitle>
                        </div>
                        <CardDescription>Top schedules ranked by tickets sold.</CardDescription>
                    </CardHeader>
                    <CardContent className="px-0 sm:px-6">
                        {scheduleRows.length > 0 ? (
                            <div className="max-h-[400px] overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Film</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Time</TableHead>
                                            <TableHead className="text-right">Tickets</TableHead>
                                            <TableHead className="text-right">Revenue</TableHead>
                                            <TableHead className="text-right">Occupancy</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {scheduleRows.map((row) => (
                                            <TableRow key={row.schedule_id}>
                                                <TableCell className="max-w-[160px] truncate font-medium">{row.title}</TableCell>
                                                <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                                                    {row.show_date
                                                        ? format(new Date(row.show_date.slice(0, 10)), "d MMM yyyy", { locale: localeId })
                                                        : "—"}
                                                </TableCell>
                                                <TableCell className="text-sm">{row.start_time ?? "—"}</TableCell>
                                                <TableCell className="text-right">{row.total_tickets.toLocaleString("id-ID")}</TableCell>
                                                <TableCell className="text-right text-muted-foreground">{formatCurrency(row.revenue)}</TableCell>
                                                <TableCell className="text-right">
                                                    <span className={`font-semibold ${row.occupancy >= 70 ? "text-green-600" : row.occupancy >= 40 ? "text-amber-600" : "text-red-500"}`}>
                                                        {row.occupancy.toFixed(1)}%
                                                    </span>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        ) : (
                            <p className="px-6 pb-6 text-sm text-muted-foreground">No schedule data for this filter.</p>
                        )}
                    </CardContent>
                </Card>
            </section>

            <Separator />

            {/* ── SECTION 6 — GENRE BREAKDOWN ──────────────────────────── */}
            <section className="space-y-4 text-foreground">
                <div>
                    <h2 className="text-base font-semibold">Genre Distribution</h2>
                    <p className="text-xs text-muted-foreground">
                        Ticket sales comparison by movie genre.
                        {topGenreData && ` ${topGenreData.name} dominates with ${totalTicketsForGenreStack > 0 ? ((topGenreData.tickets / totalTicketsForGenreStack) * 100).toFixed(1) : 0}%.`}
                    </p>
                </div>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex flex-col md:flex-row items-center gap-8">
                            <div className="w-full md:w-1/2">
                                {genrePerformance.length > 0 ? (
                                    <div className="h-[260px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={genrePerformance}
                                                    dataKey="tickets"
                                                    nameKey="name"
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={70}
                                                    outerRadius={110}
                                                    stroke="hsl(var(--background))"
                                                    strokeWidth={3}
                                                >
                                                    {genrePerformance.map((_, idx) => (
                                                        <Cell key={`cell-${idx}`} fill={GENRE_CHART_COLORS[idx % GENRE_CHART_COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip
                                                    formatter={(value, name) => {
                                                        const ticketCount = typeof value === "number" ? value : 0;
                                                        const pct = totalTicketsForGenreStack > 0 ? ((ticketCount / totalTicketsForGenreStack) * 100).toFixed(1) : "0.0";
                                                        return [`${ticketCount.toLocaleString()} tickets (${pct}%)`, name];
                                                    }}
                                                    contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "8px" }}
                                                    itemStyle={{ color: "hsl(var(--foreground))" }}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                ) : (
                                    <div className="h-[260px] w-full flex items-center justify-center text-sm text-muted-foreground">No genre data yet.</div>
                                )}
                            </div>
                            <div className="w-full md:w-1/2 space-y-3">
                                {genrePerformance.map((genre, idx) => {
                                    const pct = totalTicketsForGenreStack > 0 ? (genre.tickets / totalTicketsForGenreStack) * 100 : 0;
                                    return (
                                        <div key={genre.name} className="space-y-1">
                                            <div className="flex items-center justify-between text-sm">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: GENRE_CHART_COLORS[idx % GENRE_CHART_COLORS.length] }} />
                                                    <span className="font-medium">{genre.name}</span>
                                                </div>
                                                <span className="text-muted-foreground text-xs">{genre.tickets.toLocaleString()} · {pct.toFixed(1)}%</span>
                                            </div>
                                            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                                                <div
                                                    className="h-full rounded-full"
                                                    style={{ width: `${pct}%`, backgroundColor: GENRE_CHART_COLORS[idx % GENRE_CHART_COLORS.length] }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </section>

            <Separator />

            {/* ── SECTION 7 — AGE RATING ──────────────────────────────── */}
            {ratingPerformance.length > 0 && (
                <section className="space-y-4 text-foreground">
                    <div>
                        <h2 className="text-base font-semibold">Age Rating Distribution</h2>
                        <p className="text-xs text-muted-foreground">Tickets sold by audience age classification.</p>
                    </div>
                    <div className="grid gap-4 md:grid-cols-3">
                        {ratingPerformance.map((rating) => {
                            const totalRatingTickets = ratingPerformance.reduce((s, r) => s + r.tickets, 0);
                            const pct = totalRatingTickets > 0 ? (rating.tickets / totalRatingTickets) * 100 : 0;
                            const label = rating.name === "SU" ? "All Ages" : rating.name === "R13" ? "Age 13+" : rating.name === "D17" ? "Age 17+" : rating.name;
                            return (
                                <Card key={rating.name}>
                                    <CardHeader className="pb-2">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                                <Badge variant="secondary" className={RATING_COLORS[rating.name] || RATING_COLORS.default}>{rating.name}</Badge>
                                                {label}
                                            </CardTitle>
                                            <span className="text-xs text-muted-foreground">{pct.toFixed(1)}%</span>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-2">
                                        <p className="text-xl font-bold">{rating.tickets.toLocaleString("id-ID")} <span className="text-sm font-normal text-muted-foreground">tickets</span></p>
                                        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${
                                                    rating.name === "SU" ? "bg-green-500"
                                                    : rating.name === "R13" ? "bg-amber-500"
                                                    : "bg-red-500"
                                                }`}
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </section>
            )}
        </div>
    );
}
