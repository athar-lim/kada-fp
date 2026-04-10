'use client';

import { useEffect, useMemo, useState } from "react";
import { DateRange } from "react-day-picker";
import { format, startOfDay, endOfDay } from "date-fns";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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
  ResponsiveContainer,
  Tooltip,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  ArrowUp,
  Ticket,
  DollarSign,
  Building2,
  Percent,
  ShieldAlert,
  CircleCheck,
  Info,
  WifiOff,
  Activity,
  Clock3,
  RefreshCw,
} from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DateRangeFilter } from "@/components/filters/date-range-filter";
import IndonesiaFranchiseMap from "@/components/maps/indonesia-franchise-map";
import { DashboardMetrics, getDashboardMetrics } from "@/lib/cinetrack-api";

type NodeStatus = "ACTIVE" | "MAINTENANCE" | "OFFLINE";

const cinemaNetwork = [
  {
    id: "C001",
    name: "CGV West Jakarta",
    cityId: "jakarta",
    cityLabel: "Jakarta",
    baseTickets: 1284,
    baseOccupancy: 82,
    avgPrice: 51000,
    coordinates: [106.801, -6.176] as [number, number],
  },
  {
    id: "C002",
    name: "XXI Surabaya Plaza",
    cityId: "surabaya",
    cityLabel: "Surabaya",
    baseTickets: 980,
    baseOccupancy: 75,
    avgPrice: 50000,
    coordinates: [112.738, -7.257] as [number, number],
  },
  {
    id: "C003",
    name: "Cinemaxx Bandung",
    cityId: "bandung",
    cityLabel: "Bandung",
    baseTickets: 870,
    baseOccupancy: 70,
    avgPrice: 48500,
    coordinates: [107.619, -6.917] as [number, number],
  },
  {
    id: "C004",
    name: "XXI Medan Center",
    cityId: "medan",
    cityLabel: "Medan",
    baseTickets: 760,
    baseOccupancy: 67,
    avgPrice: 47500,
    coordinates: [98.672, 3.595] as [number, number],
  },
  {
    id: "C005",
    name: "CGV Semarang",
    cityId: "semarang",
    cityLabel: "Semarang",
    baseTickets: 382,
    baseOccupancy: 38,
    avgPrice: 46000,
    coordinates: [110.421, -6.991] as [number, number],
  },
  {
    id: "C006",
    name: "CGV Makassar",
    cityId: "makassar",
    cityLabel: "Makassar",
    baseTickets: 540,
    baseOccupancy: 61,
    avgPrice: 47000,
    coordinates: [119.432, -5.147] as [number, number],
  },
  {
    id: "C007",
    name: "XXI Balikpapan",
    cityId: "balikpapan",
    cityLabel: "Balikpapan",
    baseTickets: 420,
    baseOccupancy: 58,
    avgPrice: 46500,
    coordinates: [116.852, -1.265] as [number, number],
  },
  {
    id: "C008",
    name: "Cinemaxx Palembang",
    cityId: "palembang",
    cityLabel: "Palembang",
    baseTickets: 0,
    baseOccupancy: 0,
    avgPrice: 0,
    coordinates: [104.756, -2.991] as [number, number],
  },
];

const cityOptions = [
  { id: "all", name: "All Cities" },
  ...cinemaNetwork
    .map((item) => ({ id: item.cityId, name: item.cityLabel }))
    .filter(
      (value, index, array) =>
        array.findIndex((item) => item.id === value.id) === index
    ),
];

const dailyMultipliers = [0.82, 0.9, 0.96, 1.02, 1.1, 1.18];
const javaCityIds = new Set(["jakarta", "surabaya", "bandung", "semarang"]);

const filmCatalog = [
  { title: "Dune: Part Three", baseWeight: 0.22, avgPrice: 52000 },
  { title: "Nusantara Chronicles", baseWeight: 0.18, avgPrice: 50500 },
  { title: "Avatar 3", baseWeight: 0.15, avgPrice: 53000 },
  { title: "Grave Torture 2", baseWeight: 0.13, avgPrice: 49000 },
  { title: "Iron Man: Legacy", baseWeight: 0.1, avgPrice: 50000 },
  { title: "Moana 2", baseWeight: 0.09, avgPrice: 47000 },
  { title: "Deadpool & Wolverine", baseWeight: 0.08, avgPrice: 53500 },
  { title: "Inside Out 2", baseWeight: 0.05, avgPrice: 45500 },
];

