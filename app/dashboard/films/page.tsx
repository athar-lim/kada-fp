'use client';

import { useEffect, useMemo, useState } from "react";
import { DateRange } from "react-day-picker";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Line,
  LineChart,
  Legend,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import {
  Film,
  Ticket,
  DollarSign,
  CalendarDays,
  AlertTriangle,
  Clock4,
} from "lucide-react";
import { format, addMinutes, startOfDay, endOfDay } from "date-fns";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DateRangeFilter } from "@/components/filters/date-range-filter";
import {
  FilmsOverviewMetrics,
  getFilmsOverviewMetrics,
} from "@/lib/cinetrack-films-overview";

const cityOptions = [
  { id: "all", name: "All Cities" },
  { id: "jakarta", name: "Jakarta" },
  { id: "bandung", name: "Bandung" },
  { id: "semarang", name: "Semarang" },
  { id: "medan", name: "Medan" },
  { id: "palembang", name: "Palembang" },
  { id: "makassar", name: "Makassar" },
];

// ===========================
// DUMMY DATA
// ===========================

const movies = [
  { id: "M001", title: "Kung Fu Panda 4", genre: "Animation" },
  { id: "M002", title: "Dune: Part Two", genre: "Action" },
  { id: "M003", title: "Godzilla x Kong", genre: "Action" },
  { id: "M004", title: "Exhuma", genre: "Horror" },
  { id: "M005", title: "Siksa Kubur", genre: "Horror" },
  { id: "M006", title: "Badarawuhi di Desa Penari", genre: "Horror" },
  { id: "M007", title: "Civil War", genre: "Action" },
  { id: "M010", title: "Kingdom of the Planet of the Apes", genre: "Action" },
  { id: "M011", title: "Furiosa: A Mad Max Saga", genre: "Action" },
  { id: "M012", title: "Inside Out 2", genre: "Animation" },
  { id: "M013", title: "Deadpool & Wolverine", genre: "Action" },
  { id: "M014", title: "Despicable Me 4", genre: "Animation" },
  { id: "M015", title: "A Quiet Place: Day One", genre: "Horror" },
  { id: "M016", title: "Twisters", genre: "Action" },
  { id: "M017", title: "Alien: Romulus", genre: "Horror" },
  { id: "M018", title: "Joker: Folie à Deux", genre: "Drama" },
  { id: "M019", title: "Gladiator II", genre: "Action" },
  { id: "M020", title: "Moana 2", genre: "Animation" },
];

const cinemas = [
  { id: "C001", name: "Plaza Indonesia XXI", city: "Jakarta" },
  { id: "C002", name: "Paris Van Java CGV", city: "Bandung" },
  { id: "C003", name: "DP Mall Cinepolis", city: "Semarang" },
  { id: "C004", name: "Senayan City XXI", city: "Jakarta" },
  { id: "C005", name: "Trans Studio Mall XXI", city: "Bandung" },
];

const studios = [
  { id: "ST001", cinemaId: "C001", name: "Studio 1", capacity: 150, type: "2D" },
  { id: "ST002", cinemaId: "C001", name: "IMAX", capacity: 200, type: "IMAX" },
  { id: "ST003", cinemaId: "C002", name: "Studio 2", capacity: 120, type: "2D" },
  { id: "ST004", cinemaId: "C002", name: "Premiere", capacity: 40, type: "2D" },
  { id: "ST005", cinemaId: "C003", name: "Studio 1", capacity: 100, type: "2D" },
  { id: "ST006", cinemaId: "C003", name: "Studio 2", capacity: 80, type: "2D" },
  { id: "ST007", cinemaId: "C004", name: "Studio 1", capacity: 150, type: "2D" },
  { id: "ST008", cinemaId: "C004", name: "IMAX", capacity: 200, type: "IMAX" },
  { id: "ST009", cinemaId: "C005", name: "Studio 1", capacity: 120, type: "2D" },
  { id: "ST010", cinemaId: "C005", name: "Studio 2", capacity: 100, type: "2D" },
];

const schedules = Array.from({ length: 93 }).map((_, i) => {
  const date = new Date(2026, 2, 24 + (i % 6));
  const hour = 10 + Math.floor(Math.random() * 12);
  date.setHours(hour, Math.random() > 0.5 ? 30 : 0, 0, 0);

  let status: 'On-Time' | 'Delayed' | 'Cancelled';
  let delayMinutes = 0;
  const rand = Math.random();

  if (rand < 0.08) {
    status = 'Cancelled';
  } else if (rand < 0.3) {
    status = 'Delayed';
    delayMinutes = 15 + Math.floor(Math.random() * 30);
  } else {
    status = 'On-Time';
  }

  const studio = studios[i % studios.length];

  return {
    id: `SCH${i + 1}`,
    movieId: movies[i % movies.length].id,
    studioId: studio.id,
    cinemaId: studio.cinemaId,
    scheduledTime: date,
    actualTime: status === 'Delayed' ? addMinutes(date, delayMinutes) : date,
    status,
    delayMinutes,
    capacity: studio.capacity,
  };
});

const seatCategories = [
  { name: 'Regular', price: 35000 },
  { name: 'VIP', price: 90000 },
  { name: 'Sweetbox', price: 150000 },
];

