const API_BASE_URL = "https://capstone-project-api-cinetrack.vercel.app";

type ApiResponse<T> = {
  success: boolean;
  data: T;
  meta?: {
    pagination?: {
      page: number;
      limit: number;
      total: number;
      total_pages: number;
    };
  };
};

type CinemaSummary = {
  total_cinemas: number;
  active_cinemas: number;
  total_tickets: number;
  total_revenue: number;
};

type CinemaBreakdown = {
  cinema_id: string;
  metrics: {
    active_movies: number;
  };
};

type CinemasResponse = {
  summary: CinemaSummary;
  breakdown: CinemaBreakdown[];
};

type Studio = {
  cinema_id: string;
  total_capacity: number;
};

type FilmsOverviewFilters = {
  cityId: string;
  cinemaId: string;
};

export type FilmsOverviewMetrics = {
  activeFilms: number;
  totalShows: number;
  ticketsSold: number;
  revenue: number;
  averageOccupancy: number | null;
};

const cityNameMap: Record<string, string> = {
  jakarta: "Jakarta",
  surabaya: "Surabaya",
  bandung: "Bandung",
  medan: "Medan",
  semarang: "Semarang",
  makassar: "Makassar",
  palembang: "Palembang",
};

let studiosCache: Promise<Studio[]> | null = null;

// Fungsi ini mengambil JSON dari API dan memastikan respons sukses.
// Helper ini menjaga semua request tetap konsisten dan ringkas.
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

// Fungsi ini membentuk URL ringkasan bioskop dari filter aktif.
// Jika cinema dipilih, filter city tidak perlu dikirim lagi.
const buildCinemasUrl = ({ cityId, cinemaId }: FilmsOverviewFilters) => {
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

// Fungsi ini membaca seluruh daftar studio sekali lalu menyimpannya di cache.
// Data ini dipakai ulang untuk estimasi kapasitas dan occupancy.
const getStudios = async () => {
  if (!studiosCache) {
    studiosCache = (async () => {
      const firstUrl = new URL(`${API_BASE_URL}/studios`);
      firstUrl.searchParams.set("page", "1");
      firstUrl.searchParams.set("limit", "100");

      const firstResponse = await fetch(firstUrl.toString(), { cache: "no-store" });

      if (!firstResponse.ok) {
        throw new Error(`Request failed: ${firstResponse.status}`);
      }

      const firstResult = (await firstResponse.json()) as ApiResponse<Studio[]>;

      if (!firstResult.success) {
        throw new Error("API returned an unsuccessful response");
      }

      const totalPages = firstResult.meta?.pagination?.total_pages ?? 1;
      const items = [...firstResult.data];

      if (totalPages <= 1) {
        return items;
      }

      const extraPages = await Promise.all(
        Array.from({ length: totalPages - 1 }).map((_, index) => {
          const pageUrl = new URL(`${API_BASE_URL}/studios`);
          pageUrl.searchParams.set("page", String(index + 2));
          pageUrl.searchParams.set("limit", "100");
          return getJson<Studio[]>(pageUrl.toString());
        })
      );

      return items.concat(...extraPages);
    })();
  }

  return studiosCache;
};

// Fungsi ini mengambil total show per cinema dengan request kecil ke endpoint schedules.
// Kita hanya butuh metadata total, jadi body datanya tidak dipakai.
const getCinemaShowCount = async (cinemaId: string) => {
  const url = new URL(`${API_BASE_URL}/schedules`);
  url.searchParams.set("cinema_id", cinemaId);
  url.searchParams.set("page", "1");
  url.searchParams.set("limit", "1");

  const response = await fetch(url.toString(), { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  const result = (await response.json()) as ApiResponse<unknown[]>;

  if (!result.success) {
    throw new Error("API returned an unsuccessful response");
  }

  return result.meta?.pagination?.total ?? 0;
};

// Fungsi ini mencari kapasitas per show untuk satu cinema dari data studio.
// Jika kapasitas studionya tidak konsisten, occupancy tidak dihitung paksa.
const getCinemaCapacityPerShow = (cinemaId: string, studios: Studio[]) => {
  const capacities = studios
    .filter((studio) => studio.cinema_id === cinemaId)
    .map((studio) => studio.total_capacity);

  if (capacities.length === 0) return null;
  if (new Set(capacities).size > 1) return null;
  return capacities[0];
};

// Fungsi ini merangkum data API menjadi 5 angka untuk kartu films overview.
// Ringkasan ini mengikuti filter city/cinema, tetapi belum mengikuti date range.
export const getFilmsOverviewMetrics = async (filters: FilmsOverviewFilters) => {
  const [cinemas, studios] = await Promise.all([
    getJson<CinemasResponse>(buildCinemasUrl(filters)),
    getStudios(),
  ]);

  const cinemaIds = cinemas.breakdown.map((item) => item.cinema_id);
  const showCounts = await Promise.all(
    cinemaIds.map(async (cinemaId) => ({
      cinemaId,
      totalShows: await getCinemaShowCount(cinemaId),
    }))
  );

  const totalShows = showCounts.reduce((total, item) => total + item.totalShows, 0);
  const activeFilms =
    cinemas.breakdown.length > 0
      ? Math.max(...cinemas.breakdown.map((item) => item.metrics.active_movies))
      : 0;

  let totalCapacity = 0;

  for (const item of showCounts) {
    const capacityPerShow = getCinemaCapacityPerShow(item.cinemaId, studios);
    if (capacityPerShow === null) {
      totalCapacity = 0;
      break;
    }

    totalCapacity += item.totalShows * capacityPerShow;
  }

  return {
    activeFilms,
    totalShows,
    ticketsSold: cinemas.summary.total_tickets,
    revenue: cinemas.summary.total_revenue,
    averageOccupancy:
      totalCapacity > 0 ? (cinemas.summary.total_tickets / totalCapacity) * 100 : null,
  } satisfies FilmsOverviewMetrics;
};
