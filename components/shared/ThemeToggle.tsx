"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-10 h-10" />; // Placeholder to avoid layout shift
  }

  // Check if current active theme is dark
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="text-purple-900 hover:bg-white/10 hover:text-white dark:text-zinc-300 dark:hover:bg-zinc-800/80 dark:hover:text-zinc-100 h-10 w-10 rounded-full transition-all duration-200"
      title="Toggle Theme"
    >
      {!isDark ? (
        <Sun className="h-[1.1rem] w-[1.1rem] text-purple-900 transition-all duration-300" />
      ) : (
        <Moon className="h-[1.1rem] w-[1.1rem] text-purple-100 transition-all duration-300" />
      )}
    </Button>
  );
}
