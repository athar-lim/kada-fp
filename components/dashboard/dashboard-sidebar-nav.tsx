"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { LayoutDashboard, Video, BarChart2, Bell, Settings } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { mergeParamsForDashboardLink } from "@/lib/dashboard-url-filters";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function isMenuActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function menuLinkClass(active: boolean, collapsed: boolean) {
  return cn(
    "group flex items-center rounded-2xl text-sm font-medium transition",
    active ? "bg-muted text-foreground" : "text-foreground hover:bg-muted/60",
    collapsed ? "justify-center px-0 py-3" : "gap-3 px-5 py-4"
  );
}

function DashboardSidebarNavInner({
  collapsed,
  notifCount,
}: {
  collapsed: boolean;
  notifCount: number | null;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const hrefFor = (path: string) =>
    mergeParamsForDashboardLink(path, new URLSearchParams(searchParams.toString()), pathname);

  const mainMenu: Array<{ href: string; icon: LucideIcon; label: string }> = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/dashboard/films", icon: Video, label: "Film Performance" },
    { href: "/dashboard/sales", icon: BarChart2, label: "Sales Analytics" },
  ];

  const systemMenu: Array<{ href: string; icon: LucideIcon; label: string; badge?: string }> = [
    {
      href: "/dashboard/notifications",
      icon: Bell,
      label: "Notifications",
      badge: notifCount != null && notifCount > 0 ? String(notifCount) : undefined,
    },
    { href: "/dashboard/settings", icon: Settings, label: "Settings" },
  ];

  return (
    <>
      <div className="mb-8">
        {!collapsed && (
          <div className="mb-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            MAIN MENU
          </div>
        )}
        <ul className="space-y-2">
          {mainMenu.map((item) => {
            const active = isMenuActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <li key={item.label}>
                <Link href={hrefFor(item.href)} className={menuLinkClass(active, collapsed)}>
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
          <div className="mb-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            SYSTEM
          </div>
        )}
        <ul className="space-y-2">
          {systemMenu.map((item) => {
            const active = isMenuActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <li key={item.label}>
                <Link href={hrefFor(item.href)} className={menuLinkClass(active, collapsed)}>
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
    </>
  );
}

function SidebarNavFallback({
  collapsed,
  notifCount,
}: {
  collapsed: boolean;
  notifCount: number | null;
}) {
  const pathname = usePathname();
  const mainMenu: Array<{ href: string; icon: LucideIcon; label: string }> = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/dashboard/films", icon: Video, label: "Film Performance" },
    { href: "/dashboard/sales", icon: BarChart2, label: "Sales Analytics" },
  ];
  const systemMenu: Array<{ href: string; icon: LucideIcon; label: string; badge?: string }> = [
    {
      href: "/dashboard/notifications",
      icon: Bell,
      label: "Notifications",
      badge: notifCount != null && notifCount > 0 ? String(notifCount) : undefined,
    },
    { href: "/dashboard/settings", icon: Settings, label: "Settings" },
  ];

  return (
    <>
      <div className="mb-8">
        {!collapsed && (
          <div className="mb-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            MAIN MENU
          </div>
        )}
        <ul className="space-y-2">
          {mainMenu.map((item) => {
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
          <div className="mb-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            SYSTEM
          </div>
        )}
        <ul className="space-y-2">
          {systemMenu.map((item) => {
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
    </>
  );
}

function DashboardBrandLinkInner({
  collapsed,
  children,
}: {
  collapsed: boolean;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const href = mergeParamsForDashboardLink(
    "/dashboard",
    new URLSearchParams(searchParams.toString()),
    pathname
  );
  return (
    <Link
      href={href}
      className={cn("flex min-w-0 items-center", collapsed ? "justify-center" : "gap-3")}
    >
      {children}
    </Link>
  );
}

export function DashboardBrandLink({
  collapsed,
  children,
}: {
  collapsed: boolean;
  children: ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <Link
          href="/dashboard"
          className={cn("flex min-w-0 items-center", collapsed ? "justify-center" : "gap-3")}
        >
          {children}
        </Link>
      }
    >
      <DashboardBrandLinkInner collapsed={collapsed}>{children}</DashboardBrandLinkInner>
    </Suspense>
  );
}

export function DashboardSidebarNav({
  collapsed,
  notifCount,
}: {
  collapsed: boolean;
  notifCount: number | null;
}) {
  return (
    <Suspense fallback={<SidebarNavFallback collapsed={collapsed} notifCount={notifCount} />}>
      <DashboardSidebarNavInner collapsed={collapsed} notifCount={notifCount} />
    </Suspense>
  );
}

