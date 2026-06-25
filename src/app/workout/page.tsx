"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { 
    RefreshCcw, 
    Minus, 
    Plus, 
    Info, 
    Sparkles, 
    Dumbbell, 
    Sun, 
    Moon, 
    ChevronLeft, 
    ChevronRight, 
    Calendar as CalendarIcon, 
    CheckCircle2, 
    Clock, 
    Check 
} from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type ExerciseId = "pullups" | "pushups" | "squats" | "expander" | "curls" | "core" | "grip";

type Exercise = {
    id: ExerciseId;
    name: string;
    target: number;
    countsTowardsTotal: boolean;
};

const EXERCISES: Exercise[] = [
    { id: "pullups", name: "Multi-Grip Pull-ups", target: 50, countsTowardsTotal: true },
    { id: "pushups", name: "Deficit Push-ups", target: 200, countsTowardsTotal: true },
    { id: "squats", name: "Dumbbell Goblet Squats", target: 250, countsTowardsTotal: true },
    { id: "expander", name: "Chest Expander Pulls", target: 200, countsTowardsTotal: true },
    { id: "curls", name: "Dumbbell Bicep Curls", target: 150, countsTowardsTotal: true },
    { id: "core", name: "Floor Core/Crunches", target: 150, countsTowardsTotal: true },
    { id: "grip", name: "Hand Gripper Squeezes", target: 200, countsTowardsTotal: false }, // Excluded from total
];

type WorkoutData = {
    date: string;
    pullups: number;
    pushups: number;
    squats: number;
    expander: number;
    curls: number;
    core: number;
    grip: number;
};

type SkincareData = {
    date: string;
    cleanseM: boolean;
    moistM: boolean;
    protectM: boolean;
    lipsM: boolean;
    cleanseE: boolean;
    moistE: boolean;
    matchaMask: boolean;
};

type TabType = "planA" | "planB" | "skincare";

