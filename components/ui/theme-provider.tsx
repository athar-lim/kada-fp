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

// Fungsi ini membaca tema yang tersimpan dan kembali ke "system" jika tidak valid.
// Nilai ini dipakai sebagai sumber awal state tema di client.
const getStoredTheme = (): Theme => {
  if (typeof window === "undefined") return "system";

  const value = window.localStorage.getItem(STORAGE_KEY);
  return value === "light" || value === "dark" || value === "system"
    ? value
    : "system";
};

// Fungsi ini menerjemahkan mode tema menjadi tema aktif akhir.
// Saat mode "system", hasilnya mengikuti preferensi OS pengguna.
const resolveTheme = (theme: Theme): ResolvedTheme => {
  if (theme !== "system") return theme;

  if (typeof window === "undefined") return "light";

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

// Fungsi ini memasang atau melepas class `dark` pada elemen root.
// Class ini dipakai Tailwind untuk mengganti token warna global.
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

    // Listener ini menyelaraskan tema aktif ketika mode "system" dan OS berubah.
    // Update hanya dijalankan untuk mode system agar pilihan manual tetap stabil.
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

  // Fungsi ini menyimpan pilihan tema baru lalu langsung menerapkannya ke DOM.
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

// Fungsi ini memberi akses aman ke state tema dari komponen client lain.
// Hook akan melempar error bila dipakai di luar provider tema.
export const useTheme = () => {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within AppThemeProvider");
  }

  return context;
};
