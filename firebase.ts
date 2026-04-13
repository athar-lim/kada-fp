"use client";
import { useState, useEffect } from "react";

export function useUser() {
  const [user, setUser] = useState<{name: string, email: string, photoURL?: string} | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("cinetrack_user");
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch(e) {
      // ignore
    }
    setLoading(false);
  }, []);

  return { user, loading };
}
