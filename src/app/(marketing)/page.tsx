"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RotateCcw, Play, Pause, Flag, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import io, { Socket } from "socket.io-client";

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

let socket: Socket;

export default function Home() {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [laps, setLaps] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const updateStateFromServer = (data: StopwatchState) => {
    if (timerRef.current) clearInterval(timerRef.current);

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
  };

  useEffect(() => {
    const socketInitializer = async () => {
      await fetch('/api/socket');
      socket = io();

      socket.on('connect', () => {
        console.log('Connected to WebSocket server');
      });

      socket.on('state_update', (data: StopwatchState) => {
        updateStateFromServer(data);
      });
    };

    const fetchInitialState = async () => {
      try {
        const response = await fetch("/api/stopwatch");
        const data: StopwatchState = await response.json();
        updateStateFromServer(data);
      } catch (error) {
        console.error("Failed to fetch initial state:", error);
      } finally {
        setIsLoading(false);
      }
    };

    socketInitializer();
    fetchInitialState();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (socket) socket.disconnect();
    };
  }, []);

  const handleStartPause = useCallback(() => {
    // Optimistic update
    setIsRunning(prev => !prev);
    if (isRunning) {
      if (timerRef.current) clearInterval(timerRef.current);
      socket.emit("action", { action: "pause" });
    } else {
      const startTime = Date.now() - time;
      timerRef.current = setInterval(() => {
        setTime(Date.now() - startTime);
      }, 10);
      socket.emit("action", { action: "start" });
    }
  }, [isRunning, time]);

  const handleLap = useCallback(() => {
    if (isRunning) {
      // Optimistic update
      setLaps((prevLaps) => [time, ...prevLaps]);
      socket.emit("action", { action: "lap", currentTime: time });
    }
  }, [isRunning, time]);

  const handleReset = useCallback(() => {
    // Optimistic update
    if (timerRef.current) clearInterval(timerRef.current);
    setTime(0);
    setLaps([]);
    setIsRunning(false);
    socket.emit("action", { action: "reset" });
  }, []);

  const isHourReached = time >= 3600000;

  return (
    <div className="container mx-auto py-10 flex justify-center">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Stopwatch</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center">
          {isLoading ? (
            <div className="flex justify-center items-center h-[300px]">
              <Loader2 className="h-12 w-12 animate-spin" />
            </div>
          ) : (
            <>
              <div className="items-center justify-center pt-8 pb-4">
                <p className={cn("font-bold text-foreground tabular-nums", isHourReached ? 'text-7xl' : 'text-8xl')}>
                  {formatTime(time)}
                </p>
              </div>

              <div className="w-full flex-row justify-around items-center my-8 px-4 flex">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-20 h-20 rounded-full"
                  onClick={handleReset}
                  disabled={time === 0 && !isRunning}
                >
                  <RotateCcw size={24} />
                </Button>

                <Button
                  variant={isRunning ? "destructive" : "default"}
                  className="w-28 h-28 rounded-full"
                  onClick={handleStartPause}
                >
                  {isRunning ? <Pause size={32} /> : <Play size={32} />}
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  className="w-20 h-20 rounded-full"
                  onClick={handleLap}
                  disabled={!isRunning || time === 0}
                >
                  <Flag size={24} />
                </Button>
              </div>

              <div className="w-full mt-4">
                <ul className="space-y-2">
                  {laps.map((lap, index) => {
                    const previousLap = laps[index + 1] || 0;
                    const lapTime = lap - previousLap;
                    return (
                      <li key={index} className="flex justify-between items-center py-2 px-3 bg-muted/50 rounded-md">
                        <span className="text-muted-foreground">Lap {laps.length - index}</span>
                        <span className="text-foreground tabular-nums">{formatTime(lapTime)}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
