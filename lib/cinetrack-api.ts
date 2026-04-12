"use client";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_CINETRACK_API_BASE_URL ??
  "https://capstone-project-api-cinetrack.vercel.app";

export type DashboardQuery = {
  city?: string;
  cinema_id?: string;
  studio_id?: string;
  start_date?: string;
  end_date?: string;
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
    address: string;
    metrics: {
      total_tickets: number;
      total_revenue: number;
      active_movies: number;
      active_studios: number;
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

export type HealthResponse = {
  status: string;
  last_data_in: string;
  tickets_last_hour: number;
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

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

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

export function getSystemHealth() {
  return fetchJson<HealthResponse>("/system/health");
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
