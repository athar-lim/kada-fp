"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import type { ReactNode } from "react";

function ThemeOptionButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm transition ${
        active
          ? "border-primary bg-secondary text-foreground"
          : "border-border bg-card text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function isMenuActive(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === "/dashboard";
  }
  return pathname === href || pathname.startsWith(href + "/");
}

export default function SettingsPage() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <main className="space-y-6 text-foreground">
      <div>
        <h1 className="text-2xl font-bold">Pengaturan</h1>
        <p className="text-sm text-muted-foreground">
          Kelola preferensi tampilan dashboard.
        </p>
      </div>

      <section className="rounded-2xl border border-border bg-card p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Theme</h2>
          <p className="text-sm text-muted-foreground">
            Select your theme preference.
          </p>
        </div>

        {!mounted ? (
          <div className="rounded-xl border border-border bg-background px-4 py-3 text-sm text-muted-foreground">
            Loading theme settings...
          </div>
        ) : (
          <>
            <div className="mb-4 text-sm text-muted-foreground">
              Selected: <span className="font-medium text-foreground">{theme}</span> | Active:{" "}
              <span className="font-medium text-foreground">{resolvedTheme}</span>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <ThemeOptionButton
                active={theme === "system"}
                onClick={() => setTheme("system")}
                icon={<Monitor className="h-4 w-4" />}
                label="System"
              />
              <ThemeOptionButton
                active={theme === "light"}
                onClick={() => setTheme("light")}
                icon={<Sun className="h-4 w-4" />}
                label="Light"
              />
              <ThemeOptionButton
                active={theme === "dark"}
                onClick={() => setTheme("dark")}
                icon={<Moon className="h-4 w-4" />}
                label="Dark"
              />
            </div>
          </>
        )}
      </section>
    </main>
  );
}