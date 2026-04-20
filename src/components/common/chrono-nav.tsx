"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Timer, Calendar, CalendarDays, Settings, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ModeSwitcher } from "../theme/mode-switcher";

const navItems = [
  {
    icon: Timer,
    label: "Stopwatch",
    href: "/",
  },
  {
    icon: CalendarDays,
    label: "Daily",
    href: "/day-calendar",
  },
  {
    icon: Calendar,
    label: "Yearly",
    href: "/year-calendar",
  },
];

export function ChronoNav() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <TooltipProvider delayDuration={0}>
      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 p-2 rounded-full border border-border bg-background/80 dark:bg-black/40 backdrop-blur-xl shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Tooltip key={item.href}>
              <TooltipTrigger asChild>
                <Link
                  href={item.href}
                  className={cn(
                    "relative flex items-center justify-center h-12 w-12 rounded-full transition-all duration-300 group",
                    isActive
                      ? "bg-foreground text-background scale-110 shadow-lg"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  <Icon className={cn("h-5 w-5 transition-transform duration-300", !isActive && "group-hover:scale-110")} />
                  {isActive && (
                    <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-0.5 rounded-full bg-foreground dark:bg-background" />
                  )}
                </Link>
              </TooltipTrigger>
              <TooltipContent side="top" className="bg-foreground text-background border-none font-medium">
                {item.label}
              </TooltipContent>
            </Tooltip>
          );
        })}

        <div className="w-[px] h-6 bg-border mx-1" />

        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center justify-center h-12 w-12 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-300">
              <ModeSwitcher />
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="bg-foreground text-background border-none font-medium">
            Toggle Theme
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Link 
              href="/settings"
              className="flex items-center justify-center h-12 w-12 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-300"
            >
              <Settings className="h-5 w-5" />
            </Link>
          </TooltipTrigger>
          <TooltipContent side="top" className="bg-foreground text-background border-none font-medium">
            Settings
          </TooltipContent>
        </Tooltip>
      </nav>
    </TooltipProvider>
  );
}
