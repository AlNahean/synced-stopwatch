"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RotateCcw, Play, Pause, Flag, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

type Lap = {
  id: string;
  time: string;
};

type StopwatchState = {
  isRunning: boolean;
  startTime: string;
  elapsedTime: string;
  laps: Lap[];
};

const formatTime = (time: number) => {
  const milliseconds = Math.floor((time % 1000) / 10);
  const seconds = Math.floor((time / 1000) % 60);
  const minutes = Math.floor((time / (1000 * 60)) % 60);
  const hours = Math.floor(time / (1000 * 60 * 60));

  const minutesString = minutes.toString().padStart(2, '0');
  const secondsString = seconds.toString().padStart(2, '0');
  const millisecondsString = milliseconds.toString().padStart(2, '0');

  if (hours > 0) {
    const hoursString = hours.toString().padStart(2, '0');
    return `${hoursString}:${minutesString}:${secondsString}`;
  }

  return `${minutesString}:${secondsString}.${millisecondsString}`;
};

function StopwatchSkeleton() {
  return (
    <main className="fixed inset-0 bg-[#000000] text-white flex flex-col p-8 md:p-16 pb-28 sm:pb-32 overflow-hidden select-none antialiased">
      <header className="flex-none z-10 mb-8 md:mb-16">
        <Skeleton className="h-3 w-48 bg-white/5" />
        <Skeleton className="h-[max(5vw,3rem)] w-3/4 mt-4 bg-white/10" />
        <div className="flex gap-4 mt-6">
          <Skeleton className="h-3 w-24 bg-white/5" />
          <Skeleton className="h-3 w-24 bg-white/5" />
        </div>
      </header>
      <section className="flex-1 w-full flex items-center justify-center py-6">
        <div className="flex items-center gap-12 sm:gap-24 opacity-50">
          <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-white/5 border border-white/5" />
          <div className="h-24 w-24 sm:h-32 sm:w-32 rounded-full bg-white/10 border border-white/5" />
          <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-white/5 border border-white/5" />
        </div>
      </section>
      <footer className="flex-none z-10 flex justify-between items-end border-t border-[#111] pt-8">
        <div className="flex flex-col gap-4">
          <Skeleton className="h-6 w-32 bg-white/5" />
          <Skeleton className="h-6 w-32 bg-white/5" />
        </div>
        <div className="flex flex-col gap-2 items-end">
          <Skeleton className="h-3 w-24 bg-white/5" />
          <Skeleton className="h-3 w-32 bg-white/5" />
        </div>
      </footer>
    </main>
  );
}

