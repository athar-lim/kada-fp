export type RawDashboardNotification = Record<string, unknown>;

export type MappedDashboardNotification = {
  id: string;
  type: string;
  severity: string;
  title: string;
  what: string;
  where: string;
  impact: string;
  action: string;
  createdAt: string;
};

type NotificationTemplate = {
  title: string;
  what: string;
  action: string;
};

function getNotificationTemplate(type: string, title: string): NotificationTemplate | null {
  const key = `${type} ${title}`.toLowerCase();

  if (key.includes("backend health") || key.includes("system_issue")) {
    return {
      title: "Backend Health",
      what: "Backend services are active and responding normally.",
      action: "Check backend, database, and data synchronization connectivity.",
    };
  }
  if (key.includes("revenue trend") || key.includes("revenue_spike")) {
    return {
      title: "Revenue Trend",
      what: "Revenue is below the previous comparison window.",
      action: "Review promotions, film lineup, and branches with revenue decline.",
    };
  }
  if (key.includes("occupancy level") || key.includes("prediction_warning")) {
    return {
      title: "Occupancy Level",
      what: "Overall occupancy is low and needs attention.",
      action: "Consider reconfiguring studio layouts or reducing low-demand showtimes.",
    };
  }
  if (key.includes("cinema activity") || key.includes("early_blockbuster")) {
    return {
      title: "Cinema Activity",
      what: "All cinemas are currently active.",
      action: "Validate branches without activity to confirm offline, maintenance, or idle status.",
    };
  }
  if (key.includes("system status") || key.includes("system_status")) {
    return {
      title: "System Status",
      what: "Core platform services are running and available.",
      action: "Monitor service health and verify upstream dependencies remain stable.",
    };
  }
  if (key.includes("data delay") || key.includes("data_delay") || key.includes("sync delay")) {
    return {
      title: "Data Delay",
      what: "Data ingestion is delayed compared to the expected update window.",
      action: "Review ETL jobs, queue processing, and source feed availability.",
    };
  }
  if (key.includes("api latency") || key.includes("latency") || key.includes("slow response")) {
    return {
      title: "API Latency",
      what: "Backend response time is above the normal baseline.",
      action: "Check query performance, server load, and network bottlenecks.",
    };
  }
  if (key.includes("error spike") || key.includes("error_rate") || key.includes("failure rate")) {
    return {
      title: "Error Spike",
      what: "The application error rate is elevated in the current monitoring window.",
      action: "Inspect error logs, recent deployments, and failing integrations.",
    };
  }
  if (key.includes("ticket trend") || key.includes("ticket decline") || key.includes("sales drop")) {
    return {
      title: "Ticket Trend",
      what: "Ticket sales are below the previous comparison period.",
      action: "Review showtimes, local promotions, and demand by branch.",
    };
  }
  if (key.includes("payment anomaly") || key.includes("payment_drop") || key.includes("payment mix")) {
    return {
      title: "Payment Anomaly",
      what: "Payment mix shifted unexpectedly from the normal pattern.",
      action: "Validate payment gateway health, channel availability, and transaction logs.",
    };
  }
  if (key.includes("movie demand") || key.includes("film demand") || key.includes("top movie")) {
    return {
      title: "Movie Demand",
      what: "Audience demand concentration changed across active movies.",
      action: "Adjust scheduling and promotions to match current demand signals.",
    };
  }
  if (key.includes("studio utilization") || key.includes("studio occupancy") || key.includes("low occupancy")) {
    return {
      title: "Studio Utilization",
      what: "Studio utilization is below the operational target.",
      action: "Optimize show allocation and reduce low-performing sessions.",
    };
  }
  if (key.includes("capacity risk") || key.includes("overcapacity") || key.includes("underutilized")) {
    return {
      title: "Capacity Risk",
      what: "Capacity distribution indicates imbalance across studios or branches.",
      action: "Rebalance capacity planning based on occupancy and demand trends.",
    };
  }

  return null;
}

function toSafeText(value: unknown, fallback = "-"): string {
  const text = String(value ?? "").trim();
  return text.length > 0 ? text : fallback;
}

export function mapDashboardNotification(
  item: RawDashboardNotification,
  index: number
): MappedDashboardNotification {
  const rawImpact = item.impact ?? item.impact_size;
  const impact =
    rawImpact == null || rawImpact === ""
      ? "-"
      : typeof rawImpact === "number"
        ? `${rawImpact}`
        : String(rawImpact);

  const rawWhere = item.where ?? item.location ?? "Global";
  const where =
    typeof rawWhere === "string" && rawWhere.toLowerCase() === "network"
      ? "Global"
      : String(rawWhere);

  const type = String(item.type ?? item.notification_id ?? "notification");
  const defaultTitle = toSafeText(item.title, "System Alert");
  const template = getNotificationTemplate(type, defaultTitle);

  return {
    id: String(item.id ?? item.notification_id ?? `notif-${index}`),
    type,
    severity: String(item.severity ?? "info"),
    title: template?.title ?? defaultTitle,
    what: template?.what ?? toSafeText(item.what ?? item.what_happened ?? item.message, "-"),
    where,
    impact,
    action: template?.action ?? toSafeText(item.action ?? item.recommended_action, "-"),
    createdAt: String(item.createdAt ?? item.created_at ?? new Date().toISOString()),
  };
}
