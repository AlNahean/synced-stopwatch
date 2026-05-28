"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  ChevronLeft, 
  ChevronRight, 
  Sunrise, 
  Sun, 
  SunDim, 
  Sunset, 
  Moon, 
  CheckCircle2, 
  Calendar as CalendarIcon, 
  Sparkles, 
  Clock, 
  Loader2 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

type SalatProgress = {
  id?: string;
  date: string;
  fajr: boolean;
  dhuhr: boolean;
  asr: boolean;
  maghrib: boolean;
  isha: boolean;
};

type PrayerKey = "fajr" | "dhuhr" | "asr" | "maghrib" | "isha";

const PRAYERS: { key: PrayerKey; name: string; time: string; icon: React.ComponentType<any> }[] = [
  { key: "fajr", name: "Fajr", time: "Dawn", icon: Sunrise },
  { key: "dhuhr", name: "Dhuhr", time: "Noon", icon: Sun },
  { key: "asr", name: "Asr", time: "Afternoon", icon: SunDim },
  { key: "maghrib", name: "Maghrib", time: "Sunset", icon: Sunset },
  { key: "isha", name: "Isha", time: "Night", icon: Moon },
];

export default function SalatPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(() => new Date());
  const [logs, setLogs] = useState<Record<string, SalatProgress>>({});
  const [loading, setLoading] = useState(true);

  // Helper to format date locally timezone-safely (YYYY-MM-DD)
  const formatDateString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const selectedDateStr = formatDateString(selectedDate);
  const selectedYear = selectedDate.getFullYear();

  // Fetch all Salat logs for the current selected year
  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/salat?year=${selectedYear}`);
        if (!response.ok) throw new Error("Failed to load records");
        const data: SalatProgress[] = await response.json();
        
        // Convert to a dictionary for O(1) lookups
        const logsMap: Record<string, SalatProgress> = {};
        data.forEach((log) => {
          logsMap[log.date] = log;
        });
        setLogs(logsMap);
      } catch (err) {
        console.error("Error fetching Salat logs:", err);
        toast.error("Failed to load prayer records.");
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [selectedYear]);

  // Compute stats for today
  const selectedDayProgress = logs[selectedDateStr] || {
    date: selectedDateStr,
    fajr: false,
    dhuhr: false,
    asr: false,
    maghrib: false,
    isha: false,
  };

  const completedCount = useMemo(() => {
    let count = 0;
    if (selectedDayProgress.fajr) count++;
    if (selectedDayProgress.dhuhr) count++;
    if (selectedDayProgress.asr) count++;
    if (selectedDayProgress.maghrib) count++;
    if (selectedDayProgress.isha) count++;
    return count;
  }, [selectedDayProgress]);

  const progressPercentage = Math.round((completedCount / 5) * 100);

  // Toggle prayer state
  const handleTogglePrayer = async (prayer: PrayerKey) => {
    const originalState = selectedDayProgress[prayer];
    const newState = !originalState;

    // Optimistic Update
    setLogs((prev) => {
      const updatedRecord = {
        ...selectedDayProgress,
        [prayer]: newState,
      };
      return {
        ...prev,
        [selectedDateStr]: updatedRecord,
      };
    });

    try {
      const res = await fetch("/api/salat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: selectedDateStr,
          prayer,
          completed: newState,
        }),
      });

      if (!res.ok) throw new Error("Network response was not ok");
      
      const updatedData: SalatProgress = await res.json();
      
      // Update with server returned model just in case
      setLogs((prev) => ({
        ...prev,
        [selectedDateStr]: updatedData,
      }));

      // Show success toast on full completion
      const itemsCount = [
        prayer === "fajr" ? newState : selectedDayProgress.fajr,
        prayer === "dhuhr" ? newState : selectedDayProgress.dhuhr,
        prayer === "asr" ? newState : selectedDayProgress.asr,
        prayer === "maghrib" ? newState : selectedDayProgress.maghrib,
        prayer === "isha" ? newState : selectedDayProgress.isha,
      ].filter(Boolean).length;

      if (itemsCount === 5 && newState) {
        toast.success("SubhanAllah! All prayers completed today! 🎉");
      }
    } catch (err) {
      console.error("Failed to update prayer:", err);
      toast.error("Failed to save progress. Reverting...");
      
      // Revert optimistic update
      setLogs((prev) => ({
        ...prev,
        [selectedDateStr]: {
          ...selectedDayProgress,
          [prayer]: originalState,
        },
      }));
    }
  };

  // Month navigation
  const handlePrevMonth = () => {
    setCurrentMonthDate((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() - 1);
      return d;
    });
  };

  const handleNextMonth = () => {
    setCurrentMonthDate((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + 1);
      return d;
    });
  };

  const handleGoToToday = () => {
    const today = new Date();
    setSelectedDate(today);
    setCurrentMonthDate(today);
  };

  // Generate Month Grid Days
  const monthDays = useMemo(() => {
    const year = currentMonthDate.getFullYear();
    const month = currentMonthDate.getMonth();
    
    const firstDayIndex = new Date(year, month, 1).getDay(); // Sunday = 0
    const totalDays = new Date(year, month + 1, 0).getDate();
    
    const days: { date: Date | null; dayNumber: number | null; dateStr: string | null }[] = [];
    
    // Add empty spacers before the first day of the month
    for (let i = 0; i < firstDayIndex; i++) {
      days.push({ date: null, dayNumber: null, dateStr: null });
    }
    
    // Add all days of the month
    for (let day = 1; day <= totalDays; day++) {
      const date = new Date(year, month, day);
      days.push({
        date,
        dayNumber: day,
        dateStr: formatDateString(date),
      });
    }
    
    return days;
  }, [currentMonthDate]);

  // Compute Salat completion counts per date string
  const getCompletedCountForDate = (dateStr: string) => {
    const log = logs[dateStr];
    if (!log) return 0;
    let count = 0;
    if (log.fajr) count++;
    if (log.dhuhr) count++;
    if (log.asr) count++;
    if (log.maghrib) count++;
    if (log.isha) count++;
    return count;
  };

  const getDayColorClass = (count: number) => {
    switch (count) {
      case 0:
        return "bg-muted/30 text-muted-foreground hover:bg-muted/50 border border-border/50";
      case 1:
        return "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-500/20 border border-emerald-500/10";
      case 2:
        return "bg-emerald-500/25 text-emerald-900 dark:text-emerald-200 hover:bg-emerald-500/35 border border-emerald-500/20";
      case 3:
        return "bg-emerald-500/45 text-emerald-950 dark:text-emerald-100 hover:bg-emerald-500/55 border border-emerald-500/30";
      case 4:
        return "bg-emerald-500/70 text-white hover:bg-emerald-500/80 border border-emerald-500/50";
      case 5:
        return "bg-emerald-600 text-white font-bold hover:bg-emerald-600/90 shadow-[0_0_15px_rgba(16,185,129,0.3)] border border-emerald-600";
      default:
        return "bg-muted/30";
    }
  };

  // Generate Year Matrix Days (continuous contribution graph)
  const yearDays = useMemo(() => {
    const days: { date: Date | null; dateStr: string | null }[] = [];
    const jan1 = new Date(selectedYear, 0, 1);
    const startOffset = jan1.getDay(); // spacers needed
    
    // Add spacer days
    for (let i = 0; i < startOffset; i++) {
      days.push({ date: null, dateStr: null });
    }
    
    // Fill the 365/366 days of the year
    const d = new Date(selectedYear, 0, 1);
    while (d.getFullYear() === selectedYear) {
      days.push({
        date: new Date(d),
        dateStr: formatDateString(d),
      });
      d.setDate(d.getDate() + 1);
    }
    
    return days;
  }, [selectedYear]);

  // Handle year matrix cell click
  const handleYearCellClick = (date: Date) => {
    setSelectedDate(date);
    setCurrentMonthDate(date);
  };

  return (
    <main className="fixed inset-0 bg-background text-foreground flex flex-col p-4 sm:p-6 md:p-8 lg:p-12 pb-28 sm:pb-32 overflow-y-auto no-scrollbar antialiased">
      <Toaster position="top-right" richColors />
      
      {/* HEADER SECTION */}
      <header className="flex-none mb-6 sm:mb-8 md:mb-10 bg-background/80 backdrop-blur-sm z-10 sticky top-0 py-2 border-b border-border/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="font-mono text-[9px] md:text-[11px] tracking-[0.4em] text-muted-foreground/60 uppercase">
              CELESTIAL.PRAYER.CYCLE
            </p>
            <div className="flex items-center gap-3 mt-1.5">
              <h1 className="text-[clamp(1.8rem,5vw,3rem)] font-black tracking-tighter leading-none uppercase">
                Salat Tracker
              </h1>
              <div className="flex items-center gap-1 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold tracking-wider">
                <Sparkles className="h-3 w-3 animate-pulse" />
                SPIRITUAL_GROWTH
              </div>
            </div>
            <p className="font-mono text-[8px] sm:text-[10px] tracking-[0.2em] text-muted-foreground/40 uppercase mt-2">
              YEAR_CYCLE: {selectedYear} // SELECTED: {selectedDate.toLocaleDateString("en-US", { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase()}
            </p>
          </div>

          <div className="flex items-center gap-3 sm:self-end">
            <button
              onClick={handleGoToToday}
              className="px-4 py-1.5 rounded-full border border-border bg-muted/20 hover:bg-muted text-xs font-mono tracking-wider transition-colors duration-300"
            >
              TODAY
            </button>
            <div className="flex items-center bg-muted/10 border border-border/60 rounded-full px-2 py-1">
              <button
                onClick={() => {
                  const prev = new Date(selectedDate);
                  prev.setDate(prev.getDate() - 1);
                  setSelectedDate(prev);
                  if (prev.getMonth() !== currentMonthDate.getMonth() || prev.getFullYear() !== currentMonthDate.getFullYear()) {
                    setCurrentMonthDate(prev);
                  }
                }}
                className="p-1 hover:text-emerald-500 transition-colors"
                title="Previous Day"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="font-mono text-[10px] font-bold px-3 tabular-nums">
                {selectedDateStr}
              </span>
              <button
                onClick={() => {
                  const next = new Date(selectedDate);
                  next.setDate(next.getDate() + 1);
                  setSelectedDate(next);
                  if (next.getMonth() !== currentMonthDate.getMonth() || next.getFullYear() !== currentMonthDate.getFullYear()) {
                    setCurrentMonthDate(next);
                  }
                }}
                className="p-1 hover:text-emerald-500 transition-colors"
                title="Next Day"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT DASHBOARD */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start max-w-7xl mx-auto w-full pb-8">
        
        {/* LEFT COLUMN: DAILY PRAYER CHECKLIST (5 cols) */}
        <section className="lg:col-span-5 flex flex-col gap-6 p-5 sm:p-6 rounded-2xl border border-border/80 bg-muted/5 dark:bg-black/20 backdrop-blur-md relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-emerald-500/10 transition-all duration-500" />
          
          <div className="flex justify-between items-baseline border-b border-border/40 pb-4">
            <div>
              <h3 className="font-mono text-[10px] font-bold tracking-[0.3em] uppercase text-muted-foreground/60">
                DAILY_CHECKLIST
              </h3>
              <p className="text-xl sm:text-2xl font-bold tracking-tight mt-1 text-foreground/90">
                {selectedDate.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
              </p>
            </div>
            <div className="text-right">
              <span className="text-2xl sm:text-3xl font-black text-emerald-500 tracking-tighter">
                {progressPercentage}%
              </span>
              <p className="font-mono text-[9px] text-muted-foreground/60 tracking-wider mt-0.5">
                {completedCount}/5 COMPLETED
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {PRAYERS.map(({ key, name, time, icon: Icon }) => {
              const isChecked = selectedDayProgress[key];
              return (
                <button
                  key={key}
                  onClick={() => handleTogglePrayer(key)}
                  className={cn(
                    "w-full flex items-center justify-between p-4 rounded-xl border transition-all duration-300 scale-100 hover:scale-[1.01] active:scale-[0.99] group text-left",
                    isChecked
                      ? "border-emerald-500/40 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400 dark:bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.05)]"
                      : "border-border/80 bg-muted/20 hover:bg-muted/40 text-foreground/80 hover:text-foreground"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "p-2.5 rounded-lg border transition-all duration-300",
                      isChecked 
                        ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-500" 
                        : "border-border/50 bg-background/50 text-muted-foreground/60 group-hover:text-foreground"
                    )}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-bold text-sm sm:text-base leading-none mb-0.5">{name}</p>
                      <p className="font-mono text-[9px] text-muted-foreground/50 tracking-widest uppercase leading-none">{time}</p>
                    </div>
                  </div>

                  <div className={cn(
                    "h-6 w-6 rounded-full border flex items-center justify-center transition-all duration-300",
                    isChecked
                      ? "bg-emerald-500 border-emerald-500 text-white"
                      : "border-border/80 bg-background"
                  )}>
                    {isChecked && <CheckCircle2 className="h-4 w-4 fill-emerald-500 text-white" />}
                  </div>
                </button>
              );
            })}
          </div>

          {/* SPIRITUAL MOTIVATION METER */}
          <div className="p-4 rounded-xl border border-border/40 bg-muted/10 font-mono text-[9px] leading-relaxed text-muted-foreground/70">
            {completedCount === 0 && "⚡ Start your day with Fajr. Each prayer establishes a solid anchor in time."}
            {completedCount > 0 && completedCount < 5 && "👍 Keep going. Consistently synchronizing your heart with the prayer cycle brings alignment."}
            {completedCount === 5 && "✨ Alhamdulillah! Today your cycle is completely synced. May peace and tranquility remain with you."}
          </div>
        </section>

        {/* RIGHT COLUMN: MONTH CALENDAR & YEAR MATRIX (7 cols) */}
        <section className="lg:col-span-7 flex flex-col gap-6">
          
          {/* MONTH CALENDAR CONTAINER */}
          <div className="p-5 sm:p-6 rounded-2xl border border-border/80 bg-muted/5 dark:bg-black/20 backdrop-blur-md">
            {/* MONTH HEADER */}
            <div className="flex items-center justify-between mb-4 border-b border-border/30 pb-3">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-emerald-500" />
                <h3 className="font-mono text-[10px] font-bold tracking-[0.3em] uppercase text-muted-foreground/60">
                  MONTHLY_VIEW
                </h3>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-sm sm:text-base uppercase tracking-wider font-mono">
                  {currentMonthDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                </span>
                <div className="flex items-center bg-muted/30 border border-border/40 rounded-lg p-0.5">
                  <button
                    onClick={handlePrevMonth}
                    className="p-1 hover:text-emerald-500 transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={handleNextMonth}
                    className="p-1 hover:text-emerald-500 transition-colors"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* MONTH WEEKDAY LABELS */}
            <div className="grid grid-cols-7 gap-1.5 text-center mb-2">
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                <div key={day} className="font-mono text-[9px] font-bold text-muted-foreground/40 uppercase py-1">
                  {day}
                </div>
              ))}
            </div>

            {/* MONTH DAYS GRID */}
            <div className="grid grid-cols-7 gap-1.5">
              {loading && Object.keys(logs).length === 0 ? (
                Array.from({ length: 35 }).map((_, i) => (
                  <div key={i} className="aspect-square rounded-xl bg-muted/20 animate-pulse border border-border/20" />
                ))
              ) : (
                monthDays.map((item, idx) => {
                  if (!item.date || !item.dateStr) {
                    return <div key={`empty-${idx}`} className="aspect-square" />;
                  }

                  const isSelected = item.dateStr === selectedDateStr;
                  const isToday = item.dateStr === formatDateString(new Date());
                  const count = getCompletedCountForDate(item.dateStr);
                  const colorClass = getDayColorClass(count);

                  return (
                    <button
                      key={item.dateStr}
                      onClick={() => setSelectedDate(item.date!)}
                      className={cn(
                        "aspect-square rounded-xl flex flex-col items-center justify-between p-1.5 text-xs transition-all duration-300 relative group overflow-hidden border",
                        colorClass,
                        isSelected && "ring-2 ring-emerald-500 ring-offset-2 ring-offset-background scale-95 border-emerald-500 z-10",
                        isToday && !isSelected && "border-primary/80 border-2 font-black"
                      )}
                    >
                      <span className="font-mono text-[9px] font-bold opacity-60 self-start">
                        {item.dayNumber}
                      </span>
                      
                      {/* Tiny dots indicator */}
                      <div className="flex gap-0.5 justify-center w-full mt-1">
                        {PRAYERS.map(({ key }) => {
                          const done = logs[item.dateStr!]?.[key];
                          return (
                            <span 
                              key={key} 
                              className={cn(
                                "w-1 h-1 rounded-full",
                                done 
                                  ? (count >= 4 ? "bg-white" : "bg-emerald-500") 
                                  : "bg-muted-foreground/20"
                              )} 
                            />
                          );
                        })}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* YEAR HEAT MAP CONTROLS & MATRIX */}
          <div className="p-5 sm:p-6 rounded-2xl border border-border/80 bg-muted/5 dark:bg-black/20 backdrop-blur-md">
            <div className="flex items-center justify-between mb-4 border-b border-border/30 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-emerald-500" />
                <h3 className="font-mono text-[10px] font-bold tracking-[0.3em] uppercase text-muted-foreground/60">
                  ANNUAL_CYCLE_MATRIX
                </h3>
              </div>
              <div className="font-mono text-[9px] text-muted-foreground/50 tracking-wider uppercase">
                HEATMAP_RESOLUTION: 1_DAY
              </div>
            </div>

            {/* CONTRIBUTION GRAPH */}
            <div className="relative w-full overflow-x-auto no-scrollbar py-2">
              <div 
                className="grid grid-flow-col grid-rows-7 gap-[3px] min-w-[700px] w-full"
                style={{ gridTemplateColumns: "repeat(54, minmax(0, 1fr))" }}
              >
                {loading && Object.keys(logs).length === 0 ? (
                  Array.from({ length: 371 }).map((_, i) => (
                    <div key={i} className="aspect-square rounded-[3px] bg-muted/20 animate-pulse" />
                  ))
                ) : (
                  yearDays.map((item, idx) => {
                    if (!item.date || !item.dateStr) {
                      return <div key={`y-empty-${idx}`} className="aspect-square rounded-[3px]" />;
                    }

                    const count = getCompletedCountForDate(item.dateStr);
                    const isSelected = item.dateStr === selectedDateStr;
                    
                    // Style by completion density
                    let cellBg = "bg-muted/30 dark:bg-muted/10";
                    if (count === 1) cellBg = "bg-emerald-500/15";
                    else if (count === 2) cellBg = "bg-emerald-500/35";
                    else if (count === 3) cellBg = "bg-emerald-500/60";
                    else if (count === 4) cellBg = "bg-emerald-500/80";
                    else if (count === 5) cellBg = "bg-emerald-500 dark:bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.3)]";

                    return (
                      <button
                        key={item.dateStr}
                        onClick={() => handleYearCellClick(item.date!)}
                        className={cn(
                          "aspect-square rounded-[2px] transition-all duration-200 cursor-pointer w-full max-w-[12px] group relative hover:scale-125 hover:z-20",
                          cellBg,
                          isSelected && "ring-1.5 ring-emerald-500 ring-offset-1 ring-offset-background scale-110"
                        )}
                        title={`${item.dateStr}: ${count}/5 Prayers`}
                      />
                    );
                  })
                )}
              </div>
            </div>

            {/* HEAT MAP LEGEND */}
            <div className="flex justify-between items-center mt-3 pt-3 border-t border-border/20 font-mono text-[8px] sm:text-[9px] text-muted-foreground/50">
              <div className="flex gap-2">
                <span>YEAR_ACCUMULATION:</span>
                <span className="text-emerald-500 dark:text-emerald-400 font-bold uppercase">
                  {Object.values(logs).reduce((total, log) => {
                    let d = 0;
                    if (log.fajr) d++;
                    if (log.dhuhr) d++;
                    if (log.asr) d++;
                    if (log.maghrib) d++;
                    if (log.isha) d++;
                    return total + d;
                  }, 0)} PRAYERS COMPLETED
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span>LESS</span>
                <span className="w-2.5 h-2.5 rounded-[2px] bg-muted/30 dark:bg-muted/10" />
                <span className="w-2.5 h-2.5 rounded-[2px] bg-emerald-500/20" />
                <span className="w-2.5 h-2.5 rounded-[2px] bg-emerald-500/50" />
                <span className="w-2.5 h-2.5 rounded-[2px] bg-emerald-500" />
                <span>MORE</span>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* FOOTER SECTION */}
      <footer className="flex-none max-w-7xl mx-auto w-full flex justify-between items-end border-t border-border/50 pt-6 mt-6 bg-background/80 backdrop-blur-sm relative">
        <div className="flex flex-col">
          <span className="font-mono text-sm sm:text-xl font-bold tracking-widest leading-none text-foreground/90 uppercase">
            SYNCED_STATE
          </span>
          <p className="font-mono text-[8px] sm:text-[9px] tracking-[0.4em] text-muted-foreground/60 mt-2 uppercase">
            DATABSE: PRISMA_POSTGRESQL // LOCALTIME: {new Date().toLocaleTimeString("en-GB", {hour12: false})}
          </p>
        </div>
        
        <div className="text-right font-mono text-[8px] sm:text-[9px] tracking-[0.3em] text-muted-foreground/40 space-y-1 uppercase hidden xs:block">
          <p className="flex items-center justify-end gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            CORE: <span className="text-emerald-500/80 font-bold">ONLINE</span>
          </p>
          <p className="opacity-60 text-[7px] tracking-[0.4em]">SYSTEM_VERSION_V1.1.0_SALAT</p>
        </div>
      </footer>

      {/* CUSTOM STYLE OVERRIDES */}
      <style jsx global>{`
        /* Hide scrollbars but keep scrolling working */
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </main>
  );
}
