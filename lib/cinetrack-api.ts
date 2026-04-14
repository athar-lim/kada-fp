"use client";

const RAW_BASE_URL = process.env.NEXT_PUBLIC_CINETRACK_API_BASE_URL;
const API_BASE_URL = RAW_BASE_URL
  ? (RAW_BASE_URL.endsWith("/api/v1") ? RAW_BASE_URL : `${RAW_BASE_URL}/api/v1`)
  : "https://capstone-project-api-cinetrack.vercel.app/api/v1";
export type DashboardQuery = {
  city?: string;
  cinema_id?: string;
  studio_id?: string;
  movie_id?: string;
  start_date?: string;
  end_date?: string;
  top_n?: string;
  group_by?: string;
};

export type SummaryResponse = {
  meta: {
    period: string;
    filters: {
      city: string | null;
      cinema_id: string | null;
      studio_id: string | null;
    };
    scope: string;
  };
  data: {
    total_tickets: number;
    total_capacity?: number;
    revenue: number;
    occupancy: number;
    total_transactions: number;
    cinema_aktif: number;
    cinema_tersedia: number;
    growth?: {
      tickets?: number;
      revenue?: number;
      avg_occupancy?: number;
    };
  };
};

type SummaryApiData = {
  total_tickets: number;
  total_capacity?: number;
  revenue: number;
  avg_occupancy?: number;
  occupancy?: number;
  total_transactions: number;
  cinema_aktif: number;
  cinema_tersedia: number;
  growth?: {
    tickets?: number;
    revenue?: number;
    avg_occupancy?: number;
  };
};

export type CinemaBreakdownResponse = {
  filters?: {
    city: string | null;
    cinema_id: string | null;
  };
  summary: {
    total_cinemas: number;
    active_cinemas: number;
    total_tickets: number;
    total_revenue: number;
  };
  breakdown: Array<{
    cinema_id: string;
    cinema_name: string;
    city: string;
    address?: string;
    metrics: {
      total_tickets: number;
      total_revenue: number;
      active_movies: number;
      active_studios: number;
      total_capacity?: number;
      occupancy?: number;
    };
    top_movie?: {
      movie_id: string;
      title: string;
      tickets_sold: number;
    };
    top_genre?: {
      genre: string;
      tickets_sold: number;
    };
  }>;
};

export type TrendsResponse = {
  summary: {
    group_by: string;
    total_tickets: number;
    revenue: number;
    growth?: {
      tickets?: number;
      revenue?: number;
    };
  };
  breakdown: Array<{
    time_group: string;
    tickets_sold: number;
    revenue: number;
  }>;
};

export type OccupancyResponse = {
  summary: {
    group_by: string;
    total_tickets: number;
    total_capacity: number;
    occupancy: number;
    avg_occupancy: number;
  };
  breakdown: Array<{
    time_group: string;
    total_tickets: number;
    total_capacity: number;
    occupancy: number;
    avg_occupancy: number;
  }>;
};

type OccupancyApiData = {
  summary: {
    group_by: string;
    total_tickets: number;
    total_capacity: number;
    occupancy?: number;
    avg_occupancy?: number;
  };
  breakdown: Array<{
    time_group: string;
    total_tickets: number;
    total_capacity: number;
    occupancy?: number;
    avg_occupancy?: number;
  }>;
};

export type MovieStatsResponse = {
  filters: {
    city: string | null;
    cinema_id: string | null;
    rating_usia: string | null;
  };
  summary: {
    total_movies_showing: number;
    total_tickets_sold: number;
    top_movie: {
      movie_id: string;
      title: string;
      tickets_sold: number;
    };
    top_genre: {
      genre: string;
      tickets_sold: number;
    };
  };
  breakdown_rating_usia: Array<{
    rating_usia: string;
    total_tickets_sold: number;
    total_showings: number;
  }>;
};

export type TopMovie = {
  movie_id: string;
  title: string;
  genre: string[];
  rating_usia: string;
  duration_min: number;
  tickets_sold: number;
  revenue: number;
};

export type MovieCatalogItem = {
  movie_id: string;
  title: string;
  genre: string[];
  rating_usia: string;
  duration_min: number;
};

export type HealthResponse = {
  status: string;
  last_data_in: string;
  tickets_last_hour: number;
};

