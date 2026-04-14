"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type Theme = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

type ThemeContextValue = {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
};

const STORAGE_KEY = "kada-theme";

const ThemeContext = createContext<ThemeContextValue | null>(null);

// Reads persisted theme and falls back to "system" if invalid.
// Nilai ini dipakai sebagai sumber awal state tema di client.
const getStoredTheme = (): Theme => {
  if (typeof window === "undefined") return "system";

  const value = window.localStorage.getItem(STORAGE_KEY);
  return value === "light" || value === "dark" || value === "system"
    ? value
    : "system";
};

// Maps selected theme mode to the final active theme.
// Saat mode "system", hasilnya mengikuti preferensi OS pengguna.
const resolveTheme = (theme: Theme): ResolvedTheme => {
  if (theme !== "system") return theme;

  if (typeof window === "undefined") return "light";

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

// Adds or removes the `dark` class on the root element.
// Tailwind uses this class to switch global color tokens.
const applyThemeClass = (theme: ResolvedTheme) => {
  document.documentElement.classList.toggle("dark", theme === "dark");
};

export default function AppThemeProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [theme, setThemeState] = useState<Theme>("system");
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("light");

  useEffect(() => {
    const nextTheme = getStoredTheme();
    const nextResolvedTheme = resolveTheme(nextTheme);

    setThemeState(nextTheme);
    setResolvedTheme(nextResolvedTheme);
    applyThemeClass(nextResolvedTheme);

    const media = window.matchMedia("(prefers-color-scheme: dark)");

    // Keeps active theme in sync when using "system" mode and OS theme changes.
    // Updates only run in system mode so manual choices stay stable.
    const handleChange = () => {
      setThemeState((currentTheme) => {
        if (currentTheme !== "system") return currentTheme;

        const nextResolved = resolveTheme("system");
        setResolvedTheme(nextResolved);
        applyThemeClass(nextResolved);
        return currentTheme;
      });
    };

    media.addEventListener("change", handleChange);

    return () => {
      media.removeEventListener("change", handleChange);
    };
  }, []);

  // Persists the selected theme and applies it to the DOM immediately.
  // Penyimpanan lokal menjaga preferensi tetap konsisten antar refresh.
  const setTheme = (nextTheme: Theme) => {
    const nextResolvedTheme = resolveTheme(nextTheme);

    setThemeState(nextTheme);
    setResolvedTheme(nextResolvedTheme);
    window.localStorage.setItem(STORAGE_KEY, nextTheme);
    applyThemeClass(nextResolvedTheme);
  };

  const value = useMemo(
    () => ({
      theme,
      resolvedTheme,
      setTheme,
    }),
    [theme, resolvedTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

// Provides safe access to theme state for other client components.
// Hook akan melempar error bila dipakai di luar provider tema.
export const useTheme = () => {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within AppThemeProvider");
  }

  return context;
};
