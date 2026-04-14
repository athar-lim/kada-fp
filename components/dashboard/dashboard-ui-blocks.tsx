"use client";

import type { ReactNode } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type DashboardSectionHeaderProps = {
  title: string;
  description: ReactNode;
  action?: ReactNode;
};

export function DashboardSectionHeader({
  title,
  description,
  action,
}: DashboardSectionHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-base font-semibold">{title}</h2>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  );
}

type DashboardMetricCardProps = {
  title: string;
  icon: ReactNode;
  loading: boolean;
  value: ReactNode;
  subtitle: ReactNode;
  valueClassName?: string;
};

export function DashboardMetricCard({
  title,
  icon,
  loading,
  value,
  subtitle,
  valueClassName = "text-2xl font-bold",
}: DashboardMetricCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between text-muted-foreground">
          <CardTitle className="text-sm font-medium text-foreground">{title}</CardTitle>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-28" />
            <Skeleton className="h-4 w-40" />
          </div>
        ) : (
          <>
            <div className={valueClassName}>{value}</div>
            <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

type DashboardSummaryPanelProps = {
  label: string;
  value: ReactNode;
  subtitle?: ReactNode;
};

export function DashboardSummaryPanel({
  label,
  value,
  subtitle,
}: DashboardSummaryPanelProps) {
  return (
    <div className="rounded-2xl border border-border bg-muted/20 p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 text-lg font-semibold">{value}</p>
      {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
    </div>
  );
}
