"use client";

import { useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPinned } from "lucide-react";

type CitySummaryItem = {
  name: string;
  totalNodes: number;
  activeNodes: number;
  nonActiveNodes: number;
  coordinates: [number, number]; // [lng, lat]
  occupancy: number;
};

export default function IndonesiaFranchiseMap({
  citySummary,
}: {
  citySummary: CitySummaryItem[];
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);

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
            : city.occupancy >= 40
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
          .bindPopup(`
            <div style="min-width: 160px;">
              <strong>${city.name}</strong><br/>
              Total nodes: ${city.totalNodes}<br/>
              Active: ${city.activeNodes}<br/>
              Non-active: ${city.nonActiveNodes}<br/>
              Avg occupancy: ${city.occupancy.toFixed(1)}%
            </div>
          `);
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
  }, [citySummary]);

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <MapPinned className="h-5 w-5" />
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

      <CardContent>
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