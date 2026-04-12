"use client";

import { Fragment } from "react";
import Link from "next/link";
import { useEffect, useMemo, useState, type ComponentType } from "react";
import { useParams, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Film,
  MapPinned,
  Ticket,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getCinemaBreakdown,
  getCinemaStudios,
  getDashboardSummary,
  getMovieStats,
  getOccupancyStats,
  getTopMovies,
  getTrendStats,
  type CinemaBreakdownResponse,
  type DashboardQuery,
  type MovieStatsResponse,
  type OccupancyResponse,
  type SummaryResponse,
  type StudioResponse,
  type TopMovie,
  type TrendsResponse,
} from "@/lib/cinetrack-api";

type CityPayload = {
  summary: SummaryResponse | null;
  cinemas: CinemaBreakdownResponse | null;
  movieStats: MovieStatsResponse | null;
  topMovies: TopMovie[];
  trends: TrendsResponse | null;
  occupancy: OccupancyResponse | null;
};

type StudioMetricSummary = {
  totalTickets: number;
  revenue: number;
  occupancy: number;
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);

const formatPercent = (value: number) => `${value.toFixed(1)}%`;

const formatGrowth = (value: number) => {
  const formatted = `${Math.abs(value).toFixed(2)}%`;
  return value >= 0 ? `+${formatted}` : `-${formatted}`;
};

function MetricCardSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-4 w-40" />
    </div>
  );
}

const formatStudioType = (studio: StudioResponse) => {
  const rawType = studio.studio_type ?? studio.screen_type ?? studio.format ?? studio.type;

  if (rawType === null || rawType === undefined || rawType === "") {
    return "-";
  }

  if (typeof rawType === "number") {
    return `${rawType}D`;
  }

  return String(rawType);
};