export type AiInsightResponse = {
  scope: {
    type: string;
    value: string | null;
    label: string;
    city: string | null;
    cinema_id: string | null;
    cinema_name: string | null;
    studio_id: string | null;
    studio_name: string | null;
  };
  period: {
    start_date: string;
    end_date: string;
    label: string;
  };
  generated_at: string;
  ai_source: string;
  ai_model: string;
  cards?: {
    headline?: string;
    summary?: string;
    recommendation?: string;
    impact_level?: string;
    category?: string;
  };
  analysis?: {
    title?: string;
    description?: string;
    recommendation?: string;
    action_items?: string[];
    impact_level?: string;
    category?: string;
  };
  action_items?: string[];
};

export type StudioResponse = {
  studio_id?: string;
  id?: string;
  studio_name?: string;
  name?: string;
  cinema_id: string;
  total_capacity?: number;
  capacity?: number;
  studio_type?: string | number;
  screen_type?: string | number;
  format?: string | number;
  type?: string | number;
};

export type ScheduleListItem = {
  schedule_id: string;
  movie_id: string;
  studio_id: string;
  cinema_id: string;
  show_date: string;
  start_time: string;
  price: number;
  status: string;
  actual_time?: string | null;
  delay_minutes?: number | null;
  is_mock_timing?: boolean;
};

export type ScheduleDetailResponse = ScheduleListItem & {
  tickets_sold: number;
  revenue: number;
};

export type ScheduleQuery = {
  movie_id?: string;
  cinema_id?: string;
  studio_id?: string;
  show_date?: string;
  start_date?: string;
  end_date?: string;
  status?: string;
};

type ApiEnvelope<T> = {
  success?: boolean;
  data: T;
  meta?: {
    period?: string;
    scope?: string;
    pagination?: {
      page: number;
      limit: number;
      total: number;
      total_pages: number;
    };
    filters?: Record<string, unknown>;
    [key: string]: unknown;
  };
};

function buildQueryString(query?: Record<string, string | undefined>) {
  const params = new URLSearchParams();

  if (!query) return params.toString();

  Object.entries(query).forEach(([key, value]) => {
    if (value) {
      params.set(key, value);
    }
  });

  return params.toString();
}

