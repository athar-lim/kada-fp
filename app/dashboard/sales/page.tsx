'use client';

import { useMemo, useState } from "react";
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
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Line,
  LineChart,
  Cell,
} from "recharts";
import {
  Ticket,
  DollarSign,
  Calendar,
  AlertTriangle,
  Clock,
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

const paymentConfigs = {
  QRIS: { adminFee: 2000, successRate: 0.98 },
  Cash: { adminFee: 500, successRate: 1 },
  CC: { adminFee: 3500, successRate: 0.95 },
} as const;

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

const seededRandom = (seed: number) => {
  const x = Math.sin(seed * 9999.91) * 10000;
  return x - Math.floor(x);
};

const revenueHistoryData = Array.from({ length: 24 }).flatMap((_, index) => {
  const year = 2025 + Math.floor(index / 12);
  const month = index % 12;

  return cinemas.map((cinema, cinemaIndex) => {
    const seasonalPattern = [0.92, 0.95, 1.02, 1.04, 1.06, 1.1, 1.08, 1.03, 0.98, 1.05, 1.12, 1.2];
    const baseRevenue = 95_000_000 + cinemaIndex * 18_000_000;
    const trendMultiplier = 1 + index * 0.025;
    const randomMultiplier = 0.92 + seededRandom(index * 10 + cinemaIndex) * 0.18;
    const revenue = Math.round(
      baseRevenue * seasonalPattern[month] * trendMultiplier * randomMultiplier
    );

    return {
      year,
      month,
      monthLabel: format(new Date(year, month, 1), "MMM"),
      quarter: `Q${Math.floor(month / 3) + 1}`,
      cinemaId: cinema.id,
      city: cinema.city,
      revenue,
    };
  });
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

// Page ini merangkum penjualan lalu menurunkannya ke demand, pricing, forecast, dan risk.
export default function SalesAnalyticsPage() {
  const [selectedCity, setSelectedCity] = useState("all");
  const [selectedCinema, setSelectedCinema] = useState("all");
  const [selectedDateRange, setSelectedDateRange] = useState<DateRange | undefined>({
    from: new Date(2026, 2, 24),
    to: new Date(2026, 2, 29),
  });

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

  const appliedRange = useMemo(() => {
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

      const matchDate = appliedRange
        ? schedule.scheduledTime >= appliedRange.from &&
          schedule.scheduledTime <= appliedRange.to
        : true;

      return matchCity && matchCinema && matchDate;
    });
  }, [selectedCity, selectedCinema, appliedRange]);

  const filteredScheduleIds = useMemo(
    () => new Set(filteredSchedules.map((schedule) => schedule.id)),
    [filteredSchedules]
  );

  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => filteredScheduleIds.has(ticket.scheduleId));
  }, [filteredScheduleIds]);

  const effectiveRange = useMemo(() => {
    if (appliedRange) return appliedRange;
    if (filteredSchedules.length === 0) return null;

    const sorted = [...filteredSchedules].sort(
      (a, b) => a.scheduledTime.getTime() - b.scheduledTime.getTime()
    );

    return {
      from: startOfDay(sorted[0].scheduledTime),
      to: endOfDay(sorted[sorted.length - 1].scheduledTime),
    };
  }, [appliedRange, filteredSchedules]);

  const totalTicketsSold = filteredTickets.length;
  const totalRevenue = filteredTickets.reduce((acc, ticket) => acc + ticket.price, 0);
  const activeSchedulesOnly = filteredSchedules.filter((schedule) => schedule.status !== "Cancelled");
  const totalCapacity = activeSchedulesOnly.reduce((acc, schedule) => acc + schedule.capacity, 0);
  const avgTicketPrice = totalTicketsSold > 0 ? totalRevenue / totalTicketsSold : 0;
  const revenuePerSeat = totalCapacity > 0 ? totalRevenue / totalCapacity : 0;

  const dayCount = effectiveRange
    ? Math.max(
        1,
        Math.floor(
          (effectiveRange.to.getTime() - effectiveRange.from.getTime()) /
            (1000 * 60 * 60 * 24)
        ) + 1
      )
    : 1;

  const avgTicketsPerDay = totalTicketsSold / dayCount;

  const ticketsByDay = effectiveRange
    ? Array.from({ length: dayCount }).map((_, i) => {
        const current = new Date(effectiveRange.from);
        current.setDate(effectiveRange.from.getDate() + i);

        const dayScheduleIds = filteredSchedules
          .filter((schedule) => {
            return (
              schedule.scheduledTime.getFullYear() === current.getFullYear() &&
              schedule.scheduledTime.getMonth() === current.getMonth() &&
              schedule.scheduledTime.getDate() === current.getDate()
            );
          })
          .map((schedule) => schedule.id);

        const ticketCount = filteredTickets.filter((ticket) =>
          dayScheduleIds.includes(ticket.scheduleId)
        ).length;

        return {
          name: format(current, "dd MMM"),
          tickets: ticketCount,
        };
      })
    : [];

  const filteredRevenueHistory = useMemo(() => {
    return revenueHistoryData.filter((item) => {
      const cinema = cinemas.find((c) => c.id === item.cinemaId);

      const matchCity =
        selectedCity === "all"
          ? true
          : cinema?.city.toLowerCase() === selectedCity;

      const matchCinema =
        selectedCinema === "all" ? true : item.cinemaId === selectedCinema;

      return matchCity && matchCinema;
    });
  }, [selectedCity, selectedCinema]);

  const revenuePerCinema = cinemas
    .filter((cinema) => {
      const matchCity =
        selectedCity === "all"
          ? true
          : cinema.city.toLowerCase() === selectedCity;

      const matchCinema =
        selectedCinema === "all" ? true : cinema.id === selectedCinema;

      return matchCity && matchCinema;
    })
    .map((cinema) => {
      const cinemaSchedules = activeSchedulesOnly.filter((schedule) => schedule.cinemaId === cinema.id);
      const cinemaCapacity = cinemaSchedules.reduce((acc, schedule) => acc + schedule.capacity, 0);
      const cinemaTickets = filteredTickets.filter((ticket) => ticket.cinemaId === cinema.id);
      const revenue = cinemaTickets.reduce((acc, ticket) => acc + ticket.price, 0);
      const ticketsSold = cinemaTickets.length;
      const occupancy = cinemaCapacity > 0 ? (ticketsSold / cinemaCapacity) * 100 : 0;

      return {
        cinemaId: cinema.id,
        name: cinema.name,
        city: cinema.city,
        revenue,
        tickets: ticketsSold,
        occupancy,
        revenuePerSeat: cinemaCapacity > 0 ? revenue / cinemaCapacity : 0,
      };
    })
    .sort((a, b) => b.revenue - a.revenue);

  const revenuePerFilm = movies
    .map((movie) => {
      const movieTickets = filteredTickets.filter((ticket) => ticket.movieId === movie.id);
      const revenue = movieTickets.reduce((acc, ticket) => acc + ticket.price, 0);
      return { name: movie.title, revenue };
    })
    .filter((item) => item.revenue > 0)
    .sort((a, b) => b.revenue - a.revenue);

  const timeSlotPerformance = Array.from({ length: 24 }).map((_, hour) => {
    const label = `${hour.toString().padStart(2, "0")}:00`;
    const slotScheduleIds = filteredSchedules
      .filter((schedule) => schedule.scheduledTime.getHours() === hour)
      .map((schedule) => schedule.id);
    const slotTickets = filteredTickets.filter((ticket) => slotScheduleIds.includes(ticket.scheduleId));
    const slotRevenue = slotTickets.reduce((acc, ticket) => acc + ticket.price, 0);
    const slotCapacity = activeSchedulesOnly
      .filter((schedule) => schedule.scheduledTime.getHours() === hour)
      .reduce((acc, schedule) => acc + schedule.capacity, 0);

    return {
      hour: label,
      demand: slotTickets.length,
      revenue: slotRevenue,
      occupancy: slotCapacity > 0 ? (slotTickets.length / slotCapacity) * 100 : 0,
    };
  });

  const maxDemand = Math.max(...timeSlotPerformance.map((item) => item.demand), 0);
  const minDemand = Math.min(...timeSlotPerformance.map((item) => item.demand), 0);
  const maxRevenue = Math.max(...timeSlotPerformance.map((item) => item.revenue), 0);
  const minRevenue = Math.min(...timeSlotPerformance.map((item) => item.revenue), 0);

  const optimizationRows = timeSlotPerformance.map((item) => {
    const normDemand =
      maxDemand === minDemand ? 0 : (item.demand - minDemand) / (maxDemand - minDemand);
    const normRevenue =
      maxRevenue === minRevenue ? 0 : (item.revenue - minRevenue) / (maxRevenue - minRevenue);
    const gap = normDemand - normRevenue;
    const score = 0.6 * normDemand - 0.4 * normRevenue;

    let recommendation = "Keep current setup";
    if (normDemand > 0.7 && item.occupancy > 70) {
      recommendation = "Increase price or add premium allocation";
    } else if (normDemand > 0.7 && item.occupancy < 50) {
      recommendation = "Fix scheduling and studio allocation";
    } else if (normDemand < 0.3) {
      recommendation = "Promote or reduce slot frequency";
    }

    return {
      ...item,
      normDemand,
      normRevenue,
      gap,
      score,
      recommendation,
    };
  });

  const peakHoursRanked = [...timeSlotPerformance].sort((a, b) => b.revenue - a.revenue);
  const busiestHour = peakHoursRanked[0]?.hour ?? "-";
  const quietestHour = [...timeSlotPerformance].sort((a, b) => a.demand - b.demand)[0]?.hour ?? "-";
  const bestTimeSlot = peakHoursRanked[0] ?? null;
  const topOptimizationSlot = [...optimizationRows].sort((a, b) => b.score - a.score)[0] ?? null;

  const heatmapHours = timeSlotPerformance
    .filter((item) => item.demand > 0)
    .map((item) => item.hour);
  const heatmapDays = effectiveRange
    ? Array.from({ length: dayCount }).map((_, index) => {
        const current = new Date(effectiveRange.from);
        current.setDate(effectiveRange.from.getDate() + index);
        return {
          key: format(current, "yyyy-MM-dd"),
          label: format(current, "dd MMM"),
        };
      })
    : [];

  const demandHeatmap = heatmapHours.map((hourLabel) => {
    const hour = Number(hourLabel.slice(0, 2));

    return {
      hour: hourLabel,
      cells: heatmapDays.map((day) => {
        const slotScheduleIds = filteredSchedules
          .filter((schedule) => {
            return (
              schedule.scheduledTime.getHours() === hour &&
              format(schedule.scheduledTime, "yyyy-MM-dd") === day.key
            );
          })
          .map((schedule) => schedule.id);
        const demand = filteredTickets.filter((ticket) => slotScheduleIds.includes(ticket.scheduleId)).length;

        return {
          label: day.label,
          demand,
        };
      }),
    };
  });

  const weekdayWeekend = filteredTickets.reduce(
    (acc, ticket) => {
      const schedule = filteredSchedules.find((item) => item.id === ticket.scheduleId);
      if (!schedule) return acc;

      const isWeekend = [0, 6].includes(schedule.scheduledTime.getDay());
      if (isWeekend) {
        acc.weekendRevenue += ticket.price;
        acc.weekendTickets += 1;
      } else {
        acc.weekdayRevenue += ticket.price;
        acc.weekdayTickets += 1;
      }

      return acc;
    },
    { weekdayRevenue: 0, weekendRevenue: 0, weekdayTickets: 0, weekendTickets: 0 }
  );

  const monthlyRevenueSeries = Object.entries(
    filteredRevenueHistory.reduce<Record<string, number>>((acc, item) => {
      const key = `${item.year}-${item.month.toString().padStart(2, "0")}`;
      acc[key] = (acc[key] || 0) + item.revenue;
      return acc;
    }, {})
  )
    .map(([key, revenue]) => {
      const [year, month] = key.split("-").map(Number);
      return {
        key,
        label: format(new Date(year, month, 1), "MMM yy"),
        revenue,
        date: new Date(year, month, 1),
      };
    })
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  const lastThreeRevenue = monthlyRevenueSeries.slice(-3).map((item) => item.revenue);
  const forecastBase =
    lastThreeRevenue.length > 0
      ? lastThreeRevenue.reduce((acc, value) => acc + value, 0) / lastThreeRevenue.length
      : 0;

  const forecastRevenue = Math.round(forecastBase * 1.04);
  const trendWithForecast = [
    ...monthlyRevenueSeries.map((item) => ({
      label: item.label,
      actual: item.revenue,
      forecast: null as number | null,
    })),
    {
      label:
        monthlyRevenueSeries.length > 0
          ? format(
              new Date(
                monthlyRevenueSeries[monthlyRevenueSeries.length - 1].date.getFullYear(),
                monthlyRevenueSeries[monthlyRevenueSeries.length - 1].date.getMonth() + 1,
                1
              ),
              "MMM yy"
            )
          : "Next",
      actual: null as number | null,
      forecast: forecastRevenue,
    },
  ];

  const paymentPreference = Object.entries(
    filteredTickets.reduce<Record<string, number>>((acc, ticket) => {
      acc[ticket.paymentType] = (acc[ticket.paymentType] || 0) + 1;
      return acc;
    }, {})
  ).map(([paymentType, transactions]) => ({
    paymentType,
    transactions,
    usagePct: totalTicketsSold > 0 ? (transactions / totalTicketsSold) * 100 : 0,
  }));

  const paymentProfitability = paymentPreference.map((item) => {
    const config = paymentConfigs[item.paymentType as keyof typeof paymentConfigs];
    const avgPrice = item.transactions > 0
      ? filteredTickets
          .filter((ticket) => ticket.paymentType === item.paymentType)
          .reduce((acc, ticket) => acc + ticket.price, 0) / item.transactions
      : 0;

    return {
      ...item,
      avgPrice,
      adminFee: config.adminFee,
      successRate: config.successRate,
      netProfitability: item.transactions * avgPrice * config.successRate - item.transactions * config.adminFee,
    };
  });

  const pricingRecommendation = topOptimizationSlot
    ? topOptimizationSlot.occupancy > 70 && topOptimizationSlot.demand >= Math.max(10, maxDemand * 0.7)
      ? `Increase price around ${topOptimizationSlot.hour}; demand and occupancy are both strong.`
      : topOptimizationSlot.occupancy < 50 && topOptimizationSlot.demand >= Math.max(10, maxDemand * 0.7)
      ? `Fix scheduling around ${topOptimizationSlot.hour}; demand exists but seat fill is still weak.`
      : `Keep pricing stable and use promos around ${quietestHour} to improve demand.`
    : "No pricing recommendation for the current filter.";

  const cancelledShows = filteredSchedules.filter((schedule) => schedule.status === 'Cancelled').length;
  const delayedShows = filteredSchedules.filter((schedule) => schedule.status === 'Delayed').length;
  const totalDelayMinutes = filteredSchedules.reduce((acc, schedule) => acc + schedule.delayMinutes, 0);
  const avgDelay = delayedShows > 0 ? Math.round(totalDelayMinutes / delayedShows) : 0;

  const sortedSchedules = [...filteredSchedules].sort((a, b) => {
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

  return (
    <div className="space-y-8">
      {/* 1. Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:justify-between lg:items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Sales Analytics</h1>
          <p className="text-muted-foreground">Period: {periodLabel}</p>
        </div>

        {/* 2. Filter Bar */}
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
          <h2 className="text-lg font-semibold">SALES OVERVIEW</h2>
          <p className="text-sm text-muted-foreground">
            Revenue and ticket performance summary for the selected city, cinema, and period.
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
              <Ticket className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalTicketsSold.toLocaleString("en-US")}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Ticket Price</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(avgTicketPrice)}</div>
              <p className="text-xs text-muted-foreground">{avgTicketsPerDay.toFixed(0)} tickets per day</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue per Seat</CardTitle>
              <Clock4 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(revenuePerSeat)}</div>
              <p className="text-xs text-muted-foreground">Space utilization indicator</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Revenue and Tickets by Day</CardTitle>
            <CardDescription>Daily movement of volume before drilling into time-slot optimization.</CardDescription>
          </CardHeader>
          <CardContent className="h-[280px]">
            {ticketsByDay.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={ticketsByDay}>
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
                    dataKey="tickets"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center">
                <p className="text-muted-foreground">No daily sales data for this period.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <div className="h-px bg-border" />

      <section className="space-y-6">
        <header>
          <h2 className="text-lg font-semibold">REVENUE SOURCES</h2>
          <p className="text-sm text-muted-foreground">
            Break down revenue by cinema and movie before moving into time and pricing decisions.
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle>Revenue per Cinema</CardTitle>
              </CardHeader>
              <CardContent className="h-[340px]">
                {revenuePerCinema.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenuePerCinema.slice(0, 7)} layout="vertical">
                      <XAxis
                        type="number"
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `Rp${Math.round(Number(value) / 1000000)}M`}
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
                    <p className="text-muted-foreground">No cinema revenue data for this filter.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Revenue per Film</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {revenuePerFilm.slice(0, 6).map((film) => (
                  <div key={film.name}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="font-medium">{film.name}</span>
                      <span className="text-muted-foreground">{formatCurrency(film.revenue)}</span>
                    </div>
                    <Progress
                      value={totalRevenue > 0 ? (film.revenue / totalRevenue) * 100 : 0}
                      className="h-2 [&>div]:bg-green-500"
                    />
                  </div>
                ))}
                {revenuePerFilm.length === 0 && (
                  <p className="text-sm text-muted-foreground">No film revenue data found.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <div className="h-px bg-border" />

      <section className="space-y-6">
        <header>
          <h2 className="text-lg font-semibold">TIME & PRICING</h2>
          <p className="text-sm text-muted-foreground">
            Read demand by slot, compare it with revenue, then decide whether the issue is pricing or scheduling.
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Best Time Slot</CardTitle>
              <Clock4 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{bestTimeSlot?.hour ?? "-"}</div>
              <p className="text-xs text-muted-foreground">
                {bestTimeSlot ? formatCurrency(bestTimeSlot.revenue) : "No revenue yet"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Quietest Hour</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{quietestHour}</div>
              <p className="text-xs text-muted-foreground">Lowest demand across available slots</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pricing Recommendation</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-base font-semibold leading-snug">{pricingRecommendation}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Seat Demand Heatmap</CardTitle>
            <CardDescription>Demand concentration by show date and start time.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 overflow-x-auto">
            {demandHeatmap.length > 0 ? (
              <div className="min-w-[640px]">
                <div className="grid grid-cols-[100px_repeat(6,minmax(0,1fr))] gap-2 text-xs text-muted-foreground">
                  <div>Time</div>
                  {heatmapDays.map((day) => (
                    <div key={day.key}>{day.label}</div>
                  ))}
                </div>
                <div className="mt-3 space-y-2">
                  {demandHeatmap.map((row) => (
                    <div
                      key={row.hour}
                      className="grid grid-cols-[100px_repeat(6,minmax(0,1fr))] gap-2"
                    >
                      <div className="flex items-center text-sm font-medium">{row.hour}</div>
                      {row.cells.map((cell) => (
                        <div
                          key={`${row.hour}-${cell.label}`}
                          className="rounded-lg px-3 py-2 text-center text-sm"
                          style={{
                            backgroundColor:
                              cell.demand === 0
                                ? "hsl(var(--secondary))"
                                : `hsl(var(--primary) / ${0.15 + cell.demand / Math.max(1, maxDemand) * 0.75})`,
                          }}
                        >
                          {cell.demand}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex h-32 items-center justify-center">
                <p className="text-muted-foreground">No slot demand data for this filter.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Time Slot Optimization Score</CardTitle>
            <CardDescription>High score means demand is stronger than realized revenue.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time Slot</TableHead>
                  <TableHead className="text-right">Demand</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Score</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {optimizationRows
                  .filter((item) => item.demand > 0 || item.revenue > 0)
                  .sort((a, b) => b.score - a.score)
                  .slice(0, 6)
                  .map((item) => (
                    <TableRow key={item.hour}>
                      <TableCell className="font-medium">{item.hour}</TableCell>
                      <TableCell className="text-right">{item.demand}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.revenue)}</TableCell>
                      <TableCell className="text-right">{item.score.toFixed(2)}</TableCell>
                      <TableCell>{item.recommendation}</TableCell>
                    </TableRow>
                  ))}
                {optimizationRows.every((item) => item.demand === 0 && item.revenue === 0) && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No optimization signal available for this filter.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>

      <div className="h-px bg-border" />

      <section className="space-y-6">
        <header>
          <h2 className="text-lg font-semibold">PATTERN & FORECAST</h2>
          <p className="text-sm text-muted-foreground">
            Combine historical revenue pattern, weekday-weekend split, and simple forecasting before action.
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Weekend Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(weekdayWeekend.weekendRevenue)}</div>
              <p className="text-xs text-muted-foreground">{weekdayWeekend.weekendTickets} tickets on weekends</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Weekday Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(weekdayWeekend.weekdayRevenue)}</div>
              <p className="text-xs text-muted-foreground">{weekdayWeekend.weekdayTickets} tickets on weekdays</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Next Forecast</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(forecastRevenue)}</div>
              <p className="text-xs text-muted-foreground">Simple moving-average forecast</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend & Forecast</CardTitle>
            <CardDescription>
              Revenue history filtered by the selected city and cinema.
            </CardDescription>
          </CardHeader>

          <CardContent className="h-[320px]">
            {trendWithForecast.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendWithForecast}>
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
                    tickFormatter={(value) => `Rp${Math.round(Number(value) / 1000000)}M`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      borderColor: "hsl(var(--border))",
                    }}
                    formatter={(value) => (value ? formatCurrency(Number(value)) : "-")}
                  />
                  <Line type="monotone" dataKey="actual" stroke="hsl(var(--primary))" strokeWidth={2} />
                  <Line type="monotone" dataKey="forecast" stroke="hsl(var(--chart-3))" strokeDasharray="4 4" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center">
                <p className="text-muted-foreground">No revenue history available for this filter.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <div className="h-px bg-border" />

      <section className="space-y-6">
        <header>
          <h2 className="text-lg font-semibold">PAYMENT & SPACE UTILIZATION</h2>
          <p className="text-sm text-muted-foreground">
            Measure how customers pay, how much margin each method leaves, and whether seats are monetized efficiently.
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Payment Preference</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {paymentPreference.map((item) => (
                <div key={item.paymentType}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium">{item.paymentType}</span>
                    <span className="text-muted-foreground">{item.usagePct.toFixed(1)}%</span>
                  </div>
                  <Progress value={item.usagePct} className="h-2 [&>div]:bg-green-500" />
                </div>
              ))}
              {paymentPreference.length === 0 && (
                <p className="text-sm text-muted-foreground">No payment preference data found.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Net Payment Profitability</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Method</TableHead>
                    <TableHead className="text-right">Success</TableHead>
                    <TableHead className="text-right">Admin Fee</TableHead>
                    <TableHead className="text-right">Net</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paymentProfitability.map((item) => (
                    <TableRow key={item.paymentType}>
                      <TableCell className="font-medium">{item.paymentType}</TableCell>
                      <TableCell className="text-right">{(item.successRate * 100).toFixed(0)}%</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.adminFee)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.netProfitability)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Space Utilization</CardTitle>
            <CardDescription>Compare revenue per seat and occupancy to spot wasted capacity.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cinema</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Revenue/Seat</TableHead>
                  <TableHead className="text-right">Occupancy</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {revenuePerCinema.map((cinema) => (
                  <TableRow key={cinema.cinemaId}>
                    <TableCell>
                      <div className="font-medium">{cinema.name}</div>
                      <div className="text-sm text-muted-foreground">{cinema.city}</div>
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(cinema.revenue)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(cinema.revenuePerSeat)}</TableCell>
                    <TableCell className="text-right">{cinema.occupancy.toFixed(1)}%</TableCell>
                  </TableRow>
                ))}
                {revenuePerCinema.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      No space utilization data for this filter.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>

      <div className="h-px bg-border" />

      {/* 7. Problematic Shows */}
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
              <Clock className="h-4 w-4 text-amber-500" />
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
                {sortedSchedules.slice(0, 10).map((schedule) => (
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

                {sortedSchedules.length === 0 && (
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
