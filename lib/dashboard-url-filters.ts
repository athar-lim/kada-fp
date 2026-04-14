import { format, parseISO } from "date-fns";
import type { DateRange } from "react-day-picker";

import type { DashboardQuery } from "@/lib/cinetrack-api";

/** Query string keys shared across Dashboard, Film Performance, and Sales Analytics. */
export const DASHBOARD_FILTER_KEYS = {
  city: "city",
  cinema_id: "cinema_id",
  start_date: "start_date",
  end_date: "end_date",
} as const;

export function dateRangeFromSearchParams(searchParams: URLSearchParams): DateRange | undefined {
  const start = searchParams.get(DASHBOARD_FILTER_KEYS.start_date);
  const end = searchParams.get(DASHBOARD_FILTER_KEYS.end_date);
  if (!start) return undefined;
  try {
    return {
      from: parseISO(start),
      to: end ? parseISO(end) : parseISO(start),
    };
  } catch {
    return undefined;
  }
}

export function dashboardFiltersToQuery(
  city: string,
  cinemaId: string,
  dateRange: DateRange | undefined
): DashboardQuery {
  const q: DashboardQuery = {};
  if (city !== "all") q.city = city;
  if (cinemaId !== "all") q.cinema_id = cinemaId;
  if (dateRange?.from) {
    q.start_date = format(dateRange.from, "yyyy-MM-dd");
    q.end_date = format(dateRange.to ?? dateRange.from, "yyyy-MM-dd");
  }
  return q;
}

/**
 * Copies active filters to another page. When currently at /dashboard/cities/[city],
 * the `city` parameter is preserved so Film/Sales stay scoped to the same city.
 */
export function mergeParamsForDashboardLink(
  targetPath: string,
  currentSearchParams: URLSearchParams,
  currentPathname: string
): string {
  const merged = new URLSearchParams(currentSearchParams.toString());
  const cityMatch = currentPathname.match(/^\/dashboard\/cities\/([^/]+)$/);
  if (cityMatch && !merged.get(DASHBOARD_FILTER_KEYS.city)) {
    merged.set(DASHBOARD_FILTER_KEYS.city, decodeURIComponent(cityMatch[1]));
  }
  const qs = merged.toString();
  return qs ? `${targetPath}?${qs}` : targetPath;
}
