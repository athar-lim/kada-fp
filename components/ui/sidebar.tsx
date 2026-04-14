"use client";

import * as React from "react";
import { PanelLeft } from "lucide-react";

type SidebarContextType = {
  open: boolean;
  toggle: () => void;
};

const SidebarContext = React.createContext<SidebarContextType | null>(null);

function useSidebar() {
  const ctx = React.useContext(SidebarContext);
  if (!ctx) throw new Error("Sidebar components must be used inside SidebarProvider");
  return ctx;
}

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(true);

  const toggle = React.useCallback(() => {
    setOpen((prev) => !prev);
  }, []);

  return (
    <SidebarContext.Provider value={{ open, toggle }}>
      <div className="flex min-h-screen w-full overflow-hidden bg-background text-foreground">
        {children}
      </div>
    </SidebarContext.Provider>
  );
}

export function Sidebar({
  className,
  children,
}: React.HTMLAttributes<HTMLDivElement>) {
  const { open } = useSidebar();

  return (
    <aside
      className={cn(
        "shrink-0 overflow-hidden border-r border-border bg-card text-card-foreground transition-all duration-300 ease-in-out",
        open ? "w-64" : "w-0 border-r-0",
        className
      )}
    >
      <div
        className={cn(
          "flex h-full w-64 flex-col",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      >
        {children}
      </div>
    </aside>
  );
}

export function SidebarTrigger(
  props: React.ButtonHTMLAttributes<HTMLButtonElement>
) {
  const { toggle } = useSidebar();

  return (
    <button
      type="button"
      onClick={toggle}
      className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border bg-card text-foreground transition hover:bg-secondary"
      {...props}
    >
      <PanelLeft className="h-4 w-4" />
    </button>
  );
}

export function SidebarInset({
  className,
  children,
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex min-h-screen min-w-0 flex-1 flex-col", className)}>{children}</div>;
}

export function SidebarHeader({
  className,
  children,
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("border-b border-border p-4", className)}>{children}</div>;
}

export function SidebarContent({
  className,
  children,
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex-1 overflow-y-auto p-4", className)}>{children}</div>;
}

export function SidebarFooter({
  className,
  children,
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mt-auto border-t border-border p-4", className)}>{children}</div>;
}

export function SidebarGroup({
  className,
  children,
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mb-4", className)}>{children}</div>;
}

export function SidebarGroupLabel({
  className,
  children,
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("mb-2 text-xs font-semibold uppercase text-muted-foreground", className)}>
      {children}
    </div>
  );
}

export function SidebarMenu({
  className,
  children,
}: React.HTMLAttributes<HTMLUListElement>) {
  return <ul className={cn("space-y-1", className)}>{children}</ul>;
}

export function SidebarMenuItem({
  className,
  children,
}: React.HTMLAttributes<HTMLLIElement>) {
  return <li className={cn(className)}>{children}</li>;
}