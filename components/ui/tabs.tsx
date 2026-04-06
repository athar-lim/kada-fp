"use client";
import * as React from "react";
const cn = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");
type TabsContextType = { value: string; setValue: (v: string) => void };
const TabsContext = React.createContext<TabsContextType | null>(null);
export function Tabs({ defaultValue, value, onValueChange, className, children }: { defaultValue?: string; value?: string; onValueChange?: (v: string) => void; className?: string; children: React.ReactNode; }) {
  const [internal, setInternal] = React.useState(defaultValue ?? "");
  const current = value ?? internal;
  const setValue = (v: string) => { onValueChange?.(v); if (value === undefined) setInternal(v); };
  return <TabsContext.Provider value={{ value: current, setValue }}><div className={cn(className)}>{children}</div></TabsContext.Provider>;
}
export function TabsList({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) { return <div className={cn("inline-flex h-10 items-center justify-center rounded-md bg-secondary p-1", className)} {...props}>{children}</div>; }
export function TabsTrigger({ value, className, children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { value: string }) { const ctx = React.useContext(TabsContext); const active = ctx?.value === value; return <button type="button" onClick={() => ctx?.setValue(value)} className={cn("inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all", active ? "bg-background text-foreground shadow-sm" : "text-muted-foreground", className)} {...props}>{children}</button>; }
export function TabsContent({ value, className, children, ...props }: React.HTMLAttributes<HTMLDivElement> & { value: string }) { const ctx = React.useContext(TabsContext); if (ctx?.value !== value) return null; return <div className={cn("mt-2", className)} {...props}>{children}</div>; }
