"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Video,
  BarChart2,
  Bell,
  Settings,
  Clapperboard,
  PanelLeft,
  Loader2,
} from "lucide-react";
import { useUser } from "@/firebase";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
        <div className="text-sm text-zinc-500">Memuat waktu...</div>
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
      <div className="text-sm text-zinc-500">
        <span>{formatDate(time)}</span> | <span>{formatTime(time)}</span>
      </div>
    </div>
  );
}

function isMenuActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(href + "/");
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, loading } = useUser();
  const [collapsed, setCollapsed] = useState(false);

  const menuUtama = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/dashboard/films", icon: Video, label: "Film Performance" },
    { href: "/dashboard/sales", icon: BarChart2, label: "Sales Analytics" },
  ];

  const sistemMenu = [
    { href: "/dashboard/notifications", icon: Bell, label: "Notifikasi", badge: "4" },
    { href: "/dashboard/settings", icon: Settings, label: "Pengaturan" },
  ];

  const titleMap: Record<string, string> = {
    "/dashboard/films": "FILM PERFORMANCE",
    "/dashboard/sales": "SALES ANALYTICS",
    "/dashboard/notifications": "NOTIFIKASI",
    "/dashboard/settings": "PENGATURAN",
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
      <div className="flex h-screen w-full items-center justify-center bg-[#f8f9fb]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-red-500" />
          <p className="text-zinc-500">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  const menuLinkClass = (active: boolean, collapsed: boolean) =>
    cn(
      "group flex items-center rounded-2xl text-sm font-medium transition",
      active ? "bg-zinc-100 text-zinc-900" : "text-zinc-900 hover:bg-zinc-50",
      collapsed ? "justify-center px-0 py-3" : "gap-3 px-5 py-4"
    );

  return (
    <div className="flex min-h-screen w-full bg-[#f8f9fb] text-zinc-900">
      <aside
        className={cn(
          "sticky top-0 flex h-screen shrink-0 flex-col overflow-hidden border-r border-zinc-200 bg-white transition-all duration-300 ease-in-out",
          collapsed ? "w-20" : "w-72"
        )}
      >
        <div className="flex items-center justify-between border-b border-zinc-200 p-6">
          <Link
            href="/dashboard"
            className={cn("flex min-w-0 items-center", collapsed ? "justify-center" : "gap-3")}
          >
            <Clapperboard className="h-8 w-8 shrink-0 text-red-500" />
            {!collapsed && (
              <div className="min-w-0">
                <div className="truncate text-xl font-bold tracking-tight text-zinc-900">
                  CINETRACK
                </div>
                <div className="-mt-0.5 text-xs text-zinc-500">Analytics Platform</div>
              </div>
            )}
          </Link>

          {!collapsed && (
            <button
              type="button"
              onClick={() => setCollapsed(true)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-700 transition hover:bg-zinc-50"
            >
              <PanelLeft className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-8">
            {!collapsed && (
              <div className="mb-4 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                MENU UTAMA
              </div>
            )}
            <ul className="space-y-2">
              {menuUtama.map((item) => {
                const active = isMenuActive(pathname, item.href);
                const Icon = item.icon;

                return (
                  <li key={item.label}>
                    <Link href={item.href} className={menuLinkClass(active, collapsed)}>
                      <Icon className="h-5 w-5 shrink-0" />
                      {!collapsed && <span>{item.label}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          <div>
            {!collapsed && (
              <div className="mb-4 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                SISTEM
              </div>
            )}
            <ul className="space-y-2">
              {sistemMenu.map((item) => {
                const active = isMenuActive(pathname, item.href);
                const Icon = item.icon;

                return (
                  <li key={item.label}>
                    <Link href={item.href} className={menuLinkClass(active, collapsed)}>
                      <Icon className="h-5 w-5 shrink-0" />
                      {!collapsed && <span>{item.label}</span>}
                      {!collapsed && item.badge && (
                        <Badge className="ml-auto bg-red-500 text-white hover:bg-red-500">
                          {item.badge}
                        </Badge>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <div className="mt-auto border-t border-zinc-200 p-6">
          {collapsed ? (
            <div className="flex flex-col items-center gap-3">
              <button
                type="button"
                onClick={() => setCollapsed(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-700 transition hover:bg-zinc-50"
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
              className="flex items-center gap-3 rounded-2xl p-3 transition hover:bg-zinc-50"
            >
              <Avatar className="h-10 w-10">
                <AvatarImage src="https://i.pravatar.cc/150?u=guest" />
                <AvatarFallback>G</AvatarFallback>
              </Avatar>

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-zinc-900">admin</p>
                <p className="truncate text-xs text-zinc-500">super admin</p>
              </div>

              <div className="ml-auto h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-green-500/20" />
            </Link>
          )}
        </div>
      </aside>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-[1000] flex h-16 shrink-0 items-center justify-between border-b border-zinc-200 bg-white px-6">
          <div className="flex items-center gap-4">
            {collapsed && (
              <button
                type="button"
                onClick={() => setCollapsed(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-700 transition hover:bg-zinc-50"
              >
                <PanelLeft className="h-4 w-4" />
              </button>
            )}
            <h1 className="text-lg font-semibold tracking-tight text-zinc-900">{pageTitle}</h1>
          </div>

          <div className="hidden items-center md:flex">
            <LiveClock />
          </div>
        </header>

        <main className="flex-1 bg-[#f8f9fb] p-6">{children}</main>
      </div>
    </div>
  );
}