const tickets = Array.from({ length: 270 }).map((_, i) => {
  const activeSchedules = schedules.filter((s) => s.status !== 'Cancelled');
  const schedule = activeSchedules[i % activeSchedules.length];

  let seatCategory = seatCategories[0];
  const seatCategoryRand = Math.random();

  if (seatCategoryRand < 0.7) seatCategory = seatCategories[0];
  else if (seatCategoryRand < 0.9) seatCategory = seatCategories[1];
  else seatCategory = seatCategories[2];

  return {
    id: `T${i + 1}`,
    scheduleId: schedule.id,
    movieId: schedule.movieId,
    cinemaId: schedule.cinemaId,
    seatCategory: seatCategory.name,
    price: seatCategory.price,
    purchaseTime: new Date(
      schedule.scheduledTime.getTime() - Math.random() * 24 * 60 * 60 * 1000
    ),
    paymentType: ['QRIS', 'Cash', 'CC'][i % 3],
  };
});

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value);
};

const getStatusBadgeClass = (status: 'On-Time' | 'Delayed' | 'Cancelled') => {
  if (status === 'Cancelled') {
    return "bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400";
  }
  if (status === 'Delayed') {
    return "bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400";
  }
  return "bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400";
};

const getHighestOccupancySuggestion = (occupancy: number) => {
  if (occupancy >= 85) {
    return "Consider adding more showtimes, upgrading studio allocation, or testing premium pricing.";
  }
  if (occupancy >= 70) {
    return "Maintain the current schedule and monitor whether demand justifies an additional show.";
  }
  return "Performance is strong enough to keep the schedule stable while monitoring trend consistency.";
};

const getLowestOccupancySuggestion = (occupancy: number) => {
  if (occupancy < 30) {
    return "Consider reducing show frequency or offering price promotions.";
  }
  if (occupancy < 50) {
    return "Review schedule timing, improve promotion, and test targeted discounts.";
  }
  return "Keep the title under observation and optimize showtimes before making major reductions.";
};

// Helper ini memberi label apakah demand film sudah pas dengan kapasitas yang dipakai.
const getCapacityFitLabel = (occupancy: number, baseline: number) => {
  if (occupancy >= baseline + 10) return "Undersized";
  if (occupancy <= baseline - 10) return "Oversized";
  return "Fit";
};

// Helper ini mengubah score performa jadi status aksi yang mudah dibaca.
const getPerformanceStatus = (score: number) => {
  if (score < 0.5) return "Critical";
  if (score < 0.7) return "Underperforming";
  return "Good";
};

