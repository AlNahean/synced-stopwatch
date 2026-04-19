'use client';

import React, { useEffect, useState, useMemo } from 'react';

/**
 * YEAR PROGRESS // PRO-OPTIMIZED MONOLITH
 * 
 * FIXES:
 * - OVERLAP: Dots now scale based on viewport height (vh) to avoid hitting header/footer.
 * - MOBILE: Columns increased to 15 to make the grid wider/shorter, fitting mobile screens perfectly.
 * - PC: Preserved 45-column cinematic layout with large dots.
 * - ZERO SCROLL: 'fixed inset-0' and 'overflow-hidden'.
 */

export default function YearProgressPage() {
    const [now, setNow] = useState<Date | null>(null);

    useEffect(() => {
        setNow(new Date());
        const interval = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(interval);
    }, []);

    const stats = useMemo(() => {
        if (!now) return null;
        const year = now.getFullYear();
        const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
        const totalDays = isLeapYear ? 366 : 365;
        const startOfYear = new Date(year, 0, 0);
        const diff = now.getTime() - startOfYear.getTime();
        const oneDay = 1000 * 60 * 60 * 24;
        const dayOfYear = Math.floor(diff / oneDay);
        return {
            year,
            totalDays,
            dayOfYear,
            daysRemaining: totalDays - dayOfYear,
            percentage: Math.floor((dayOfYear / totalDays) * 100),
            time: now.toLocaleTimeString('en-GB', { hour12: false }),
            dateLabel: now.toLocaleDateString('en-US', { month: 'short', day: '2-digit' }).toUpperCase()
        };
    }, [now]);

    if (!now || !stats) return <div className="h-screen bg-black" />;

    return (
        <main className="fixed inset-0 bg-[#000000] text-white flex flex-col p-5 md:p-10 lg:p-16 overflow-hidden select-none antialiased">

            {/* HEADER: Protected Space */}
            <header className="flex-none mb-2 md:mb-6">
                <p className="font-mono text-[9px] md:text-[11px] tracking-[0.4em] text-[#444] uppercase">
                    ANNUAL.CYCLE.PROGRESS
                </p>

                <div className="flex items-baseline gap-x-2 md:gap-x-4 mt-1">
                    <h1 className="text-[clamp(2rem,7vw,5rem)] font-black tracking-tighter leading-none">
                        {stats.percentage}%
                    </h1>
                    <h1 className="text-[clamp(2rem,7vw,5rem)] font-black tracking-tighter leading-none uppercase">
                        <span className="text-[#FF4500]">{stats.daysRemaining}</span>
                        <span className="ml-2 hidden xs:inline">DAYS</span>
                        <span className="ml-2 hidden md:inline text-white">REMAINING</span>
                    </h1>
                </div>

                <p className="font-mono text-[9px] md:text-[10px] tracking-[0.2em] text-[#222] uppercase mt-2">
                    END_OF_CYCLE_{stats.year}
                </p>
            </header>

            {/* GRID SECTION: Flexible container that shrinks contents to fit height */}
            <section className="flex-1 min-h-0 w-full flex items-center justify-center">
                <div
                    className={`
            grid w-full h-full content-center justify-items-center
            /* Mobile: 15 Cols (Makes grid shorter to avoid overlap) */
            grid-cols-15 md:grid-cols-25 lg:grid-cols-45
            /* Minimal gap */
            gap-1 lg:gap-2
          `}
                >
                    {Array.from({ length: stats.totalDays }).map((_, i) => {
                        const dayNumber = i + 1;
                        const isPast = dayNumber < stats.dayOfYear;
                        const isToday = dayNumber === stats.dayOfYear;

                        return (
                            <div
                                key={i}
                                className={`
                  aspect-square rounded-full w-full
                  /* DOT SIZING: Height-based sizing (vh) prevents the "Tower" from hitting the footer */
                  max-w-[min(2.1vh,22px)]
                  
                  ${isPast ? 'bg-white' : ''}
                  ${isToday ? 'bg-[#FF4500]' : ''}
                  ${!isPast && !isToday ? 'bg-[#151515]' : ''}
                `}
                            />
                        );
                    })}
                </div>
            </section>

            {/* FOOTER SECTION: Protected Space */}
            <footer className="flex-none flex justify-between items-end border-t border-[#111] pt-4 md:pt-8 mt-2">
                <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full border border-[#222] flex items-center justify-center text-[10px] text-white font-bold shrink-0">
                        N
                    </div>
                    <div className="flex flex-col">
                        <span className="font-mono text-sm md:text-xl font-bold tracking-widest leading-none">
                            {stats.time}
                        </span>
                        <p className="font-mono text-[9px] md:text-[10px] tracking-[0.3em] text-[#444] mt-1">
                            {stats.dateLabel} // {stats.year}
                        </p>
                    </div>
                </div>

                <div className="text-right font-mono text-[9px] md:text-[10px] tracking-[0.2em] text-[#333] space-y-0.5">
                    <p>STATUS: <span className="text-white">ACTIVE</span></p>
                    <p>CORE_SYSTEM_V1.0.4</p>
                </div>
            </footer>

            {/* Breakpoint Overrides for Custom Grids */}
            <style jsx global>{`
        body { background: black; margin: 0; overflow: hidden; height: 100dvh; }
        
        /* Mobile Grid */
        .grid-cols-15 { grid-template-columns: repeat(15, minmax(0, 1fr)) !important; }
        
        /* Tablet Grid */
        @media (min-width: 768px) {
          .md\:grid-cols-25 { grid-template-columns: repeat(25, minmax(0, 1fr)) !important; }
        }
        
        /* PC Grid */
        @media (min-width: 1024px) {
          .lg\:grid-cols-45 { grid-template-columns: repeat(45, minmax(0, 1fr)) !important; }
        }
      `}</style>
        </main>
    );
}