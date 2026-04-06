"use client";
import { useMemo } from "react";
export function useUser() {
  return useMemo(() => ({ user: { name: "Demo User", email: "demo@example.com", photoURL: "" }, loading: false }), []);
}
