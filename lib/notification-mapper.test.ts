import { describe, expect, it } from "vitest";

import { mapDashboardNotification } from "./notification-mapper";

describe("mapDashboardNotification", () => {
  it("maps known backend health notifications to idiomatic English template", () => {
    const mapped = mapDashboardNotification(
      {
        notification_id: "system_issue",
        title: "Backend health",
        severity: "info",
        location: "network",
        impact_size: 45,
      },
      0
    );

    expect(mapped.title).toBe("Backend Health");
    expect(mapped.what).toBe("Backend services are active and responding normally.");
    expect(mapped.action).toBe(
      "Check backend, database, and data synchronization connectivity."
    );
    expect(mapped.where).toBe("Global");
    expect(mapped.impact).toBe("45");
  });

  it("maps known studio utilization notifications by type keyword", () => {
    const mapped = mapDashboardNotification(
      {
        type: "studio_occupancy_warning",
        title: "Low occupancy",
        severity: "warning",
      },
      1
    );

    expect(mapped.title).toBe("Studio Utilization");
    expect(mapped.what).toBe("Studio utilization is below the operational target.");
    expect(mapped.action).toBe(
      "Optimize show allocation and reduce low-performing sessions."
    );
  });

  it("falls back to backend text for unknown notification types", () => {
    const mapped = mapDashboardNotification(
      {
        id: "custom-1",
        type: "custom_signal",
        title: "Custom Signal",
        what_happened: "Backend sent a new custom signal.",
        recommended_action: "Inspect custom pipeline.",
        where: "Jakarta",
        impact: "low",
      },
      2
    );

    expect(mapped.title).toBe("Custom Signal");
    expect(mapped.what).toBe("Backend sent a new custom signal.");
    expect(mapped.action).toBe("Inspect custom pipeline.");
    expect(mapped.where).toBe("Jakarta");
    expect(mapped.impact).toBe("low");
  });

  it('normalizes location "network" into "Global"', () => {
    const mapped = mapDashboardNotification(
      {
        type: "custom_signal",
        title: "Custom Signal",
        location: "network",
      },
      3
    );

    expect(mapped.where).toBe("Global");
  });

  it("normalizes numeric impact_size into string impact", () => {
    const mapped = mapDashboardNotification(
      {
        type: "custom_signal",
        title: "Custom Signal",
        impact_size: 19.38,
      },
      4
    );

    expect(mapped.impact).toBe("19.38");
  });

  it("uses fallback id when id and notification_id are missing", () => {
    const mapped = mapDashboardNotification(
      {
        type: "custom_signal",
        title: "No ID Payload",
      },
      7
    );

    expect(mapped.id).toBe("notif-7");
  });
});
