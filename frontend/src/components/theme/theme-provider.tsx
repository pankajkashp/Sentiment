"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

type Theme = "light" | "dark";
type ThemeContextValue = { theme: Theme; toggleTheme: () => void };
const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const saved = window.localStorage.getItem("policylens-theme");
    const preference = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    const next = saved === "dark" || saved === "light" ? saved : preference;
    setTheme(next);
    document.documentElement.dataset.theme = next;
  }, []);

  const value = useMemo<ThemeContextValue>(() => ({
    theme,
    toggleTheme: () => setTheme((current) => current === "light" ? "dark" : "light")
  }), [theme]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem("policylens-theme", theme);
  }, [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
}