const notificationsData = [
  {
    type: "WARNING",
    title: "Low Occupancy — Semarang",
    description: "CGV Semarang dropped below the 40% threshold.",
    time: "01:42 WIB",
    colorClass: "bg-amber-500",
    read: false,
    iconType: "warning",
    cityId: "semarang",
    cinemaId: "C005",
    date: new Date(2026, 2, 28, 9, 0, 0, 0),
  },
  {
    type: "ALERT",
    title: "Node Offline — Palembang",
    description: "CineTrack has not responded since 08:15 WIB.",
    time: "06:17 WIB",
    colorClass: "bg-red-500",
    read: false,
    iconType: "offline",
    cityId: "palembang",
    cinemaId: "C008",
    date: new Date(2026, 2, 29, 8, 15, 0, 0),
  },
  {
    type: "SUCCESS",
    title: "New Record — West Jakarta",
    description: "Highest single-day sales across the franchise network.",
    time: "01:53 WIB",
    colorClass: "bg-green-500",
    read: false,
    iconType: "success",
    cityId: "jakarta",
    cinemaId: "C001",
    date: new Date(2026, 2, 29, 21, 0, 0, 0),
  },
  {
    type: "INFO",
    title: "Release Tomorrow — Nusantara Rising",
    description: "High demand is projected; all studios are fully activated.",
    time: "Yesterday 18:00",
    colorClass: "bg-blue-500",
    read: false,
    iconType: "info",
    cityId: "surabaya",
    cinemaId: "C002",
    date: new Date(2026, 2, 28, 18, 0, 0, 0),
  },
  {
    type: "INFO",
    title: "Monthly Report Ready",
    description: "The February 2026 report has been generated and is ready to download.",
    time: "00:35 WIB",
    colorClass: "bg-blue-500",
    read: true,
    iconType: "info",
    cityId: "jakarta",
    cinemaId: "C001",
    date: new Date(2026, 2, 27, 10, 0, 0, 0),
  },
];

const seededRandom = (seed: number) => {
  const x = Math.sin(seed * 9999.91) * 10000;
  return x - Math.floor(x);
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);

