"use client";

import { useEffect, useMemo, useState } from "react";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import {
  Activity,
  DollarSign,
  Gauge,
  MapPinned,
  RefreshCw,
  Ticket,
} from "lucide-react";
import {
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { DateRangeFilter } from "@/components/filters/date-range-filter";
import IndonesiaFranchiseMap from "@/components/maps/indonesia-franchise-map";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getCinemaPerformanceBreakdown,
  getDashboardSummary,
  getLatestAiInsight,
  getOccupancyStats,
  getSystemHealth,
  getTopMovies,
  type AiInsightResponse,
  type CinemaBreakdownResponse,
  type DashboardQuery,
  type HealthResponse,
  type OccupancyResponse,
  type SummaryResponse,
  type TopMovie,
} from "@/lib/cinetrack-api";

type DashboardPayload = {
  summary: SummaryResponse | null;
  cinemas: CinemaBreakdownResponse | null;
  occupancy: OccupancyResponse | null;
  topMovies: TopMovie[] | null;
  health: HealthResponse | null;
  insight: AiInsightResponse | null;
};

type DashboardErrors = Partial<Record<keyof DashboardPayload, string>>;

type MultiCityOccupancyPoint = {
  label: string;
  [city: string]: number | string | undefined;
};

const cityCoordinates: Record<string, [number, number]> = {
  Jakarta: [106.8456, -6.2088],
  Bandung: [107.6191, -6.9175],
  Surabaya: [112.7508, -7.2575],
  Semarang: [110.421, -6.9667],
  Medan: [98.6722, 3.5952],
  Makassar: [119.4327, -5.1477],
  Denpasar: [115.2167, -8.65],
  Palembang: [104.7458, -2.9761],
  Samarinda: [117.1458, -0.5022],
  Jayapura: [140.7181, -2.5337],
  Yogyakarta: [110.3695, -7.7956],
  Pontianak: [109.3425, -0.0263],
};

const occupancyLineColors = [
  "#ef4444",
  "#2563eb",
  "#16a34a",
  "#f59e0b",
  "#7c3aed",
  "#0891b2",
  "#db2777",
  "#4f46e5",
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);

const formatCompactCurrency = (value: number) => {
  if (value >= 1_000_000_000) return `Rp ${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `Rp ${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `Rp ${(value / 1_000).toFixed(0)}K`;
  return formatCurrency(value);
};

const formatGrowthLabel = (value: number) => {
  const formatted = `${Math.abs(value).toFixed(2)}%`;
  return value >= 0 ? `+${formatted}` : `-${formatted}`;
};

const formatQueryDate = (date: Date) => format(date, "yyyy-MM-dd");

function getDefaultDateRange(): DateRange {
  const today = new Date();
  return {
    from: today,
    to: today,
  };
}

function buildQuery(
  selectedCity: string,
  selectedCinema: string,
  selectedDateRange: DateRange | undefined
): DashboardQuery {
  const query: DashboardQuery = {};

  if (selectedCity !== "all") {
    query.city = selectedCity;
  }

  if (selectedCinema !== "all") {
    query.cinema_id = selectedCinema;
  }

  if (selectedDateRange?.from) {
    query.start_date = formatQueryDate(selectedDateRange.from);
    query.end_date = formatQueryDate(selectedDateRange.to ?? selectedDateRange.from);
  }

  return query;
}

function getErrorMessage(reason: unknown, fallback: string) {
  return reason instanceof Error ? reason.message : fallback;
}

function formatPeriod(periodString?: string) {
  if (!periodString) return "Semua tanggal";

  const [startDate, endDate] = periodString.split(" to ");
  if (!startDate || !endDate) return periodString;

  const options: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "short",
    year: "numeric",
  };

  const start = new Date(startDate).toLocaleDateString("id-ID", options);
  const end = new Date(endDate).toLocaleDateString("id-ID", options);

  return `${start} - ${end}`;
}

function MetricCardSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-4 w-40" />
    </div>
  );
}