async function fetchJson<T>(
  path: string,
  query?: Record<string, string | undefined>,
  options?: {
    unwrapEnvelope?: boolean;
  }
): Promise<T> {
  const queryString = buildQueryString(query);
  const url = queryString ? `${API_BASE_URL}${path}?${queryString}` : `${API_BASE_URL}${path}`;

  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  if (typeof window !== "undefined") {
    const token = localStorage.getItem("cinetrack_token");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  const response = await fetch(url, {
    headers,
    cache: "no-store",
  });

  if (response.status === 401) {
    if (typeof window !== "undefined") {
      // Clear invalid token
      localStorage.removeItem("cinetrack_token");
      localStorage.removeItem("cinetrack_user");
      // Redirect to login
      window.location.href = "/login";
    }
    throw new Error(`Unauthorized (401) - Please log in`);
  }

  if (!response.ok) {
    throw new Error(`Request failed for ${path} (${response.status})`);
  }

  const payload = (await response.json()) as T | ApiEnvelope<T>;
  const shouldUnwrapEnvelope = options?.unwrapEnvelope ?? true;

  if (!shouldUnwrapEnvelope) {
    return payload as T;
  }

  if (
    payload &&
    typeof payload === "object" &&
    "data" in payload &&
    !Array.isArray(payload)
  ) {
    return (payload as ApiEnvelope<T>).data;
  }

  return payload as T;
}

export function getDashboardSummary(query?: DashboardQuery) {
  return fetchJson<ApiEnvelope<SummaryApiData>>("/stats/summary", query, {
    unwrapEnvelope: false,
  }).then((payload) => ({
    data: {
      total_tickets: payload.data.total_tickets,
      total_capacity: payload.data.total_capacity,
      revenue: payload.data.revenue,
      occupancy: payload.data.avg_occupancy ?? payload.data.occupancy ?? 0,
      total_transactions: payload.data.total_transactions,
      cinema_aktif: payload.data.cinema_aktif,
      cinema_tersedia: payload.data.cinema_tersedia,
      growth: payload.data.growth,
    },
    meta: {
      period: String(payload.meta?.period ?? ""),
      filters: {
        city: (payload.meta?.filters?.city as string | null | undefined) ?? null,
        cinema_id: (payload.meta?.filters?.cinema_id as string | null | undefined) ?? null,
        studio_id: (payload.meta?.filters?.studio_id as string | null | undefined) ?? null,
      },
      scope: String(payload.meta?.scope ?? ""),
    },
  }));
}

export function getCinemaBreakdown(query?: DashboardQuery) {
  return fetchJson<CinemaBreakdownResponse>("/cinemas", query);
}

export function getCinemaPerformanceBreakdown(query?: DashboardQuery) {
  return fetchJson<CinemaBreakdownResponse>("/stats/cinema", query);
}

export function getTrendStats(query?: DashboardQuery) {
  return fetchJson<TrendsResponse>("/stats/trends", query);
}

export function getOccupancyStats(query?: DashboardQuery) {
  return fetchJson<OccupancyApiData>("/stats/occupancy", query).then((payload) => ({
    summary: {
      ...payload.summary,
      occupancy: payload.summary.occupancy ?? payload.summary.avg_occupancy ?? 0,
      avg_occupancy: payload.summary.avg_occupancy ?? payload.summary.occupancy ?? 0,
    },
    breakdown: payload.breakdown.map((item) => ({
      ...item,
      occupancy: item.occupancy ?? item.avg_occupancy ?? 0,
      avg_occupancy: item.avg_occupancy ?? item.occupancy ?? 0,
    })),
  }));
}

export function getMovieStats(query?: DashboardQuery) {
  return fetchJson<MovieStatsResponse>("/stats/movie", query);
}

export function getTopMovies(query?: DashboardQuery) {
  return fetchJson<TopMovie[]>("/movies/rankings", {
    ...query,
    top10: "true",
  });
}

export async function getMoviesCatalog() {
  const firstPage = await fetchJson<ApiEnvelope<MovieCatalogItem[]>>(
    "/movies",
    {
      page: "1",
      limit: "100",
    },
    {
      unwrapEnvelope: false,
    }
  );

  const items = [...firstPage.data];
  const totalPages = Number(firstPage.meta?.pagination?.total_pages ?? 1);

  if (totalPages <= 1) {
    return items;
  }

  const extraPages = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, index) =>
      fetchJson<ApiEnvelope<MovieCatalogItem[]>>(
        "/movies",
        {
          page: String(index + 2),
          limit: "100",
        },
        {
          unwrapEnvelope: false,
        }
      ).then((payload) => payload.data)
    )
  );

  return items.concat(...extraPages);
}

export async function getSchedules(query?: ScheduleQuery) {
  const firstPage = await fetchJson<ApiEnvelope<ScheduleListItem[]>>(
    "/schedules",
    {
      ...query,
      page: "1",
      limit: "100",
    },
    {
      unwrapEnvelope: false,
    }
  );

  const items = [...firstPage.data];
  const totalPages = Number(firstPage.meta?.pagination?.total_pages ?? 1);

  if (totalPages <= 1) {
    return items;
  }

  const extraPages = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, index) =>
      fetchJson<ApiEnvelope<ScheduleListItem[]>>(
        "/schedules",
        {
          ...query,
          page: String(index + 2),
          limit: "100",
        },
        {
          unwrapEnvelope: false,
        }
      ).then((payload) => payload.data)
    )
  );

  return items.concat(...extraPages);
}

export function getScheduleDetail(scheduleId: string) {
  return fetchJson<ScheduleDetailResponse>(`/schedules/${scheduleId}`);
}

export function getSystemHealth() {
  return fetchJson<HealthResponse>("/system/health");
}

export function getLatestAiInsight(query?: DashboardQuery) {
  return fetchJson<AiInsightResponse>("/ai/insights/latest", query);
}

