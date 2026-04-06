"use client";
import * as React from "react";
const cn = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");
export function Progress({ value = 0, className }: { value?: number; className?: string }) {
  return <div className={cn("relative h-3 w-full overflow-hidden rounded-full bg-secondary", className)}><div className="h-full bg-primary transition-all" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></div>;
}
