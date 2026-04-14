"use client";

import { useEffect, useState } from "react";
import { useTheme } from "@/components/ui/theme-provider";

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-muted-foreground">
        Theme
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-xl border border-border bg-card p-1">
      <button
        type="button"
        onClick={() => setTheme("system")}
        className={`rounded-lg px-3 py-2 text-sm transition ${
          theme === "system" ? "bg-secondary text-foreground" : "text-muted-foreground"
        }`}
      >
        System
      </button>
      <button
        type="button"
        onClick={() => setTheme("dark")}
        className={`rounded-lg px-3 py-2 text-sm transition ${
          theme === "dark" ? "bg-secondary text-foreground" : "text-muted-foreground"
        }`}
      >
        Dark
      </button>
      <button
        type="button"
        onClick={() => setTheme("light")}
        className={`rounded-lg px-3 py-2 text-sm transition ${
          theme === "light" ? "bg-secondary text-foreground" : "text-muted-foreground"
        }`}
      >
        Light
      </button>
    </div>
  );
}