const formatCompactCurrency = (value: number) => {
  if (value >= 1_000_000_000) return `Rp ${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `Rp ${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `Rp ${(value / 1_000).toFixed(0)}K`;
  return formatCurrency(value);
};

const calculateTrend = (values: number[]) => {
  if (values.length < 2) return null;

  const first = values[0];
  const last = values[values.length - 1];

  if (first === 0 && last === 0) return "0.0%";
  if (first === 0) return "+100.0%";

  const diff = ((last - first) / first) * 100;
  const sign = diff >= 0 ? "+" : "";
  return `${sign}${diff.toFixed(1)}%`;
};

const isDateInRange = (
  date: Date,
  range: { from: Date; to: Date } | null
) => {
  if (!range) return true;
  return date >= range.from && date <= range.to;
};

const getNotificationIcon = (type: string) => {
  if (type === "warning") return <ShieldAlert className="h-5 w-5 text-amber-400" />;
  if (type === "offline") return <WifiOff className="h-5 w-5 text-red-500" />;
  if (type === "success") return <CircleCheck className="h-5 w-5 text-green-500" />;
  return <Info className="h-5 w-5 text-blue-500" />;
};

const franchiseDailyData = cinemaNetwork.flatMap((cinema, cinemaIndex) => {
  return dailyMultipliers.map((multiplier, dayIndex) => {
    const date = new Date(2026, 2, 24 + dayIndex, 12, 0, 0, 0);
    const seed = cinemaIndex * 100 + dayIndex;
    const occupancyShift = Math.round((seededRandom(seed + 1) - 0.5) * 10);
    const ticketShift = 0.92 + seededRandom(seed + 2) * 0.16;

    let status: NodeStatus = "ACTIVE";

    if (cinema.id === "C008") {
      status = "OFFLINE";
    } else if (cinema.id === "C007" && dayIndex === 2) {
      status = "MAINTENANCE";
    }

    const tickets =
      status === "OFFLINE"
        ? 0
        : Math.round(cinema.baseTickets * multiplier * ticketShift);

    const occupancy =
      status === "OFFLINE"
        ? 0
        : Math.max(
            0,
            Math.min(98, cinema.baseOccupancy + occupancyShift + dayIndex * 2)
          );

    const revenue = status === "OFFLINE" ? 0 : Math.round(tickets * cinema.avgPrice);

    return {
      cinemaId: cinema.id,
      cinemaName: cinema.name,
      cityId: cinema.cityId,
      cityLabel: cinema.cityLabel,
      coordinates: cinema.coordinates,
      date,
      tickets,
      revenue,
      occupancy,
      status,
    };
  });
});

const filmPerformanceData = franchiseDailyData.flatMap((row, rowIndex) => {
  if (row.status === "OFFLINE" || row.tickets === 0) return [];

  const rawWeights = filmCatalog.map((film, filmIndex) => {
    const modifier = 1 + (seededRandom(rowIndex * 10 + filmIndex) - 0.5) * 0.18;
    return film.baseWeight * modifier;
  });

  const totalWeight = rawWeights.reduce((acc, value) => acc + value, 0);

  return filmCatalog.map((film, filmIndex) => {
    const allocatedTickets = Math.round(
      (row.tickets * rawWeights[filmIndex]) / totalWeight
    );

    const dateTime = new Date(row.date);
    dateTime.setHours(
      10 + ((filmIndex * 2 + rowIndex) % 12),
      filmIndex % 2 === 0 ? 15 : 45,
      0,
      0
    );

    return {
      title: film.title,
      cinemaId: row.cinemaId,
      cinemaName: row.cinemaName,
      cityId: row.cityId,
      cityLabel: row.cityLabel,
      date: row.date,
      dateTime,
      tickets: allocatedTickets,
      revenue: allocatedTickets * film.avgPrice,
    };
  });
});

const transactionFeedData = filmPerformanceData
  .filter((item) => item.tickets > 0)
  .map((item, index) => ({
    cityId: item.cityId,
    cityLabel: item.cityLabel,
    cinemaId: item.cinemaId,
    cinemaName: item.cinemaName,
    film: item.title,
    tickets: Math.max(1, Math.min(4, Math.round(item.tickets / 120))),
    time: format(item.dateTime, "HH:mm"),
    date: item.date,
    dateTime: item.dateTime,
    sortKey: item.dateTime.getTime() + index,
  }));

export default function DashboardPage() {
  const [selectedCity, setSelectedCity] = useState("all");
  const [selectedCinema, setSelectedCinema] = useState("all");
  const [selectedFranchiseTab, setSelectedFranchiseTab] = useState("all");
  const [apiMetrics, setApiMetrics] = useState<DashboardMetrics | null>(null);
  const [apiMetricsError, setApiMetricsError] = useState(false);
  const [selectedDateRange, setSelectedDateRange] = useState<DateRange | undefined>({
    from: new Date(2026, 2, 24),
    to: new Date(2026, 2, 29),
  });

  useEffect(() => {
    let cancelled = false;

    // Effect ini mengambil ringkasan metrik live dari backend saat filter berubah.
    // State lama dipertahankan sampai request baru selesai agar UI tetap stabil.
    const loadMetrics = async () => {
      try {
        const metrics = await getDashboardMetrics({
          cityId: selectedCity,
          cinemaId: selectedCinema,
        });

        if (cancelled) return;
        setApiMetrics(metrics);
        setApiMetricsError(false);
      } catch {
        if (cancelled) return;
        setApiMetricsError(true);
      }
    };

    loadMetrics();

    return () => {
      cancelled = true;
    };
  }, [selectedCity, selectedCinema]);

  const visibleCinemaOptions = useMemo(() => {
    const filteredCinemas = cinemaNetwork.filter((cinema) => {
      if (selectedCity === "all") return true;
      return cinema.cityId === selectedCity;
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

  const filteredFranchiseRows = useMemo(() => {
    return franchiseDailyData.filter((row) => {
      const matchCity = selectedCity === "all" ? true : row.cityId === selectedCity;
      const matchCinema = selectedCinema === "all" ? true : row.cinemaId === selectedCinema;

      return matchCity && matchCinema && isDateInRange(row.date, appliedRange);
    });
  }, [selectedCity, selectedCinema, appliedRange]);

  const filteredFilmRows = useMemo(() => {
    return filmPerformanceData.filter((row) => {
      const matchCity = selectedCity === "all" ? true : row.cityId === selectedCity;
      const matchCinema = selectedCinema === "all" ? true : row.cinemaId === selectedCinema;

      return matchCity && matchCinema && isDateInRange(row.date, appliedRange);
    });
  }, [selectedCity, selectedCinema, appliedRange]);

  const filteredTransactionFeed = useMemo(() => {
    return transactionFeedData
      .filter((row) => {
        const matchCity = selectedCity === "all" ? true : row.cityId === selectedCity;
        const matchCinema = selectedCinema === "all" ? true : row.cinemaId === selectedCinema;

        return matchCity && matchCinema && isDateInRange(row.date, appliedRange);
      })
      .sort((a, b) => b.sortKey - a.sortKey);
  }, [selectedCity, selectedCinema, appliedRange]);

  const filteredNotifications = useMemo(() => {
    return notificationsData.filter((row) => {
      const matchCity = selectedCity === "all" ? true : row.cityId === selectedCity;
      const matchCinema = selectedCinema === "all" ? true : row.cinemaId === selectedCinema;

      return matchCity && matchCinema && isDateInRange(row.date, appliedRange);
    });
  }, [selectedCity, selectedCinema, appliedRange]);

  const periodLabel = selectedDateRange?.from
    ? `${format(selectedDateRange.from, "MMM dd, yyyy")} - ${format(
        selectedDateRange.to ?? selectedDateRange.from,
        "MMM dd, yyyy"
      )}`
    : "All Time";

  const effectiveRange = useMemo(() => {
    if (appliedRange) return appliedRange;
    if (filteredFranchiseRows.length === 0) return null;

    const sorted = [...filteredFranchiseRows].sort(
      (a, b) => a.date.getTime() - b.date.getTime()
    );

    return {
      from: startOfDay(sorted[0].date),
      to: endOfDay(sorted[sorted.length - 1].date),
    };
  }, [appliedRange, filteredFranchiseRows]);

  const dailySummary = useMemo(() => {
    if (!effectiveRange) return [];

    const dayCount =
      Math.max(
        1,
        Math.floor(
          (effectiveRange.to.getTime() - effectiveRange.from.getTime()) /
            (1000 * 60 * 60 * 24)
        ) + 1
      );

    return Array.from({ length: dayCount }).map((_, index) => {
      const current = new Date(effectiveRange.from);
      current.setDate(effectiveRange.from.getDate() + index);

      const rows = filteredFranchiseRows.filter((row) => {
        return (
          row.date.getFullYear() === current.getFullYear() &&
          row.date.getMonth() === current.getMonth() &&
          row.date.getDate() === current.getDate()
        );
      });

      const activeCount = new Set(
        rows.filter((row) => row.status === "ACTIVE").map((row) => row.cinemaId)
      ).size;

      const occupancy =
        rows.length > 0
          ? rows.reduce((acc, row) => acc + row.occupancy, 0) / rows.length
          : 0;

      return {
        name: format(current, "MMM dd"),
        tickets: rows.reduce((acc, row) => acc + row.tickets, 0),
        revenue: rows.reduce((acc, row) => acc + row.revenue, 0),
        active: activeCount,
        occupancy: Number(occupancy.toFixed(1)),
      };
    });
  }, [filteredFranchiseRows, effectiveRange]);

  const totalTickets = filteredFranchiseRows.reduce((acc, row) => acc + row.tickets, 0);
  const totalRevenue = filteredFranchiseRows.reduce((acc, row) => acc + row.revenue, 0);

  const latestByCinema = Object.values(
    filteredFranchiseRows.reduce<Record<string, (typeof filteredFranchiseRows)[number]>>(
      (acc, row) => {
        if (!acc[row.cinemaId] || acc[row.cinemaId].date < row.date) {
          acc[row.cinemaId] = row;
        }
        return acc;
      },
      {}
    )
  );

  const activeFranchiseCount = latestByCinema.filter(
    (row) => row.status === "ACTIVE"
  ).length;
  const nonActiveFranchiseCount = latestByCinema.filter(
    (row) => row.status !== "ACTIVE"
  ).length;
  const maintenanceCount = latestByCinema.filter(
    (row) => row.status === "MAINTENANCE"
  ).length;
  const totalVisibleFranchise = latestByCinema.length;

  const avgOccupancy =
    filteredFranchiseRows.length > 0
      ? filteredFranchiseRows.reduce((acc, row) => acc + row.occupancy, 0) /
        filteredFranchiseRows.length
      : 0;

  const metricCardsData = [
    {
      title: "Total Tickets Sold",
      value: (apiMetrics?.totalTickets ?? totalTickets).toLocaleString("en-US"),
      trend: apiMetrics ? null : calculateTrend(dailySummary.map((item) => item.tickets)),
      trendLabel: apiMetrics ? null : "vs start of period",
      subtitle: apiMetrics
        ? "Live API snapshot. Date filter is not supported yet."
        : apiMetricsError
        ? "API unavailable. Showing local fallback."
        : "Across the selected period",
      chartData:
        apiMetrics?.ticketsChart ??
        dailySummary.map((item) => ({ name: item.name, value: item.tickets })),
      stroke: "hsl(var(--chart-1))",
      icon: <Ticket className="h-4 w-4 text-muted-foreground" />,
    },
    {
      title: "Period Revenue",
      value: formatCompactCurrency(apiMetrics?.totalRevenue ?? totalRevenue),
      trend: apiMetrics ? null : calculateTrend(dailySummary.map((item) => item.revenue)),
      trendLabel: apiMetrics ? null : "vs start of period",
      subtitle: apiMetrics
        ? "Gross ticket revenue from the live backend."
        : apiMetricsError
        ? "API unavailable. Showing local fallback."
        : "Gross ticket revenue",
      chartData:
        apiMetrics?.revenueChart ??
        dailySummary.map((item) => ({ name: item.name, value: item.revenue })),
      stroke: "hsl(var(--chart-2))",
      icon: <DollarSign className="h-4 w-4 text-muted-foreground" />,
    },
    {
      title: "Active Franchises",
      value: `${apiMetrics?.activeCinemas ?? activeFranchiseCount} / ${
        apiMetrics?.totalCinemas ?? totalVisibleFranchise
      }`,
      trend: null,
      trendLabel: null,
      subtitle: apiMetrics
        ? `${apiMetrics.inactiveCinemas} inactive in the current API filter`
        : apiMetricsError
        ? "API unavailable. Showing local fallback."
        : `${maintenanceCount} under maintenance`,
      chartData:
        apiMetrics?.activeChart ??
        dailySummary.map((item) => ({ name: item.name, value: item.active })),
      stroke: "hsl(var(--chart-3))",
      icon: <Building2 className="h-4 w-4 text-muted-foreground" />,
    },
    {
      title: "Average Occupancy",
      value:
        apiMetrics && apiMetrics.averageOccupancy === null
          ? "N/A"
          : `${(apiMetrics?.averageOccupancy ?? avgOccupancy).toFixed(1)}%`,
      trend:
        apiMetrics && apiMetrics.averageOccupancy === null
          ? null
          : apiMetrics
          ? null
          : calculateTrend(dailySummary.map((item) => item.occupancy)),
      trendLabel: apiMetrics ? null : "vs start of period",
      subtitle: apiMetrics
        ? "Occupancy is not exposed by the API yet."
        : apiMetricsError
        ? "API unavailable. Showing local fallback."
        : "Network-wide average",
      chartData:
        apiMetrics?.occupancyChart ??
        dailySummary.map((item) => ({ name: item.name, value: item.occupancy })),
      stroke: "hsl(var(--chart-4))",
      icon: <Percent className="h-4 w-4 text-muted-foreground" />,
    },
  ];

  const occupancyScale = avgOccupancy > 0 ? avgOccupancy / 73.2 : 0;
  const baseHourlyCurve = [12, 15, 35, 60, 75, 95, 90, 20];
  const hourlyLabels = ["00", "04", "08", "12", "16", "19", "21", "24"];

  const hourlyOccupancyData = hourlyLabels.map((hour, index) => ({
    hour,
    occupancy: Number(
      Math.min(100, Math.max(0, baseHourlyCurve[index] * occupancyScale)).toFixed(1)
    ),
  }));

  const franchiseSummary = Object.values(
    filteredFranchiseRows.reduce<
      Record<
        string,
        {
          name: string;
          city: string;
          cityId: string;
          tickets: number;
          occupancySum: number;
          count: number;
          status: NodeStatus;
        }
      >
    >((acc, row) => {
      if (!acc[row.cinemaId]) {
        acc[row.cinemaId] = {
          name: row.cinemaName,
          city: row.cityLabel,
          cityId: row.cityId,
          tickets: 0,
          occupancySum: 0,
          count: 0,
          status: row.status,
        };
      }

      acc[row.cinemaId].tickets += row.tickets;
      acc[row.cinemaId].occupancySum += row.occupancy;
      acc[row.cinemaId].count += 1;
      acc[row.cinemaId].status = row.status;

      return acc;
    }, {})
  )
    .map((item) => ({
      ...item,
      occupancy: item.count > 0 ? Math.round(item.occupancySum / item.count) : 0,
    }))
    .sort((a, b) => b.tickets - a.tickets);

  const visibleFranchiseSummary = useMemo(() => {
    if (selectedFranchiseTab === "active") {
      return franchiseSummary.filter((item) => item.status === "ACTIVE");
    }

    if (selectedFranchiseTab === "java") {
      return franchiseSummary.filter((item) => javaCityIds.has(item.cityId));
    }

    return franchiseSummary;
  }, [franchiseSummary, selectedFranchiseTab]);

  const topFilmsData = Object.values(
    filteredFilmRows.reduce<
      Record<
        string,
        {
          title: string;
          tickets: number;
          revenue: number;
        }
      >
    >((acc, row) => {
      if (!acc[row.title]) {
        acc[row.title] = {
          title: row.title,
          tickets: 0,
          revenue: 0,
        };
      }

      acc[row.title].tickets += row.tickets;
      acc[row.title].revenue += row.revenue;
      return acc;
    }, {})
  )
    .sort((a, b) => b.tickets - a.tickets)
    .slice(0, 5);

  const topFilmColors = [
    "bg-yellow-400",
    "bg-slate-400",
    "bg-amber-600",
    "bg-primary",
    "bg-primary/70",
  ];

  const mapSummary = Object.values(
    latestByCinema.reduce<
      Record<
        string,
        {
          name: string;
          totalNodes: number;
          activeNodes: number;
          nonActiveNodes: number;
          coordinates: [number, number];
          occupancySum: number;
          occupancyCount: number;
        }
      >
    >((acc, row) => {
      if (!acc[row.cityId]) {
        acc[row.cityId] = {
          name: row.cityLabel,
          totalNodes: 0,
          activeNodes: 0,
          nonActiveNodes: 0,
          coordinates: row.coordinates,
          occupancySum: 0,
          occupancyCount: 0,
        };
      }

      acc[row.cityId].totalNodes += 1;
      if (row.status === "ACTIVE") {
        acc[row.cityId].activeNodes += 1;
      } else {
        acc[row.cityId].nonActiveNodes += 1;
      }

      acc[row.cityId].occupancySum += row.occupancy;
      acc[row.cityId].occupancyCount += 1;

      return acc;
    }, {})
  ).map((item) => ({
    ...item,
    occupancy:
      item.occupancyCount > 0 ? item.occupancySum / item.occupancyCount : 0,
  }));

  const notificationActiveCount = filteredNotifications.filter(
    (item) => !item.read
  ).length;

  const pieData = topFilmsData.map((item) => ({
    name: item.title,
    value: item.tickets,
  }));

  const latestTransactionTime = filteredTransactionFeed[0]?.dateTime ?? null;

  const transactionsInLastHour = latestTransactionTime
    ? filteredTransactionFeed.filter(
        (row) =>
          latestTransactionTime.getTime() - row.dateTime.getTime() <= 60 * 60 * 1000
      )
    : [];

  const lastSystemUpdate = (() => {
    const timestamps = [
      ...filteredFranchiseRows.map((item) => item.date.getTime()),
      ...filteredNotifications.map((item) => item.date.getTime()),
      ...filteredTransactionFeed.map((item) => item.dateTime.getTime()),
    ];

    if (timestamps.length === 0) return null;
    return new Date(Math.max(...timestamps));
  })();

  const networkHealthLabel =
    activeFranchiseCount === 0
      ? "Down"
      : nonActiveFranchiseCount > 0
      ? "Degraded"
      : "Healthy";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard Analytics</h1>
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
                <SelectValue placeholder="Select city" />
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
                <SelectValue placeholder="Select cinema" />
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

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {metricCardsData.map((card, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              {card.icon}
            </CardHeader>

            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>

              {card.trend && (
                <p
                  className={`flex items-center text-xs ${
                    card.trend.startsWith("-") ? "text-red-400" : "text-green-400"
                  }`}
                >
                  <ArrowUp
                    className={`mr-1 h-3 w-3 ${
                      card.trend.startsWith("-") ? "rotate-180" : ""
                    }`}
                  />
                  {card.trend} {card.trendLabel}
                </p>
              )}

              {card.subtitle && (
                <p className="text-xs text-muted-foreground">{card.subtitle}</p>
              )}

              <div className="mt-4 h-[40px] min-w-0 -ml-6">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={card.chartData}>
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke={card.stroke}
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div>
        <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold">
          Notifications & Alerts
          <Badge className="border-red-500/30 bg-red-500/20 text-red-400">
            {notificationActiveCount} Active
          </Badge>
        </h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map((item, index) => (
              <Card
                key={index}
                className={`relative overflow-hidden ${item.read ? "opacity-60" : ""}`}
              >
                <div
                  className={`absolute left-0 top-0 bottom-0 w-1 ${item.colorClass}`}
                />
                <CardHeader className="pl-6">
                  <div className="flex items-start gap-3">
                    {getNotificationIcon(item.iconType)}
                    <div>
                      <CardTitle className="text-base">{item.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                    {!item.read && (
                      <div className="absolute top-3 right-3 h-2 w-2 rounded-full bg-green-400" />
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pl-6 pb-4">
                  <p className="text-xs text-muted-foreground">{item.time}</p>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="xl:col-span-5">
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                No notifications found for this filter.
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <IndonesiaFranchiseMap citySummary={mapSummary} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="min-w-0 lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Franchise Network</CardTitle>

              <Tabs
                value={selectedFranchiseTab}
                onValueChange={setSelectedFranchiseTab}
                className="w-full pt-2"
              >
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="active">Active</TabsTrigger>
                  <TabsTrigger value="java">Java</TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>

            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Franchise</TableHead>
                    <TableHead className="text-right">Tickets</TableHead>
                    <TableHead>Occupancy</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {visibleFranchiseSummary.length > 0 ? (
                    visibleFranchiseSummary.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <div className="font-medium">{item.name}</div>
                          <div className="text-sm text-muted-foreground">{item.city}</div>
                        </TableCell>

                        <TableCell className="text-right font-mono">
                          {item.tickets.toLocaleString("en-US")}
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="w-10 text-right font-medium">
                              {item.occupancy}%
                            </span>
                            <Progress
                              value={item.occupancy}
                              className={`h-2 [&>div]:bg-green-500 ${
                                item.occupancy < 40
                                  ? "[&>div]:bg-red-500"
                                  : item.occupancy < 70
                                  ? "[&>div]:bg-amber-500"
                                  : ""
                              }`}
                            />
                          </div>
                        </TableCell>

                        <TableCell>
                          <Badge
                            className={`${
                              item.status === "ACTIVE"
                                ? "border-green-500/30 bg-green-500/20 text-green-400"
                                : item.status === "MAINTENANCE"
                                ? "border-amber-500/30 bg-amber-500/20 text-amber-400"
                                : "border-red-500/30 bg-red-500/20 text-red-400"
                            }`}
                          >
                            {item.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-center text-muted-foreground"
                      >
                        No franchise data found for this filter.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <div className="min-w-0 space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Top Films</span>
                <Badge className="border-border bg-transparent text-foreground">
                  This Period
                </Badge>
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              {topFilmsData.length > 0 ? (
                topFilmsData.map((film, index) => (
                  <div key={film.title}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="font-semibold">
                        {index + 1}. {film.title}
                      </span>
                      <span className="text-muted-foreground">
                        {formatCompactCurrency(film.revenue)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div
                        className={`h-1.5 grow rounded-full ${
                          topFilmColors[index] ?? "bg-primary/70"
                        }`}
                      />
                      <span className="w-24 text-right font-mono text-xs text-muted-foreground">
                        {film.tickets.toLocaleString("en-US")} tickets
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No film performance data for this filter.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top Film Distribution</CardTitle>
              <CardDescription>
                Ticket share for the best-performing films.
              </CardDescription>
            </CardHeader>

            <CardContent className="h-[260px] min-w-0">
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      outerRadius={90}
                      label
                    >
                      {pieData.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            index === 0
                              ? "hsl(var(--chart-1))"
                              : index === 1
                              ? "hsl(var(--chart-2))"
                              : index === 2
                              ? "hsl(var(--chart-3))"
                              : index === 3
                              ? "hsl(var(--chart-4))"
                              : "hsl(var(--chart-5))"
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
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center">
                  <p className="text-sm text-muted-foreground">
                    No distribution data available.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Occupancy by Hour</CardTitle>
            <CardDescription>
              Average occupancy trend across the selected network scope.
            </CardDescription>
          </CardHeader>

          <CardContent className="h-[250px] min-w-0 pr-6">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyOccupancyData}>
                <defs>
                  <linearGradient id="occupancyGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="hsl(var(--chart-1))"
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor="hsl(var(--chart-1))"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>

                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    borderColor: "hsl(var(--border))",
                  }}
                  formatter={(value) => [`${value}%`, "Occupancy"]}
                />

                <Area
                  type="monotone"
                  dataKey="occupancy"
                  stroke="hsl(var(--chart-1))"
                  fill="url(#occupancyGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>

          <CardContent className="space-y-2">
            <div className="text-2xl font-bold">{activeFranchiseCount} Active</div>
            <p className="text-sm text-muted-foreground">
              {nonActiveFranchiseCount} non-active node
              {nonActiveFranchiseCount !== 1 ? "s" : ""}
            </p>

            <Badge
              className={`${
                networkHealthLabel === "Healthy"
                  ? "border-green-500/30 bg-green-500/20 text-green-400"
                  : networkHealthLabel === "Degraded"
                  ? "border-amber-500/30 bg-amber-500/20 text-amber-400"
                  : "border-red-500/30 bg-red-500/20 text-red-400"
              }`}
            >
              {networkHealthLabel}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Transactions in the Last Hour
            </CardTitle>
            <Clock3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>

          <CardContent className="space-y-2">
            <div className="text-2xl font-bold">
              {transactionsInLastHour.length.toLocaleString("en-US")}
            </div>
            <p className="text-sm text-muted-foreground">
              {transactionsInLastHour
                .reduce((acc, row) => acc + row.tickets, 0)
                .toLocaleString("en-US")}{" "}
              tickets processed
            </p>
            <p className="text-xs text-muted-foreground">
              {latestTransactionTime
                ? `Window ending ${format(latestTransactionTime, "MMM dd, yyyy · HH:mm")}`
                : "No recent transaction data"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last System Update</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>

          <CardContent className="space-y-2">
            <div className="text-2xl font-bold">
              {lastSystemUpdate
                ? format(lastSystemUpdate, "HH:mm")
                : "--:--"}
            </div>
            <p className="text-sm text-muted-foreground">
              {lastSystemUpdate
                ? format(lastSystemUpdate, "MMM dd, yyyy")
                : "No update data available"}
            </p>
            <p className="text-xs text-muted-foreground">
              Latest refresh within the current dashboard filter scope
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
