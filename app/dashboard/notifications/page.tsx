"use client";

import { useMemo, useState, useEffect } from "react";
import {
  AlertTriangle,
  Bell,
  BellOff,
  BrainCircuit,
  CheckCircle2,
  Clapperboard,
  Clock,
  LightbulbIcon,
  Server,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Zap,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import {
  getAiInsightsHistory,
  getDashboardNotifications,
  type DashboardNotification,
  type AiInsightResponse,
} from "@/lib/cinetrack-api";

type AiInsightWithLegacyActions = AiInsightResponse & {
  action_items?: string[];
};

// ─── Helpers ────────────────────────────────────────────────────────────────

const getNotificationIcon = (type: string) => {
  if (type === "system_issue") return Server;
  if (type === "revenue_spike") return TrendingUp;
  if (type === "early_blockbuster") return Clapperboard;
  if (type === "prediction_warning") return TrendingDown;
  return AlertTriangle;
};

const getSeverityConfig = (severity: string) => {
  if (severity === "critical") return {
    badgeClass: "bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400",
    borderClass: "border-l-red-500",
    iconBg: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800",
    iconColor: "text-red-600 dark:text-red-400",
    label: "Critical",
  };
  if (severity === "warning") return {
    badgeClass: "bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400",
    borderClass: "border-l-amber-500",
    iconBg: "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800",
    iconColor: "text-amber-600 dark:text-amber-400",
    label: "Warning",
  };
  if (severity === "opportunity") return {
    badgeClass: "bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400",
    borderClass: "border-l-green-500",
    iconBg: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800",
    iconColor: "text-green-600 dark:text-green-400",
    label: "Opportunity",
  };
  return {
    badgeClass: "bg-secondary text-secondary-foreground",
    borderClass: "border-l-muted",
    iconBg: "bg-muted border-border",
    iconColor: "text-muted-foreground",
    label: "Info",
  };
};

const getImpactConfig = (level?: string) => {
  if (!level) return { class: "bg-muted text-muted-foreground border-border", label: "—" };
  const l = level.toLowerCase();
  if (l === "high" || l === "critical") return { class: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-200", label: "High Impact" };
  if (l === "medium") return { class: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200", label: "Medium Impact" };
  return { class: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-200", label: "Low Impact" };
};

// ─── Page ────────────────────────────────────────────────────────────────────

type Tab = "all" | "system" | "ai";

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("all");
  const [selectedSeverity, setSelectedSeverity] = useState("all");
  const [notifications, setNotifications] = useState<DashboardNotification[]>([]);
  const [aiInsights, setAiInsights] = useState<AiInsightResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unmounted = false;

    Promise.allSettled([getDashboardNotifications(), getAiInsightsHistory()])
      .then((results) => {
        if (unmounted) return;

        if (results[0].status === "fulfilled") {
          setNotifications(results[0].value);
        } else {
          console.error("Failed to load notifications", results[0].reason);
        }

        if (results[1].status === "fulfilled") {
          const sortedInsights = [...results[1].value].sort((a, b) => {
            const aTime = a.generated_at ? new Date(a.generated_at).getTime() : 0;
            const bTime = b.generated_at ? new Date(b.generated_at).getTime() : 0;
            return bTime - aTime;
          });
          setAiInsights(sortedInsights);
        } else {
          console.error("Failed to load AI insight history", results[1].reason);
        }

        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load notifications page data", err);
        if (!unmounted) {
          setLoading(false);
        }
      });

    return () => { unmounted = true; };
  }, []);

  const filteredNotifications = useMemo(() => {
    if (selectedSeverity === "all") return notifications;
    return notifications.filter((item) => item.severity === selectedSeverity);
  }, [selectedSeverity, notifications]);

  const summary = useMemo(() => notifications.reduce(
    (acc, item) => { acc.total += 1; const s = item.severity as keyof typeof acc; if (s in acc) acc[s] += 1; return acc; },
    { total: 0, critical: 0, warning: 0, opportunity: 0 }
  ), [notifications]);

  const groupedNotifications = useMemo(() => ({
    critical: filteredNotifications.filter((item) => item.severity === "critical"),
    warning: filteredNotifications.filter((item) => item.severity === "warning"),
    opportunity: filteredNotifications.filter((item) => item.severity === "opportunity"),
  }), [filteredNotifications]);

  const totalAlerts = summary.total + aiInsights.length;

  // Severity filter pill buttons — shown on "all" and "system" tabs
  const SeverityFilter = () => (
    <div className="flex flex-wrap gap-2">
      {[
        { value: "all", label: "All", count: summary.total },
        { value: "critical", label: "Critical", dot: "bg-red-500" as const, count: summary.critical },
        { value: "warning", label: "Warning", dot: "bg-amber-500" as const, count: summary.warning },
        { value: "opportunity", label: "Opportunity", dot: "bg-green-500" as const, count: summary.opportunity },
      ].map((item) => (
        <button
          key={item.value}
          type="button"
          onClick={() => setSelectedSeverity(item.value)}
          className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition ${
            selectedSeverity === item.value
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-card text-foreground hover:bg-muted"
          }`}
        >
          {"dot" in item && <span className={`h-2 w-2 rounded-full ${item.dot}`} />}
          {item.label}
          {item.count > 0 && (
            <span className={`rounded-full px-1.5 text-[10px] font-bold ${
              selectedSeverity === item.value ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
            }`}>{item.count}</span>
          )}
        </button>
      ))}
    </div>
  );

  return (
    <main className="space-y-8 text-foreground">

      {/* ── HEADER ── */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">Notifications & AI Insights</h1>
            {totalAlerts > 0 && (
              <span className="inline-flex items-center justify-center rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground">
                {totalAlerts}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            AI insight history and operational alerts in one place, including impact and recommended actions.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1 rounded-xl border border-border bg-muted/40 p-1 self-start">
          {([
            { id: "all", label: "All", count: totalAlerts },
            { id: "system", label: "System", count: summary.total },
            { id: "ai", label: "AI Insights", count: aiInsights.length },
          ] as const).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                activeTab === t.id
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
              {t.count > 0 && (
                <span className={`rounded-full px-1.5 py-0 text-[10px] font-bold ${
                  activeTab === t.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}>{t.count}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">System Alerts</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.total}</div>
            <p className="text-xs text-muted-foreground mt-1">Active operational alerts</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-primary">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">AI Insights</CardTitle>
              <Sparkles className="h-4 w-4 text-primary animate-pulse" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{aiInsights.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Stored AI findings</p>
          </CardContent>
        </Card>
      </div>

      {(activeTab === "all" || activeTab === "system") && <SeverityFilter />}

      {(activeTab === "all" || activeTab === "system") && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <h2 className="text-base font-semibold">System Alerts</h2>
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground">{filteredNotifications.length} alerts</span>
          </div>

          {loading ? (
            <Card>
              <CardContent className="py-12 flex flex-col items-center gap-3">
                <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                <p className="text-sm text-muted-foreground">Loading system alerts...</p>
              </CardContent>
            </Card>
          ) : filteredNotifications.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center gap-3">
                <CheckCircle2 className="h-12 w-12 text-green-500/40" />
                <p className="text-sm font-medium text-muted-foreground">No alerts for the selected severity.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredNotifications.map((item, index) => {
                const ItemIcon = getNotificationIcon(item.type);
                const cfg = getSeverityConfig(item.severity);
                return (
                  <Card key={item.id || `notif-${index}`} className={`border-l-4 ${cfg.borderClass}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className={`mt-0.5 rounded-xl border p-2 ${cfg.iconBg}`}>
                            <ItemIcon className={`h-4 w-4 ${cfg.iconColor}`} />
                          </div>
                          <div>
                            <CardTitle className="text-sm font-semibold">{item.title}</CardTitle>
                            <CardDescription className="flex items-center gap-1 mt-1">
                              <Clock className="h-3 w-3" />
                              {item.createdAt}
                            </CardDescription>
                          </div>
                        </div>
                        <Badge className={cfg.badgeClass}>{cfg.label}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="border-t pt-4">
                      <div className="grid gap-3 md:grid-cols-2">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">What Happened</p>
                          <p className="mt-1 text-sm text-muted-foreground">{item.what || "-"}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Where</p>
                          <p className="mt-1 text-sm text-muted-foreground">{item.where || "-"}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Impact</p>
                          <p className="mt-1 text-sm text-muted-foreground">{item.impact || "-"}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Recommended Action</p>
                          <p className="mt-1 text-sm text-foreground">{item.action || "-"}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* ── AI INSIGHTS HISTORY ── */}
      {(activeTab === "all" || activeTab === "ai") && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <BrainCircuit className="h-5 w-5 text-primary" />
            <h2 className="text-base font-semibold text-primary">AI Operational Intelligence History</h2>
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground">{aiInsights.length} history items</span>
          </div>

          {aiInsights.length > 0 ? (
            <div className="grid gap-4">
              {aiInsights.map((item, index) => {
                const impactCfg = getImpactConfig(item.cards?.impact_level ?? item.analysis?.impact_level);
                const actionItems: string[] =
                  item.analysis?.action_items ??
                  (item as AiInsightWithLegacyActions).action_items ??
                  [];
                const category = item.cards?.category ?? item.analysis?.category ?? "AI Analysis";
                const headline = item.cards?.headline ?? item.analysis?.title;
                const summary = item.cards?.summary ?? item.analysis?.description;
                const recommendation = item.cards?.recommendation ?? item.analysis?.recommendation;

                return (
                  <Card
                    key={`ai-${item.generated_at ?? item.period?.label ?? index}`}
                    className="border-l-4 border-l-primary"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 rounded-xl border border-primary/20 bg-primary/10 p-2 shrink-0">
                            <Sparkles className="h-4 w-4 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <CardTitle className="text-sm font-semibold leading-snug">{headline}</CardTitle>
                            <CardDescription className="flex items-center gap-1 mt-1">
                              <Clock className="h-3 w-3 shrink-0" />
                              {item.period?.label ?? "—"}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="flex flex-wrap gap-1.5 justify-end">
                            <Badge variant="outline" className="capitalize text-[10px]">{category}</Badge>
                            <Badge variant="outline" className={`text-[10px] capitalize border ${impactCfg.class}`}>
                              {impactCfg.label}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4 border-t pt-4">
                      <div className="grid gap-4 lg:grid-cols-2">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                            Analysis &amp; Findings
                          </p>
                          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                            {summary}
                          </p>
                        </div>
                        {recommendation && (
                          <div className="rounded-xl border border-primary/10 bg-primary/5 p-4">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-primary/70">
                              Recommended Action
                            </p>
                            <p className="mt-2 text-sm font-medium text-foreground leading-relaxed">
                              {recommendation}
                            </p>
                          </div>
                        )}
                      </div>

                      {actionItems.length > 0 && (
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                            Action Items
                          </p>
                          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                            {actionItems.slice(0, 6).map((li, i) => (
                              <div
                                key={i}
                                className="flex items-start gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground"
                              >
                                <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
                                {li}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center gap-3">
                <BellOff className="h-12 w-12 text-muted-foreground/20" />
                <p className="text-sm font-medium text-muted-foreground">No AI insight history yet.</p>
                <p className="text-xs text-muted-foreground max-w-xs">
                  The backend has not returned insight history data yet.
                </p>
              </CardContent>
            </Card>
          )}
        </section>
      )}
    </main>
  );
}