// Page ini membaca performa film dari winner sampai risk agar keputusan lineup lebih jelas.
export default function FilmsAnalyticsPage() {
  const [selectedCity, setSelectedCity] = useState("all");
  const [selectedCinema, setSelectedCinema] = useState("all");
  const [apiOverview, setApiOverview] = useState<FilmsOverviewMetrics | null>(null);
  const [apiOverviewLoading, setApiOverviewLoading] = useState(true);
  const [apiOverviewError, setApiOverviewError] = useState(false);
  const [selectedDateRange, setSelectedDateRange] = useState<DateRange | undefined>({
    from: new Date(2026, 2, 24),
    to: new Date(2026, 2, 29),
  });

  useEffect(() => {
    let cancelled = false;

    // Effect ini memuat ringkasan live untuk kartu films overview.
    // Request hanya mengikuti filter city dan cinema karena API belum mendukung period.
    const loadOverview = async () => {
      setApiOverviewLoading(true);
      setApiOverviewError(false);
      setApiOverview(null);

      try {
        const overview = await getFilmsOverviewMetrics({
          cityId: selectedCity,
          cinemaId: selectedCinema,
        });

        if (cancelled) return;
        setApiOverview(overview);
        setApiOverviewError(false);
      } catch {
        if (cancelled) return;
        setApiOverview(null);
        setApiOverviewError(true);
      } finally {
        if (cancelled) return;
        setApiOverviewLoading(false);
      }
    };

    loadOverview();

    return () => {
      cancelled = true;
    };
  }, [selectedCity, selectedCinema]);

  const visibleCinemaOptions = useMemo(() => {
    const filteredCinemas = cinemas.filter((cinema) => {
      if (selectedCity === "all") return true;
      return cinema.city.toLowerCase() === selectedCity;
    });

    return [
      { id: "all", name: "All Cinemas" },
      ...filteredCinemas.map((cinema) => ({
        id: cinema.id,
        name: cinema.name,
      })),
    ];
  }, [selectedCity]);

  const appliedFilmsRange = useMemo(() => {
    if (!selectedDateRange?.from) return null;

    return {
      from: startOfDay(selectedDateRange.from),
      to: endOfDay(selectedDateRange.to ?? selectedDateRange.from),
    };
  }, [selectedDateRange]);

  const filteredSchedules = useMemo(() => {
    return schedules.filter((schedule) => {
      const cinema = cinemas.find((c) => c.id === schedule.cinemaId);

      const matchCity =
        selectedCity === "all"
          ? true
          : cinema?.city.toLowerCase() === selectedCity;

      const matchCinema =
        selectedCinema === "all" ? true : schedule.cinemaId === selectedCinema;

      const matchDate = appliedFilmsRange
        ? schedule.scheduledTime >= appliedFilmsRange.from &&
          schedule.scheduledTime <= appliedFilmsRange.to
        : true;

      return matchCity && matchCinema && matchDate;
    });
  }, [selectedCity, selectedCinema, appliedFilmsRange]);

  const filteredScheduleIds = useMemo(
    () => new Set(filteredSchedules.map((schedule) => schedule.id)),
    [filteredSchedules]
  );

  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => filteredScheduleIds.has(ticket.scheduleId));
  }, [filteredScheduleIds]);

  const effectiveFilmsRange = useMemo(() => {
    if (appliedFilmsRange) return appliedFilmsRange;
    if (filteredSchedules.length === 0) return null;

    const sorted = [...filteredSchedules].sort(
      (a, b) => a.scheduledTime.getTime() - b.scheduledTime.getTime()
    );

    return {
      from: startOfDay(sorted[0].scheduledTime),
      to: endOfDay(sorted[sorted.length - 1].scheduledTime),
    };
  }, [appliedFilmsRange, filteredSchedules]);

  const uniqueMovieIds = new Set(filteredSchedules.map((schedule) => schedule.movieId));
  const activeFilmsCount = uniqueMovieIds.size;
  const totalShows = filteredSchedules.length;
  const totalTicketsSold = filteredTickets.length;
  const totalRevenue = filteredTickets.reduce((acc, ticket) => acc + ticket.price, 0);

  const activeSchedulesOnly = filteredSchedules.filter((schedule) => schedule.status !== "Cancelled");
  const totalCapacity = activeSchedulesOnly.reduce((acc, schedule) => acc + schedule.capacity, 0);
  const avgOccupancy = totalCapacity > 0 ? (totalTicketsSold / totalCapacity) * 100 : 0;

  const filmsDayCount = effectiveFilmsRange
    ? Math.max(
        1,
        Math.floor(
          (effectiveFilmsRange.to.getTime() - effectiveFilmsRange.from.getTime()) /
            (1000 * 60 * 60 * 24)
        ) + 1
      )
    : 1;

  const showsPerDay = effectiveFilmsRange
    ? Array.from({ length: filmsDayCount }).map((_, i) => {
        const current = new Date(effectiveFilmsRange.from);
        current.setDate(effectiveFilmsRange.from.getDate() + i);

        const count = filteredSchedules.filter((schedule) => {
          return (
            schedule.scheduledTime.getFullYear() === current.getFullYear() &&
            schedule.scheduledTime.getMonth() === current.getMonth() &&
            schedule.scheduledTime.getDate() === current.getDate()
          );
        }).length;

        return {
          date: format(current, "yyyy-MM-dd"),
          name: format(current, "dd MMM"),
          shows: count,
        };
      })
    : [];

  const ticketsPerMovie = movies
    .map((movie) => {
      const movieTickets = filteredTickets.filter((ticket) => ticket.movieId === movie.id);
      return {
        name: movie.title,
        tickets: movieTickets.length,
      };
    })
    .filter((item) => item.tickets > 0)
    .sort((a, b) => b.tickets - a.tickets);

  const revenuePerMovie = movies
    .map((movie) => {
      const movieTickets = filteredTickets.filter((ticket) => ticket.movieId === movie.id);
      const revenue = movieTickets.reduce((acc, ticket) => acc + ticket.price, 0);

      return {
        name: movie.title,
        revenue,
      };
    })
    .filter((item) => item.revenue > 0)
    .sort((a, b) => b.revenue - a.revenue);

  const occupancyPerMovie = movies
    .map((movie) => {
      const movieSchedules = filteredSchedules.filter(
        (schedule) => schedule.movieId === movie.id && schedule.status !== "Cancelled"
      );
      const movieCapacity = movieSchedules.reduce((acc, schedule) => acc + schedule.capacity, 0);
      const movieTicketsSold = filteredTickets.filter((ticket) => ticket.movieId === movie.id).length;
      const occupancy = movieCapacity > 0 ? (movieTicketsSold / movieCapacity) * 100 : 0;

      return {
        name: movie.title,
        shows: movieSchedules.length,
        tickets: movieTicketsSold,
        capacity: movieCapacity,
        occupancy,
      };
    })
    .filter((item) => item.shows > 0)
    .sort((a, b) => b.occupancy - a.occupancy);

  const highestOccupancyFilm =
    occupancyPerMovie.length > 0 ? occupancyPerMovie[0] : null;

  const lowestOccupancyFilm =
    occupancyPerMovie.length > 0
      ? occupancyPerMovie[occupancyPerMovie.length - 1]
      : null;

  const topThreeBestSellingFilms = movies
    .map((movie) => {
      const movieTickets = filteredTickets.filter((ticket) => ticket.movieId === movie.id);
      const movieSchedules = filteredSchedules.filter(
        (schedule) => schedule.movieId === movie.id && schedule.status !== "Cancelled"
      );
      const revenue = movieTickets.reduce((acc, ticket) => acc + ticket.price, 0);
      const capacity = movieSchedules.reduce((acc, schedule) => acc + schedule.capacity, 0);
      const occupancy = capacity > 0 ? (movieTickets.length / capacity) * 100 : 0;

      return {
        id: movie.id,
        title: movie.title,
        genre: movie.genre,
        tickets: movieTickets.length,
        revenue,
        shows: movieSchedules.length,
        occupancy,
      };
    })
    .filter((item) => item.tickets > 0)
    .sort((a, b) => b.tickets - a.tickets)
    .slice(0, 3);

  const genreDistribution = Object.entries(
    filteredSchedules.reduce<Record<string, number>>((acc, schedule) => {
      const movie = movies.find((item) => item.id === schedule.movieId);
      const genre = movie?.genre ?? "Unknown";
      acc[genre] = (acc[genre] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  const formatDistribution = Object.entries(
    filteredSchedules.reduce<Record<string, number>>((acc, schedule) => {
      const studio = studios.find((item) => item.id === schedule.studioId);
      const type = studio?.type ?? "Unknown";
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  const cancelledShows = filteredSchedules.filter((schedule) => schedule.status === "Cancelled").length;
  const delayedShows = filteredSchedules.filter((schedule) => schedule.status === "Delayed").length;
  const totalDelayMinutes = filteredSchedules.reduce((acc, schedule) => acc + schedule.delayMinutes, 0);
  const avgDelay = delayedShows > 0 ? Math.round(totalDelayMinutes / delayedShows) : 0;

  const sortedProblematicSchedules = [...filteredSchedules].sort((a, b) => {
    const statusOrder = { Cancelled: 0, Delayed: 1, "On-Time": 2 };
    return (
      statusOrder[a.status] - statusOrder[b.status] ||
      b.scheduledTime.getTime() - a.scheduledTime.getTime()
    );
  });

  const periodLabel = selectedDateRange?.from
    ? `${format(selectedDateRange.from, "dd MMM yyyy")} - ${format(
        selectedDateRange.to ?? selectedDateRange.from,
        "dd MMM yyyy"
      )}`
    : "All Periods";

  const rankingStyles = [
    "border-yellow-500/30 bg-yellow-500/10",
    "border-slate-400/30 bg-slate-400/10",
    "border-amber-700/30 bg-amber-700/10",
  ];

  const schedulePerformanceRows = filteredSchedules
    .map((schedule) => {
      const scheduleTickets = filteredTickets.filter((ticket) => ticket.scheduleId === schedule.id);
      const revenue = scheduleTickets.reduce((acc, ticket) => acc + ticket.price, 0);
      const movie = movies.find((item) => item.id === schedule.movieId);
      const cinema = cinemas.find((item) => item.id === schedule.cinemaId);

      return {
        id: schedule.id,
        movieTitle: movie?.title ?? "Unknown",
        cinemaName: cinema?.name ?? "Unknown",
        showDate: format(schedule.scheduledTime, "dd MMM"),
        startTime: format(schedule.scheduledTime, "HH:mm"),
        tickets: scheduleTickets.length,
        revenue,
        occupancy: schedule.capacity > 0 ? (scheduleTickets.length / schedule.capacity) * 100 : 0,
      };
    })
    .sort((a, b) => b.tickets - a.tickets || b.revenue - a.revenue);

  const repeatScheduleRows = movies
    .map((movie) => {
      const dailyPoints = Object.entries(
        filteredSchedules.reduce<Record<string, number>>((acc, schedule) => {
          if (schedule.movieId !== movie.id) return acc;
          const key = format(schedule.scheduledTime, "yyyy-MM-dd");
          const scheduleTickets = filteredTickets.filter((ticket) => ticket.scheduleId === schedule.id).length;
          acc[key] = (acc[key] || 0) + scheduleTickets;
          return acc;
        }, {})
      )
        .map(([date, tickets]) => ({ date, tickets }))
        .sort((a, b) => a.date.localeCompare(b.date));

      if (dailyPoints.length < 2) return null;

      const firstTickets = dailyPoints[0].tickets;
      const lastTickets = dailyPoints[dailyPoints.length - 1].tickets;
      const growthRate = firstTickets > 0 ? ((lastTickets - firstTickets) / firstTickets) * 100 : 0;

      return {
        movieId: movie.id,
        title: movie.title,
        firstTickets,
        lastTickets,
        growthRate,
        repeatDays: dailyPoints.length,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .sort((a, b) => b.growthRate - a.growthRate);

  const audienceDensityRows = occupancyPerMovie
    .map((item) => ({
      name: item.name,
      totalTickets: item.tickets,
      totalShows: item.shows,
      audienceDensity: item.shows > 0 ? item.tickets / item.shows : 0,
    }))
    .sort((a, b) => b.audienceDensity - a.audienceDensity);

  const occupancyByDay = showsPerDay.map((day) => {
    const daySchedules = activeSchedulesOnly.filter(
      (schedule) => format(schedule.scheduledTime, "yyyy-MM-dd") === day.date
    );
    const dayScheduleIds = new Set(daySchedules.map((schedule) => schedule.id));
    const dayTickets = filteredTickets.filter((ticket) => dayScheduleIds.has(ticket.scheduleId)).length;
    const dayCapacity = daySchedules.reduce((acc, schedule) => acc + schedule.capacity, 0);

    return {
      label: day.name,
      occupancy: dayCapacity > 0 ? (dayTickets / dayCapacity) * 100 : 0,
      tickets: dayTickets,
      capacity: dayCapacity,
    };
  });

  const occupancyByStudio = studios
    .filter((studio) => {
      if (selectedCinema !== "all" && studio.cinemaId !== selectedCinema) return false;
      const cinema = cinemas.find((item) => item.id === studio.cinemaId);
      if (selectedCity !== "all" && cinema?.city.toLowerCase() !== selectedCity) return false;
      return true;
    })
    .map((studio) => {
      const studioSchedules = activeSchedulesOnly.filter((schedule) => schedule.studioId === studio.id);
      const studioScheduleIds = new Set(studioSchedules.map((schedule) => schedule.id));
      const studioTickets = filteredTickets.filter((ticket) => studioScheduleIds.has(ticket.scheduleId)).length;
      const studioCapacity = studioSchedules.reduce((acc, schedule) => acc + schedule.capacity, 0);
      const cinema = cinemas.find((item) => item.id === studio.cinemaId);

      return {
        id: studio.id,
        label: studio.name,
        cinemaName: cinema?.name ?? "Unknown",
        occupancy: studioCapacity > 0 ? (studioTickets / studioCapacity) * 100 : 0,
        tickets: studioTickets,
        capacity: studioCapacity,
      };
    })
    .filter((item) => item.capacity > 0)
    .sort((a, b) => b.occupancy - a.occupancy);

  const capacityFitRows = occupancyPerMovie
    .map((item) => ({
      name: item.name,
      occupancy: item.occupancy,
      avgOccupancy,
      fitLabel: getCapacityFitLabel(item.occupancy, avgOccupancy),
    }))
    .sort((a, b) => b.occupancy - a.occupancy);

  const underperformingRows = occupancyPerMovie
    .map((item) => {
      const score = avgOccupancy > 0 ? item.occupancy / avgOccupancy : 0;
      const status = getPerformanceStatus(score);

      return {
        name: item.name,
        score,
        status,
        occupancy: item.occupancy,
        recommendation:
          status === "Critical"
            ? "Reduce shows or replace the title."
            : status === "Underperforming"
            ? "Review time slot and studio assignment."
            : "Keep the current setup and monitor trend.",
      };
    })
    .sort((a, b) => a.score - b.score);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:justify-between lg:items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Films Analytics</h1>
          <p className="text-muted-foreground">Period: {periodLabel}</p>
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="w-full md:w-52">
            <Select
              value={selectedCity}
              onValueChange={(value) => {
                setSelectedCity(value);
                setSelectedCinema("all");
              }}
            >
              <SelectTrigger>
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
          </div>

          <div className="w-full md:w-64">
            <Select value={selectedCinema} onValueChange={setSelectedCinema}>
              <SelectTrigger>
                <SelectValue placeholder="Select Cinema" />
              </SelectTrigger>
              <SelectContent>
                {visibleCinemaOptions.map((cinema) => (
                  <SelectItem key={cinema.id} value={cinema.id}>
                    {cinema.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full md:w-auto">
            <DateRangeFilter
              value={selectedDateRange}
              onApply={setSelectedDateRange}
              triggerLabel="Select period"
            />
          </div>
        </div>
      </div>

      <div className="h-px bg-border" />

      <section className="space-y-6">
        <header>
          <h2 className="text-lg font-semibold">FILMS OVERVIEW</h2>
          <p className="text-sm text-muted-foreground">
            Summary of film performance by city, cinema, and screening period.
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Films</CardTitle>
              <Film className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {apiOverviewLoading
                  ? "--"
                  : apiOverviewError
                  ? "Failed"
                  : apiOverview?.activeFilms ?? "N/A"}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Shows</CardTitle>
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {apiOverviewLoading
                  ? "--"
                  : apiOverviewError
                  ? "Failed"
                  : (apiOverview?.totalShows ?? 0).toLocaleString("en-US")}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tickets Sold</CardTitle>
              <Ticket className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {apiOverviewLoading
                  ? "--"
                  : apiOverviewError
                  ? "Failed"
                  : (apiOverview?.ticketsSold ?? 0).toLocaleString("en-US")}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {apiOverviewLoading
                  ? "--"
                  : apiOverviewError
                  ? "Failed"
                  : formatCurrency(apiOverview?.revenue ?? 0)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Occupancy</CardTitle>
              <Clock4 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {apiOverviewLoading
                  ? "--"
                  : apiOverviewError
                  ? "Failed"
                  : apiOverview?.averageOccupancy === null
                  ? "N/A"
                  : `${apiOverview.averageOccupancy.toFixed(1)}%`}
              </div>
            </CardContent>
          </Card>
        </div>

        <p className="text-xs text-muted-foreground">
          {apiOverviewLoading
            ? "Loading live API summary..."
            : apiOverview
            ? "Live API data follows city and cinema filters. Period filter is not supported by this endpoint yet."
            : apiOverviewError
            ? "API is unavailable for these cards right now."
            : "No API data available."}
        </p>

        <Card>
          <CardHeader>
            <CardTitle>Shows per Day</CardTitle>
            <CardDescription>Show trend by screening date.</CardDescription>
          </CardHeader>
          <CardContent className="h-[280px]">
            {showsPerDay.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={showsPerDay}>
                  <XAxis
                    dataKey="name"
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
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      borderColor: "hsl(var(--border))",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="shows"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center">
                <p className="text-muted-foreground">No show data for this period.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <div className="h-px bg-border" />

      <section className="space-y-6">
        <header>
          <h2 className="text-lg font-semibold">TOP FILMS PERFORMANCE</h2>
          <p className="text-sm text-muted-foreground">
            Most popular films based on total tickets sold in the selected period.
          </p>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>Tickets Sold per Film</CardTitle>
          </CardHeader>
          <CardContent className="h-[360px]">
            {ticketsPerMovie.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ticketsPerMovie.slice(0, 8)} layout="vertical">
                  <XAxis
                    type="number"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={160}
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      borderColor: "hsl(var(--border))",
                    }}
                    cursor={{ fill: "hsl(var(--secondary))" }}
                  />
                  <Bar dataKey="tickets" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center">
                <p className="text-muted-foreground">No film data for this filter.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <div className="h-px bg-border" />

      <section className="space-y-6">
        <header>
          <h2 className="text-lg font-semibold">TOP 3 BEST-SELLING FILMS</h2>
          <p className="text-sm text-muted-foreground">
            The three strongest films by ticket sales within the selected filter.
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-3">
          {topThreeBestSellingFilms.length > 0 ? (
            topThreeBestSellingFilms.map((film, index) => (
              <Card
                key={film.id}
                className={rankingStyles[index] ?? "border-border"}
              >
                <CardHeader className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge className="bg-primary text-primary-foreground">
                      Rank #{index + 1}
                    </Badge>
                    <Badge className="border border-border bg-transparent text-foreground">{film.genre}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">{film.title}</CardTitle>
                  <CardDescription>
                    Best-selling title based on total ticket sales.
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Tickets Sold</p>
                      <p className="text-xl font-bold">{film.tickets}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Revenue</p>
                      <p className="text-xl font-bold">{formatCurrency(film.revenue)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Shows</p>
                      <p className="text-xl font-bold">{film.shows}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Occupancy</p>
                      <p className="text-xl font-bold">{film.occupancy.toFixed(1)}%</p>
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Occupancy Level</span>
                      <span className="font-medium">{film.occupancy.toFixed(1)}%</span>
                    </div>
                    <Progress
                      value={film.occupancy}
                      className={`h-2 [&>div]:bg-green-500 ${
                        film.occupancy < 40
                          ? "[&>div]:bg-red-500"
                          : film.occupancy < 70
                          ? "[&>div]:bg-amber-500"
                          : ""
                      }`}
                    />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="md:col-span-3">
              <CardContent className="py-10 text-center text-muted-foreground">
                No best-selling film data found for this filter.
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      <div className="h-px bg-border" />

      <section className="space-y-6">
        <header>
          <h2 className="text-lg font-semibold">REVENUE & OCCUPANCY</h2>
          <p className="text-sm text-muted-foreground">
            Comparison of revenue and occupancy across films.
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Highest Occupancy</CardTitle>
              <CardDescription>
                Best-performing title by occupancy rate.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {highestOccupancyFilm ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-lg font-semibold">{highestOccupancyFilm.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {highestOccupancyFilm.tickets} tickets • {highestOccupancyFilm.shows} shows
                    </p>
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Occupancy</span>
                      <span className="font-medium">
                        {highestOccupancyFilm.occupancy.toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={highestOccupancyFilm.occupancy} className="h-2 [&>div]:bg-green-500" />
                  </div>

                  <div className="rounded-lg border border-border bg-muted/30 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Suggested Action
                    </p>
                    <p className="mt-1 text-sm">
                      {getHighestOccupancySuggestion(highestOccupancyFilm.occupancy)}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">No occupancy data available.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Lowest Occupancy</CardTitle>
              <CardDescription>
                Weakest-performing title by occupancy rate.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {lowestOccupancyFilm ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-lg font-semibold">{lowestOccupancyFilm.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {lowestOccupancyFilm.tickets} tickets • {lowestOccupancyFilm.shows} shows
                    </p>
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Occupancy</span>
                      <span className="font-medium">
                        {lowestOccupancyFilm.occupancy.toFixed(1)}%
                      </span>
                    </div>
                    <Progress
                      value={lowestOccupancyFilm.occupancy}
                      className={`h-2 ${
                        lowestOccupancyFilm.occupancy < 40
                          ? "[&>div]:bg-red-500"
                          : lowestOccupancyFilm.occupancy < 70
                          ? "[&>div]:bg-amber-500"
                          : "[&>div]:bg-green-500"
                      }`}
                    />
                  </div>

                  <div className="rounded-lg border border-border bg-muted/30 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Suggested Action
                    </p>
                    <p className="mt-1 text-sm">
                      {getLowestOccupancySuggestion(lowestOccupancyFilm.occupancy)}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">No occupancy data available.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle>Revenue per Film</CardTitle>
              </CardHeader>
              <CardContent className="h-[350px]">
                {revenuePerMovie.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenuePerMovie.slice(0, 7)} layout="vertical">
                      <XAxis
                        type="number"
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `Rp${Number(value) / 1000000}M`}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={160}
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          borderColor: "hsl(var(--border))",
                        }}
                        cursor={{ fill: "hsl(var(--secondary))" }}
                        formatter={(value) => formatCurrency(Number(value))}
                      />
                      <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-muted-foreground">No revenue data for this filter.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Occupancy per Film</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Film</TableHead>
                      <TableHead className="text-right">Occupancy</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {occupancyPerMovie.slice(0, 8).map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <div className="font-medium">{item.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {item.tickets} tickets • {item.shows} shows
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <span className="w-12 text-right font-medium">
                              {item.occupancy.toFixed(1)}%
                            </span>
                            <Progress
                              value={item.occupancy}
                              className={`h-2 w-20 [&>div]:bg-green-500 ${
                                item.occupancy < 40
                                  ? '[&>div]:bg-red-500'
                                  : item.occupancy < 70
                                  ? '[&>div]:bg-amber-500'
                                  : ''
                              }`}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {occupancyPerMovie.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={2} className="text-center text-muted-foreground">
                          No occupancy data available.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <div className="h-px bg-border" />

      <section className="space-y-6">
        <header>
          <h2 className="text-lg font-semibold">GENRE & FORMAT MIX</h2>
          <p className="text-sm text-muted-foreground">
            Show composition by film genre and studio format.
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Genre Distribution</CardTitle>
            </CardHeader>
            <CardContent className="h-[320px]">
              {genreDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={genreDistribution}>
                    <XAxis
                      dataKey="name"
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
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        borderColor: "hsl(var(--border))",
                      }}
                      cursor={{ fill: "hsl(var(--secondary))" }}
                    />
                    <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center">
                  <p className="text-muted-foreground">No genre data available.</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Studio Format Distribution</CardTitle>
            </CardHeader>
            <CardContent className="h-[320px]">
              {formatDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={formatDistribution}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label
                    >
                      {formatDistribution.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            index % 4 === 0
                              ? "hsl(var(--primary))"
                              : index % 4 === 1
                              ? "hsl(var(--chart-2))"
                              : index % 4 === 2
                              ? "hsl(var(--chart-3))"
                              : "hsl(var(--chart-4))"
                          }
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        borderColor: "hsl(var(--border))",
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center">
                  <p className="text-muted-foreground">No studio format data available.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      <div className="h-px bg-border" />

      <section className="space-y-6">
        <header>
          <h2 className="text-lg font-semibold">SCHEDULE & EFFICIENCY</h2>
          <p className="text-sm text-muted-foreground">
            Read schedule strength first, then check whether screen volume is too high or too low.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Schedule Performance</CardTitle>
              <CardDescription>Top schedules by ticket volume and realized occupancy.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Film</TableHead>
                    <TableHead>Show</TableHead>
                    <TableHead className="text-right">Tickets</TableHead>
                    <TableHead className="text-right">Occupancy</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schedulePerformanceRows.slice(0, 6).map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="font-medium">{item.movieTitle}</div>
                        <div className="text-sm text-muted-foreground">{item.cinemaName}</div>
                      </TableCell>
                      <TableCell>{item.showDate}, {item.startTime}</TableCell>
                      <TableCell className="text-right">{item.tickets}</TableCell>
                      <TableCell className="text-right">{item.occupancy.toFixed(1)}%</TableCell>
                    </TableRow>
                  ))}
                  {schedulePerformanceRows.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        No schedule performance data available.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Repeat Schedule Performance</CardTitle>
              <CardDescription>Check whether repeated screenings still gain or lose traction.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Film</TableHead>
                    <TableHead className="text-right">First Day</TableHead>
                    <TableHead className="text-right">Last Day</TableHead>
                    <TableHead className="text-right">Growth</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {repeatScheduleRows.slice(0, 6).map((item) => (
                    <TableRow key={item.movieId}>
                      <TableCell>
                        <div className="font-medium">{item.title}</div>
                        <div className="text-sm text-muted-foreground">{item.repeatDays} screening days</div>
                      </TableCell>
                      <TableCell className="text-right">{item.firstTickets}</TableCell>
                      <TableCell className="text-right">{item.lastTickets}</TableCell>
                      <TableCell className="text-right">
                        <span className={item.growthRate >= 0 ? "text-green-600" : "text-red-600"}>
                          {item.growthRate >= 0 ? "+" : ""}
                          {item.growthRate.toFixed(1)}%
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                  {repeatScheduleRows.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        Not enough repeated screening data for this filter.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Audience Density</CardTitle>
            <CardDescription>Average audience size per screening for each film.</CardDescription>
          </CardHeader>
          <CardContent className="h-[320px]">
            {audienceDensityRows.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={audienceDensityRows.slice(0, 8)} layout="vertical">
                  <XAxis
                    type="number"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={160}
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      borderColor: "hsl(var(--border))",
                    }}
                    formatter={(value) => `${Number(value).toFixed(1)} viewers/show`}
                  />
                  <Bar dataKey="audienceDensity" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center">
                <p className="text-muted-foreground">No audience density data available.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <div className="h-px bg-border" />

      <section className="space-y-6">
        <header>
          <h2 className="text-lg font-semibold">FIT & ACTION</h2>
          <p className="text-sm text-muted-foreground">
            Compare occupancy, capacity fit, and underperforming score before changing the lineup.
          </p>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>Occupancy Breakdown</CardTitle>
            <CardDescription>Drill down occupancy by movie, day, and studio.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="movie">
              <TabsList>
                <TabsTrigger value="movie">By Movie</TabsTrigger>
                <TabsTrigger value="day">By Day</TabsTrigger>
                <TabsTrigger value="studio">By Studio</TabsTrigger>
              </TabsList>

              <TabsContent value="movie">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Label</TableHead>
                      <TableHead className="text-right">Tickets</TableHead>
                      <TableHead className="text-right">Capacity</TableHead>
                      <TableHead className="text-right">Occupancy</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {occupancyPerMovie.slice(0, 8).map((item) => (
                      <TableRow key={item.name}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell className="text-right">{item.tickets}</TableCell>
                        <TableCell className="text-right">{item.capacity}</TableCell>
                        <TableCell className="text-right">{item.occupancy.toFixed(1)}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>

              <TabsContent value="day">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Day</TableHead>
                      <TableHead className="text-right">Tickets</TableHead>
                      <TableHead className="text-right">Capacity</TableHead>
                      <TableHead className="text-right">Occupancy</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {occupancyByDay.map((item) => (
                      <TableRow key={item.label}>
                        <TableCell className="font-medium">{item.label}</TableCell>
                        <TableCell className="text-right">{item.tickets}</TableCell>
                        <TableCell className="text-right">{item.capacity}</TableCell>
                        <TableCell className="text-right">{item.occupancy.toFixed(1)}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>

              <TabsContent value="studio">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Studio</TableHead>
                      <TableHead className="text-right">Tickets</TableHead>
                      <TableHead className="text-right">Capacity</TableHead>
                      <TableHead className="text-right">Occupancy</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {occupancyByStudio.slice(0, 8).map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="font-medium">{item.label}</div>
                          <div className="text-sm text-muted-foreground">{item.cinemaName}</div>
                        </TableCell>
                        <TableCell className="text-right">{item.tickets}</TableCell>
                        <TableCell className="text-right">{item.capacity}</TableCell>
                        <TableCell className="text-right">{item.occupancy.toFixed(1)}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Capacity Fit</CardTitle>
              <CardDescription>Shows whether each film needs larger, smaller, or similar capacity.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Film</TableHead>
                    <TableHead className="text-right">Occupancy</TableHead>
                    <TableHead className="text-right">Baseline</TableHead>
                    <TableHead className="text-right">Fit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {capacityFitRows.slice(0, 8).map((item) => (
                    <TableRow key={item.name}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="text-right">{item.occupancy.toFixed(1)}%</TableCell>
                      <TableCell className="text-right">{item.avgOccupancy.toFixed(1)}%</TableCell>
                      <TableCell className="text-right">{item.fitLabel}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Underperforming Detection</CardTitle>
              <CardDescription>Flag films that sit below the network occupancy baseline.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Film</TableHead>
                    <TableHead className="text-right">Score</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {underperformingRows.slice(0, 8).map((item) => (
                    <TableRow key={item.name}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="text-right">{item.score.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge
                          className={
                            item.status === "Critical"
                              ? "bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400"
                              : item.status === "Underperforming"
                              ? "bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400"
                              : "bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400"
                          }
                        >
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{item.recommendation}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </section>

      <div className="h-px bg-border" />

      <section className="space-y-6">
        <header>
          <h2 className="text-lg font-semibold">PROBLEMATIC SHOWS</h2>
          <p className="text-sm text-muted-foreground">
            Summary of cancelled and delayed schedules in the selected period.
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cancelled Shows</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{cancelledShows} shows</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Delayed Shows</CardTitle>
              <Clock4 className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{delayedShows} shows</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Delay</CardTitle>
              <Clock4 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgDelay} minutes</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Problematic Schedule List</CardTitle>
              <span className="text-sm text-muted-foreground">
                Follows city, cinema, and period filters
              </span>
            </div>
          </CardHeader>

          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Film</TableHead>
                  <TableHead>Cinema</TableHead>
                  <TableHead>Scheduled Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedProblematicSchedules.slice(0, 10).map((schedule) => (
                  <TableRow key={schedule.id}>
                    <TableCell className="font-medium">
                      {movies.find((movie) => movie.id === schedule.movieId)?.title}
                    </TableCell>
                    <TableCell>
                      {cinemas.find((cinema) => cinema.id === schedule.cinemaId)?.name}
                    </TableCell>
                    <TableCell>
                      {format(schedule.scheduledTime, 'dd MMM yyyy, HH:mm')}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusBadgeClass(schedule.status)}>
                        {schedule.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {schedule.status === 'Delayed'
                        ? `${schedule.delayMinutes} min delay`
                        : schedule.status === 'Cancelled'
                        ? 'Cancelled'
                        : '-'}
                    </TableCell>
                  </TableRow>
                ))}

                {sortedProblematicSchedules.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No problematic schedules found for this filter.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
