import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import AppThemeProvider from "@/components/ui/theme-provider";
import "leaflet/dist/leaflet.css";

export const metadata: Metadata = {
  title: "KADA FP",
  description: "Local frontend",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-background text-foreground">
        <AppThemeProvider>{children}</AppThemeProvider>
      </body>
    </html>
  );
}