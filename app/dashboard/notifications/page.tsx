"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Bell, Clapperboard, Server, TrendingDown, TrendingUp } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const notifications = [
  {
    id: "ALT-001",
    type: "system_issue",
    severity: "critical",
    title: "Node Offline",
    what: "CineTrack Palembang has stopped responding since 08:15 WIB.",
    where: "Palembang",
    impact: "All live monitoring and schedule sync from this node are currently unavailable.",
    action: "Escalate to operations and network support, then redirect manual monitoring to the local branch team.",
    createdAt: "06:17 WIB",
  },
  {
    id: "ALT-002",
    type: "occupancy_anomaly",
    severity: "warning",
    title: "Low Occupancy",
    what: "CGV Semarang dropped to 38% occupancy and fell below the 40% threshold.",
    where: "Semarang",
    impact: "Around 120 seats per day are currently underutilized in the active schedule mix.",
    action: "Reduce weak slots or move the film into a smaller studio before applying discounts.",
    createdAt: "01:42 WIB",
  },
  {
    id: "ALT-003",
    type: "revenue_spike",
    severity: "opportunity",
    title: "New Revenue Record",
    what: "West Jakarta set the highest single-day sales result across the network.",
    where: "West Jakarta",
    impact: "Daily ticket volume rose 22% above the local baseline.",
    action: "Add prime-time capacity and protect margin with tighter pricing on peak slots.",
    createdAt: "01:53 WIB",
  },
  {
    id: "ALT-004",
    type: "early_blockbuster",
    severity: "opportunity",
    title: "Early Blockbuster Signal",
    what: "Nusantara Rising shows a fast sales ramp and fully activated studios ahead of release day.",
    where: "Network-wide",
    impact: "Projected opening-day demand is 1.4x above the current benchmark.",
    action: "Open additional screenings early and shift marketing spend to conversion-focused campaigns.",
    createdAt: "Yesterday 18:00",
  },
  {
    id: "ALT-005",
    type: "prediction_warning",
    severity: "warning",
    title: "Prediction Warning",
    what: "Bandung is projected to soften by 12% if the current weekday pattern continues.",
    where: "Bandung",
    impact: "Expected revenue loss is about Rp 18M over the next forecast window.",
    action: "Refresh weekday scheduling and test a narrower promo on weak time slots instead of full-day discounts.",
    createdAt: "00:35 WIB",
  },
];

// Helper ini menentukan ikon yang paling cocok untuk tiap jenis alert.
const getNotificationIcon = (type: string) => {
  if (type === "system_issue") return Server;
  if (type === "revenue_spike") return TrendingUp;
  if (type === "early_blockbuster") return Clapperboard;
  if (type === "prediction_warning") return TrendingDown;
  return AlertTriangle;
};

// Helper ini memberi warna badge agar severity cepat terbaca di feed.
const getSeverityClass = (severity: string) => {
  if (severity === "critical") {
    return "bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400";
  }
  if (severity === "warning") {
    return "bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400";
  }
  if (severity === "opportunity") {
    return "bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400";
  }
  return "bg-secondary text-secondary-foreground";
};

// Page ini menyusun alert berdasarkan severity supaya aksi harian lebih mudah diprioritaskan.
export default function NotificationsPage() {
  const [selectedSeverity, setSelectedSeverity] = useState("all");

  const filteredNotifications = useMemo(() => {
    if (selectedSeverity === "all") return notifications;
    return notifications.filter((item) => item.severity === selectedSeverity);
  }, [selectedSeverity]);

  const summary = useMemo(() => {
    return notifications.reduce(
      (acc, item) => {
        acc.total += 1;
        acc[item.severity] += 1;
        return acc;
      },
      { total: 0, critical: 0, warning: 0, opportunity: 0 }
    );
  }, []);

  const groupedNotifications = useMemo(() => {
    return {
      critical: filteredNotifications.filter((item) => item.severity === "critical"),
      warning: filteredNotifications.filter((item) => item.severity === "warning"),
      opportunity: filteredNotifications.filter((item) => item.severity === "opportunity"),
    };
  }, [filteredNotifications]);

  return (
    <main className="space-y-8 text-foreground">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notifications & Alerts</h1>
          <p className="text-sm text-muted-foreground">
            Critical issue first, then anomaly, opportunity, and the recommended action.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            { value: "all", label: "All" },
            { value: "critical", label: "Critical" },
            { value: "warning", label: "Warning" },
            { value: "opportunity", label: "Opportunity" },
          ].map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setSelectedSeverity(item.value)}
              className={`rounded-full border px-3 py-1.5 text-sm transition ${
                selectedSeverity === item.value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-foreground"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical</CardTitle>
            <Server className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.critical}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Warnings</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.warning}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Opportunities</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.opportunity}</div>
          </CardContent>
        </Card>
      </div>

      {[
        { key: "critical", title: "Critical Issues", items: groupedNotifications.critical },
        { key: "warning", title: "Performance Anomalies", items: groupedNotifications.warning },
        { key: "opportunity", title: "Opportunities", items: groupedNotifications.opportunity },
      ].map((group) => (
        <section key={group.key} className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">{group.title}</h2>
            <p className="text-sm text-muted-foreground">
              Each alert explains what happened, where it happened, the impact, and the next action.
            </p>
          </div>

          {group.items.length > 0 ? (
            <div className="grid gap-4">
              {group.items.map((item) => {
                const Icon = getNotificationIcon(item.type);

                return (
                  <Card key={item.id}>
                    <CardHeader className="space-y-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className="rounded-full border border-border bg-muted/40 p-2">
                            <Icon className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div>
                            <CardTitle className="text-base">{item.title}</CardTitle>
                            <CardDescription>{item.createdAt}</CardDescription>
                          </div>
                        </div>

                        <Badge className={getSeverityClass(item.severity)}>
                          {item.severity}
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent className="grid gap-4 lg:grid-cols-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          What Happened
                        </p>
                        <p className="mt-1 text-sm">{item.what}</p>
                      </div>

                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Where
                        </p>
                        <p className="mt-1 text-sm">{item.where}</p>
                      </div>

                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Impact Size
                        </p>
                        <p className="mt-1 text-sm">{item.impact}</p>
                      </div>

                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Recommended Action
                        </p>
                        <p className="mt-1 text-sm">{item.action}</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                No alerts in this severity for the current filter.
              </CardContent>
            </Card>
          )}
        </section>
      ))}
    </main>
  );
}
