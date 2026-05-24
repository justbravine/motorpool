"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    let initialTheme: "light" | "dark" = "light";

    try {
      const savedTheme = localStorage.getItem("motorpool-theme");
      if (savedTheme) {
        initialTheme = savedTheme === "dark" ? "dark" : "light";
      } else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
        initialTheme = "dark";
      }
    } catch (error) {
      // Fallback for devices restricting localStorage (e.g., iOS Safari private mode)
      if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
        initialTheme = "dark";
      }
    }

    setTheme(initialTheme);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme, mounted]);

  const toggleTheme = () => {
    setTheme((prevTheme) => {
      const nextTheme = prevTheme === "dark" ? "light" : "dark";
      try {
        localStorage.setItem("motorpool-theme", nextTheme);
      } catch (error) {}
      return nextTheme;
    });
  };

  // Prevent hydration mismatch by returning a consistent UI until mounted
  if (!mounted) {
    return (
      <button
        type="button"
        className="relative z-50 flex items-center justify-center h-9 w-9 md:h-10 md:w-10 rounded-full border border-[color:var(--panel-edge)] bg-[color:var(--panel)] text-[color:var(--muted-strong)] shadow-sm opacity-50 cursor-not-allowed"
        aria-label="Loading theme toggle"
        disabled
      >
        <Moon size={16} className="pointer-events-none" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="relative z-50 flex items-center justify-center h-9 w-9 md:h-10 md:w-10 rounded-full border border-[color:var(--panel-edge)] bg-[color:var(--panel)] text-[color:var(--muted-strong)] hover:text-[color:var(--foreground)] shadow-sm transition-all active:scale-90 touch-manipulation"
      aria-label="Toggle theme"
    >
      {theme === "dark" ? <Sun size={16} className="text-amber-500 pointer-events-none" /> : <Moon size={16} className="pointer-events-none" />}
    </button>
  );
}
