"use client";

import React, { useState, useEffect } from "react";
import { 
  History, 
  Terminal, 
  Check, 
  X, 
  Edit3, 
  FileDown, 
  ArrowLeft,
  Loader2
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

type ActivityLog = {
  id: string;
  stopwatchId: string;
  action: string;
  details: string | null;
  comment: string | null;
  createdAt: string;
};

export default function HistoryPage() {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingActivityId, setEditingActivityId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState("");

  const fetchActivities = async () => {
    try {
      const response = await fetch("/api/stopwatch/activity");
      if (response.ok) {
        const data = await response.json();
        setActivities(data);
      }
    } catch (error) {
      console.error("Failed to fetch activities:", error);
      toast.error("Failed to load activities.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  const handleSaveComment = async (id: string) => {
    try {
      // Optimistic update
      setActivities(prev => 
        prev.map(act => act.id === id ? { ...act, comment: editingCommentText } : act)
      );
      setEditingActivityId(null);

      const res = await fetch("/api/stopwatch/activity", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, comment: editingCommentText }),
      });

      if (!res.ok) throw new Error("Failed to save comment");

      const updated = await res.json();
      setActivities(prev => 
        prev.map(act => act.id === id ? updated : act)
      );
      toast.success("Comment saved.");
    } catch (error) {
      console.error("Error saving comment:", error);
      toast.error("Failed to save comment.");
      fetchActivities(); // Rollback
    }
  };

  const handleExportMDX = () => {
    if (activities.length === 0) {
      toast.error("No activities available to export.");
      return;
    }

    const timestamp = new Date().toISOString();
    let mdxContent = `---
title: Synced Stopwatch Session Logs
exportedAt: ${timestamp}
totalEvents: ${activities.length}
schema: ActivityLog.V1.1
---

# Synced Stopwatch Activity History

Exported session record representing the historical timeline of stopwatch state adjustments, laps, and annotated logs.

| Action | Executed At | Latency / Details | Comments / Annotations |
| :--- | :--- | :--- | :--- |
`;

    activities.forEach((act) => {
      const execDate = new Date(act.createdAt);
      const timeStr = execDate.toLocaleTimeString("en-GB", { hour12: false });
      const msStr = String(execDate.getMilliseconds()).padStart(3, "0");
      const dateStr = execDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      
      const actionName = act.action.toUpperCase();
      const detailsText = act.details || "-";
      const commentText = act.comment || "-";
      
      mdxContent += `| **${actionName}** | ${dateStr} at ${timeStr}.${msStr} | ${detailsText} | ${commentText} |\n`;
    });

    mdxContent += `
---

## System Notes

> [!NOTE]
> This MDX document was compiled automatically by the Synced Stopwatch dashboard console exporter.
`;

    const blob = new Blob([mdxContent], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `stopwatch_activities_${new Date().toISOString().split('T')[0]}.mdx`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("MDX report exported successfully!");
  };

  const getActionColor = (action: string) => {
    switch (action.toUpperCase()) {
      case "START":
        return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
      case "PAUSE":
        return "text-amber-500 bg-amber-500/10 border-amber-500/20";
      case "LAP":
        return "text-sky-500 bg-sky-500/10 border-sky-500/20";
      case "RESET":
        return "text-rose-500 bg-rose-500/10 border-rose-500/20";
      default:
        return "text-muted-foreground bg-muted border-border";
    }
  };

  const getActionStatusDot = (action: string) => {
    switch (action.toUpperCase()) {
      case "START":
        return "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]";
      case "PAUSE":
        return "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]";
      case "LAP":
        return "bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.5)]";
      case "RESET":
        return "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]";
      default:
        return "bg-muted-foreground";
    }
  };

  return (
    <main className="fixed inset-0 bg-background text-foreground flex flex-col p-4 sm:p-6 md:p-8 lg:p-12 pb-28 sm:pb-32 overflow-y-auto no-scrollbar antialiased">
      <Toaster position="top-right" richColors />
      
      {/* HEADER SECTION */}
      <header className="flex-none mb-8 sm:mb-12 border-b border-border/40 pb-4 max-w-4xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link 
              href="/"
              className="h-10 w-10 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-foreground/60" />
            </Link>
            <div>
              <p className="font-mono text-[9px] md:text-[11px] tracking-[0.4em] text-muted-foreground/60 uppercase">
                CHRONO.STOPWATCH.SYNCED
              </p>
              <div className="flex items-center gap-3 mt-1.5">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tighter leading-none uppercase">
                  Activity Logs
                </h1>
                <div className="flex items-center gap-1 bg-[#FF4500]/10 text-[#FF4500] text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold tracking-wider">
                  <History className="h-3 w-3" />
                  HISTORY_CONSOLE
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleExportMDX}
            disabled={loading || activities.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-[#FF4500]/15 border border-[#FF4500]/25 rounded-full text-xs font-mono font-bold tracking-wider hover:bg-[#FF4500]/25 transition-all text-[#FF4500] disabled:opacity-30 disabled:pointer-events-none self-start sm:self-end"
          >
            <FileDown className="h-4 w-4" />
            EXPORT TO MDX
          </button>
        </div>
      </header>

      {/* CONSOLE AREA */}
      <div className="flex-1 max-w-4xl mx-auto w-full mb-6">
        <div className="flex flex-col h-full min-h-[400px] w-full bg-muted/5 dark:bg-black/10 border border-border/80 rounded-2xl p-5 sm:p-6 backdrop-blur-md">
          <div className="flex-none flex items-center justify-between border-b border-border/30 pb-3 mb-4 font-mono text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-bold tracking-[0.2em] text-muted-foreground">LIVE_FEED</span>
            </div>
            <span className="text-muted-foreground/50 tracking-wider">
              {activities.length} EVENTS LOADED
            </span>
          </div>

          <div className="flex-1 space-y-3 pb-8">
            {loading ? (
              <div className="h-48 flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-[#FF4500] animate-spin" />
              </div>
            ) : activities.length === 0 ? (
              <div className="h-48 border border-dashed border-border/40 rounded-xl flex flex-col items-center justify-center p-6 text-center">
                <p className="font-mono text-[10px] text-muted-foreground/40 uppercase tracking-wider mb-1">CONSOLE_EMPTY</p>
                <p className="font-mono text-[9px] text-muted-foreground/20 uppercase tracking-normal">No recorded actions detected.</p>
              </div>
            ) : (
              activities.map((act) => {
                const isEditing = editingActivityId === act.id;
                const execDate = new Date(act.createdAt);
                const timeFormatted = execDate.toLocaleTimeString("en-GB", {
                  hour12: false,
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                });
                const msFormatted = String(execDate.getMilliseconds()).padStart(3, "0");
                const dateLabel = execDate.toLocaleDateString("en-US", { month: "short", day: "numeric" }).toUpperCase();

                return (
                  <div 
                    key={act.id} 
                    className="group p-4 rounded-xl border border-border/40 bg-muted/10 dark:bg-muted/5 flex flex-col relative transition-all duration-300 hover:border-border hover:bg-muted/15"
                  >
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-3">
                        <span className={cn("w-1.5 h-1.5 rounded-full", getActionStatusDot(act.action))} />
                        <span className={cn("font-mono text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider", getActionColor(act.action))}>
                          {act.action}
                        </span>
                        {act.details && (
                          <span className="font-mono text-[9px] text-muted-foreground/75 font-medium">
                            {act.details}
                          </span>
                        )}
                      </div>
                      <span className="font-mono text-[9px] text-muted-foreground/40 tabular-nums">
                        {dateLabel} // {timeFormatted}.{msFormatted}
                      </span>
                    </div>

                    {/* Inline Comment Edit */}
                    <div className="mt-3 border-t border-border/10 pt-2.5">
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editingCommentText}
                            onChange={(e) => setEditingCommentText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSaveComment(act.id);
                              if (e.key === "Escape") setEditingActivityId(null);
                            }}
                            className="flex-1 bg-background/60 border border-border/80 rounded px-2.5 py-1 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-[#FF4500]"
                            placeholder="Add action commentary..."
                            autoFocus
                          />
                          <button 
                            onClick={() => handleSaveComment(act.id)}
                            className="text-emerald-500 hover:text-emerald-400 p-1 transition-colors"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => setEditingActivityId(null)}
                            className="text-muted-foreground/60 hover:text-muted-foreground p-1 transition-colors"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : act.comment ? (
                        <div 
                          onClick={() => {
                            setEditingActivityId(act.id);
                            setEditingCommentText(act.comment || "");
                          }}
                          className="cursor-pointer flex items-start justify-between gap-2 p-2.5 rounded bg-muted/20 border border-border/20 group/cmt hover:bg-muted/40 transition-colors"
                        >
                          <span className="font-mono text-xs text-muted-foreground group-hover/cmt:text-foreground break-all flex-1">
                            {act.comment}
                          </span>
                          <Edit3 className="h-3.5 w-3.5 opacity-0 group-hover/cmt:opacity-100 text-muted-foreground hover:text-[#FF4500] flex-shrink-0 transition-opacity self-center" />
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingActivityId(act.id);
                            setEditingCommentText("");
                          }}
                          className="text-[10px] font-mono text-muted-foreground/45 hover:text-[#FF4500] flex items-center gap-1.5 transition-colors"
                        >
                          <span>+ ADD_COMMENT</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* FOOTER SECTION */}
      <footer className="flex-none max-w-4xl mx-auto w-full flex justify-between items-end border-t border-border/50 pt-6 mt-6 bg-background/80 backdrop-blur-sm relative">
        <div className="flex flex-col">
          <span className="font-mono text-sm sm:text-xl font-bold tracking-widest leading-none text-foreground/90 uppercase">
            SYNCED_HISTORY
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
          <p className="opacity-60 text-[7px] tracking-[0.4em]">SYSTEM_VERSION_V1.1.0_HISTORY</p>
        </div>
      </footer>

      {/* CUSTOM STYLE OVERRIDES */}
      <style dangerouslySetInnerHTML={{ __html: `
        body { 
          background: var(--background); 
          margin: 0; 
          overflow: hidden; 
          height: 100dvh; 
        }
        /* Hide scrollbars but keep scrolling working */
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