export default function WorkoutPage() {
    const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
    const [currentMonthDate, setCurrentMonthDate] = useState<Date>(() => new Date());
    
    // DB state
    const [workoutLogs, setWorkoutLogs] = useState<Record<string, WorkoutData>>({});
    const [skincareLogs, setSkincareLogs] = useState<Record<string, SkincareData>>({});
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabType>("planA");
    const [mounted, setMounted] = useState(false);

    // Date formatting helper YYYY-MM-DD
    const formatDateString = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    };

    const selectedDateStr = formatDateString(selectedDate);
    const selectedYear = selectedDate.getFullYear();

    // Fetch data for active year
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [workoutRes, skincareRes] = await Promise.all([
                    fetch(`/api/workout?year=${selectedYear}`),
                    fetch(`/api/skincare?year=${selectedYear}`)
                ]);

                if (workoutRes.ok) {
                    const workouts: WorkoutData[] = await workoutRes.json();
                    const wMap: Record<string, WorkoutData> = {};
                    workouts.forEach(w => { wMap[w.date] = w; });
                    setWorkoutLogs(wMap);
                }

                if (skincareRes.ok) {
                    const skincares: SkincareData[] = await skincareRes.json();
                    const sMap: Record<string, SkincareData> = {};
                    skincares.forEach(s => { sMap[s.date] = s; });
                    setSkincareLogs(sMap);
                }
            } catch (err) {
                console.error("Error fetching logs:", err);
                toast.error("Failed to sync records with database.");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
        setMounted(true);
    }, [selectedYear]);

    // Current Active Day State
    const activeWorkout: WorkoutData = workoutLogs[selectedDateStr] || {
        date: selectedDateStr,
        pullups: 0,
        pushups: 0,
        squats: 0,
        expander: 0,
        curls: 0,
        core: 0,
        grip: 0,
    };

    const activeSkincare: SkincareData = skincareLogs[selectedDateStr] || {
        date: selectedDateStr,
        cleanseM: false,
        moistM: false,
        protectM: false,
        lipsM: false,
        cleanseE: false,
        moistE: false,
        matchaMask: false,
    };

    // Reps calculations
    const targetReps = 1000;
    const totalReps = EXERCISES
        .filter(ex => ex.countsTowardsTotal)
        .reduce((acc, curr) => acc + (activeWorkout[curr.id] || 0), 0);
    const progressPercentage = Math.min((totalReps / targetReps) * 100, 100);

    // DB update triggers
    const updateWorkoutCount = async (id: ExerciseId, amount: number) => {
        const originalCount = activeWorkout[id];
        const newCount = Math.max(0, originalCount + amount);

        // Optimistic UI Update
        setWorkoutLogs(prev => ({
            ...prev,
            [selectedDateStr]: {
                ...activeWorkout,
                [id]: newCount
            }
        }));

        try {
            const res = await fetch("/api/workout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    date: selectedDateStr,
                    exercise: id,
                    count: newCount
                })
            });
            if (!res.ok) throw new Error("Sync failed");
            const data = await res.json();
            setWorkoutLogs(prev => ({ ...prev, [selectedDateStr]: data }));
        } catch (e) {
            console.error(e);
            toast.error("Database sync failed, reverting count.");
            setWorkoutLogs(prev => ({
                ...prev,
                [selectedDateStr]: {
                    ...activeWorkout,
                    [id]: originalCount
                }
            }));
        }
    };

    const toggleSkincareStep = async (step: keyof Omit<SkincareData, "date">) => {
        const originalState = activeSkincare[step];
        const newState = !originalState;

        // Optimistic UI Update
        setSkincareLogs(prev => ({
            ...prev,
            [selectedDateStr]: {
                ...activeSkincare,
                [step]: newState
            }
        }));

        try {
            const res = await fetch("/api/skincare", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    date: selectedDateStr,
                    step,
                    completed: newState
                })
            });
            if (!res.ok) throw new Error("Sync failed");
            const data = await res.json();
            setSkincareLogs(prev => ({ ...prev, [selectedDateStr]: data }));
        } catch (e) {
            console.error(e);
            toast.error("Failed to update skincare step.");
            setSkincareLogs(prev => ({
                ...prev,
                [selectedDateStr]: {
                    ...activeSkincare,
                    [step]: originalState
                }
            }));
        }
    };

    const resetWorkout = async () => {
        // Optimistically set to 0
        const backup = activeWorkout;
        setWorkoutLogs(prev => ({
            ...prev,
            [selectedDateStr]: {
                date: selectedDateStr,
                pullups: 0,
                pushups: 0,
                squats: 0,
                expander: 0,
                curls: 0,
                core: 0,
                grip: 0,
            }
        }));

        try {
            const resetOps = EXERCISES.map(ex => 
                fetch("/api/workout", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ date: selectedDateStr, exercise: ex.id, count: 0 })
                })
            );
            await Promise.all(resetOps);
            toast.success("Progress reset successfully.");
        } catch (e) {
            console.error(e);
            toast.error("Failed to reset database record, reverting.");
            setWorkoutLogs(prev => ({ ...prev, [selectedDateStr]: backup }));
        }
    };

    // Plan A: Circuit Logic
    // One round counts as: pullups +5, pushups +20, squats +25, expander +20, curls +15, core +15
    const circuitConfig = {
        pullups: 5,
        pushups: 20,
        squats: 25,
        expander: 20,
        curls: 15,
        core: 15,
        grip: 0
    };

    // Calculate completed rounds based on counts
    const completedRounds = Math.min(
        10,
        Math.floor(
            Math.min(
                activeWorkout.pullups / 5,
                activeWorkout.pushups / 20,
                activeWorkout.squats / 25,
                activeWorkout.expander / 20,
                activeWorkout.curls / 15,
                activeWorkout.core / 15
            )
        )
    );

    const toggleCircuitRound = async (roundNum: number) => {
        const currentCompletedRounds = completedRounds;
        const targetRounds = roundNum + 1; // Completed rounds up to index
        
        let deltaRounds = targetRounds - currentCompletedRounds;
        if (targetRounds === currentCompletedRounds && roundNum === currentCompletedRounds - 1) {
            // Clicked active last round: Toggle off
            deltaRounds = -1;
        } else if (targetRounds <= currentCompletedRounds) {
            // Clicked an earlier round: toggle down to this round
            deltaRounds = targetRounds - currentCompletedRounds;
        }

        // Apply changes to exercises
        const updatePromises = EXERCISES
            .filter(ex => ex.id !== "grip")
            .map(ex => {
                const step = circuitConfig[ex.id];
                const deltaCount = deltaRounds * step;
                return updateWorkoutCount(ex.id, deltaCount);
            });
        
        await Promise.all(updatePromises);
        toast.info(deltaRounds > 0 ? `Logged ${deltaRounds} circuit rounds! 🚀` : `Removed ${Math.abs(deltaRounds)} circuit rounds.`);
    };

    // Plan B Quick Actions
    const applyPlanBSection = async (section: "morning" | "afternoon" | "evening") => {
        const plans = {
            morning: { pushups: 50, squats: 75, expander: 50, curls: 50, core: 50, pullups: 25 },
            afternoon: { pushups: 100, squats: 100, expander: 75, curls: 50, core: 50, pullups: 25 },
            evening: { pushups: 50, squats: 75, expander: 75, curls: 50, core: 50 }
        };

        const config = plans[section];
        const updatePromises = Object.entries(config).map(([exId, val]) => 
            updateWorkoutCount(exId as ExerciseId, val)
        );

        await Promise.all(updatePromises);
        toast.success(`Applied ${section.toUpperCase()} workout values!`);
    };

    // Calendar & Heatmap generation logic
    const monthDays = useMemo(() => {
        const year = currentMonthDate.getFullYear();
        const month = currentMonthDate.getMonth();
        
        const firstDayIndex = new Date(year, month, 1).getDay();
        const totalDays = new Date(year, month + 1, 0).getDate();
        
        const days: { date: Date | null; dayNumber: number | null; dateStr: string | null }[] = [];
        
        for (let i = 0; i < firstDayIndex; i++) {
            days.push({ date: null, dayNumber: null, dateStr: null });
        }
        
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

    const getRepsForDate = (dateStr: string) => {
        const log = workoutLogs[dateStr];
        if (!log) return 0;
        return EXERCISES
            .filter(ex => ex.countsTowardsTotal)
            .reduce((sum, curr) => sum + (log[curr.id] || 0), 0);
    };

    const getSkincareDoneCount = (dateStr: string) => {
        const log = skincareLogs[dateStr];
        if (!log) return 0;
        let count = 0;
        if (log.cleanseM) count++;
        if (log.moistM) count++;
        if (log.protectM) count++;
        if (log.lipsM) count++;
        if (log.cleanseE) count++;
        if (log.moistE) count++;
        if (log.matchaMask) count++;
        return count;
    };

    const getCalendarCellColor = (reps: number) => {
        if (reps === 0) return "bg-muted/30 text-muted-foreground hover:bg-muted/50 border border-border/50";
        if (reps < 300) return "bg-orange-500/10 text-orange-800 dark:text-orange-300 hover:bg-orange-500/20 border border-orange-500/10";
        if (reps < 600) return "bg-orange-500/25 text-orange-900 dark:text-orange-200 hover:bg-orange-500/35 border border-orange-500/20";
        if (reps < 1000) return "bg-orange-500/50 text-orange-950 dark:text-orange-100 hover:bg-orange-500/60 border border-orange-500/35";
        return "bg-orange-600 text-white font-bold hover:bg-orange-600/90 shadow-[0_0_15px_rgba(249,115,22,0.3)] border border-orange-600";
    };

    const getSkincareCellColor = (doneCount: number) => {
        if (doneCount === 0) return "bg-muted/30 text-muted-foreground hover:bg-muted/50 border border-border/50";
        if (doneCount < 3) return "bg-pink-500/10 text-pink-850 dark:text-pink-300 hover:bg-pink-500/20 border border-pink-500/10";
        if (doneCount < 6) return "bg-pink-500/30 text-pink-900 dark:text-pink-200 hover:bg-pink-500/40 border border-pink-500/25";
        return "bg-pink-600 text-white font-bold hover:bg-pink-600/90 shadow-[0_0_15px_rgba(236,72,153,0.3)] border border-pink-600";
    };

    const yearDays = useMemo(() => {
        const days: { date: Date | null; dateStr: string | null }[] = [];
        const jan1 = new Date(selectedYear, 0, 1);
        const startOffset = jan1.getDay();
        
        for (let i = 0; i < startOffset; i++) {
            days.push({ date: null, dateStr: null });
        }
        
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

    if (!mounted) return null;

    const isSkincareTab = activeTab === "skincare";

    return (
        <main className="fixed inset-0 bg-background text-foreground flex flex-col p-4 sm:p-6 md:p-8 lg:p-12 pb-28 sm:pb-32 overflow-y-auto no-scrollbar antialiased">
            <Toaster position="top-right" richColors />
            
            {/* Header Switcher */}
            <header className="flex-none mb-6 sm:mb-8 md:mb-10 bg-background/80 backdrop-blur-sm z-10 relative py-2 border-b border-border/50 max-w-7xl mx-auto w-full">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <p className="font-mono text-[9px] md:text-[11px] tracking-[0.4em] text-muted-foreground/60 uppercase">
                            ATHLETIC.CHALLENGE.CYCLE
                        </p>
                        <div className="flex items-center gap-3 mt-1.5">
                            <h1 className="text-[clamp(1.8rem,5vw,3rem)] font-black tracking-tighter leading-none uppercase">
                                Workout & Skincare
                            </h1>
                            <div className={cn(
                                "flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold tracking-wider transition-colors duration-300",
                                isSkincareTab 
                                    ? "bg-pink-500/10 dark:bg-pink-500/20 text-pink-600 dark:text-pink-400"
                                    : "bg-orange-500/10 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400"
                            )}>
                                <Sparkles className="h-3 w-3 animate-pulse" />
                                {isSkincareTab ? "GLOW_ROUTINE" : "1000_REPS_CHALLENGE"}
                            </div>
                        </div>
                        <p className="font-mono text-[8px] sm:text-[10px] tracking-[0.2em] text-muted-foreground/40 uppercase mt-2">
                            YEAR_CYCLE: {selectedYear} // SELECTED: {selectedDate.toLocaleDateString("en-US", { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase()}
                        </p>
                    </div>

                    <div className="flex items-center gap-3 sm:self-end">
                        <Button
                            variant="outline"
                            onClick={() => {
                                const today = new Date();
                                setSelectedDate(today);
                                setCurrentMonthDate(today);
                            }}
                            className="rounded-full hover:bg-muted text-xs font-mono tracking-wider h-9"
                        >
                            TODAY
                        </Button>
                        <div className="flex items-center bg-muted/10 border border-border/60 rounded-full px-2 py-1 h-9">
                            <button
                                onClick={() => {
                                    const prev = new Date(selectedDate);
                                    prev.setDate(prev.getDate() - 1);
                                    setSelectedDate(prev);
                                    if (prev.getMonth() !== currentMonthDate.getMonth() || prev.getFullYear() !== currentMonthDate.getFullYear()) {
                                        setCurrentMonthDate(prev);
                                    }
                                }}
                                className={cn("p-1 transition-colors", isSkincareTab ? "hover:text-pink-500" : "hover:text-orange-500")}
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
                                className={cn("p-1 transition-colors", isSkincareTab ? "hover:text-pink-500" : "hover:text-orange-500")}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Dashboard Workspace */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start max-w-7xl mx-auto w-full pb-8">
                
                {/* Left Side: Logger Card */}
                <div className="lg:col-span-7 space-y-6">
                    {/* Progress Banner */}
                    <Card className="border-border shadow-md bg-card/60 backdrop-blur-md overflow-hidden relative group">
                        <div className={cn(
                            "absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl pointer-events-none transition-all duration-500",
                            isSkincareTab ? "bg-pink-500/5 group-hover:bg-pink-500/10" : "bg-orange-500/5 group-hover:bg-orange-500/10"
                        )} />
                        <div className="h-2 bg-muted/20 w-full relative">
                            <div
                                className={cn(
                                    "h-full transition-all duration-500 ease-out",
                                    isSkincareTab 
                                        ? "bg-gradient-to-r from-pink-500 to-rose-400 shadow-[0_0_10px_rgba(236,72,153,0.5)]"
                                        : "bg-gradient-to-r from-orange-500 to-amber-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]"
                                )}
                                style={{ width: `${isSkincareTab ? (getSkincareDoneCount(selectedDateStr) / 6.5) * 100 : progressPercentage}%` }}
                            />
                        </div>
                        <CardHeader className="flex flex-row items-center justify-between pb-4">
                            <div>
                                <CardTitle className="text-xl md:text-2xl font-bold tracking-tight">
                                    {isSkincareTab ? "Skincare Compliance" : "Daily Challenge"}
                                </CardTitle>
                                <CardDescription className="text-muted-foreground mt-1 font-mono text-[10px]">
                                    {isSkincareTab ? "STEPS COMPLETED: MORNING & EVENING ROUTINE" : "REPS TARGET: 1000 REPS (EXCLUDES GRIP)"}
                                </CardDescription>
                            </div>
                            {!isSkincareTab && (
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="outline" size="icon" title="Reset Progress" className="shrink-0 rounded-full border-border/80 hover:bg-orange-500/10 hover:text-orange-500">
                                            <RefreshCcw className="h-4 w-4" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This action will reset today's workout progress back to 0. This cannot be undone.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={resetWorkout} className="bg-orange-600 hover:bg-orange-500 text-white">
                                                Yes, Reset
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            )}
                        </CardHeader>
                        <CardContent>
                            <div className="flex justify-between items-end mb-2">
                                {isSkincareTab ? (
                                    <span className="text-4xl font-black tracking-tighter">{getSkincareDoneCount(selectedDateStr)} <span className="text-sm text-muted-foreground font-mono font-medium">/ {activeSkincare.matchaMask ? 7 : 6} STEPS</span></span>
                                ) : (
                                    <span className="text-4xl font-black tracking-tighter">{totalReps} <span className="text-sm text-muted-foreground font-mono font-medium">/ {targetReps} REPS</span></span>
                                )}
                                <span className={cn("text-sm font-bold font-mono", isSkincareTab ? "text-pink-500" : "text-orange-500")}>
                                    {Math.round(isSkincareTab ? (getSkincareDoneCount(selectedDateStr) / (activeSkincare.matchaMask ? 7 : 6)) * 100 : progressPercentage)}%
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Custom Nav Tabs */}
                    <div className="flex justify-center">
                        <div className="inline-flex h-11 items-center justify-center rounded-xl bg-muted/40 p-1 text-muted-foreground w-full md:w-auto shadow-inner border border-border/60">
                            <button
                                onClick={() => setActiveTab("planA")}
                                className={cn(
                                    "inline-flex items-center justify-center whitespace-nowrap rounded-lg px-4 py-2 text-xs font-semibold font-mono tracking-wider transition-all w-full md:w-auto",
                                    activeTab === "planA" ? "bg-background text-orange-500 shadow-sm border border-border/40" : "hover:text-foreground"
                                )}
                            >
                                <Dumbbell className="h-4 w-4 mr-2" />
                                PLAN A (CIRCUITS)
                            </button>
                            <button
                                onClick={() => setActiveTab("planB")}
                                className={cn(
                                    "inline-flex items-center justify-center whitespace-nowrap rounded-lg px-4 py-2 text-xs font-semibold font-mono tracking-wider transition-all w-full md:w-auto",
                                    activeTab === "planB" ? "bg-background text-orange-500 shadow-sm border border-border/40" : "hover:text-foreground"
                                )}
                            >
                                <Info className="h-4 w-4 mr-2" />
                                PLAN B (SPREAD)
                            </button>
                            <button
                                onClick={() => setActiveTab("skincare")}
                                className={cn(
                                    "inline-flex items-center justify-center whitespace-nowrap rounded-lg px-4 py-2 text-xs font-semibold font-mono tracking-wider transition-all w-full md:w-auto",
                                    activeTab === "skincare" ? "bg-background text-pink-500 shadow-sm border border-border/40" : "hover:text-foreground"
                                )}
                            >
                                <Sparkles className="h-4 w-4 mr-2" />
                                SKINCARE
                            </button>
                        </div>
                    </div>

                    {/* Tabs Content */}
                    {activeTab === "planA" && (
                        <div className="space-y-6">
                            {/* Circuit Helper Panel */}
                            <Card className="border-border bg-orange-500/5 border-orange-500/20 rounded-2xl p-5 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-3 text-orange-500/10 font-bold font-mono text-[70px] leading-none pointer-events-none select-none">
                                    CIRCUIT
                                </div>
                                <h3 className="font-bold text-sm tracking-wide text-orange-500 font-mono mb-1">THE POWER HOUR</h3>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    Perform 10 full rounds of the circuit. Complete round by round below:
                                </p>
                                
                                {/* Round Tracker Bullets */}
                                <div className="grid grid-cols-5 xs:grid-cols-10 gap-2 mt-4">
                                    {Array.from({ length: 10 }).map((_, idx) => {
                                        const isDone = completedRounds > idx;
                                        return (
                                            <button
                                                key={idx}
                                                onClick={() => toggleCircuitRound(idx)}
                                                className={cn(
                                                    "h-10 rounded-xl border flex flex-col items-center justify-center font-mono transition-all duration-300",
                                                    isDone 
                                                        ? "bg-orange-500 border-orange-500 text-white font-black shadow-[0_0_10px_rgba(249,115,22,0.3)]" 
                                                        : "border-border/80 hover:bg-orange-500/10 hover:text-orange-500 text-muted-foreground text-xs"
                                                )}
                                            >
                                                <span className="text-[9px] opacity-60">R</span>
                                                <span className="text-xs -mt-1">{idx + 1}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </Card>

                            <WorkoutExerciseList activeWorkout={activeWorkout} updateCount={updateWorkoutCount} />
                        </div>
                    )}

                    {activeTab === "planB" && (
                        <div className="space-y-6">
                            {/* Greasing the Groove Sessions */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {[
                                    {
                                        name: "Morning",
                                        reps: "300 Reps",
                                        desc: "50 Deficit Pushups, 75 Goblet Squats, 50 Expander, 50 Bicep Curls, 50 Core, 25 Pullups",
                                        action: "morning"
                                    },
                                    {
                                        name: "Afternoon",
                                        reps: "400 Reps",
                                        desc: "100 Deficit Pushups, 100 Goblet Squats, 75 Expander, 50 Bicep Curls, 50 Core, 25 Pullups",
                                        action: "afternoon"
                                    },
                                    {
                                        name: "Evening",
                                        reps: "300 Reps",
                                        desc: "50 Deficit Pushups, 75 Goblet Squats, 75 Expander, 50 Bicep Curls, 50 Core",
                                        action: "evening"
                                    }
                                ].map((session) => (
                                    <Card key={session.name} className="border-border bg-muted/10 p-4 flex flex-col justify-between group hover:border-orange-500/40 transition-colors duration-300">
                                        <div>
                                            <div className="flex justify-between items-baseline mb-1">
                                                <h4 className="font-bold text-xs tracking-wider text-foreground font-mono">{session.name.toUpperCase()}</h4>
                                                <span className="text-[10px] font-mono text-orange-500 font-semibold">{session.reps}</span>
                                            </div>
                                            <p className="text-[11px] text-muted-foreground leading-relaxed min-h-[50px]">{session.desc}</p>
                                        </div>
                                        <Button
                                            onClick={() => applyPlanBSection(session.action as any)}
                                            variant="secondary"
                                            className="mt-3 w-full h-8 text-[10px] font-mono tracking-wider font-bold rounded-lg border-border hover:bg-orange-500/10 hover:text-orange-500 hover:border-orange-500/20"
                                        >
                                            APPLY REPS
                                        </Button>
                                    </Card>
                                ))}
                            </div>

                            <WorkoutExerciseList activeWorkout={activeWorkout} updateCount={updateWorkoutCount} />
                        </div>
                    )}

                    {activeTab === "skincare" && (
                        <div className="space-y-4">
                            {/* Morning Routine Card */}
                            <Card className="border-border bg-card/40 backdrop-blur-md">
                                <CardHeader className="pb-3 border-b border-border/50 bg-muted/20">
                                    <CardTitle className="text-sm font-mono tracking-wider flex items-center justify-between">
                                        <span className="flex items-center">
                                            <Sun className="h-4 w-4 mr-2 text-amber-500 animate-spin-slow" /> MORNING ROUTINE
                                        </span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-4 space-y-3">
                                    {[
                                        { key: "cleanseM", step: "1", title: "Cleanse", desc: "Pond's Daily Face Wash (cools and refreshes)" },
                                        { key: "moistM", step: "2", title: "Moisturize", desc: "Nivea Soft (apply a very light layer)" },
                                        { key: "protectM", step: "3", title: "Protect", desc: "Sinoz SPF 50 (Crucial for preventing sun damage)" },
                                        { key: "lipsM", step: "4", title: "Lips", desc: "Pink tub lip balm" }
                                    ].map((step) => {
                                        const done = activeSkincare[step.key as keyof SkincareData];
                                        return (
                                            <button
                                                key={step.key}
                                                onClick={() => toggleSkincareStep(step.key as any)}
                                                className={cn(
                                                    "w-full flex items-center justify-between p-3.5 rounded-xl border transition-all duration-300 scale-100 hover:scale-[1.01] active:scale-[0.99] group text-left",
                                                    done
                                                        ? "border-pink-500/30 bg-pink-500/5 text-pink-500/90 dark:bg-pink-500/10"
                                                        : "border-border/80 bg-muted/10 hover:bg-muted/30"
                                                )}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className="font-mono text-xs font-bold text-muted-foreground/60 w-4">{step.step}.</span>
                                                    <div>
                                                        <span className="font-bold text-xs font-mono">{step.title}: </span>
                                                        <span className="text-xs text-muted-foreground">{step.desc}</span>
                                                    </div>
                                                </div>
                                                <div className={cn(
                                                    "h-5 w-5 rounded-full border flex items-center justify-center transition-all duration-300",
                                                    done ? "bg-pink-500 border-pink-500 text-white" : "border-border"
                                                )}>
                                                    {done && <Check className="h-3 w-3" />}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </CardContent>
                            </Card>

                            {/* Evening Routine Card */}
                            <Card className="border-border bg-card/40 backdrop-blur-md">
                                <CardHeader className="pb-3 border-b border-border/50 bg-muted/20">
                                    <CardTitle className="text-sm font-mono tracking-wider flex items-center justify-between">
                                        <span className="flex items-center">
                                            <Moon className="h-4 w-4 mr-2 text-indigo-500 animate-pulse" /> EVENING ROUTINE
                                        </span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-4 space-y-3">
                                    {[
                                        { key: "cleanseE", step: "1", title: "Cleanse", desc: "Bioaqua Papaya Purifying Cleanser (removes SPF and sweat)" },
                                        { key: "moistE", step: "2", title: "Moisturize", desc: "Nivea Soft (apply thicker layer for overnight hydration)" }
                                    ].map((step) => {
                                        const done = activeSkincare[step.key as keyof SkincareData];
                                        return (
                                            <button
                                                key={step.key}
                                                onClick={() => toggleSkincareStep(step.key as any)}
                                                className={cn(
                                                    "w-full flex items-center justify-between p-3.5 rounded-xl border transition-all duration-300 scale-100 hover:scale-[1.01] active:scale-[0.99] group text-left",
                                                    done
                                                        ? "border-pink-500/30 bg-pink-500/5 text-pink-500/90 dark:bg-pink-500/10"
                                                        : "border-border/80 bg-muted/10 hover:bg-muted/30"
                                                )}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className="font-mono text-xs font-bold text-muted-foreground/60 w-4">{step.step}.</span>
                                                    <div>
                                                        <span className="font-bold text-xs font-mono">{step.title}: </span>
                                                        <span className="text-xs text-muted-foreground">{step.desc}</span>
                                                    </div>
                                                </div>
                                                <div className={cn(
                                                    "h-5 w-5 rounded-full border flex items-center justify-center transition-all duration-300",
                                                    done ? "bg-pink-500 border-pink-500 text-white" : "border-border"
                                                )}>
                                                    {done && <Check className="h-3 w-3" />}
                                                </div>
                                            </button>
                                        );
                                    })}

                                    {/* Twice a week Matcha Mask option */}
                                    <div className="pt-4 border-t border-border/50">
                                        <button
                                            onClick={() => toggleSkincareStep("matchaMask")}
                                            className={cn(
                                                "w-full flex items-center justify-between p-3.5 rounded-xl border transition-all duration-300 scale-100 hover:scale-[1.01] active:scale-[0.99] group text-left",
                                                activeSkincare.matchaMask
                                                    ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-600 dark:bg-emerald-500/10"
                                                    : "border-border/80 bg-muted/10 hover:bg-muted/30"
                                            )}
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="font-mono text-xs font-bold text-emerald-500 w-4">★</span>
                                                <div>
                                                    <span className="font-bold text-xs font-mono text-emerald-500">Twice a Week Night: </span>
                                                    <span className="text-xs text-muted-foreground">Laikou Matcha Sleeping Mask (overnight soothing)</span>
                                                </div>
                                            </div>
                                            <div className={cn(
                                                "h-5 w-5 rounded-full border flex items-center justify-center transition-all duration-300",
                                                activeSkincare.matchaMask ? "bg-emerald-500 border-emerald-500 text-white" : "border-border"
                                            )}>
                                                {activeSkincare.matchaMask && <Check className="h-3 w-3" />}
                                            </div>
                                        </button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </div>

                {/* Right Side: Calendar & Heatmap */}
                <div className="lg:col-span-5 space-y-6">
                    {/* Monthly Calendar View */}
                    <div className="p-5 sm:p-6 rounded-2xl border border-border/80 bg-muted/5 dark:bg-black/20 backdrop-blur-md">
                        <div className="flex items-center justify-between mb-4 border-b border-border/30 pb-3">
                            <div className="flex items-center gap-2">
                                <CalendarIcon className={cn("h-4 w-4", isSkincareTab ? "text-pink-500 animate-pulse" : "text-orange-500")} />
                                <h3 className="font-mono text-[10px] font-bold tracking-[0.3em] uppercase text-muted-foreground/60">
                                    {isSkincareTab ? "MONTHLY_SKINCARE_VIEW" : "MONTHLY_REPS_VIEW"}
                                </h3>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="font-bold text-xs uppercase tracking-wider font-mono">
                                    {currentMonthDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                                </span>
                                <div className="flex items-center bg-muted/30 border border-border/45 rounded-lg p-0.5">
                                    <button
                                        onClick={() => {
                                            setCurrentMonthDate(prev => {
                                                const d = new Date(prev);
                                                d.setMonth(d.getMonth() - 1);
                                                return d;
                                            });
                                        }}
                                        className={cn("p-1 transition-colors", isSkincareTab ? "hover:text-pink-500" : "hover:text-orange-500")}
                                    >
                                        <ChevronLeft className="h-3 w-3" />
                                    </button>
                                    <button
                                        onClick={() => {
                                            setCurrentMonthDate(prev => {
                                                const d = new Date(prev);
                                                d.setMonth(d.getMonth() + 1);
                                                return d;
                                            });
                                        }}
                                        className={cn("p-1 transition-colors", isSkincareTab ? "hover:text-pink-500" : "hover:text-orange-500")}
                                    >
                                        <ChevronRight className="h-3 w-3" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-7 gap-1 text-center mb-2">
                            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(day => (
                                <div key={day} className="font-mono text-[9px] font-bold text-muted-foreground/40 uppercase py-1">
                                    {day}
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-7 gap-1">
                            {monthDays.map((item, idx) => {
                                if (!item.date || !item.dateStr) {
                                    return <div key={`empty-${idx}`} className="aspect-square" />;
                                }

                                const isSelected = item.dateStr === selectedDateStr;
                                const isToday = item.dateStr === formatDateString(new Date());
                                
                                if (isSkincareTab) {
                                    const doneCount = getSkincareDoneCount(item.dateStr);
                                    const colorClass = getSkincareCellColor(doneCount);
                                    return (
                                        <button
                                            key={item.dateStr}
                                            onClick={() => setSelectedDate(item.date!)}
                                            className={cn(
                                                "aspect-square rounded-xl flex flex-col items-center justify-between p-1.5 text-xs transition-all duration-300 relative group overflow-hidden border",
                                                colorClass,
                                                isSelected && "ring-2 ring-pink-500 ring-offset-2 ring-offset-background scale-95 border-pink-500 z-10",
                                                isToday && !isSelected && "border-primary/80 border-2 font-black"
                                            )}
                                        >
                                            <span className="font-mono text-[9px] font-bold opacity-60 self-start">
                                                {item.dayNumber}
                                            </span>
                                            <div className="flex gap-0.5 justify-center w-full mt-1">
                                                <span className={cn(
                                                    "w-1 h-1 rounded-full",
                                                    doneCount >= 6 ? "bg-white" : doneCount > 0 ? "bg-pink-500" : "bg-muted-foreground/20"
                                                )} />
                                            </div>
                                        </button>
                                    );
                                } else {
                                    const reps = getRepsForDate(item.dateStr);
                                    const colorClass = getCalendarCellColor(reps);
                                    return (
                                        <button
                                            key={item.dateStr}
                                            onClick={() => setSelectedDate(item.date!)}
                                            className={cn(
                                                "aspect-square rounded-xl flex flex-col items-center justify-between p-1.5 text-xs transition-all duration-300 relative group overflow-hidden border",
                                                colorClass,
                                                isSelected && "ring-2 ring-orange-500 ring-offset-2 ring-offset-background scale-95 border-orange-500 z-10",
                                                isToday && !isSelected && "border-primary/80 border-2 font-black"
                                            )}
                                        >
                                            <span className="font-mono text-[9px] font-bold opacity-60 self-start">
                                                {item.dayNumber}
                                            </span>
                                            <div className="flex gap-0.5 justify-center w-full mt-1">
                                                <span className={cn(
                                                    "w-1 h-1 rounded-full",
                                                    reps >= 1000 ? "bg-white" : reps > 0 ? "bg-orange-500" : "bg-muted-foreground/20"
                                                )} />
                                            </div>
                                        </button>
                                    );
                                }
                            })}
                        </div>
                    </div>

                    {/* Annual Heat Map Matrix */}
                    <div className="p-5 sm:p-6 rounded-2xl border border-border/80 bg-muted/5 dark:bg-black/20 backdrop-blur-md">
                        <div className="flex items-center justify-between mb-4 border-b border-border/30 pb-3">
                            <div className="flex items-center gap-2">
                                <Clock className={cn("h-4 w-4", isSkincareTab ? "text-pink-500 animate-pulse" : "text-orange-500")} />
                                <h3 className="font-mono text-[10px] font-bold tracking-[0.3em] uppercase text-muted-foreground/60">
                                    {isSkincareTab ? "ANNUAL_SKINCARE_MATRIX" : "ANNUAL_CHALLENGE_MATRIX"}
                                </h3>
                            </div>
                        </div>

                        <div className="relative w-full overflow-x-auto no-scrollbar py-2">
                            <div 
                                className="grid grid-flow-col grid-rows-7 gap-[3px] min-w-[700px] w-full"
                                style={{ gridTemplateColumns: "repeat(54, minmax(0, 1fr))" }}
                            >
                                {yearDays.map((item, idx) => {
                                    if (!item.date || !item.dateStr) {
                                        return <div key={`y-empty-${idx}`} className="aspect-square rounded-[3px]" />;
                                    }

                                    const isSelected = item.dateStr === selectedDateStr;
                                    
                                    if (isSkincareTab) {
                                        const doneCount = getSkincareDoneCount(item.dateStr);
                                        let cellBg = "bg-muted/30 dark:bg-muted/10";
                                        if (doneCount > 0 && doneCount < 3) cellBg = "bg-pink-500/15";
                                        else if (doneCount >= 3 && doneCount < 6) cellBg = "bg-pink-500/40";
                                        else if (doneCount >= 6) cellBg = "bg-pink-500 dark:bg-pink-400 shadow-[0_0_8px_rgba(236,72,153,0.3)]";

                                        return (
                                            <button
                                                key={item.dateStr}
                                                onClick={() => {
                                                    setSelectedDate(item.date!);
                                                    setCurrentMonthDate(item.date!);
                                                }}
                                                className={cn(
                                                    "aspect-square rounded-[2px] transition-all duration-200 cursor-pointer w-full max-w-[12px] group relative hover:scale-125 hover:z-20",
                                                    cellBg,
                                                    isSelected && "ring-1.5 ring-pink-500 ring-offset-1 ring-offset-background scale-110"
                                                )}
                                                title={`${item.dateStr}: ${doneCount} Skincare Steps`}
                                            />
                                        );
                                    } else {
                                        const reps = getRepsForDate(item.dateStr);
                                        let cellBg = "bg-muted/30 dark:bg-muted/10";
                                        if (reps > 0 && reps < 300) cellBg = "bg-orange-500/15";
                                        else if (reps >= 300 && reps < 600) cellBg = "bg-orange-500/35";
                                        else if (reps >= 600 && reps < 1000) cellBg = "bg-orange-500/60";
                                        else if (reps >= 1000) cellBg = "bg-orange-500 dark:bg-orange-400 shadow-[0_0_8px_rgba(249,115,22,0.3)]";

                                        return (
                                            <button
                                                key={item.dateStr}
                                                onClick={() => {
                                                    setSelectedDate(item.date!);
                                                    setCurrentMonthDate(item.date!);
                                                }}
                                                className={cn(
                                                    "aspect-square rounded-[2px] transition-all duration-200 cursor-pointer w-full max-w-[12px] group relative hover:scale-125 hover:z-20",
                                                    cellBg,
                                                    isSelected && "ring-1.5 ring-orange-500 ring-offset-1 ring-offset-background scale-110"
                                                )}
                                                title={`${item.dateStr}: ${reps} Reps`}
                                            />
                                        );
                                    }
                                })}
                            </div>
                        </div>

                        <div className="flex justify-between items-center mt-3 pt-3 border-t border-border/20 font-mono text-[8px] sm:text-[9px] text-muted-foreground/50">
                            {isSkincareTab ? (
                                <div className="flex gap-2">
                                    <span>YEAR_ACCUMULATION:</span>
                                    <span className="text-pink-500 dark:text-pink-400 font-bold uppercase">
                                        {Object.values(skincareLogs).reduce((total, log) => {
                                            let count = 0;
                                            if (log.cleanseM) count++;
                                            if (log.moistM) count++;
                                            if (log.protectM) count++;
                                            if (log.lipsM) count++;
                                            if (log.cleanseE) count++;
                                            if (log.moistE) count++;
                                            if (log.matchaMask) count++;
                                            return total + count;
                                        }, 0)} STEPS COMPLETED
                                    </span>
                                </div>
                            ) : (
                                <div className="flex gap-2">
                                    <span>YEAR_ACCUMULATION:</span>
                                    <span className="text-orange-500 dark:text-orange-400 font-bold uppercase">
                                        {Object.values(workoutLogs).reduce((total, log) => {
                                            const reps = EXERCISES
                                                .filter(ex => ex.countsTowardsTotal)
                                                .reduce((sum, curr) => sum + (log[curr.id] || 0), 0);
                                            return total + reps;
                                        }, 0)} REPS LOGGED
                                    </span>
                                </div>
                            )}
                            <div className="flex items-center gap-1.5">
                                <span>LESS</span>
                                <span className="w-2.5 h-2.5 rounded-[2px] bg-muted/30 dark:bg-muted/10" />
                                <span className={cn("w-2.5 h-2.5 rounded-[2px]", isSkincareTab ? "bg-pink-500/20" : "bg-orange-500/20")} />
                                <span className={cn("w-2.5 h-2.5 rounded-[2px]", isSkincareTab ? "bg-pink-500/50" : "bg-orange-500/50")} />
                                <span className={cn("w-2.5 h-2.5 rounded-[2px]", isSkincareTab ? "bg-pink-500" : "bg-orange-500")} />
                                <span>MORE</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sticky/Relative Footer Info */}
            <footer className="flex-none max-w-7xl mx-auto w-full flex justify-between items-end border-t border-border/50 pt-6 mt-6 bg-background/80 backdrop-blur-sm relative">
                <div className="flex flex-col">
                    <span className="font-mono text-sm sm:text-xl font-bold tracking-widest leading-none text-foreground/90 uppercase">
                        SYNCED_STATE
                    </span>
                    <p className="font-mono text-[8px] sm:text-[9px] tracking-[0.4em] text-muted-foreground/60 mt-2 uppercase">
                        DATABASE: PRISMA_POSTGRESQL // LOCALTIME: {new Date().toLocaleTimeString("en-GB", {hour12: false})}
                    </p>
                </div>
                
                <div className="text-right font-mono text-[8px] sm:text-[9px] tracking-[0.3em] text-muted-foreground/40 space-y-1 uppercase hidden xs:block">
                    <p className="flex items-center justify-end gap-1.5">
                        <span className={cn("w-1.5 h-1.5 rounded-full animate-pulse", isSkincareTab ? "bg-pink-500" : "bg-orange-500")} />
                        CORE: <span className={cn("font-bold", isSkincareTab ? "text-pink-500/80" : "text-orange-500/80")}>ONLINE</span>
                    </p>
                    <p className="opacity-60 text-[7px] tracking-[0.4em]">SYSTEM_VERSION_V1.2.0_WORKOUT</p>
                </div>
            </footer>

            <style dangerouslySetInnerHTML={{ __html: `
                body { 
                    background: var(--background); 
                    margin: 0; 
                    overflow: hidden; 
                    height: 100dvh; 
                }
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .no-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}} />
        </main>
    );
}

// Subcomponent to list exercises cleanly
function WorkoutExerciseList({ activeWorkout, updateCount }: { 
    activeWorkout: WorkoutData; 
    updateCount: (id: ExerciseId, amount: number) => void;
}) {
    return (
        <Card className="border-border shadow-sm overflow-hidden bg-card/40 backdrop-blur-md">
            <CardContent className="p-0">
                <div className="flex flex-col divide-y divide-border/60">
                    {EXERCISES.map((ex) => {
                        const count = activeWorkout[ex.id] || 0;
                        const isComplete = count >= ex.target;
                        return (
                            <div key={ex.id} className={cn(
                                "flex flex-col sm:flex-row sm:items-center justify-between p-4 md:p-5 transition-colors duration-300",
                                isComplete ? "bg-orange-500/5 hover:bg-orange-500/10" : "hover:bg-muted/10"
                            )}>
                                <div className="mb-4 sm:mb-0">
                                    <div className="flex items-center gap-2">
                                        <h3 className={cn(
                                            "font-bold text-sm tracking-tight font-mono",
                                            isComplete ? "text-orange-500" : "text-foreground/90"
                                        )}>
                                            {ex.name}
                                        </h3>
                                        {!ex.countsTowardsTotal && (
                                            <span className="px-2 py-0.5 rounded-full bg-muted/60 text-muted-foreground text-[8px] font-bold uppercase tracking-wider font-mono">
                                                Bonus
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                                        {count} / {ex.target} reps
                                    </p>
                                </div>

                                <div className="flex items-center gap-1.5 self-start sm:self-auto">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => updateCount(ex.id, -5)}
                                        className="h-8 w-8 border-border rounded-lg"
                                    >
                                        <Minus className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => updateCount(ex.id, -1)}
                                        className="h-8 w-8 border-border rounded-lg text-[10px] font-bold font-mono"
                                    >
                                        -1
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        onClick={() => updateCount(ex.id, 1)}
                                        className="h-8 px-2 text-[10px] font-mono font-bold rounded-lg border-border"
                                    >
                                        + 1
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        onClick={() => updateCount(ex.id, 5)}
                                        className="h-8 px-2 text-[10px] font-mono font-bold rounded-lg border-border"
                                    >
                                        + 5
                                    </Button>
                                    <Button
                                        variant="default"
                                        onClick={() => updateCount(ex.id, 10)}
                                        className="h-8 px-3 text-[10px] font-mono font-bold rounded-lg bg-orange-600 hover:bg-orange-500 text-white shadow-md hover:shadow-orange-500/20"
                                    >
                                        + 10
                                    </Button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
