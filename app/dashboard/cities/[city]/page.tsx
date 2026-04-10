"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ComponentType } from "react";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  DollarSign,
  Film,
  MapPinned,
  Ticket,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  getCinemaBreakdown,
  getDashboardSummary,
  getMovieStats,
  getOccupancyStats,
  getTopMovies,
  getTrendStats,
  type CinemaBreakdownResponse,
  type MovieStatsResponse,
  type OccupancyResponse,
  type SummaryResponse,
  type TopMovie,
  type TrendsResponse,
} from "@/lib/cinetrack-api";

type CityPayload = {
  summary: SummaryResponse | null;
  cinemas: CinemaBreakdownResponse | null;
  movieStats: MovieStatsResponse | null;
  topMovies: TopMovie[];
  trends: TrendsResponse | null;
  occupancy: OccupancyResponse | null;
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);

const formatPercent = (value: number) => `${value.toFixed(1)}%`;

const formatGrowth = (value: number) => {
  const formatted = `${Math.abs(value).toFixed(2)}%`;
  return value >= 0 ? `+${formatted}` : `-${formatted}`;
};

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle ? <p className="text-xs text-muted-foreground">{subtitle}</p> : null}
      </CardContent>
    </Card>
  );
}

export default function CityDetailPage() {
  const params = useParams<{ city: string }>();
  const city = decodeURIComponent(params.city);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<CityPayload>({
    summary: null,
    cinemas: null,
    movieStats: null,
    topMovies: [],
    trends: null,
    occupancy: null,
  });

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      setLoading(true);
      setError(null);

      const results = await Promise.allSettled([
        getDashboardSummary({ city }),
        getCinemaBreakdown({ city }),
        getMovieStats({ city }),
        getTopMovies({ city }),
        getTrendStats({ city }),
        getOccupancyStats({ city }),
      ]);

      if (cancelled) return;

      setData({
        summary: results[0].status === "fulfilled" ? results[0].value : null,
        cinemas: results[1].status === "fulfilled" ? results[1].value : null,
        movieStats: results[2].status === "fulfilled" ? results[2].value : null,
        topMovies: results[3].status === "fulfilled" ? results[3].value : [],
        trends: results[4].status === "fulfilled" ? results[4].value : null,
        occupancy: results[5].status === "fulfilled" ? results[5].value : null,
      });

      const rejected = results.find((result) => result.status === "rejected");
      if (rejected?.status === "rejected") {
        setError(rejected.reason instanceof Error ? rejected.reason.message : "Gagal memuat data kota.");
      }

      setLoading(false);
    };

    loadData();

    return () => {
      cancelled = true;
    };
  }, [city]);

  const salesChartData = useMemo(
    () =>
      data.trends?.breakdown.map((item) => ({
        label: item.time_group,
        tickets: item.tickets_sold,
        revenue: item.revenue,
      })) ?? [],
    [data.trends]
  );

  const occupancyChartData = useMemo(
    () =>
      data.occupancy?.breakdown.map((item) => ({
        label: item.time_group.split(" ").at(-1) ?? item.time_group,
        occupancy: Number(item.avg_occupancy.toFixed(2)),
      })) ?? [],
    [data.occupancy]
  );

  const cinemaRows = data.cinemas?.breakdown ?? [];
  const topMovies = data.topMovies.slice(0, 10);
  const growth = data.summary?.data.growth;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-4">
          <Link href="/dashboard">
            <Button variant="outline" size="icon" className="rounded-2xl">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>

          <div>
            <h1 className="text-2xl font-bold text-foreground">Ringkasan Kinerja: {city}</h1>
            <p className="text-muted-foreground">
              Menampilkan data performa terperinci untuk kota yang dipilih.
            </p>
          </div>
        </div>

        {error ? (
          <Card className="border-amber-300 bg-amber-50">
            <CardContent className="py-4 text-sm text-amber-700">{error}</CardContent>
          </Card>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value={data.summary ? formatCurrency(data.summary.data.revenue) : "--"}
          subtitle={growth?.revenue !== undefined ? `${formatGrowth(growth.revenue)} vs previous period` : undefined}
          icon={DollarSign}
        />
        <StatCard
          title="Tiket Terjual"
          value={data.summary ? data.summary.data.total_tickets.toLocaleString("id-ID") : "--"}
          subtitle={growth?.tickets !== undefined ? `${formatGrowth(growth.tickets)} vs previous period` : undefined}
          icon={Ticket}
        />
        <StatCard
          title="Rata-rata Okupansi"
          value={data.summary ? formatPercent(data.summary.data.occupancy) : "--"}
          subtitle={
            growth?.avg_occupancy !== undefined
              ? `${formatGrowth(growth.avg_occupancy)} vs previous period`
              : undefined
          }
          icon={Users}
        />
        <StatCard
          title="Jumlah Bioskop"
          value={data.cinemas ? String(data.cinemas.summary.total_cinemas) : "--"}
          subtitle="Bioskop yang terdaftar di kota ini"
          icon={Building2}
        />
      </div>

      <Tabs defaultValue="cinema" className="space-y-6">
        <TabsList className="h-auto flex-wrap rounded-2xl bg-muted/60 p-2">
          <TabsTrigger value="cinema" className="gap-2 rounded-xl px-4 py-2">
            <Building2 className="h-4 w-4" />
            Performa Bioskop
          </TabsTrigger>
          <TabsTrigger value="film" className="gap-2 rounded-xl px-4 py-2">
            <Film className="h-4 w-4" />
            Performa Film
          </TabsTrigger>
          <TabsTrigger value="sales" className="gap-2 rounded-xl px-4 py-2">
            <TrendingUp className="h-4 w-4" />
            Data Penjualan
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cinema" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Daftar Bioskop</CardTitle>
              <CardDescription>Ringkasan performa seluruh bioskop di {city}.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bioskop</TableHead>
                    <TableHead>Kota</TableHead>
                    <TableHead className="text-right">Tiket</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead className="text-right">Film Aktif</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cinemaRows.length > 0 ? (
                    cinemaRows.map((cinema) => (
                      <TableRow key={cinema.cinema_id}>
                        <TableCell>
                          <div className="font-medium">{cinema.cinema_name}</div>
                          <div className="text-xs text-muted-foreground">{cinema.address}</div>
                        </TableCell>
                        <TableCell>{cinema.city}</TableCell>
                        <TableCell className="text-right">
                          {cinema.metrics.total_tickets.toLocaleString("id-ID")}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(cinema.metrics.total_revenue)}
                        </TableCell>
                        <TableCell className="text-right">{cinema.metrics.active_movies}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        {loading ? "Loading..." : "Belum ada data bioskop untuk kota ini."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="film" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-5">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Highlight Film</CardTitle>
                <CardDescription>Ringkasan film teratas untuk kota {city}.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-2xl border border-border bg-muted/20 p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Top Movie</p>
                  <p className="mt-2 text-lg font-semibold">
                    {data.movieStats?.summary.top_movie.title ?? "--"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {data.movieStats?.summary.top_movie.tickets_sold?.toLocaleString("id-ID") ?? "--"} tiket
                  </p>
                </div>
                <div className="rounded-2xl border border-border bg-muted/20 p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Top Genre</p>
                  <p className="mt-2 text-lg font-semibold">
                    {data.movieStats?.summary.top_genre.genre ?? "--"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {data.movieStats?.summary.top_genre.tickets_sold?.toLocaleString("id-ID") ?? "--"} tiket
                  </p>
                </div>
                <div className="rounded-2xl border border-border bg-muted/20 p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Rating Breakdown</p>
                  <div className="mt-3 space-y-3">
                    {data.movieStats?.breakdown_rating_usia.map((item) => (
                      <div key={item.rating_usia} className="flex items-center justify-between gap-3 text-sm">
                        <Badge variant="outline">{item.rating_usia}</Badge>
                        <span className="text-muted-foreground">
                          {item.total_tickets_sold.toLocaleString("id-ID")} tiket
                        </span>
                      </div>
                    )) ?? <p className="text-sm text-muted-foreground">Belum ada data rating.</p>}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>Top Film di {city}</CardTitle>
                <CardDescription>Film terlaris berdasarkan total tiket dan revenue.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Film</TableHead>
                      <TableHead>Genre</TableHead>
                      <TableHead className="text-right">Tiket</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topMovies.length > 0 ? (
                      topMovies.map((movie) => (
                        <TableRow key={movie.movie_id}>
                          <TableCell>
                            <div className="font-medium">{movie.title}</div>
                            <div className="text-xs text-muted-foreground">{movie.rating_usia}</div>
                          </TableCell>
                          <TableCell>{movie.genre[0] ?? "-"}</TableCell>
                          <TableCell className="text-right">
                            {movie.tickets_sold.toLocaleString("id-ID")}
                          </TableCell>
                          <TableCell className="text-right">{formatCurrency(movie.revenue)}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground">
                          {loading ? "Loading..." : "Belum ada data film untuk kota ini."}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sales" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Tren Penjualan</CardTitle>
                <CardDescription>Total tiket per jam di {city}.</CardDescription>
              </CardHeader>
              <CardContent className="h-[320px]">
                {salesChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={salesChartData}>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" />
                      <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
                      <YAxis tickLine={false} axisLine={false} fontSize={12} />
                      <Tooltip />
                      <Bar dataKey="tickets" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                    {loading ? "Loading..." : "Belum ada data penjualan."}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Okupansi per Jam</CardTitle>
                <CardDescription>Pergerakan okupansi kota {city} pada periode aktif.</CardDescription>
              </CardHeader>
              <CardContent className="h-[320px]">
                {occupancyChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={occupancyChartData}>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" />
                      <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
                      <YAxis tickLine={false} axisLine={false} fontSize={12} />
                      <Tooltip formatter={(value) => [`${value}%`, "Okupansi"]} />
                      <Line
                        type="monotone"
                        dataKey="occupancy"
                        stroke="hsl(var(--primary))"
                        strokeWidth={3}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                    {loading ? "Loading..." : "Belum ada data okupansi."}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Snapshot Kota</CardTitle>
              <CardDescription>Informasi cepat untuk analisis penjualan dan distribusi node.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-border bg-muted/20 p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPinned className="h-4 w-4" />
                  Kota Aktif
                </div>
                <p className="mt-2 text-xl font-semibold">{city}</p>
              </div>
              <div className="rounded-2xl border border-border bg-muted/20 p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Building2 className="h-4 w-4" />
                  Bioskop Aktif
                </div>
                <p className="mt-2 text-xl font-semibold">
                  {data.cinemas?.summary.active_cinemas ?? 0}
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-muted/20 p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Ticket className="h-4 w-4" />
                  Total Transaksi
                </div>
                <p className="mt-2 text-xl font-semibold">
                  {data.summary?.data.total_transactions?.toLocaleString("id-ID") ?? "--"}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
