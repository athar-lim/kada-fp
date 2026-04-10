const API_BASE_URL = "https://capstone-project-api-cinetrack.vercel.app";

type ApiResponse<T> = {
  success: boolean;
  data: T;
};

type CinemaBreakdown = {
  cinema_id: string;
  metrics: {
    total_tickets: number;
    total_revenue: number;
    active_studios: number;
  };
};

type CinemasResponse = {
  summary: {
    total_cinemas: number;
    active_cinemas: number;
    total_tickets: number;
    total_revenue: number;
  };
  breakdown: CinemaBreakdown[];
};

type Studio = {
  cinema_id: string;
  total_capacity: number;
};

type DashboardFilters = {
  cityId: string;
  cinemaId: string;
};

export type DashboardMetricPoint = {
  name: string;
  value: number;
};

export type DashboardMetrics = {
  totalTickets: number;
  totalRevenue: number;
  activeCinemas: number;
  totalCinemas: number;
  inactiveCinemas: number;
  averageOccupancy: number | null;
  ticketsChart: DashboardMetricPoint[];
  revenueChart: DashboardMetricPoint[];
  activeChart: DashboardMetricPoint[];
  occupancyChart: DashboardMetricPoint[];
};

const cityNameMap: Record<string, string> = {
  jakarta: "Jakarta",
  surabaya: "Surabaya",
  bandung: "Bandung",
  medan: "Medan",
  semarang: "Semarang",
  makassar: "Makassar",
  balikpapan: "Balikpapan",
  palembang: "Palembang",
};

// Fungsi ini membentuk query API dari filter dashboard yang aktif.
// Jika cinema dipilih, filter city diabaikan agar ID cinema tetap valid.
const buildCinemasUrl = ({ cityId, cinemaId }: DashboardFilters) => {
  const url = new URL(`${API_BASE_URL}/cinemas`);

  if (cinemaId !== "all") {
    url.searchParams.set("cinema_id", cinemaId);
    return url.toString();
  }

  const cityName = cityNameMap[cityId];
  if (cityId !== "all" && cityName) {
    url.searchParams.set("city", cityName);
  }

  return url.toString();
};

// Fungsi ini mengambil JSON dari endpoint API dan melempar error jika gagal.
// Helper ini menjaga logika request tetap singkat di komponen dashboard.
const getJson = async <T,>(url: string): Promise<T> => {
  const response = await fetch(url, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  const result = (await response.json()) as ApiResponse<T>;

  if (!result.success) {
    throw new Error("API returned an unsuccessful response");
  }

  return result.data;
};

// Fungsi ini mencoba menghitung occupancy dari data kapasitas studio.
// Nilainya dikembalikan `null` jika API belum memberi data yang cukup akurat.
const calculateAverageOccupancy = (
  cinemas: CinemasResponse,
  studios: Studio[],
  filters: DashboardFilters
) => {
  if (studios.length === 0) return null;

  const visibleCinemaIds =
    filters.cinemaId !== "all"
      ? new Set([filters.cinemaId])
      : new Set(cinemas.breakdown.map((item) => item.cinema_id));

  const visibleStudios = studios.filter((studio) => visibleCinemaIds.has(studio.cinema_id));
  const totalCapacity = visibleStudios.reduce(
    (total, studio) => total + studio.total_capacity,
    0
  );

  if (totalCapacity === 0) return null;
  return null;
};

// Fungsi ini merangkum respons API menjadi format yang dipakai kartu metrik.
// Data chart diambil per cinema agar kartu tetap punya sparkline sederhana.
export const getDashboardMetrics = async (filters: DashboardFilters) => {
  const [cinemas, studios] = await Promise.all([
    getJson<CinemasResponse>(buildCinemasUrl(filters)),
    getJson<Studio[]>(`${API_BASE_URL}/studios`),
  ]);

  const points = cinemas.breakdown.map((item) => ({
    name: item.cinema_id,
    tickets: item.metrics.total_tickets,
    revenue: item.metrics.total_revenue,
    active: item.metrics.active_studios > 0 ? 1 : 0,
  }));

  return {
    totalTickets: cinemas.summary.total_tickets,
    totalRevenue: cinemas.summary.total_revenue,
    activeCinemas: cinemas.summary.active_cinemas,
    totalCinemas: cinemas.summary.total_cinemas,
    inactiveCinemas: cinemas.summary.total_cinemas - cinemas.summary.active_cinemas,
    averageOccupancy: calculateAverageOccupancy(cinemas, studios, filters),
    ticketsChart: points.map((item) => ({ name: item.name, value: item.tickets })),
    revenueChart: points.map((item) => ({ name: item.name, value: item.revenue })),
    activeChart: points.map((item) => ({ name: item.name, value: item.active })),
    occupancyChart: [],
  } satisfies DashboardMetrics;
};
