"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-10 w-10" />;
  }

  const isDark = theme === "dark";

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="
        h-10 w-10 rounded-full
        text-purple-900 
        hover:bg-purple-100/50
        hover:text-purple-700
        
        dark:text-purple-200
        dark:hover:bg-purple-900/30
        dark:hover:text-purple-100
        
        transition-all duration-300
      "
      title="Toggle Theme"
    >
      {isDark ? (
        <Moon className="h-[1.1rem] w-[1.1rem] transition-transform duration-300 hover:rotate-12" />
      ) : (
        <Sun className="h-[1.1rem] w-[1.1rem] transition-transform duration-300 hover:rotate-45" />
      )}
    </Button>
  );
}
