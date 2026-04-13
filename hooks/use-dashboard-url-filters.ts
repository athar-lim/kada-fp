"use client";

import { useCallback, useMemo } from "react";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  dashboardFiltersToQuery,
  dateRangeFromSearchParams,
  mergeParamsForDashboardLink,
} from "@/lib/dashboard-url-filters";

export function useDashboardUrlFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const selectedCity = searchParams.get("city") ?? "all";
  const selectedCinema = searchParams.get("cinema_id") ?? "all";
  const dateRange = useMemo(() => dateRangeFromSearchParams(searchParams), [searchParams]);

  const replaceParams = useCallback(
    (params: URLSearchParams) => {
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router]
  );

  const setCity = useCallback(
    (city: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (!city || city === "all") params.delete("city");
      else params.set("city", city);
      params.delete("cinema_id");
      replaceParams(params);
    },
    [replaceParams, searchParams]
  );

  const setCinema = useCallback(
    (cinemaId: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (!cinemaId || cinemaId === "all") params.delete("cinema_id");
      else params.set("cinema_id", cinemaId);
      replaceParams(params);
    },
    [replaceParams, searchParams]
  );

  const setDateRange = useCallback(
    (range: DateRange | undefined) => {
      const params = new URLSearchParams(searchParams.toString());
      if (!range?.from) {
        params.delete("start_date");
        params.delete("end_date");
      } else {
        params.set("start_date", format(range.from, "yyyy-MM-dd"));
        params.set("end_date", format(range.to ?? range.from, "yyyy-MM-dd"));
      }
      replaceParams(params);
    },
    [replaceParams, searchParams]
  );

  const hrefWithFilters = useCallback(
    (targetPath: string) =>
      mergeParamsForDashboardLink(targetPath, new URLSearchParams(searchParams.toString()), pathname),
    [pathname, searchParams]
  );

  const apiQuery = useMemo(
    () => dashboardFiltersToQuery(selectedCity, selectedCinema, dateRange),
    [dateRange, selectedCinema, selectedCity]
  );

  return {
    selectedCity,
    selectedCinema,
    dateRange,
    setCity,
    setCinema,
    setDateRange,
    hrefWithFilters,
    apiQuery,
  };
}