export function getLatestAiInsights(
  query?: DashboardQuery & {
    limit?: string;
  }
) {
  return fetchJson<AiInsightResponse[]>("/ai/insights/latest", { ...query, all: "true" } as Record<string, string | undefined>, {
    unwrapEnvelope: false,
  })
    .then((payload) => {
      if (
        payload &&
        typeof payload === "object" &&
        "data" in payload &&
        Array.isArray((payload as { data?: unknown }).data)
      ) {
        return (payload as { data: AiInsightResponse[] }).data;
      }

      return Array.isArray(payload) ? payload : [];
    })
    .catch((err) => {
      console.warn("API /ai/insights/latest?all=true returned an error:", err.message);
      return [];
    });
}

export function getAiInsightsHistory() {
  return fetchJson<AiInsightResponse[]>("/ai/insights/history", undefined, {
    unwrapEnvelope: false,
  })
    .then((payload) => {
      if (
        payload &&
        typeof payload === "object" &&
        "data" in payload &&
        payload.data &&
        typeof payload.data === "object" &&
        "items" in payload.data &&
        Array.isArray((payload.data as { items?: unknown }).items)
      ) {
        return (payload.data as { items: AiInsightResponse[] }).items;
      }

      if (
        payload &&
        typeof payload === "object" &&
        "data" in payload &&
        Array.isArray((payload as { data?: unknown }).data)
      ) {
        return (payload as { data: AiInsightResponse[] }).data;
      }

      return Array.isArray(payload) ? payload : [];
    })
    .catch((err) => {
      console.warn("API /ai/insights/history returned an error:", err.message);
      return [];
    });
}

export async function getCinemaStudios(cinemaId: string) {
  const firstPage = await fetchJson<ApiEnvelope<StudioResponse[]>>("/studios", {
    cinema_id: cinemaId,
    page: "1",
    limit: "100",
  }, {
    unwrapEnvelope: false,
  });

  const items = [...firstPage.data];
  const totalPages = Number(firstPage.meta?.pagination?.total_pages ?? 1);

  if (totalPages <= 1) {
    return items;
  }

  const extraPages = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, index) =>
      fetchJson<ApiEnvelope<StudioResponse[]>>("/studios", {
        cinema_id: cinemaId,
        page: String(index + 2),
        limit: "100",
      }, {
        unwrapEnvelope: false,
      }).then((payload) => payload.data)
    )
  );

  return items.concat(...extraPages);
}

export type FilmsDashboardOverview = {
  active_films: number;
  total_shows: number;
  tickets_sold: number;
  revenue: number;
  avg_occupancy: number;
  growth?: {
    tickets?: number;
    revenue?: number;
    avg_occupancy?: number;
  };
};

export type FilmsDashboardPerformance = {
  top_movie: {
    rank: number;
    movie_id: string;
    title: string;
    total_tickets: number;
    total_revenue: number;
    blockbuster_score: number;
  } | null;
  breakdown: Array<{
    rank: number;
    movie_id: string;
    title: string;
    total_tickets: number;
    total_revenue: number;
    blockbuster_score: number;
    genre?: string;
    genres?: string[];
    rating?: string;
    rating_usia?: string;
    duration?: number;
    duration_min?: number;
    share_of_tickets?: number;
    share_of_revenue?: number;
    seat_distribution?: {
      Regular: number;
      VIP: number;
      Sweetbox: number;
    };
  }>;
};

export type FilmsDashboardSchedules = {
  schedule_performance: Array<{
    schedule_id: string;
    movie_id: string;
    title: string;
    show_date: string;
    start_time: string;
    studio_id: string;
    cinema_id: string;
    total_tickets: number;
    revenue: number;
    occupancy: number;
  }>;
  repeat_schedule_performance: Array<{
    movie_id: string;
    title: string;
    show_date: string;
    total_schedules: number;
    total_tickets: number;
    revenue: number;
  }>;
  audience_density: Array<{
    movie_id: string;
    title: string;
    total_schedules: number;
    total_tickets: number;
    audience_density: number;
    capacity_utilization: number;
  }>;
};

export type FilmsDashboardOccupancy = {
  overall: {
    group_by: string;
    total_tickets: number;
    total_capacity: number;
    occupancy: number;
  };
  by_movie: Array<{
    movie_id: string;
    title: string;
    total_tickets: number;
    total_capacity: number;
    occupancy: number;
    capacity_fit: number;
    underperforming_score: number;
    status: string;
  }>;
  by_day: Array<{
    show_date: string;
    total_tickets: number;
    total_capacity: number;
    occupancy: number;
  }>;
  by_studio: Array<{
    studio_id: string;
    studio_name: string;
    total_tickets: number;
    total_capacity: number;
    occupancy: number;
  }>;
};

