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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

export default function SalesAnalyticsPage() {
  const [selectedCity, setSelectedCity] = useState("all");
  const [selectedCinema, setSelectedCinema] = useState("all");
  const [selectedDateRange, setSelectedDateRange] = useState<DateRange | undefined>({
    from: new Date(2026, 2, 24),
    to: new Date(2026, 2, 29),
  });
  const [revenueView, setRevenueView] = useState<"yearly" | "quarterly" | "monthly">("yearly");
  const [selectedRevenueYear, setSelectedRevenueYear] = useState("2026");

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

  const availableRevenueYears = useMemo(() => {
    return [...new Set(filteredRevenueHistory.map((item) => item.year.toString()))].sort();
  }, [filteredRevenueHistory]);

  const yearlyRevenueData = useMemo(() => {
    return Object.entries(
      filteredRevenueHistory.reduce<Record<string, number>>((acc, item) => {
        acc[item.year] = (acc[item.year] || 0) + item.revenue;
        return acc;
      }, {})
    ).map(([year, revenue]) => ({ label: year, revenue }));
  }, [filteredRevenueHistory]);

  const quarterlyRevenueData = useMemo(() => {
    const targetYear = Number(selectedRevenueYear);

    const grouped = filteredRevenueHistory
      .filter((item) => item.year === targetYear)
      .reduce<Record<string, number>>((acc, item) => {
        acc[item.quarter] = (acc[item.quarter] || 0) + item.revenue;
        return acc;
      }, {});

    return ["Q1", "Q2", "Q3", "Q4"].map((quarter) => ({
      label: quarter,
      revenue: grouped[quarter] || 0,
    }));
  }, [filteredRevenueHistory, selectedRevenueYear]);

  const monthlyRevenueData = useMemo(() => {
    const targetYear = Number(selectedRevenueYear);

    const grouped = filteredRevenueHistory
      .filter((item) => item.year === targetYear)
      .reduce<Record<number, number>>((acc, item) => {
        acc[item.month] = (acc[item.month] || 0) + item.revenue;
        return acc;
      }, {});

    return Array.from({ length: 12 }).map((_, month) => ({
      label: format(new Date(targetYear, month, 1), "MMM"),
      revenue: grouped[month] || 0,
    }));
  }, [filteredRevenueHistory, selectedRevenueYear]);

  const revenueChartData =
    revenueView === "yearly"
      ? yearlyRevenueData
      : revenueView === "quarterly"
      ? quarterlyRevenueData
      : monthlyRevenueData;

  const revenueChartTitle =
    revenueView === "yearly"
      ? "Yearly Revenue"
      : revenueView === "quarterly"
      ? `Quarterly Revenue (${selectedRevenueYear})`
      : `Monthly Revenue (${selectedRevenueYear})`;

  const revenuePerFilm = movies
    .map((movie) => {
      const movieTickets = filteredTickets.filter((ticket) => ticket.movieId === movie.id);
      const revenue = movieTickets.reduce((acc, ticket) => acc + ticket.price, 0);
      return { name: movie.title, revenue };
    })
    .filter((item) => item.revenue > 0)
    .sort((a, b) => b.revenue - a.revenue);

  const occupancyPerCinema = cinemas
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
      const cinemaSchedules = filteredSchedules.filter(
        (schedule) => schedule.cinemaId === cinema.id && schedule.status !== 'Cancelled'
      );
      const totalCapacity = cinemaSchedules.reduce((acc, schedule) => acc + schedule.capacity, 0);
      const ticketsSold = filteredTickets.filter((ticket) => ticket.cinemaId === cinema.id).length;
      const occupancy = totalCapacity > 0 ? (ticketsSold / totalCapacity) * 100 : 0;

      return {
        name: cinema.name,
        city: cinema.city,
        occupancy,
      };
    })
    .sort((a, b) => b.occupancy - a.occupancy);

  const ticketsByHour = Array.from({ length: 24 }).map((_, hour) => {
    const label = `${hour.toString().padStart(2, "0")}:00`;
    const count = filteredTickets.filter((ticket) => ticket.purchaseTime.getHours() === hour).length;

    return {
      hour: label,
      tickets: count,
    };
  });

  const peakHoursRanked = [...ticketsByHour].sort((a, b) => b.tickets - a.tickets);
  const busiestHour = peakHoursRanked[0]?.hour ?? "-";
  const quietestHour = peakHoursRanked[peakHoursRanked.length - 1]?.hour ?? "-";

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

      {/* 3. Total Tickets Sold */}
      <section className="space-y-6">
        <header>
          <h2 className="text-lg font-semibold">TOTAL TICKETS SOLD</h2>
          <p className="text-sm text-muted-foreground">
            Daily trend and summary of ticket sales in the selected period.
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
              <Ticket className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalTicketsSold}</div>
            </CardContent>
          </Card>

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
              <CardTitle className="text-sm font-medium">Daily Average</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgTicketsPerDay.toFixed(0)} tickets/day</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Tickets Sold by Day</CardTitle>
            <CardDescription>Daily ticket movement across the selected screening period.</CardDescription>
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
                <p className="text-muted-foreground">No ticket sales data for this period.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <div className="h-px bg-border" />

      {/* 4. Annual Revenue */}
      <section className="space-y-6">
        <header>
          <h2 className="text-lg font-semibold">ANNUAL REVENUE</h2>
          <p className="text-sm text-muted-foreground">
            Revenue view can be switched between yearly, quarterly, and monthly.
          </p>
        </header>

        <Card>
          <CardHeader className="space-y-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle>{revenueChartTitle}</CardTitle>
                <CardDescription>
                  Revenue history filtered by the selected city and cinema.
                </CardDescription>
              </div>

              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <Tabs
                  value={revenueView}
                  onValueChange={(value) => setRevenueView(value as "yearly" | "quarterly" | "monthly")}
                  className="w-full md:w-auto"
                >
                  <TabsList>
                    <TabsTrigger value="yearly">Yearly</TabsTrigger>
                    <TabsTrigger value="quarterly">Quarterly</TabsTrigger>
                    <TabsTrigger value="monthly">Monthly</TabsTrigger>
                  </TabsList>
                </Tabs>

                {revenueView !== "yearly" && (
                  <div className="w-full md:w-40">
                    <Select value={selectedRevenueYear} onValueChange={setSelectedRevenueYear}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Year" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableRevenueYears.map((year) => (
                          <SelectItem key={year} value={year}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="h-[300px]">
            {revenueChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueChartData}>
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
                    cursor={{ fill: 'hsl(var(--secondary))' }}
                    formatter={(value) => formatCurrency(Number(value))}
                  />
                  <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                    {revenueChartData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          index === revenueChartData.length - 1
                            ? "hsl(var(--primary))"
                            : "hsl(var(--chart-5))"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
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

      {/* 5. Revenue & Occupancy */}
      <section className="space-y-6">
        <header>
          <h2 className="text-lg font-semibold">REVENUE & OCCUPANCY</h2>
          <p className="text-sm text-muted-foreground">
            Film revenue and cinema occupancy performance in the selected period.
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle>Revenue per Film</CardTitle>
              </CardHeader>
              <CardContent className="h-[350px]">
                {revenuePerFilm.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenuePerFilm.slice(0, 7)} layout="vertical">
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
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        width={140}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          borderColor: "hsl(var(--border))",
                        }}
                        cursor={{ fill: 'hsl(var(--secondary))' }}
                        formatter={(value) => formatCurrency(Number(value))}
                      />
                      <Bar
                        dataKey="revenue"
                        fill="hsl(var(--primary))"
                        radius={[0, 4, 4, 0]}
                        barSize={20}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-muted-foreground">No film revenue data found.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Occupancy per Cinema</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cinema</TableHead>
                      <TableHead className="text-right">Occupancy</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {occupancyPerCinema.map((cinema, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <div className="font-medium">{cinema.name}</div>
                          <div className="text-sm text-muted-foreground">{cinema.city}</div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <span className="w-12 text-right font-medium">
                              {cinema.occupancy.toFixed(1)}%
                            </span>
                            <Progress
                              value={cinema.occupancy}
                              className={`h-2 w-20 [&>div]:bg-green-500 ${
                                cinema.occupancy < 40
                                  ? '[&>div]:bg-red-500'
                                  : cinema.occupancy < 70
                                  ? '[&>div]:bg-amber-500'
                                  : ''
                              }`}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {occupancyPerCinema.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={2} className="text-center text-muted-foreground">
                          No cinema data available for this filter.
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

      {/* 6. Peak Hours */}
      <section className="space-y-6">
        <header>
          <h2 className="text-lg font-semibold">PEAK HOURS</h2>
          <p className="text-sm text-muted-foreground">
            Ticket sales distribution by purchase hour.
          </p>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>Tickets Sold by Hour</CardTitle>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ticketsByHour}>
                <XAxis
                  dataKey="hour"
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
                    borderColor: "hsl(var(--border))"
                  }}
                  cursor={{ fill: 'hsl(var(--secondary))' }}
                />
                <Bar dataKey="tickets" radius={[4, 4, 0, 0]}>
                  {ticketsByHour.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        peakHoursRanked.slice(0, 3).some((item) => item.hour === entry.hour)
                          ? "hsl(var(--primary))"
                          : "hsl(var(--chart-5))"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Busiest Hour</CardTitle>
              <Clock4 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{busiestHour}</div>
              <p className="text-xs text-muted-foreground">Highest ticket volume</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Quietest Hour</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{quietestHour}</div>
              <p className="text-xs text-muted-foreground">Lowest ticket volume</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Promotion Suggestion</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-base font-semibold">Promote around {quietestHour}</div>
              <p className="text-xs text-muted-foreground">
                Consider a targeted discount or flash offer to improve traffic.
              </p>
            </CardContent>
          </Card>
        </div>
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