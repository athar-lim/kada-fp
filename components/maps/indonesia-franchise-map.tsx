"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { DashboardQuery } from "@/lib/cinetrack-api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type LeafletMap = import("leaflet").Map;

type CitySummaryItem = {
  name: string;
  totalNodes: number;
  activeNodes: number;
  nonActiveNodes: number;
  coordinates: [number, number]; // [lng, lat]
  occupancy: number;
  totalTickets: number;
  revenue: number;
};

const formatCompactCurrency = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    notation: "compact",
    compactDisplay: "short",
    maximumFractionDigits: 1,
  }).format(value);

export default function IndonesiaFranchiseMap({
  citySummary,
  query,
}: {
  citySummary: CitySummaryItem[];
  query?: Pick<DashboardQuery, "start_date" | "end_date">;
}) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);

  useEffect(() => {
    let cancelled = false;

    const initializeMap = async () => {
      const L = await import("leaflet");

      if (cancelled || !containerRef.current) return;

      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }

      const map = L.map(containerRef.current, {
        zoomControl: true,
        scrollWheelZoom: false,
      }).setView([-2.5, 118], 5);

      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(map);

      citySummary.forEach((city) => {
        const color =
          city.occupancy >= 70
            ? "#22c55e"
            : city.occupancy >= 30
            ? "#f59e0b"
            : "#ef4444";

        const radius = Math.max(8, Math.min(16, 8 + city.totalNodes * 2));
        const [lng, lat] = city.coordinates;

        L.circleMarker([lat, lng], {
          radius,
          fillColor: color,
          color: "#ffffff",
          weight: 2,
          opacity: 1,
          fillOpacity: 0.85,
        })
          .addTo(map)
          .bindTooltip(`
            <div style="min-width: 220px; padding: 4px 2px;">
              <div style="font-size: 14px; font-weight: 700; margin-bottom: 8px;">${city.name}</div>
              <div style="display: grid; gap: 4px; font-size: 12px; line-height: 1.4;">
                <div><span style="color:#71717a;">Active Franchise:</span> <strong>${city.activeNodes}/${city.totalNodes}</strong></div>
                <div><span style="color:#71717a;">Total Tickets:</span> <strong>${city.totalTickets.toLocaleString("id-ID")}</strong></div>
                <div><span style="color:#71717a;">Revenue:</span> <strong>Rp ${formatCompactCurrency(city.revenue)}</strong></div>
                <div><span style="color:#71717a;">Avg Occupancy:</span> <strong>${city.occupancy.toFixed(1)}%</strong></div>
              </div>
              <div style="margin-top: 10px; font-size: 11px; color: #2563eb; font-weight: 600;">
                Click for the detail
              </div>
            </div>
          `, {
            direction: "top",
            sticky: true,
            opacity: 0.95,
          })
          .on("click", () => {
            const params = new URLSearchParams();

            if (query?.start_date) {
              params.set("start_date", query.start_date);
            }

            if (query?.end_date) {
              params.set("end_date", query.end_date);
            }

            const queryString = params.toString();
            const href = queryString
              ? `/dashboard/cities/${encodeURIComponent(city.name)}?${queryString}`
              : `/dashboard/cities/${encodeURIComponent(city.name)}`;

            router.push(href);
          });
      });

      setTimeout(() => {
        map.invalidateSize();
      }, 0);
    };

    initializeMap();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [citySummary, query?.end_date, query?.start_date, router]);

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 py-2">
            Franchise Map - Indonesia
          </CardTitle>
          <CardDescription>
            Geographic map with city-level franchise markers.
          </CardDescription>
        </div>

        <Badge className="border-border bg-transparent text-foreground">
          {citySummary.reduce((acc, item) => acc + item.activeNodes, 0)} active nodes
        </Badge>
      </CardHeader>

      <CardContent className="relative z-0">
        <div
          ref={containerRef}
          className="h-[380px] overflow-hidden rounded-xl border border-border"
        />

        <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
            <span>High occupancy</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-amber-500" />
            <span>Medium occupancy</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
            <span>Low occupancy</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-foreground">Marker size:</span>
            <span>Number of nodes in each city</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