export type FilmsDashboardDistribution = {
  genre_popularity: {
    summary: {
      total_movies_showing: number;
      total_tickets_sold: number;
      top_movie: {
        movie_id: string;
        title: string;
        tickets_sold: number;
      } | null;
      top_genre: {
        genre: string;
        tickets_sold: number;
      } | null;
    };
    breakdown: Array<{
      genre: string;
      total_tickets: number;
    }>;
    breakdown_rating_usia: Array<{
      rating_usia: string;
      total_tickets_sold: number;
      total_showings: number;
      seat_distribution?: {
        Regular: number;
        VIP: number;
        Sweetbox: number;
      };
    }>;
  };
  studio_format_distribution: Array<{
    format: string;
    type: string;
    total_studios: number;
    total_schedules: number;
  }>;
};

export type FilmsDashboardOperationalRisk = {
  summary: {
    total_shows: number;
    cancelled: number;
    delayed: number;
    avg_delay_minutes: number | null;
    problematic_rate: number;
    is_mock_delay?: boolean;
  };
  impacted_movies: Array<{
    movie_id: string;
    title?: string;
    affected_shows?: number;
    delayed_shows?: number;
    cancelled_shows?: number;
  }>;
  problematic_schedules: Array<{
    schedule_id: string;
    movie_id?: string;
    title?: string;
    cinema_id?: string;
    studio_id?: string;
    show_date?: string;
    start_time?: string;
    status?: string;
    delay_minutes?: number | null;
    note?: string | null;
  }>;
};

// Fungsi ini mengambil ringkasan utama halaman film dari endpoint dashboard resmi.
// Data yang dikembalikan sudah sesuai filter kota, bioskop, studio, dan tanggal.
export function getFilmsDashboardOverview(query?: DashboardQuery) {
  return fetchJson<FilmsDashboardOverview>("/dashboard/films/overview", query);
}

// Fungsi ini mengambil ranking film berdasarkan tiket, revenue, dan blockbuster score.
// Hasilnya dipakai untuk chart penjualan film dan kartu top performer.
export function getFilmsDashboardPerformance(query?: DashboardQuery) {
  return fetchJson<FilmsDashboardPerformance>("/dashboard/films/performance", query);
}

// Fungsi ini mengambil performa jadwal, repeat show, dan audience density film.
// Endpoint ini menjadi sumber utama untuk section schedule & efficiency.
export function getFilmsDashboardSchedules(query?: DashboardQuery) {
  return fetchJson<FilmsDashboardSchedules>("/dashboard/films/schedules", query);
}

// Fungsi ini mengambil breakdown occupancy per film, hari, dan studio.
// Nilai mentahnya tetap dibiarkan apa adanya agar normalisasi dilakukan dekat UI.
export function getFilmsDashboardOccupancy(query?: DashboardQuery) {
  return fetchJson<FilmsDashboardOccupancy>("/dashboard/films/occupancy", query);
}

// Fungsi ini mengambil distribusi genre dan format studio dari dashboard film.
// Data ini dipakai untuk komposisi mix penonton dan penjadwalan screen.
export function getFilmsDashboardDistribution(query?: DashboardQuery) {
  return fetchJson<FilmsDashboardDistribution>("/dashboard/films/distribution", query);
}

// Fungsi ini mengambil ringkasan risiko operasional film seperti cancel dan delay.
// Data ini dipakai untuk kartu problematic shows dan tabel schedule bermasalah.
export function getFilmsDashboardOperationalRisk(query?: DashboardQuery) {
  return fetchJson<FilmsDashboardOperationalRisk>("/dashboard/films/operational-risk", query);
}

// --- Sales Dashboard Types & Functions ---

export type SalesDashboardOverview = {
  total_revenue: number;
  total_tickets: number;
  avg_ticket_price: number;
  revenue_per_seat?: number;
  avg_occupancy: number;
  growth?: {
    tickets?: number;
    revenue?: number;
    avg_occupancy?: number;
  };
};

