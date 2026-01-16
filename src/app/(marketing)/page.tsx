"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RotateCcw, Play, Pause, Flag, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

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

  return (
    <div className="container mx-auto py-6 sm:py-10 px-4 flex justify-center min-h-[calc(100vh-4rem)] items-center sm:items-start">
      <Card className="w-full max-w-lg sm:max-w-xl md:max-w-2xl shadow-xl border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl sm:text-2xl text-center font-bold tracking-tight">Stopwatch</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center p-4 sm:p-6">
          {isLoading ? (
            <div className="flex justify-center items-center h-[300px]">
              <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* Timer Display */}
              <div className="flex items-center justify-center py-8 sm:py-12 w-full overflow-hidden">
                <p
                  className={cn(
                    "font-mono font-bold text-foreground tabular-nums tracking-tighter leading-none select-none",
                    // Use viewport width (vw) for mobile to prevent cutoff, fixed size for larger screens
                    "text-[15vw] sm:text-7xl md:text-8xl"
                  )}
                >
                  {formatTime(time)}
                </p>
              </div>

              {/* Controls */}
              <div className="w-full flex flex-row justify-center items-center gap-4 sm:gap-8 mb-8">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-16 w-16 sm:h-20 sm:w-20 rounded-full border-2 hover:bg-muted active:scale-95 transition-all shrink-0"
                  onClick={handleReset}
                  disabled={time === 0 && !isRunning}
                  aria-label="Reset"
                >
                  <RotateCcw className="h-6 w-6 sm:h-8 sm:w-8" />
                </Button>

                <Button
                  variant={isRunning ? "destructive" : "default"}
                  size="icon"
                  className={cn(
                    "h-24 w-24 sm:h-28 sm:w-28 rounded-full shadow-lg hover:shadow-xl active:scale-95 transition-all shrink-0",
                    isRunning ? "bg-red-500 hover:bg-red-600" : "bg-primary hover:bg-primary/90"
                  )}
                  onClick={handleStartPause}
                  aria-label={isRunning ? "Pause" : "Start"}
                >
                  {isRunning ? (
                    <Pause className="h-10 w-10 sm:h-12 sm:w-12 fill-current" />
                  ) : (
                    <Play className="h-10 w-10 sm:h-12 sm:w-12 fill-current ml-1" />
                  )}
                </Button>

                <Button
                  variant="outline"
                  size="icon"
                  className="h-16 w-16 sm:h-20 sm:w-20 rounded-full border-2 hover:bg-muted active:scale-95 transition-all shrink-0"
                  onClick={handleLap}
                  disabled={!isRunning || time === 0}
                  aria-label="Lap"
                >
                  <Flag className="h-6 w-6 sm:h-8 sm:w-8" />
                </Button>
              </div>

              {/* Laps List */}
              <div className="w-full mt-2">
                {laps.length > 0 && (
                  <div className="flex items-center justify-between px-4 pb-2 text-sm font-medium text-muted-foreground border-b mb-2">
                    <span>Lap No.</span>
                    <span>Split Time</span>
                  </div>
                )}
                <ScrollArea className={cn("w-full rounded-md transition-all duration-300", laps.length > 0 ? "h-64 sm:h-72 border bg-muted/20" : "h-0")}>
                  <ul className="divide-y divide-border/50">
                    {laps.map((lap, index) => {
                      const previousLap = laps[index + 1] || 0;
                      const lapTime = lap - previousLap;
                      const lapNumber = laps.length - index;

                      return (
                        <li key={index} className="flex justify-between items-center py-3 px-4 hover:bg-muted/50 transition-colors text-sm sm:text-base">
                          <span className="font-medium text-muted-foreground">Lap {lapNumber}</span>
                          <span className="font-mono text-foreground tabular-nums font-semibold">{formatTime(lapTime)}</span>
                        </li>
                      );
                    })}
                  </ul>
                </ScrollArea>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}