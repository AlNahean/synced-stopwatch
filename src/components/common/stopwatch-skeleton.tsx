"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function StopwatchSkeleton() {
  return (
    <main className="fixed inset-0 bg-background text-foreground flex flex-col p-8 md:p-16 pb-28 sm:pb-32 overflow-hidden select-none antialiased">
      <header className="flex-none z-10 mb-8 md:mb-16">
        <Skeleton className="h-3 w-48 opacity-20" />
        <Skeleton className="h-[max(5vw,3rem)] w-3/4 mt-4 opacity-30" />
        <div className="flex gap-4 mt-6">
          <Skeleton className="h-3 w-24 opacity-20" />
          <Skeleton className="h-3 w-24 opacity-20" />
        </div>
      </header>
      <section className="flex-1 w-full flex items-center justify-center py-6">
        <div className="flex items-center gap-12 sm:gap-24 opacity-50">
          <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full border border-border opacity-20" />
          <div className="h-24 w-24 sm:h-32 sm:w-32 rounded-full border border-border opacity-30" />
          <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full border border-border opacity-20" />
        </div>
      </section>
      <footer className="flex-none z-10 flex justify-between items-end border-t border-border pt-8">
        <div className="flex flex-col gap-4">
          <Skeleton className="h-6 w-32 opacity-20" />
          <Skeleton className="h-6 w-32 opacity-20" />
        </div>
        <div className="flex flex-col gap-2 items-end">
          <Skeleton className="h-3 w-24 opacity-20" />
          <Skeleton className="h-3 w-32 opacity-20" />
        </div>
      </footer>
    </main>
  );
}