export type SalesDashboardRevenueByCinema = {
  summary?: {
    total_cinemas?: number;
    active_cinemas?: number;
    total_revenue_network?: number;
    total_tickets_network?: number;
  };
  top_performing_cinema?: unknown;
  lowest_performing_cinema?: unknown;
  breakdown: Array<{
    rank?: number;
    cinema_id: string;
    cinema_name: string;
    city: string;
    total_revenue: number;
    total_tickets?: number;
    contribution?: number;
    occupancy?: number;
    metrics?: { occupancy?: number; total_capacity?: number };
    top_movie?: { movie_id: string; title: string; tickets_sold: number };
  }>;
};

export type SalesDashboardRevenueByMovie = {
  breakdown: Array<{
    rank?: number;
    movie_id: string;
    title: string;
    total_revenue: number;
    total_tickets?: number;
    contribution: number;
  }>;
};

export type SalesDashboardTimeSlots = {
  peak_sales_hour?: {
    time_slot: string;
    revenue: number;
    demand?: number;
    occupancy?: number;
    recommendation: string;
  } | null;
  quiet_hour?: {
    time_slot: string;
    revenue?: number;
    demand?: number;
  } | null;
  breakdown: Array<{
    time_slot: string;
    demand: string | number;
    revenue: number;
    occupancy?: number;
    optimization_score: number;
    recommendation: string;
  }>;
};

export type SalesDashboardTrend = {
  summary?: {
    group_by?: string;
    date_axis?: string;
    total_revenue?: number;
    total_tickets?: number;
  };
  forecast?: {
    projected_revenue: number;
  };
  breakdown: Array<{
    time_group: string;
    total_tickets: number;
    revenue: number;
  }>;
  yearly_breakdown?: Array<{
    month: string;
    revenue: number;
  }>;
};

export type SalesDashboardWeekendWeekday = {
  summary?: {
    winning_period?: string;
    revenue_gap?: number;
    ticket_gap?: number;
  };
  breakdown: Array<{
    day_type: string;
    total_revenue: number;
    total_tickets?: number;
    total_shows?: number;
    occupancy?: number;
    avg_revenue_per_show?: number;
    avg_tickets_per_show?: number;
  }>;
};

export type SalesDashboardPayment = {
  total_transactions?: number;
  preferred_payment?: unknown;
  breakdown: Array<{
    payment_type: string;
    total_transactions?: number;
    usage_rate: number;
    gross_revenue?: number;
    avg_price?: number;
    success_rate: number;
    admin_fee: number;
    net_profitability: number;
  }>;
};

export type SalesDashboardOperationalRisk = {
  summary?: {
    total_shows?: number;
    cancelled: number;
    delayed: number;
    avg_delay_minutes: number | null;
    problematic_rate?: number;
    is_mock_delay?: boolean;
  };
  problematic_schedules?: Array<{
    schedule_id: string;
    movie_id?: string;
    title?: string;
    movie?: { movie_id?: string; title: string } | null;
    cinema_id?: string;
    cinema_name?: string;
    city?: string;
    cinema?: { cinema_id?: string; cinema_name: string; city?: string } | null;
    show_date?: string;
    start_time: string;
    status: string;
    delay_minutes?: number | null;
    tickets_sold?: number;
    revenue?: number;
  }>;
};

export function getSalesDashboardOverview(query?: DashboardQuery) {
  return fetchJson<SalesDashboardOverview>("/dashboard/sales/overview", query);
}

export function getSalesDashboardRevenueByCinema(query?: DashboardQuery) {
  return fetchJson<SalesDashboardRevenueByCinema>("/dashboard/sales/revenue-by-cinema", query);
}

export function getSalesDashboardRevenueByMovie(query?: DashboardQuery) {
  return fetchJson<SalesDashboardRevenueByMovie>("/dashboard/sales/revenue-by-movie", query);
}

export function getSalesDashboardTimeSlots(query?: DashboardQuery) {
  return fetchJson<SalesDashboardTimeSlots>("/dashboard/sales/time-slots", query);
}

export function getSalesDashboardTrend(query?: DashboardQuery) {
  return fetchJson<SalesDashboardTrend>("/dashboard/sales/trend", query);
}