function StatCard({
  title,
  value,
  subtitle,
  loading = false,
  icon: Icon,
}: {
  title: string;
  value: string;
  subtitle?: string;
  loading?: boolean;
  icon: ComponentType<{ className?: string }>;
}) {
  const subtitleClassName =
    subtitle === undefined
      ? "text-xs text-muted-foreground"
      : subtitle.startsWith("+")
        ? "text-xs text-green-600"
        : subtitle.startsWith("-")
          ? "text-xs text-red-600"
          : "text-xs text-muted-foreground";

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <MetricCardSkeleton />
        ) : (
          <>
            <div className="text-2xl font-bold">{value}</div>
            {subtitle ? <p className={subtitleClassName}>{subtitle}</p> : null}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function CityDetailPage() {
  const params = useParams<{ city: string }>();
  const searchParams = useSearchParams();
  const city = decodeURIComponent(params.city);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<CityPayload>({
    summary: null,
    cinemas: null,
    movieStats: null,
    topMovies: [],
    trends: null,
    occupancy: null,
  });
  const [expandedCinemaIds, setExpandedCinemaIds] = useState<string[]>([]);
  const [studioDetails, setStudioDetails] = useState<Record<string, StudioResponse[]>>({});
  const [studioLoading, setStudioLoading] = useState<Record<string, boolean>>({});
  const [studioErrors, setStudioErrors] = useState<Record<string, string>>({});
  const [studioMetrics, setStudioMetrics] = useState<Record<string, StudioMetricSummary>>({});
  const [studioMetricsLoading, setStudioMetricsLoading] = useState<Record<string, boolean>>({});
  const [studioMetricsErrors, setStudioMetricsErrors] = useState<Record<string, string>>({});
  const dateQuery = useMemo<Pick<DashboardQuery, "start_date" | "end_date">>(() => {
    const start_date = searchParams.get("start_date") ?? undefined;
    const end_date = searchParams.get("end_date") ?? undefined;

    return {
      start_date,
      end_date,
    };
  }, [searchParams]);

  useEffect(() => {
    setExpandedCinemaIds([]);
    setStudioDetails({});
    setStudioLoading({});
    setStudioErrors({});
    setStudioMetrics({});
    setStudioMetricsLoading({});
    setStudioMetricsErrors({});
  }, [city, dateQuery.end_date, dateQuery.start_date]);

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      setLoading(true);
      setError(null);

      const results = await Promise.allSettled([
        getDashboardSummary({ city, ...dateQuery }),
        getCinemaBreakdown({ city, ...dateQuery }),
        getMovieStats({ city, ...dateQuery }),
        getTopMovies({ city, ...dateQuery }),
        getTrendStats({ city, ...dateQuery }),
        getOccupancyStats({ city, ...dateQuery }),
      ]);

      if (cancelled) return;

      setData({
        summary: results[0].status === "fulfilled" ? results[0].value : null,
        cinemas: results[1].status === "fulfilled" ? results[1].value : null,
        movieStats: results[2].status === "fulfilled" ? results[2].value : null,
        topMovies: results[3].status === "fulfilled" ? results[3].value : [],
        trends: results[4].status === "fulfilled" ? results[4].value : null,
        occupancy: results[5].status === "fulfilled" ? results[5].value : null,
      });

      const rejected = results.find((result) => result.status === "rejected");
      if (rejected?.status === "rejected") {
        setError(rejected.reason instanceof Error ? rejected.reason.message : "Gagal memuat data kota.");
      }

      setLoading(false);
    };

    loadData();

    return () => {
      cancelled = true;
    };
  }, [city, dateQuery]);

  const salesChartData = useMemo(
    () =>
      data.trends?.breakdown.map((item) => ({
        label: item.time_group,
        tickets: item.tickets_sold,
        revenue: item.revenue,
      })) ?? [],
    [data.trends]
  );

  const occupancyChartData = useMemo(
    () =>
      data.occupancy?.breakdown.map((item) => ({
        label: item.time_group.split(" ").at(-1) ?? item.time_group,
        occupancy: Number(item.avg_occupancy.toFixed(2)),
      })) ?? [],
    [data.occupancy]
  );

  const cinemaRows = data.cinemas?.breakdown ?? [];
  const topMovies = data.topMovies.slice(0, 10);
  const growth = data.summary?.data.growth;

  const loadStudioMetrics = async (studios: StudioResponse[]) => {
    const studiosToLoad = studios.filter((studio) => {
      const studioId = studio.studio_id ?? studio.id;
      return studioId && !studioMetrics[studioId] && !studioMetricsLoading[studioId];
    });

    if (studiosToLoad.length === 0) {
      return;
    }

    setStudioMetricsLoading((current) => {
      const next = { ...current };
      studiosToLoad.forEach((studio) => {
        const studioId = studio.studio_id ?? studio.id;
        if (studioId) next[studioId] = true;
      });
      return next;
    });

    const results = await Promise.allSettled(
      studiosToLoad.map(async (studio) => {
        const studioId = studio.studio_id ?? studio.id;
        if (!studioId) {
          throw new Error("Studio ID tidak tersedia.");
        }

        const summary = await getDashboardSummary({
          city,
          studio_id: studioId,
          ...dateQuery,
        });

        return {
          studioId,
          metrics: {
            totalTickets: summary.data.total_tickets,
            revenue: summary.data.revenue,
            occupancy: summary.data.occupancy,
          },
        };
      })
    );

    const nextMetrics: Record<string, StudioMetricSummary> = {};
    const nextErrors: Record<string, string> = {};
    const nextLoading: Record<string, boolean> = {};

    results.forEach((result, index) => {
      const studioId = studiosToLoad[index].studio_id ?? studiosToLoad[index].id;
      if (!studioId) return;

      nextLoading[studioId] = false;

      if (result.status === "fulfilled") {
        nextMetrics[studioId] = result.value.metrics;
        nextErrors[studioId] = "";
      } else {
        nextErrors[studioId] =
          result.reason instanceof Error
            ? result.reason.message
            : "Gagal memuat metrik studio.";
      }
    });

    setStudioMetrics((current) => ({ ...current, ...nextMetrics }));
    setStudioMetricsErrors((current) => ({ ...current, ...nextErrors }));
    setStudioMetricsLoading((current) => ({ ...current, ...nextLoading }));
  };

  const toggleCinemaStudios = async (cinemaId: string) => {
    const isOpen = expandedCinemaIds.includes(cinemaId);

    if (isOpen) {
      setExpandedCinemaIds((current) => current.filter((id) => id !== cinemaId));
      return;
    }

    setExpandedCinemaIds((current) => [...current, cinemaId]);

    if (studioDetails[cinemaId] || studioLoading[cinemaId]) {
      return;
    }

    setStudioLoading((current) => ({ ...current, [cinemaId]: true }));
    setStudioErrors((current) => ({ ...current, [cinemaId]: "" }));

    try {
      const studios = await getCinemaStudios(cinemaId);
      setStudioDetails((current) => ({ ...current, [cinemaId]: studios }));
      await loadStudioMetrics(studios);
    } catch (reason) {
      setStudioErrors((current) => ({
        ...current,
        [cinemaId]:
          reason instanceof Error ? reason.message : "Gagal memuat detail studio.",
      }));
    } finally {
      setStudioLoading((current) => ({ ...current, [cinemaId]: false }));
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-4">
          <Link href="/dashboard">
            <Button variant="outline" size="icon" className="rounded-2xl">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>

          <div>
            <h1 className="text-2xl font-bold text-foreground">Ringkasan Kinerja: {city}</h1>
            <p className="text-muted-foreground">
              Menampilkan data performa terperinci untuk kota yang dipilih.
            </p>
          </div>
        </div>

        {error ? (
          <Card className="border-amber-300 bg-amber-50">
            <CardContent className="py-4 text-sm text-amber-700">{error}</CardContent>
          </Card>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Tiket Terjual"
          value={data.summary ? data.summary.data.total_tickets.toLocaleString("id-ID") : "--"}
          subtitle={growth?.tickets !== undefined ? `${formatGrowth(growth.tickets)} vs previous period` : undefined}
          loading={loading}
          icon={Ticket}
        />
        <StatCard
          title="Total Revenue"
          value={data.summary ? formatCurrency(data.summary.data.revenue) : "--"}
          subtitle={growth?.revenue !== undefined ? `${formatGrowth(growth.revenue)} vs previous period` : undefined}
          loading={loading}
          icon={DollarSign}
        />
        <StatCard
          title="Jumlah Bioskop"
          value={data.cinemas ? String(data.cinemas.summary.total_cinemas) : "--"}
          subtitle="Bioskop yang terdaftar di kota ini"
          loading={loading}
          icon={Building2}
        />
        <StatCard
          title="Rata-rata Okupansi"
          value={data.summary ? formatPercent(data.summary.data.occupancy) : "--"}
          subtitle={
            growth?.avg_occupancy !== undefined
              ? `${formatGrowth(growth.avg_occupancy)} vs previous period`
              : undefined
          }
          loading={loading}
          icon={Users}
        />
      </div>

      <Tabs defaultValue="cinema" className="space-y-6">
        <TabsList className="h-auto flex-wrap rounded-2xl bg-muted/60 p-2">
          <TabsTrigger value="cinema" className="gap-2 rounded-xl px-4 py-2">
            <Building2 className="h-4 w-4" />
            Performa Bioskop
          </TabsTrigger>
          <TabsTrigger value="film" className="gap-2 rounded-xl px-4 py-2">
            <Film className="h-4 w-4" />
            Performa Film
          </TabsTrigger>
          <TabsTrigger value="sales" className="gap-2 rounded-xl px-4 py-2">
            <TrendingUp className="h-4 w-4" />
            Data Penjualan
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cinema" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Daftar Bioskop</CardTitle>
              <CardDescription>Ringkasan performa seluruh bioskop di {city}.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-14 text-center">Detail</TableHead>
                    <TableHead>Bioskop</TableHead>
                    <TableHead>Kota</TableHead>
                    <TableHead className="text-right">Tiket</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead className="text-right">Film Aktif</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cinemaRows.length > 0 ? (
                    cinemaRows.map((cinema) => {
                      const isExpanded = expandedCinemaIds.includes(cinema.cinema_id);
                      const studios = studioDetails[cinema.cinema_id] ?? [];

                      return (
                        <Fragment key={cinema.cinema_id}>
                          <TableRow key={cinema.cinema_id}>
                            <TableCell className="text-center">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-lg"
                                onClick={() => void toggleCinemaStudios(cinema.cinema_id)}
                                aria-label={`Lihat detail studio ${cinema.cinema_name}`}
                              >
                                {isExpanded ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </Button>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">{cinema.cinema_name}</div>
                              <div className="text-xs text-muted-foreground">{cinema.address}</div>
                            </TableCell>
                            <TableCell>{cinema.city}</TableCell>
                            <TableCell className="text-right">
                              {cinema.metrics.total_tickets.toLocaleString("id-ID")}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(cinema.metrics.total_revenue)}
                            </TableCell>
                            <TableCell className="text-right">{cinema.metrics.active_movies}</TableCell>
                          </TableRow>

                          {isExpanded ? (
                            <TableRow className="bg-muted/20">
                              <TableCell colSpan={6} className="px-6 py-4">
                                <div className="rounded-xl border border-border bg-background p-4">
                                  <div className="mb-3 flex items-center justify-between">
                                    <p className="text-sm font-semibold text-foreground">
                                      Detail Studio
                                    </p>
                                    <Badge variant="outline">
                                      {studioLoading[cinema.cinema_id]
                                        ? "Loading..."
                                        : `${studios.length} studio`}
                                    </Badge>
                                  </div>

                                  {studioLoading[cinema.cinema_id] ? (
                                    <p className="text-sm text-muted-foreground">
                                      Memuat detail studio...
                                    </p>
                                  ) : studioErrors[cinema.cinema_id] ? (
                                    <p className="text-sm text-amber-700">
                                      {studioErrors[cinema.cinema_id]}
                                    </p>
                                  ) : studios.length > 0 ? (
                                    <div className="grid gap-3 md:grid-cols-2">
                                      {studios.map((studio, index) => (
                                        <div
                                          key={studio.studio_id ?? studio.id ?? `${cinema.cinema_id}-${index}`}
                                          className="rounded-xl border border-border bg-muted/10 p-3"
                                        >
                                          <p className="font-medium text-foreground">
                                            {studio.studio_name ?? studio.name ?? `Studio ${index + 1}`}
                                          </p>
                                          <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                                            <p>
                                              Capacity:{" "}
                                              {(studio.total_capacity ?? studio.capacity ?? 0).toLocaleString("id-ID")}
                                            </p>
                                            <p>
                                              Type: {formatStudioType(studio)}
                                            </p>
                                          </div>

                                          {(() => {
                                            const studioId = studio.studio_id ?? studio.id;
                                            const metrics = studioId ? studioMetrics[studioId] : undefined;
                                            const metricsLoading = studioId ? studioMetricsLoading[studioId] : false;
                                            const metricsError = studioId ? studioMetricsErrors[studioId] : "";

                                            if (metricsLoading) {
                                              return (
                                                <div className="mt-3 grid gap-2 text-sm text-muted-foreground">
                                                  <p>Memuat metrik studio...</p>
                                                </div>
                                              );
                                            }

                                            if (metricsError) {
                                              return (
                                                <div className="mt-3 text-sm text-amber-700">
                                                  {metricsError}
                                                </div>
                                              );
                                            }

                                            if (!metrics) {
                                              return null;
                                            }

                                            return (
                                              <div className="mt-3 grid gap-2 rounded-lg bg-muted/30 p-3 text-sm md:grid-cols-3">
                                                <div>
                                                  <p className="text-xs text-muted-foreground">Tickets</p>
                                                  <p className="font-semibold text-foreground">
                                                    {metrics.totalTickets.toLocaleString("id-ID")}
                                                  </p>
                                                </div>
                                                <div>
                                                  <p className="text-xs text-muted-foreground">Revenue</p>
                                                  <p className="font-semibold text-foreground">
                                                    {formatCurrency(metrics.revenue)}
                                                  </p>
                                                </div>
                                                <div>
                                                  <p className="text-xs text-muted-foreground">Occupancy</p>
                                                  <p className="font-semibold text-foreground">
                                                    {metrics.occupancy.toFixed(1)}%
                                                  </p>
                                                </div>
                                              </div>
                                            );
                                          })()}
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-sm text-muted-foreground">
                                      Belum ada data studio untuk bioskop ini.
                                    </p>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ) : null}
                        </Fragment>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        {loading ? "Loading..." : "Belum ada data bioskop untuk kota ini."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="film" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-5">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Highlight Film</CardTitle>
                <CardDescription>Ringkasan film teratas untuk kota {city}.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-2xl border border-border bg-muted/20 p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Top Movie</p>
                  <p className="mt-2 text-lg font-semibold">
                    {data.movieStats?.summary.top_movie.title ?? "--"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {data.movieStats?.summary.top_movie.tickets_sold?.toLocaleString("id-ID") ?? "--"} tiket
                  </p>
                </div>
                <div className="rounded-2xl border border-border bg-muted/20 p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Top Genre</p>
                  <p className="mt-2 text-lg font-semibold">
                    {data.movieStats?.summary.top_genre.genre ?? "--"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {data.movieStats?.summary.top_genre.tickets_sold?.toLocaleString("id-ID") ?? "--"} tiket
                  </p>
                </div>
                <div className="rounded-2xl border border-border bg-muted/20 p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Rating Breakdown</p>
                  <div className="mt-3 space-y-3">
                    {data.movieStats?.breakdown_rating_usia.map((item) => (
                      <div key={item.rating_usia} className="flex items-center justify-between gap-3 text-sm">
                        <Badge variant="outline">{item.rating_usia}</Badge>
                        <span className="text-muted-foreground">
                          {item.total_tickets_sold.toLocaleString("id-ID")} tiket
                        </span>
                      </div>
                    )) ?? <p className="text-sm text-muted-foreground">Belum ada data rating.</p>}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>Top Film di {city}</CardTitle>
                <CardDescription>Film terlaris berdasarkan total tiket dan revenue.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Film</TableHead>
                      <TableHead>Genre</TableHead>
                      <TableHead className="text-right">Tiket</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topMovies.length > 0 ? (
                      topMovies.map((movie) => (
                        <TableRow key={movie.movie_id}>
                          <TableCell>
                            <div className="font-medium">{movie.title}</div>
                            <div className="text-xs text-muted-foreground">{movie.rating_usia}</div>
                          </TableCell>
                          <TableCell>{movie.genre[0] ?? "-"}</TableCell>
                          <TableCell className="text-right">
                            {movie.tickets_sold.toLocaleString("id-ID")}
                          </TableCell>
                          <TableCell className="text-right">{formatCurrency(movie.revenue)}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground">
                          {loading ? "Loading..." : "Belum ada data film untuk kota ini."}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sales" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Tren Penjualan</CardTitle>
                <CardDescription>Total tiket per jam di {city}.</CardDescription>
              </CardHeader>
              <CardContent className="h-[320px]">
                {salesChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={salesChartData}>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" />
                      <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
                      <YAxis tickLine={false} axisLine={false} fontSize={12} />
                      <Tooltip />
                      <Bar dataKey="tickets" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                    {loading ? "Loading..." : "Belum ada data penjualan."}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Okupansi per Jam</CardTitle>
                <CardDescription>Pergerakan okupansi kota {city} pada periode aktif.</CardDescription>
              </CardHeader>
              <CardContent className="h-[320px]">
                {occupancyChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={occupancyChartData}>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" />
                      <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
                      <YAxis tickLine={false} axisLine={false} fontSize={12} />
                      <Tooltip formatter={(value) => [`${value}%`, "Okupansi"]} />
                      <Line
                        type="monotone"
                        dataKey="occupancy"
                        stroke="hsl(var(--primary))"
                        strokeWidth={3}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                    {loading ? "Loading..." : "Belum ada data okupansi."}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Snapshot Kota</CardTitle>
              <CardDescription>Informasi cepat untuk analisis penjualan dan distribusi node.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-border bg-muted/20 p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPinned className="h-4 w-4" />
                  Kota Aktif
                </div>
                <p className="mt-2 text-xl font-semibold">{city}</p>
              </div>
              <div className="rounded-2xl border border-border bg-muted/20 p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Building2 className="h-4 w-4" />
                  Bioskop Aktif
                </div>
                <p className="mt-2 text-xl font-semibold">
                  {data.cinemas?.summary.active_cinemas ?? 0}
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-muted/20 p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Ticket className="h-4 w-4" />
                  Total Transaksi
                </div>
                <p className="mt-2 text-xl font-semibold">
                  {data.summary?.data.total_transactions?.toLocaleString("id-ID") ?? "--"}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
