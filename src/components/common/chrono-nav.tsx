"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Timer, Calendar, CalendarDays, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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

  return (
    <TooltipProvider delayDuration={0}>
      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 p-2 rounded-full border border-white/10 bg-black/40 backdrop-blur-xl shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
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
                      ? "bg-white text-black scale-110 shadow-lg" 
                      : "text-white/60 hover:text-white hover:bg-white/10"
                  )}
                >
                  <Icon className={cn("h-5 w-5 transition-transform duration-300", !isActive && "group-hover:scale-110")} />
                  {isActive && (
                    <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-black" />
                  )}
                </Link>
              </TooltipTrigger>
              <TooltipContent side="top" className="bg-white text-black border-none font-medium">
                {item.label}
              </TooltipContent>
            </Tooltip>
          );
        })}
        <div className="w-[1px] h-6 bg-white/10 mx-1" />
        <Tooltip>
          <TooltipTrigger asChild>
            <button className="flex items-center justify-center h-12 w-12 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-all duration-300">
              <Settings className="h-5 w-5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="bg-white text-black border-none font-medium">
            Settings
          </TooltipContent>
        </Tooltip>
      </nav>
    </TooltipProvider>
  );
}
