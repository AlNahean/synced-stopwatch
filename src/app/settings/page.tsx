"use client";

import { useState } from "react";
import { ModeSwitcher } from "@/components/theme/mode-switcher";
import { Button } from "@/components/ui/button";
import { RotateCcw, ChevronLeft, Github, Info, Monitor, Zap } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const [resetting, setResetting] = useState(false);

  const handleGlobalReset = async () => {
    setResetting(true);
    try {
      await fetch("/api/stopwatch/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset" }),
      });
      // Optionally show a toast or feedback
    } catch (error) {
      console.error("Failed to reset stopwatch:", error);
    } finally {
      setTimeout(() => setResetting(false), 500);
    }
  };

  return (
    <main className="fixed inset-0 bg-background text-foreground flex flex-col p-8 md:p-16 pb-28 sm:pb-32 overflow-y-auto antialiased">
      {/* HEADER */}
      <header className="flex-none mb-12 md:mb-20">
        <div className="flex items-center gap-4 mb-4">
            <Link 
                href="/"
                className="h-10 w-10 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
            >
                <ChevronLeft className="h-5 w-5" />
            </Link>
            <p className="font-mono text-[9px] md:text-[11px] tracking-[0.5em] text-muted-foreground uppercase mt-1">
                SYSTEM.PREFERENCES
            </p>
        </div>
        <h1 className="text-[clamp(2.5rem,8vw,5.5rem)] font-black tracking-tighter leading-none uppercase">
          Settings
        </h1>
      </header>

      {/* SETTINGS CONTENT */}
      <div className="flex-1 max-w-4xl space-y-12 md:space-y-20 pb-12">
        
        {/* APPEARANCE */}
        <section>
          <div className="flex items-center gap-2 mb-6">
            <Monitor className="h-4 w-4 text-[#FF4500]" />
            <h3 className="font-mono text-xs font-bold tracking-[0.3em] uppercase text-muted-foreground/80">Appearance</h3>
          </div>
          <div className="p-6 rounded-2xl border border-border bg-muted/20 flex items-center justify-between">
            <div>
              <p className="font-bold text-lg">Visual Theme</p>
              <p className="text-sm text-muted-foreground">Toggle between cinematic light and dark modes.</p>
            </div>
            <div className="scale-125 transform-gpu outline outline-offset-4 outline-border rounded-lg">
                <ModeSwitcher />
            </div>
          </div>
        </section>

        {/* STOPWATCH CONTROLS */}
        <section>
          <div className="flex items-center gap-2 mb-6">
            <Zap className="h-4 w-4 text-[#FF4500]" />
            <h3 className="font-mono text-xs font-bold tracking-[0.3em] uppercase text-muted-foreground/80">Global Controls</h3>
          </div>
          <div className="p-6 rounded-2xl border border-border bg-muted/20 flex items-center justify-between">
            <div>
              <p className="font-bold text-lg">Reset Stopwatch</p>
              <p className="text-sm text-muted-foreground">Clear all active timers, laps, and sync data across all clients.</p>
            </div>
            <Button 
                variant="outline" 
                onClick={handleGlobalReset}
                disabled={resetting}
                className={cn(
                    "flex items-center gap-2 font-mono h-12 px-6 rounded-full border-border hover:bg-destructive hover:text-destructive-foreground transition-all duration-300",
                    resetting && "animate-pulse opacity-50"
                )}
            >
              <RotateCcw className={cn("h-4 w-4", resetting && "animate-spin")} />
              {resetting ? "RESETTING..." : "GLOBAL_RESET"}
            </Button>
          </div>
        </section>

        {/* SYSTEM INFO */}
        <section>
           <div className="flex items-center gap-2 mb-6">
            <Info className="h-4 w-4 text-[#FF4500]" />
            <h3 className="font-mono text-xs font-bold tracking-[0.3em] uppercase text-muted-foreground/80">System Info</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-6 rounded-2xl border border-border bg-muted/5">
                <p className="font-mono text-[10px] text-muted-foreground mb-1">VERSION</p>
                <p className="font-mono font-bold">0.1.0_CORE_ALPHA</p>
              </div>
              <div className="p-6 rounded-2xl border border-border bg-muted/5">
                <p className="font-mono text-[10px] text-muted-foreground mb-1">LATENCY_SYNC</p>
                <p className="font-mono font-bold">0.0001ms</p>
              </div>
              <div className="p-6 rounded-2xl border border-border bg-muted/5">
                <p className="font-mono text-[10px] text-muted-foreground mb-1">BUILD_ID</p>
                <p className="font-mono font-bold tracking-tighter">CHRONO-2024-X-99</p>
              </div>
              <div className="p-6 rounded-2xl border border-border bg-muted/5 flex items-center justify-between">
                <div>
                   <p className="font-mono text-[10px] text-muted-foreground mb-1">SOURCE</p>
                   <p className="font-mono font-bold">GITHUB_REPOSITORY</p>
                </div>
                <Github className="h-5 w-5 opacity-40 hover:opacity-100 transition-opacity cursor-pointer" />
              </div>
          </div>
        </section>

      </div>

      <style jsx global>{`
        body { background: var(--background); margin: 0; overflow: hidden; height: 100dvh; }
      `}</style>
    </main>
  );
}