export function getSalesDashboardWeekendWeekday(query?: DashboardQuery) {
  return fetchJson<SalesDashboardWeekendWeekday>("/dashboard/sales/weekend-vs-weekday", query);
}

export function getSalesDashboardPayment(query?: DashboardQuery) {
  return fetchJson<SalesDashboardPayment>("/dashboard/sales/payment", query);
}

export function getSalesDashboardOperationalRisk(query?: DashboardQuery) {
  return fetchJson<SalesDashboardOperationalRisk>("/dashboard/sales/operational-risk", query);
}

/** Satu panggilan menggantikan enam request terpisah untuk halaman Films (perlu token admin). */
export type FilmsAnalyticsBundlePayload = {
  overview: FilmsDashboardOverview;
  performance: FilmsDashboardPerformance;
  schedules: FilmsDashboardSchedules;
  occupancy: FilmsDashboardOccupancy;
  distribution: FilmsDashboardDistribution;
  operational_risk: FilmsDashboardOperationalRisk;
};

/** Satu panggilan menggantikan delapan request terpisah untuk halaman Sales (perlu token admin). */
export type SalesAnalyticsBundlePayload = {
  overview: SalesDashboardOverview;
  revenue_by_cinema: SalesDashboardRevenueByCinema;
  revenue_by_movie: SalesDashboardRevenueByMovie;
  time_slots: SalesDashboardTimeSlots;
  trend: SalesDashboardTrend;
  weekend_vs_weekday: SalesDashboardWeekendWeekday;
  payment: SalesDashboardPayment;
  operational_risk: SalesDashboardOperationalRisk;
};

export function getFilmsAnalyticsBundle(query?: DashboardQuery & { top_n?: string }) {
  return fetchJson<FilmsAnalyticsBundlePayload>("/dashboard/films/analytics", query);
}

export function getSalesAnalyticsBundle(
  query?: DashboardQuery & { cinema_top_n?: string; movie_top_n?: string }
) {
  return fetchJson<SalesAnalyticsBundlePayload>("/dashboard/sales/analytics", query);
}

export function getCities() {
  return fetchJson<string[] | Array<{ city?: string; name?: string }>>("/cities", undefined, { unwrapEnvelope: false }).then(payload => {
    // API sometimes returns an envelope, sometimes not. Let's handle it safely.
    let data;
    if (payload && typeof payload === "object" && "data" in payload && Array.isArray((payload as any).data)) {
      data = (payload as any).data;
    } else if (Array.isArray(payload)) {
      data = payload;
    } else {
      data = [];
    }

    const parsedCities = data.map((c: any) => typeof c === 'string' ? c : (c.city || c.name || ""));
    return parsedCities.filter(Boolean) as string[];
  });
}

// --- Notifications Types & Functions ---

export type DashboardNotification = {
  id: string;
  type: string;
  severity: "critical" | "warning" | "opportunity" | string;
  title: string;
  what: string;
  where: string;
  impact: string;
  action: string;
  createdAt: string;
};

export function getDashboardNotifications() {
  return fetchJson<DashboardNotification[]>("/dashboard/notifications", undefined, { unwrapEnvelope: false })
    .then(payload => {
      let data;
      if (payload && typeof payload === "object" && "data" in payload && Array.isArray((payload as any).data)) {
        data = (payload as any).data;
      } else if (Array.isArray(payload)) {
        data = payload;
      } else {
        data = [];
      }
      return data as DashboardNotification[];
    })
    .catch(err => {
      console.warn("API /dashboard/notifications returned an error:", err.message);
      return []; // Return empty array on 500 or network errors to not break dashboard
    });
}

export type AuthResponse = {
  token: string;
  refresh_token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
};

export async function loginAdmin(email: string, password: string): Promise<AuthResponse> {
  // Can't use API_BASE_URL because it's not exported, but it's local to the file so we can string interpolate it.
  const url = `${process.env.NEXT_PUBLIC_CINETRACK_API_BASE_URL ?? "https://capstone-project-api-cinetrack.vercel.app/api/v1"}/auth/login`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new Error(`Login failed (${response.status})`);
  }

  const payload = await response.json();
  if (payload.success && payload.data) {
    return payload.data;
  }
  throw new Error("Invalid response format");
}