export default function Home() {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [laps, setLaps] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const syncState = async (action: string, body?: object) => {
    try {
      await fetch("/api/stopwatch/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...body }),
      });
    } catch (error) {
      console.error(`Failed to sync action '${action}':`, error);
    }
  };

  useEffect(() => {
    const fetchInitialState = async () => {
      try {
        const response = await fetch("/api/stopwatch");
        const data: StopwatchState = await response.json();

        const elapsedTime = Number(data.elapsedTime);
        setIsRunning(data.isRunning);
        setLaps(data.laps.map(lap => Number(lap.time)));

        if (data.isRunning) {
          const startTime = new Date(data.startTime).getTime();
          const initialTime = Date.now() - startTime;
          setTime(initialTime);

          timerRef.current = setInterval(() => {
            setTime(Date.now() - startTime);
          }, 10);
        } else {
          setTime(elapsedTime);
        }
      } catch (error) {
        console.error("Failed to fetch initial state:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInitialState();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleStartPause = useCallback(() => {
    if (isRunning) {
      // Pause
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setIsRunning(false);
      syncState("pause");
    } else {
      // Start/Resume
      const startTime = Date.now() - time;
      timerRef.current = setInterval(() => {
        setTime(Date.now() - startTime);
      }, 10);
      setIsRunning(true);
      syncState("start");
    }
  }, [isRunning, time]);

  const handleLap = useCallback(() => {
    if (isRunning) {
      setLaps((prevLaps) => [time, ...prevLaps]);
      syncState("lap", { currentTime: time });
    }
  }, [isRunning, time]);

  const handleReset = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTime(0);
    setLaps([]);
    setIsRunning(false);
    syncState("reset");
  }, []);

  if (isLoading) {
    return <StopwatchSkeleton />;
  }

  return (
    <main className="fixed inset-0 bg-[#000000] text-white flex flex-col p-8 md:p-16 pb-28 sm:pb-32 overflow-hidden select-none antialiased">
      {/* HEADER: De-congested Style */}
      <header className="flex-none z-10 mb-8 md:mb-16">
        <p className="font-mono text-[9px] md:text-[11px] tracking-[0.5em] text-[#555] uppercase">
          CHRONO.STOPWATCH.SYNCED
        </p>
        <div className="flex items-baseline gap-x-4 mt-2">
          <h1 className="text-[clamp(2.5rem,10vw,6rem)] font-black tracking-tighter leading-none">
            {formatTime(time)}
          </h1>
        </div>
        <div className="flex flex-wrap gap-4 mt-6">
          <p className="font-mono text-[8px] sm:text-[10px] tracking-[0.3em] text-[#333] uppercase">
            RESOLUTION: 10_MS
          </p>
          <p className="font-mono text-[8px] sm:text-[10px] tracking-[0.3em] text-[#333] uppercase">
            STATUS: <span className={cn(isRunning ? "text-[#FF4500]" : "text-[#444]")}>{isRunning ? "ACTIVE" : "PAUSED"}</span>
          </p>
        </div>
      </header>

      {/* CONTROLS: Central Hub */}
      <section className="flex-1 w-full flex items-center justify-center py-6">
        <div className="flex items-center gap-12 sm:gap-24">
          <button
            onClick={handleReset}
            disabled={time === 0 && !isRunning}
            className="group flex flex-col items-center gap-3 disabled:opacity-20 transition-all duration-300"
          >
            <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-white/5 transition-colors">
              <RotateCcw className="h-6 w-6 sm:h-8 sm:w-8 text-white/60" />
            </div>
            <span className="font-mono text-[9px] tracking-widest text-[#444] group-hover:text-white/60 transition-colors">RESET</span>
          </button>

          <button
            onClick={handleStartPause}
            className="group flex flex-col items-center gap-6 transition-all duration-300"
          >
            <div className={cn(
              "h-24 w-24 sm:h-32 sm:w-32 rounded-full border flex items-center justify-center transition-all duration-500 scale-100 hover:scale-105 active:scale-95 shadow-2xl",
              isRunning 
                ? "border-[#FF4500]/40 bg-[#FF4500]/5 shadow-[#FF4500]/5" 
                : "border-white/5 bg-white/2 shadow-white/2"
            )}>
              {isRunning ? (
                <Pause className="h-8 w-8 sm:h-12 sm:w-12 fill-[#FF4500] text-[#FF4500]" />
              ) : (
                <Play className="h-8 w-8 sm:h-12 sm:w-12 fill-white text-white ml-2" />
              )}
            </div>
            <span className={cn(
              "font-mono text-[11px] font-bold tracking-[0.3em] transition-colors",
              isRunning ? "text-[#FF4500]" : "text-white/60"
            )}>
              {isRunning ? "PAUSE" : "START"}
            </span>
          </button>

          <button
            onClick={handleLap}
            disabled={!isRunning || time === 0}
            className="group flex flex-col items-center gap-3 disabled:opacity-20 transition-all duration-300"
          >
            <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-white/5 transition-colors">
              <Flag className="h-6 w-6 sm:h-8 sm:w-8 text-white/60" />
            </div>
            <span className="font-mono text-[9px] tracking-widest text-[#444] group-hover:text-white/60 transition-colors">LAP</span>
          </button>
        </div>
      </section>

      {/* FOOTER: Minimalist Stats & Laps */}
      <footer className="flex-none z-10 flex justify-between items-end border-t border-[#111] pt-8">
        <div className="flex flex-col gap-4 max-h-[15vh] overflow-y-auto no-scrollbar pr-4">
          {laps.slice(0, 3).map((lap, index) => (
            <div key={index} className="flex items-center gap-4 animate-in fade-in slide-in-from-left-4 duration-300">
               <span className="font-mono text-[9px] text-[#333]">L.0{laps.length - index}</span>
               <span className="font-mono text-base font-bold text-white/40 tabular-nums tracking-wider">{formatTime(lap)}</span>
            </div>
          ))}
          {laps.length > 3 && (
            <p className="font-mono text-[8px] text-[#222] tracking-[0.3em]">+ {laps.length - 3} MORE LAPS</p>
          )}
        </div>

        <div className="text-right font-mono text-[8px] sm:text-[9px] tracking-[0.3em] text-[#333] space-y-1 uppercase">
          <p className="flex items-center justify-end gap-2 text-[#444]">
            <span className="w-1 h-1 rounded-full bg-[#FF4500] opacity-60" />
            SYSTEM: <span className="text-[#777]">SYNCED</span>
          </p>
          <p className="opacity-60">VERSION: 0.1.0_CORE</p>
          <p className="opacity-40 text-[7px]">LATENCY: 0.0001MS</p>
        </div>
      </footer>

      <style jsx global>{`
        body { background: black; margin: 0; overflow: hidden; height: 100dvh; }
      `}</style>
    </main>
  );
}