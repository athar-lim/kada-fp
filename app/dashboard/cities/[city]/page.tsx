"use client";

import { Fragment } from "react";
import Link from "next/link";
import { useEffect, useMemo, useState, type ComponentType } from "react";
import { useParams, usePathname, useSearchParams } from "next/navigation";
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
  getCinemaPerformanceBreakdown,
  getDashboardSummary,
  getMoviesCatalog,
  getMovieStats,
  getOccupancyStats,
  getScheduleDetail,
  getSchedules,
  getTopMovies,
  getTrendStats,
  type CinemaBreakdownResponse,
  type DashboardQuery,
  type MovieCatalogItem,
  type MovieStatsResponse,
  type OccupancyResponse,
  type ScheduleDetailResponse,
  type SummaryResponse,
  type StudioResponse,
  type TopMovie,
  type TrendsResponse,
} from "@/lib/cinetrack-api";
import { mergeParamsForDashboardLink } from "@/lib/dashboard-url-filters";

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

type ScheduleBreakdownRow = {
  scheduleId: string;
  movieId: string;
  movieTitle: string;
  studioId: string;
  showDate: string;
  startTime: string;
  ticketsSold: number;
  occupancy: number;
  price: number;
  status: string;
};

type StudioMovieBreakdownRow = {
  movieId: string;
  movieTitle: string;
  ticketsSold: number;
  totalSchedules: number;
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

const formatQueryDate = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

function getDefaultDateQuery() {
  const today = new Date();
  return {
    start_date: formatQueryDate(today),
    end_date: formatQueryDate(today),
  };
}

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
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const city = decodeURIComponent(params.city);
  const dashboardHref = mergeParamsForDashboardLink(
    "/dashboard",
    new URLSearchParams(searchParams.toString()),
    pathname
  );
  const filmsHref = mergeParamsForDashboardLink(
    "/dashboard/films",
    new URLSearchParams(searchParams.toString()),
    pathname
  );
  const salesHref = mergeParamsForDashboardLink(
    "/dashboard/sales",
    new URLSearchParams(searchParams.toString()),
    pathname
  );
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
  const [expandedStudioIds, setExpandedStudioIds] = useState<string[]>([]);
  const [expandedStudioMovieIds, setExpandedStudioMovieIds] = useState<string[]>([]);
  const [expandedStudioScheduleIds, setExpandedStudioScheduleIds] = useState<string[]>([]);
  const [studioMetrics, setStudioMetrics] = useState<Record<string, StudioMetricSummary>>({});
  const [studioMetricsLoading, setStudioMetricsLoading] = useState<Record<string, boolean>>({});
  const [studioMetricsErrors, setStudioMetricsErrors] = useState<Record<string, string>>({});
  const [cityScheduleRows, setCityScheduleRows] = useState<ScheduleBreakdownRow[]>([]);
  const [citySchedulesLoading, setCitySchedulesLoading] = useState(false);
  const [citySchedulesError, setCitySchedulesError] = useState<string>("");
  const [studioScheduleRows, setStudioScheduleRows] = useState<Record<string, ScheduleBreakdownRow[]>>({});
  const [studioMovieRows, setStudioMovieRows] = useState<Record<string, StudioMovieBreakdownRow[]>>({});
  const [studioBreakdownLoading, setStudioBreakdownLoading] = useState<Record<string, boolean>>({});
  const [studioBreakdownErrors, setStudioBreakdownErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState("cinema");
  const dateQuery = useMemo<Pick<DashboardQuery, "start_date" | "end_date">>(() => {
    const fallback = getDefaultDateQuery();
    const start_date = searchParams.get("start_date") ?? fallback.start_date;
    const end_date = searchParams.get("end_date") ?? fallback.end_date;

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
    setExpandedStudioIds([]);
    setExpandedStudioMovieIds([]);
    setExpandedStudioScheduleIds([]);
    setStudioMetrics({});
    setStudioMetricsLoading({});
    setStudioMetricsErrors({});
    setCityScheduleRows([]);
    setCitySchedulesLoading(false);
    setCitySchedulesError("");
    setStudioScheduleRows({});
    setStudioMovieRows({});
    setStudioBreakdownLoading({});
    setStudioBreakdownErrors({});
  }, [city, dateQuery.end_date, dateQuery.start_date]);

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      setLoading(true);
      setError(null);

      const results = await Promise.allSettled([
        getDashboardSummary({ city, ...dateQuery }),
        getCinemaPerformanceBreakdown({ city, ...dateQuery }),
        getCinemaBreakdown({ city }),
        getMovieStats({ city, ...dateQuery }),
        getTopMovies({ city, ...dateQuery }),
        getTrendStats({ city, ...dateQuery }),
        getOccupancyStats({ city, ...dateQuery }),
      ]);

      let cinemasData = results[1].status === "fulfilled" ? results[1].value : null;

      if (cinemasData && cinemasData.breakdown.length > 0 && !cancelled) {
        const cinemaSummaries = await Promise.allSettled(
          cinemasData.breakdown.map((cinema) =>
            getDashboardSummary({ city, cinema_id: cinema.cinema_id, ...dateQuery })
          )
        );

        if (!cancelled) {
          cinemasData.breakdown.forEach((cinema, i) => {
            const sumRes = cinemaSummaries[i];
            if (sumRes.status === "fulfilled") {
              cinema.metrics.total_tickets = sumRes.value.data.total_tickets;
              cinema.metrics.total_revenue = sumRes.value.data.revenue;
              if (sumRes.value.data.occupancy !== undefined) {
                cinema.metrics.occupancy = sumRes.value.data.occupancy;
              }
            }
          });
        }
      }

      if (cancelled) return;

      const cinemaMetrics = results[1].status === "fulfilled" ? results[1].value : null;
      const cinemaDirectory = results[2].status === "fulfilled" ? results[2].value : null;
      const addressByCinemaId = Object.fromEntries(
        (cinemaDirectory?.breakdown ?? []).map((item) => [item.cinema_id, item.address ?? ""])
      );

      setData({
        summary: results[0].status === "fulfilled" ? results[0].value : null,
        cinemas: cinemaMetrics
          ? {
              ...cinemaMetrics,
              breakdown: cinemaMetrics.breakdown.map((item) => ({
                ...item,
                address: addressByCinemaId[item.cinema_id] ?? item.address,
              })),
            }
          : null,
        movieStats: results[3].status === "fulfilled" ? results[3].value : null,
        topMovies: results[4].status === "fulfilled" ? results[4].value : [],
        trends: results[5].status === "fulfilled" ? results[5].value : null,
        occupancy: results[6].status === "fulfilled" ? results[6].value : null,
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
  }, [city, dateQuery.end_date, dateQuery.start_date]);

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
      data.occupancy?.breakdown.map((item) => {
        const parts = item.time_group.split(" ");
        let label = item.time_group;
        if (parts.length === 2) {
          const dateParts = parts[0].split("-");
          if (dateParts.length === 3) {
            label = `${dateParts[2]}/${dateParts[1]} ${parts[1]}`;
          }
        }
        return {
          label,
          occupancy: Number((item.occupancy ?? (item as any).avg_occupancy ?? 0).toFixed(2)),
        };
      }) ?? [],
    [data.occupancy]
  );

  const cinemaRows = useMemo(() => data.cinemas?.breakdown ?? [], [data.cinemas]);
  const topMovies = data.topMovies.slice(0, 10);
  const growth = data.summary?.data.growth;
  const cinemaMetricTotals = useMemo(() => {
    if (!data.cinemas) {
      return {
        totalTickets: 0,
        totalRevenue: 0,
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
      totalCinemas: data.cinemas.summary.total_cinemas,
    };
  }, [data.cinemas]);

  const fetchScheduleDetailsInBatches = async (
    schedules: Array<{ schedule_id: string }>,
    batchSize = 20
  ) => {
    const results: ScheduleDetailResponse[] = [];

    for (let index = 0; index < schedules.length; index += batchSize) {
      const chunk = schedules.slice(index, index + batchSize);
      const settled = await Promise.allSettled(
        chunk.map((schedule) => getScheduleDetail(schedule.schedule_id))
      );

      results.push(
        ...settled.flatMap((result) => (result.status === "fulfilled" ? [result.value] : []))
      );
    }

    return results;
  };

  useEffect(() => {
    let cancelled = false;

    const loadCityScheduleBreakdown = async () => {
      if (activeTab !== "sales") {
        return;
      }

      if (!data.cinemas || cinemaRows.length === 0) {
        setCityScheduleRows([]);
        return;
      }

      setCitySchedulesLoading(true);
      setCitySchedulesError("");

      try {
        const [moviesCatalog, schedulesByCinema, studiosByCinema] = await Promise.all([
          getMoviesCatalog(),
          Promise.all(
            cinemaRows.map((cinema) =>
              getSchedules({
                cinema_id: cinema.cinema_id,
                start_date: dateQuery.start_date,
                end_date: dateQuery.end_date,
              })
            )
          ),
          Promise.all(
            cinemaRows.map((cinema) =>
              getCinemaStudios(cinema.cinema_id).catch(() => [] as StudioResponse[])
            )
          ),
        ]);

        if (cancelled) return;

        const movieMap = new Map<string, MovieCatalogItem>(
          moviesCatalog.map((movie) => [movie.movie_id, movie])
        );
        const studioCapacityMap = new Map<string, number>();
        studiosByCinema.flat().forEach((studio) => {
          const studioId = studio.studio_id ?? studio.id;
          const capacity = Number(studio.capacity ?? 0);
          if (studioId) {
            studioCapacityMap.set(studioId, Number.isFinite(capacity) ? capacity : 0);
          }
        });
        const scheduleList = schedulesByCinema.flat();
        const scheduleDetails = await fetchScheduleDetailsInBatches(scheduleList);

        if (cancelled) return;

        const rows = scheduleDetails
          .map((detail) => ({
            scheduleId: detail.schedule_id,
            movieId: detail.movie_id,
            movieTitle: movieMap.get(detail.movie_id)?.title ?? detail.movie_id,
            studioId: detail.studio_id,
            showDate: detail.show_date,
            startTime: detail.start_time,
            ticketsSold: detail.tickets_sold,
            occupancy:
              (studioCapacityMap.get(detail.studio_id) ?? 0) > 0
                ? (detail.tickets_sold / (studioCapacityMap.get(detail.studio_id) ?? 1)) * 100
                : 0,
            price: detail.price,
            status: detail.status,
          }))
          .sort((a, b) => b.ticketsSold - a.ticketsSold)
          .slice(0, 10);

        setCityScheduleRows(rows);
      } catch (reason) {
        if (cancelled) return;
        setCitySchedulesError(
          reason instanceof Error ? reason.message : "Gagal memuat breakdown schedule kota."
        );
      } finally {
        if (!cancelled) {
          setCitySchedulesLoading(false);
        }
      }
    };

    void loadCityScheduleBreakdown();

    return () => {
      cancelled = true;
    };
  }, [activeTab, cinemaRows, data.cinemas, dateQuery.end_date, dateQuery.start_date]);

  const loadStudioMetrics = async (cinemaId: string, studios: StudioResponse[]) => {
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
          cinema_id: cinemaId,
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

  const loadStudioBreakdowns = async (studios: StudioResponse[]) => {
    const studioIdsToLoad = studios
      .map((studio) => studio.studio_id ?? studio.id)
      .filter((studioId): studioId is string => Boolean(studioId))
      .filter((studioId) => !studioScheduleRows[studioId] && !studioBreakdownLoading[studioId]);

    if (studioIdsToLoad.length === 0) {
      return;
    }

    setStudioBreakdownLoading((current) => {
      const next = { ...current };
      studioIdsToLoad.forEach((studioId) => {
        next[studioId] = true;
      });
      return next;
    });

    const moviesCatalog = await getMoviesCatalog();
    const movieMap = new Map<string, MovieCatalogItem>(
      moviesCatalog.map((movie) => [movie.movie_id, movie])
    );
    const studioCapacityMap = new Map<string, number>(
      studios
        .map((studio) => [
          studio.studio_id ?? studio.id,
          studio.total_capacity ?? studio.capacity ?? 0,
        ] as const)
        .filter((entry): entry is [string, number] => Boolean(entry[0]))
    );

    const results = await Promise.allSettled(
      studioIdsToLoad.map(async (studioId) => {
        const schedules = await getSchedules({
          studio_id: studioId,
          start_date: dateQuery.start_date,
          end_date: dateQuery.end_date,
        });

        const detailResults = await Promise.allSettled(
          schedules.map((schedule) => getScheduleDetail(schedule.schedule_id))
        );

        const scheduleRows = detailResults
          .flatMap((result) => (result.status === "fulfilled" ? [result.value] : []))
          .map((detail: ScheduleDetailResponse) => ({
            scheduleId: detail.schedule_id,
            movieId: detail.movie_id,
            movieTitle: movieMap.get(detail.movie_id)?.title ?? detail.movie_id,
            studioId: detail.studio_id,
            showDate: detail.show_date,
            startTime: detail.start_time,
            ticketsSold: detail.tickets_sold,
            occupancy:
              (studioCapacityMap.get(detail.studio_id) ?? 0) > 0
                ? (detail.tickets_sold / (studioCapacityMap.get(detail.studio_id) ?? 1)) * 100
                : 0,
            price: detail.price,
            status: detail.status,
          }))
          .sort((a, b) => b.ticketsSold - a.ticketsSold);

        const movieRows = Object.values(
          scheduleRows.reduce<Record<string, StudioMovieBreakdownRow>>((acc, row) => {
            if (!acc[row.movieId]) {
              acc[row.movieId] = {
                movieId: row.movieId,
                movieTitle: row.movieTitle,
                ticketsSold: 0,
                totalSchedules: 0,
                occupancy: 0,
              };
            }

            acc[row.movieId].ticketsSold += row.ticketsSold;
            acc[row.movieId].totalSchedules += 1;
            return acc;
          }, {})
        )
          .map((row) => {
            const studioCapacity = studioCapacityMap.get(studioId) ?? 0;
            const totalCapacity = studioCapacity * row.totalSchedules;
            return {
              ...row,
              occupancy: totalCapacity > 0 ? (row.ticketsSold / totalCapacity) * 100 : 0,
            };
          })
          .sort((a, b) => b.ticketsSold - a.ticketsSold);

        return {
          studioId,
          scheduleRows: scheduleRows.slice(0, 6),
          movieRows: movieRows.slice(0, 5),
        };
      })
    );

    const nextScheduleRows: Record<string, ScheduleBreakdownRow[]> = {};
    const nextMovieRows: Record<string, StudioMovieBreakdownRow[]> = {};
    const nextErrors: Record<string, string> = {};
    const nextLoading: Record<string, boolean> = {};

    results.forEach((result, index) => {
      const studioId = studioIdsToLoad[index];
      nextLoading[studioId] = false;

      if (result.status === "fulfilled") {
        nextScheduleRows[studioId] = result.value.scheduleRows;
        nextMovieRows[studioId] = result.value.movieRows;
        nextErrors[studioId] = "";
      } else {
        nextErrors[studioId] =
          result.reason instanceof Error
            ? result.reason.message
            : "Gagal memuat breakdown studio.";
      }
    });

    setStudioScheduleRows((current) => ({ ...current, ...nextScheduleRows }));
    setStudioMovieRows((current) => ({ ...current, ...nextMovieRows }));
    setStudioBreakdownErrors((current) => ({ ...current, ...nextErrors }));
    setStudioBreakdownLoading((current) => ({ ...current, ...nextLoading }));
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
      await Promise.all([loadStudioMetrics(cinemaId, studios), loadStudioBreakdowns(studios)]);
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

  const toggleStudioDetail = (studioId: string) => {
    setExpandedStudioIds((current) =>
      current.includes(studioId)
        ? current.filter((id) => id !== studioId)
        : [...current, studioId]
    );
  };

  const toggleStudioMovieDetail = (studioId: string) => {
    setExpandedStudioMovieIds((current) =>
      current.includes(studioId)
        ? current.filter((id) => id !== studioId)
        : [...current, studioId]
    );
  };

  const toggleStudioScheduleDetail = (studioId: string) => {
    setExpandedStudioScheduleIds((current) =>
      current.includes(studioId)
        ? current.filter((id) => id !== studioId)
        : [...current, studioId]
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-4">
          <Link href={dashboardHref}>
            <Button variant="outline" size="icon" className="mt-1 h-9 w-9 shrink-0 rounded-xl">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>

          <div className="min-w-0 flex-1 space-y-1.5">
            <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
              <MapPinned className="h-6 w-6 text-primary" />
              Performa Kota: {city}
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
              Menampilkan data performa terperinci untuk kota yang dipilih. Filter tanggal 
              saat ini akan otomatis diterapkan jika Anda beralih ke analitik lanjutan.
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-3 pl-13 md:pl-0">
          <Button variant="outline" className="gap-2 bg-background shadow-sm hover:bg-muted" asChild>
            <Link href={filmsHref}>
              <Film className="h-4 w-4 text-emerald-500" />
              Detail Performa Film
            </Link>
          </Button>
          <Button variant="outline" className="gap-2 bg-background shadow-sm hover:bg-muted" asChild>
            <Link href={salesHref}>
              <TrendingUp className="h-4 w-4 text-blue-500" />
              Detail Analitik Sales
            </Link>
          </Button>
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
            value={data.cinemas ? cinemaMetricTotals.totalTickets.toLocaleString("id-ID") : "--"}
            subtitle={growth?.tickets !== undefined ? `${formatGrowth(growth.tickets)} vs previous period` : undefined}
            loading={loading}
            icon={Ticket}
          />
          <StatCard
            title="Total Revenue"
            value={data.cinemas ? formatCurrency(cinemaMetricTotals.totalRevenue) : "--"}
            subtitle={growth?.revenue !== undefined ? `${formatGrowth(growth.revenue)} vs previous period` : undefined}
            loading={loading}
            icon={DollarSign}
        />
          <StatCard
            title="Jumlah Bioskop"
            value={data.cinemas ? String(cinemaMetricTotals.totalCinemas) : "--"}
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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
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
                              <div className="text-xs text-muted-foreground">{cinema.address ?? "-"}</div>
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
                                    <div className="space-y-3">
                                      {studios.map((studio, index) => (
                                        (() => {
                                          const studioId = studio.studio_id ?? studio.id;
                                          const isStudioExpanded = studioId
                                            ? expandedStudioIds.includes(studioId)
                                            : false;
                                          const isMovieExpanded = studioId
                                            ? expandedStudioMovieIds.includes(studioId)
                                            : false;
                                          const isScheduleExpanded = studioId
                                            ? expandedStudioScheduleIds.includes(studioId)
                                            : false;
                                          const metrics = studioId ? studioMetrics[studioId] : undefined;
                                          const metricsLoading = studioId ? studioMetricsLoading[studioId] : false;
                                          const metricsError = studioId ? studioMetricsErrors[studioId] : "";
                                          const breakdownLoading = studioId ? studioBreakdownLoading[studioId] : false;
                                          const breakdownError = studioId ? studioBreakdownErrors[studioId] : "";
                                          const movieRows = studioId ? studioMovieRows[studioId] ?? [] : [];
                                          const scheduleRows = studioId ? studioScheduleRows[studioId] ?? [] : [];

                                          return (
                                            <div
                                              key={studioId ?? `${cinema.cinema_id}-${index}`}
                                              className="rounded-xl border border-border bg-muted/10 p-3"
                                            >
                                              <button
                                                type="button"
                                                className="flex w-full items-start justify-between gap-3 text-left"
                                                onClick={() => {
                                                  if (studioId) {
                                                    toggleStudioDetail(studioId);
                                                  }
                                                }}
                                              >
                                                <div>
                                                  <p className="font-medium text-foreground">
                                                    {studio.studio_name ?? studio.name ?? `Studio ${index + 1}`}
                                                  </p>
                                                  <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                                                    <p>
                                                      Capacity:{" "}
                                                      {(studio.total_capacity ?? studio.capacity ?? 0).toLocaleString("id-ID")}
                                                    </p>
                                                    <p>Type: {formatStudioType(studio)}</p>
                                                  </div>
                                                </div>
                                                {studioId ? (
                                                  isStudioExpanded ? (
                                                    <ChevronUp className="mt-1 h-4 w-4 text-muted-foreground" />
                                                  ) : (
                                                    <ChevronDown className="mt-1 h-4 w-4 text-muted-foreground" />
                                                  )
                                                ) : null}
                                              </button>

                                              {isStudioExpanded ? (
                                                <>
                                                  {metricsLoading ? (
                                                    <div className="mt-3 grid gap-2 text-sm text-muted-foreground">
                                                      <p>Memuat metrik studio...</p>
                                                    </div>
                                                  ) : metricsError ? (
                                                    <div className="mt-3 text-sm text-amber-700">
                                                      {metricsError}
                                                    </div>
                                                  ) : metrics ? (
                                                    <div className="mt-3 space-y-3">
                                                      <div className="grid gap-2 rounded-lg bg-muted/30 p-3 text-sm md:grid-cols-3">
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

                                                      {breakdownLoading ? (
                                                        <p className="text-sm text-muted-foreground">
                                                          Memuat breakdown studio...
                                                        </p>
                                                      ) : breakdownError ? (
                                                        <p className="text-sm text-amber-700">{breakdownError}</p>
                                                      ) : (
                                                        <div className="space-y-3">
                                                          <div className="rounded-lg border border-border p-3">
                                                            <button
                                                              type="button"
                                                              className="flex w-full items-center justify-between gap-3 text-left"
                                                              onClick={() => {
                                                                if (studioId) {
                                                                  toggleStudioMovieDetail(studioId);
                                                                }
                                                              }}
                                                            >
                                                              <p className="text-sm font-semibold text-foreground">
                                                                Movie
                                                              </p>
                                                              {studioId ? (
                                                                isMovieExpanded ? (
                                                                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                                                                ) : (
                                                                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                                                )
                                                              ) : null}
                                                            </button>
                                                            {isMovieExpanded ? (
                                                              <div className="mt-3">
                                                                {movieRows.length > 0 ? (
                                                                  <Table>
                                                                    <TableHeader>
                                                                      <TableRow>
                                                                        <TableHead>Movie</TableHead>
                                                                        <TableHead className="text-right">Schedules</TableHead>
                                                                        <TableHead className="text-right">Tiket</TableHead>
                                                                        <TableHead className="text-right">Occupancy</TableHead>
                                                                      </TableRow>
                                                                    </TableHeader>
                                                                    <TableBody>
                                                                      {movieRows.map((row) => (
                                                                        <TableRow key={row.movieId}>
                                                                          <TableCell className="font-medium">
                                                                            {row.movieTitle}
                                                                          </TableCell>
                                                                          <TableCell className="text-right">
                                                                            {row.totalSchedules}
                                                                          </TableCell>
                                                                          <TableCell className="text-right">
                                                                            {row.ticketsSold.toLocaleString("id-ID")}
                                                                          </TableCell>
                                                                          <TableCell className="text-right">
                                                                            {row.occupancy.toFixed(1)}%
                                                                          </TableCell>
                                                                        </TableRow>
                                                                      ))}
                                                                    </TableBody>
                                                                  </Table>
                                                                ) : (
                                                                  <p className="text-sm text-muted-foreground">
                                                                    Belum ada breakdown movie.
                                                                  </p>
                                                                )}
                                                              </div>
                                                            ) : null}
                                                          </div>

                                                          <div className="rounded-lg border border-border p-3">
                                                            <button
                                                              type="button"
                                                              className="flex w-full items-center justify-between gap-3 text-left"
                                                              onClick={() => {
                                                                if (studioId) {
                                                                  toggleStudioScheduleDetail(studioId);
                                                                }
                                                              }}
                                                            >
                                                              <p className="text-sm font-semibold text-foreground">
                                                                Schedule
                                                              </p>
                                                              {studioId ? (
                                                                isScheduleExpanded ? (
                                                                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                                                                ) : (
                                                                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                                                )
                                                              ) : null}
                                                            </button>
                                                            {isScheduleExpanded ? (
                                                              <div className="mt-3">
                                                                {scheduleRows.length > 0 ? (
                                                                  <Table>
                                                                    <TableHeader>
                                                                      <TableRow>
                                                                        <TableHead>Movie</TableHead>
                                                                        <TableHead>Schedule</TableHead>
                                                                        <TableHead className="text-right">Tiket</TableHead>
                                                                        <TableHead className="text-right">Occupancy</TableHead>
                                                                      </TableRow>
                                                                    </TableHeader>
                                                                    <TableBody>
                                                                      {scheduleRows.map((row) => (
                                                                        <TableRow key={row.scheduleId}>
                                                                          <TableCell className="font-medium">
                                                                            {row.movieTitle}
                                                                          </TableCell>
                                                                          <TableCell>
                                                                            {row.showDate} • {row.startTime}
                                                                          </TableCell>
                                                                          <TableCell className="text-right">
                                                                            {row.ticketsSold.toLocaleString("id-ID")}
                                                                          </TableCell>
                                                                          <TableCell className="text-right">
                                                                            {row.occupancy.toFixed(1)}%
                                                                          </TableCell>
                                                                        </TableRow>
                                                                      ))}
                                                                    </TableBody>
                                                                  </Table>
                                                                ) : (
                                                                  <p className="text-sm text-muted-foreground">
                                                                    Belum ada breakdown schedule.
                                                                  </p>
                                                                )}
                                                              </div>
                                                            ) : null}
                                                          </div>
                                                        </div>
                                                      )}
                                                    </div>
                                                  ) : null}
                                                </>
                                              ) : null}
                                            </div>
                                          );
                                        })()
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
                      <TableHead className="text-right">Occupancy</TableHead>
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
