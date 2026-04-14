"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Clapperboard, PanelLeft, Loader2 } from "lucide-react";
import { useUser } from "@/firebase";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getDashboardNotifications } from "@/lib/cinetrack-api";
import {
  DashboardBrandLink,
  DashboardSidebarNav,
} from "@/components/dashboard/dashboard-sidebar-nav";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function LiveClock() {
  const [mounted, setMounted] = useState(false);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (date: Date) => {
    return (
      date.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }) + " WIB"
    );
  };

  if (!mounted) {
    return (
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-green-500" />
          <span className="text-sm font-medium text-green-500">LIVE</span>
        </div>
        <div className="text-sm text-muted-foreground">Loading time...</div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <div className="relative flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-green-500" />
        </div>
        <span className="text-sm font-medium text-green-500">LIVE</span>
      </div>
      <div className="text-sm text-muted-foreground">
        <span>{formatDate(time)}</span> | <span>{formatTime(time)}</span>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, loading } = useUser();
  const [collapsed, setCollapsed] = useState(false);

  const [notifCount, setNotifCount] = useState<number | null>(null);

  useEffect(() => {
    getDashboardNotifications()
      .then((data) => {
        const alertCount = data.filter((item) => {
          const severity = String(item.severity ?? "").toLowerCase();
          return (
            severity === "critical" ||
            severity === "warning" ||
            severity === "opportunity"
          );
        }).length;
        setNotifCount(alertCount);
      })
      .catch(() => setNotifCount(null));
  }, []);

  const titleMap: Record<string, string> = {
    "/dashboard/films": "FILM PERFORMANCE",
    "/dashboard/sales": "SALES ANALYTICS",
    "/dashboard/notifications": "NOTIFICATIONS",
    "/dashboard/settings": "SETTINGS",
    "/dashboard": "DASHBOARD",
    "/login": "ADMIN LOGIN",
  };

  const dynamicPageTitle = pathname.startsWith("/dashboard/cities/")
    ? "CITY PERFORMANCE"
    : null;

  const matchedTitle =
    Object.keys(titleMap)
      .sort((a, b) => b.length - a.length)
      .find((route) => pathname === route || pathname.startsWith(route + "/")) || "/dashboard";

  const pageTitle = dynamicPageTitle ?? titleMap[matchedTitle];

  if (loading && !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-red-500" />
          <p className="text-muted-foreground">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      <aside
        className={cn(
          "sticky top-0 flex h-screen shrink-0 flex-col overflow-hidden border-r border-border bg-card transition-all duration-300 ease-in-out",
          collapsed ? "w-20" : "w-72"
        )}
      >
        <div className="flex items-center justify-between border-b border-border p-6">
          <DashboardBrandLink collapsed={collapsed}>
            <Clapperboard className="h-8 w-8 shrink-0 text-red-500" />
            {!collapsed && (
              <div className="min-w-0">
                <div className="truncate text-xl font-bold tracking-tight text-foreground">
                  CINETRACK
                </div>
                <div className="-mt-0.5 text-xs text-muted-foreground">Analytics Platform</div>
              </div>
            )}
          </DashboardBrandLink>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <DashboardSidebarNav collapsed={collapsed} notifCount={notifCount} />
        </div>

        <div className="mt-auto border-t border-border p-6">
          {collapsed ? (
            <div className="flex flex-col items-center gap-3">
              <button
                type="button"
                onClick={() => setCollapsed(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-background text-foreground transition hover:bg-muted"
              >
                <PanelLeft className="h-4 w-4" />
              </button>

              <Link href="/login">
                <Avatar className="h-10 w-10">
                  <AvatarImage src="https://i.pravatar.cc/150?u=guest" />
                  <AvatarFallback>G</AvatarFallback>
                </Avatar>
              </Link>
            </div>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-3 rounded-2xl p-3 transition hover:bg-muted"
            >
              <Avatar className="h-10 w-10">
                <AvatarImage src="https://i.pravatar.cc/150?u=guest" />
                <AvatarFallback>G</AvatarFallback>
              </Avatar>

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">admin</p>
                <p className="truncate text-xs text-muted-foreground">super admin</p>
              </div>

              <div className="ml-auto h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-green-500/20" />
            </Link>
          )}
        </div>
      </aside>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-[1000] flex h-16 shrink-0 items-center justify-between border-b border-border bg-card px-6">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setCollapsed((prev) => !prev)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-background text-foreground transition hover:bg-muted"
            >
              <PanelLeft className="h-4 w-4" />
            </button>
            <h1 className="text-lg font-semibold tracking-tight text-foreground">{pageTitle}</h1>
          </div>

          <div className="hidden items-center md:flex">
            <LiveClock />
          </div>
        </header>

        <main className="flex-1 bg-background p-6">{children}</main>
      </div>
    </div>
  );
}