export default function DashboardPage() {
  const [selectedCity, setSelectedCity] = useState("all");
  const [selectedCinema, setSelectedCinema] = useState("all");
  const [selectedDateRange, setSelectedDateRange] = useState<DateRange | undefined>(getDefaultDateRange);
  const [data, setData] = useState<DashboardPayload>({
    summary: null,
    cinemas: null,
    occupancy: null,
    topMovies: null,
    health: null,
    insight: null,
  });
  const [errors, setErrors] = useState<DashboardErrors>({});
  const [loading, setLoading] = useState(true);
  const [multiCityOccupancyData, setMultiCityOccupancyData] = useState<MultiCityOccupancyPoint[]>([]);
  const [multiCityOccupancyKeys, setMultiCityOccupancyKeys] = useState<string[]>([]);

  const query = useMemo(
    () => buildQuery(selectedCity, selectedCinema, selectedDateRange),
    [selectedCity, selectedCinema, selectedDateRange]
  );

  useEffect(() => {
    let cancelled = false;

    const loadDashboard = async () => {
      setLoading(true);
      setErrors({});

      const results = await Promise.allSettled([
        getDashboardSummary(query),
        getCinemaPerformanceBreakdown(query),
        getOccupancyStats(query),
        getTopMovies(query),
        getSystemHealth(),
        getLatestAiInsight(),
      ]);

      if (cancelled) return;

      setData({
        summary: results[0].status === "fulfilled" ? results[0].value : null,
        cinemas: results[1].status === "fulfilled" ? results[1].value : null,
        occupancy: results[2].status === "fulfilled" ? results[2].value : null,
        topMovies: results[3].status === "fulfilled" ? results[3].value : null,
        health: results[4].status === "fulfilled" ? results[4].value : null,
        insight: results[5].status === "fulfilled" ? results[5].value : null,
      });

      setErrors({
        summary:
          results[0].status === "rejected"
            ? getErrorMessage(results[0].reason, "Failed to load summary.")
            : undefined,
        cinemas:
          results[1].status === "rejected"
            ? getErrorMessage(results[1].reason, "Failed to load cinemas.")
            : undefined,
        occupancy:
          results[2].status === "rejected"
            ? getErrorMessage(results[2].reason, "Failed to load occupancy.")
            : undefined,
        topMovies:
          results[3].status === "rejected"
            ? getErrorMessage(results[3].reason, "Failed to load top movies.")
            : undefined,
        health:
          results[4].status === "rejected"
            ? getErrorMessage(results[4].reason, "Failed to load system health.")
            : undefined,
        insight:
          results[5].status === "rejected"
            ? getErrorMessage(results[5].reason, "Failed to load AI insight.")
            : undefined,
      });

      setLoading(false);
    };

    loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [query]);

  const cityOptions = useMemo(() => {
    if (!data.cinemas) return [{ id: "all", name: "All City" }];

    const uniqueCities = [...new Set(data.cinemas.breakdown.map((item) => item.city))].sort();

    return [
      { id: "all", name: "All City" },
      ...uniqueCities.map((city) => ({ id: city, name: city })),
    ];
  }, [data.cinemas]);

  const cinemaOptions = useMemo(() => {
    if (!data.cinemas) return [{ id: "all", name: "All Franchise" }];

    const filtered = data.cinemas.breakdown.filter((item) => {
      if (selectedCity === "all") return true;
      return item.city === selectedCity;
    });

    return [
      { id: "all", name: "All Franchise" },
      ...filtered.map((item) => ({
        id: item.cinema_id,
        name: item.cinema_name,
      })),
    ];
  }, [data.cinemas, selectedCity]);

  const mapSummary = useMemo(() => {
    if (!data.cinemas) return [];

    const grouped = data.cinemas.breakdown.reduce((acc, cinema) => {
      const coordinates = cityCoordinates[cinema.city] ?? [106.8456, -6.2088];

        if (!acc[cinema.city]) {
          acc[cinema.city] = {
            name: cinema.city,
            totalNodes: 0,
            activeNodes: 0,
            nonActiveNodes: 0,
            occupancy: 0,
            occupancyCount: 0,
            totalTickets: 0,
            revenue: 0,
            coordinates,
          };
        }

        acc[cinema.city].totalNodes += 1;
        acc[cinema.city].totalTickets += cinema.metrics.total_tickets;
        acc[cinema.city].revenue += cinema.metrics.total_revenue;

      if (cinema.metrics.active_studios > 0) {
        acc[cinema.city].activeNodes += 1;
        acc[cinema.city].occupancy += data.summary?.data.occupancy ?? 0;
        acc[cinema.city].occupancyCount += 1;
      } else {
        acc[cinema.city].nonActiveNodes += 1;
      }

      return acc;
    }, {} as Record<string, {
      name: string;
      totalNodes: number;
      activeNodes: number;
      nonActiveNodes: number;
      occupancy: number;
      occupancyCount: number;
      totalTickets: number;
      revenue: number;
      coordinates: [number, number];
    }>);

    return Object.values(grouped).map((item) => ({
      name: item.name,
      totalNodes: item.totalNodes,
      activeNodes: item.activeNodes,
      nonActiveNodes: item.nonActiveNodes,
      coordinates: item.coordinates,
      occupancy: item.occupancyCount > 0 ? item.occupancy / item.occupancyCount : 0,
      totalTickets: item.totalTickets,
      revenue: item.revenue,
    }));
  }, [data.cinemas, data.summary]);

  const occupancyChartData = useMemo(() => {
    if (selectedCity === "all" && selectedCinema === "all" && multiCityOccupancyData.length > 0) {
      return multiCityOccupancyData;
    }

    if (!data.occupancy) return [];

    return data.occupancy.breakdown.map((item) => ({
      label: item.time_group.split(" ").at(-1) ?? item.time_group,
      occupancy: Number(item.avg_occupancy.toFixed(2)),
    }));
  }, [data.occupancy, multiCityOccupancyData, selectedCity, selectedCinema]);

  useEffect(() => {
    let cancelled = false;

    const loadMultiCityOccupancy = async () => {
      if (!data.cinemas || selectedCity !== "all" || selectedCinema !== "all") {
        setMultiCityOccupancyData([]);
        setMultiCityOccupancyKeys([]);
        return;
      }

      const uniqueCities = [...new Set(data.cinemas.breakdown.map((item) => item.city))].sort();
      if (uniqueCities.length === 0) {
        setMultiCityOccupancyData([]);
        setMultiCityOccupancyKeys([]);
        return;
      }

      const results = await Promise.allSettled(
        uniqueCities.map((city) =>
          getOccupancyStats({
            city,
            start_date: query.start_date,
            end_date: query.end_date,
          })
        )
      );

      if (cancelled) return;

      const merged = new Map<string, MultiCityOccupancyPoint>();
      const successfulCities: string[] = [];

      results.forEach((result, index) => {
        if (result.status !== "fulfilled") return;

        const city = uniqueCities[index];
        successfulCities.push(city);

        result.value.breakdown.forEach((item) => {
          const label = item.time_group.split(" ").at(-1) ?? item.time_group;
          const existing = merged.get(label) ?? { label };
          existing[city] = Number(item.avg_occupancy.toFixed(2));
          merged.set(label, existing);
        });
      });

      setMultiCityOccupancyKeys(successfulCities);
      setMultiCityOccupancyData(Array.from(merged.values()));
    };

    loadMultiCityOccupancy();

    return () => {
      cancelled = true;
    };
  }, [data.cinemas, query.end_date, query.start_date, selectedCity, selectedCinema]);

  const topMovies = data.topMovies?.slice(0, 10) ?? [];
  const hasAnyError = Object.values(errors).some(Boolean);
  const cinemaMetricTotals = useMemo(() => {
    if (!data.cinemas) {
      return {
        totalTickets: 0,
        totalRevenue: 0,
        activeCinemas: 0,
        totalCinemas: 0,
      };
    }

    return {
      totalTickets: data.cinemas.breakdown.reduce(
        (sum, item) => sum + item.metrics.total_tickets,
        0
      ),
      totalRevenue: data.cinemas.breakdown.reduce(
        (sum, item) => sum + item.metrics.total_revenue,
        0
      ),
      activeCinemas: data.cinemas.summary.active_cinemas,
      totalCinemas: data.cinemas.summary.total_cinemas,
    };
  }, [data.cinemas]);
  const ticketGrowth = data.summary?.data.growth?.tickets;
  const revenueGrowth = data.summary?.data.growth?.revenue;
  const avgOccupancyGrowth = data.summary?.data.growth?.avg_occupancy;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Cinema Operations Dashboard</h1>
            <p className="text-sm text-muted-foreground">Overview of your cinema operations.</p>
            {loading ? (
              <Skeleton className="mt-2 h-3 w-40" />
            ) : (
              <p className="text-xs text-muted-foreground">
                {`Data from ${formatPeriod(data.summary?.meta.period)}`}
              </p>
            )}
          </div>

        <div className="w-full max-w-5xl">
          <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-[minmax(220px,1fr)_minmax(220px,1fr)_minmax(220px,1fr)]">
            <Select
              value={selectedCity}
              onValueChange={(value) => {
                setSelectedCity(value);
                setSelectedCinema("all");
              }}
            >
              <SelectTrigger className="h-15 w-full min-w-0">
                <SelectValue placeholder="Select City" />
              </SelectTrigger>
              <SelectContent>
                {cityOptions.map((city) => (
                  <SelectItem key={city.id} value={city.id}>
                    {city.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedCinema} onValueChange={setSelectedCinema}>
              <SelectTrigger className="h-15 w-full min-w-0">
                <SelectValue placeholder="Select Franchise" />
              </SelectTrigger>
              <SelectContent>
                {cinemaOptions.map((cinema) => (
                  <SelectItem key={cinema.id} value={cinema.id}>
                    {cinema.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <DateRangeFilter
              value={selectedDateRange}
              onApply={setSelectedDateRange}
              triggerLabel="Select Period"
            />
          </div>
        </div>
      </div>

      {hasAnyError ? (
        <Card className="border-amber-300 bg-amber-50">
          <CardContent className="space-y-1 py-4 text-sm text-amber-700">
            <p>Beberapa data dashboard belum bisa dimuat dari API saat ini.</p>
            {errors.summary ? <p>Summary: {errors.summary}</p> : null}
            {errors.cinemas ? <p>Cinemas: {errors.cinemas}</p> : null}
            {errors.topMovies ? <p>Top movies: {errors.topMovies}</p> : null}
            {errors.occupancy ? <p>Occupancy: {errors.occupancy}</p> : null}
            {errors.health ? <p>System health: {errors.health}</p> : null}
            {errors.insight ? <p>Insight: {errors.insight}</p> : null}
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Total Tickets Sold</CardTitle>
              <Ticket className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <MetricCardSkeleton />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {data.cinemas
                    ? cinemaMetricTotals.totalTickets.toLocaleString("id-ID")
                    : "--"}
                </div>
                <p
                  className={
                    ticketGrowth === undefined
                      ? "text-xs text-muted-foreground"
                      : ticketGrowth < 0
                        ? "text-xs text-red-600"
                        : "text-xs text-green-600"
                  }
                >
                  {ticketGrowth === undefined
                    ? "No growth data available"
                    : `${formatGrowthLabel(ticketGrowth)} vs previous period`}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <MetricCardSkeleton />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {data.cinemas
                    ? formatCompactCurrency(cinemaMetricTotals.totalRevenue)
                    : "--"}
                </div>
                <p
                  className={
                    revenueGrowth === undefined
                      ? "text-xs text-muted-foreground"
                      : revenueGrowth < 0
                        ? "text-xs text-red-600"
                        : "text-xs text-green-600"
                  }
                >
                  {revenueGrowth === undefined
                    ? "No growth data available"
                    : `${formatGrowthLabel(revenueGrowth)} vs previous period`}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Active Franchises</CardTitle>
              <MapPinned className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <MetricCardSkeleton />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {data.cinemas
                    ? `${cinemaMetricTotals.activeCinemas} / ${cinemaMetricTotals.totalCinemas}`
                    : "--"}
                </div>
                <div className="space-y-2">
                  <Progress
                    value={
                      data.cinemas && cinemaMetricTotals.totalCinemas > 0
                        ? (cinemaMetricTotals.activeCinemas / cinemaMetricTotals.totalCinemas) * 100
                        : 0
                    }
                    className="h-1"
                  />
                  <p className="text-xs text-muted-foreground">
                    {data.cinemas && cinemaMetricTotals.totalCinemas > 0
                      ? `${((cinemaMetricTotals.activeCinemas / cinemaMetricTotals.totalCinemas) * 100).toFixed(0)}% Active Franchises`
                      : "Active Franchises out of Total Available"}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Average Occupancy</CardTitle>
              <Gauge className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <MetricCardSkeleton />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {data.summary ? `${data.summary.data.occupancy.toFixed(1)}%` : "--"}
                </div>
                <p
                  className={
                    avgOccupancyGrowth === undefined
                      ? "text-xs text-muted-foreground"
                      : avgOccupancyGrowth < 0
                        ? "text-xs text-red-600"
                        : "text-xs text-green-600"
                  }
                >
                  {avgOccupancyGrowth === undefined
                    ? "No growth data available"
                    : `${formatGrowthLabel(avgOccupancyGrowth)} vs previous period`}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex items-center justify-between px-8 pt-6 pb-2">
          <div className="flex w-full items-center justify-between gap-2">
            <div>
              <CardTitle>Operational Intelligence Insights</CardTitle>
              <p className="py-2 text-sm text-gray-500">
                {data.insight?.period?.label
                  ? `Based on data from ${formatPeriod(data.insight.period.label)}`
                  : "Latest AI-generated operational insight"}
              </p>
            </div>
            <Button variant="ghost" size="sm" disabled className="shrink-0">
              Lihat Semua
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3 rounded-lg border border-dashed border-border bg-muted/20 px-4 py-6">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-11/12" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ) : data.insight ? (
            <div className="space-y-4 rounded-2xl border border-border bg-muted/20 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <h3 className="text-base font-semibold text-foreground">
                    {data.insight.cards?.headline ?? data.insight.analysis?.title ?? "Operational insight"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {data.insight.cards?.summary ??
                      data.insight.analysis?.description ??
                      "Insight terbaru belum memiliki ringkasan."}
                  </p>
                </div>
                <div className="flex gap-2">
                  {data.insight.cards?.impact_level || data.insight.analysis?.impact_level ? (
                    <Badge variant="outline" className="capitalize">
                      {data.insight.cards?.impact_level ?? data.insight.analysis?.impact_level}
                    </Badge>
                  ) : null}
                  {data.insight.cards?.category || data.insight.analysis?.category ? (
                    <Badge variant="outline" className="capitalize">
                      {data.insight.cards?.category ?? data.insight.analysis?.category}
                    </Badge>
                  ) : null}
                </div>
              </div>

              <div className="rounded-xl border border-border bg-background/80 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Recommendation
                </p>
                <p className="mt-2 text-sm text-foreground">
                  {data.insight.cards?.recommendation ??
                    data.insight.analysis?.recommendation ??
                    "Belum ada rekomendasi yang tersedia."}
                </p>
              </div>

              {((data.insight.analysis?.action_items?.length ?? 0) > 0 ||
                (data.insight.action_items?.length ?? 0) > 0) ? (
                <div className="space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Action Items
                  </p>
                  <div className="space-y-2">
                    {(data.insight.analysis?.action_items ?? data.insight.action_items ?? [])
                      .slice(0, 3)
                      .map((item, index) => (
                        <div
                          key={`${index}-${item}`}
                          className="rounded-xl border border-border bg-background/70 px-3 py-2 text-sm text-foreground"
                        >
                          {item}
                        </div>
                      ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
              Insight belum tersedia
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="px-0 pb-0">
          {mapSummary.length > 0 ? (
            <IndonesiaFranchiseMap
              citySummary={mapSummary}
              query={{
                start_date: query.start_date,
                end_date: query.end_date,
              }}
            />
          ) : (
            <div className="px-6 pb-6">
              <div className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-16 text-center text-sm text-muted-foreground">
                Map data unavailable
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-5">
        <Card className="xl:col-span-3">
          <CardHeader>
            <CardTitle>Top Best-Selling Movies</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center font-semibold">Peringkat</TableHead>
                  <TableHead className="text-center font-semibold">Judul</TableHead>
                  <TableHead className="text-center font-semibold">Genre</TableHead>
                  <TableHead className="text-center font-semibold">Tiket</TableHead>
                  <TableHead className="text-center font-semibold">Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topMovies.length > 0 ? (
                  topMovies.map((movie, index) => (
                    <TableRow key={movie.movie_id}>
                      <TableCell className="text-center">{index + 1}</TableCell>
                      <TableCell className="font-medium">{movie.title}</TableCell>
                      <TableCell className="text-center">{movie.genre[0] ?? "-"}</TableCell>
                      <TableCell className="text-center">
                        {movie.tickets_sold.toLocaleString("id-ID")}
                      </TableCell>
                      <TableCell className="text-center text-muted-foreground">
                        {formatCompactCurrency(movie.revenue)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      {loading ? "Loading top movies..." : "Data film terlaris belum tersedia."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="space-y-6 xl:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Average Studio Occupancy</CardTitle>
              <p className="text-xs text-gray-500">Average occupancy rates across different cities</p>
            </CardHeader>
            <CardContent className="h-[320px] pr-2">
              {occupancyChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={occupancyChartData}>
                    <XAxis
                      dataKey="label"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `${value}%`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        borderColor: "hsl(var(--border))",
                      }}
                      formatter={(value, name) => [`${value}%`, name === "occupancy" ? "Okupansi" : name]}
                    />
                    {selectedCity === "all" && selectedCinema === "all" && multiCityOccupancyKeys.length > 0 ? (
                      <>
                        <Legend
                          wrapperStyle={{
                            paddingLeft: "0.5rem",
                            paddingRight: "0.5rem",
                            paddingTop: "0.5rem",
                            fontSize: "12px",
                          }}
                          formatter={(value) => <span className="text-xs">{value}</span>}
                        />
                        {multiCityOccupancyKeys.map((city, index) => (
                          <Line
                            key={city}
                            type="monotone"
                            dataKey={city}
                            stroke={occupancyLineColors[index % occupancyLineColors.length]}
                            strokeWidth={2.5}
                            dot={false}
                            connectNulls
                          />
                        ))}
                      </>
                    ) : (
                      <Line
                        type="monotone"
                        dataKey="occupancy"
                        stroke="hsl(var(--primary))"
                        strokeWidth={3}
                        dot={false}
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 text-sm text-muted-foreground">
                  {loading ? "Loading occupancy..." : "Data okupansi belum tersedia."}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>System Health</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  <span>Status</span>
                </div>
                <Badge variant="outline" className="capitalize">
                  {data.health?.status ?? "Unavailable"}
                </Badge>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Ticket className="h-4 w-4 text-muted-foreground" />
                  <span>Transactions (Last 60 mins)</span>
                </div>
                <span className="font-medium">
                  {data.health ? data.health.tickets_last_hour.toLocaleString("id-ID") : "--"}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 text-muted-foreground" />
                  <span>Last Database Updated</span>
                </div>
                <span className="text-right font-medium">
                  {data.health?.last_data_in
                    ? format(new Date(data.health.last_data_in), "dd MMM yyyy, HH:mm")
                    : "--"}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
