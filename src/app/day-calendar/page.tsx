'use client';

import React, { useEffect, useState, useMemo } from 'react';

/**
 * DAY PROGRESS // CHRONO-OPTIMIZED MONOLITH (V3 - CLEAN GRID)
 * 
 * FIXES APPLIED:
 * - Removed internal hour text from dots for a much cleaner, minimalist aesthetic.
 * - Retained optimized grid columns to prevent vertical overflow on mobile.
 */

export default function DayProgressPage() {
    const [now, setNow] = useState<Date | null>(null);

    useEffect(() => {
        setNow(new Date());
        const interval = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(interval);
    }, []);

    const stats = useMemo(() => {
        if (!now) return null;

        const hours = now.getHours();
        const minutes = now.getMinutes();
        const seconds = now.getSeconds();

        const totalMinutesInDay = 24 * 60;
        const currentMinutesPassed = (hours * 60) + minutes;
        const secondsIntoDay = (currentMinutesPassed * 60) + seconds;
        const totalSecondsInDay = 24 * 60 * 60;

        const percentage = (secondsIntoDay / totalSecondsInDay) * 100;

        // Grid logic: 96 segments (15 mins each)
        const currentSegment = Math.floor(currentMinutesPassed / 15);

        const remainingMinutes = totalMinutesInDay - currentMinutesPassed;
        const remainingHours = Math.floor(remainingMinutes / 60);
        const remainingMinsDisplay = remainingMinutes % 60;

        return {
            percentage: percentage.toFixed(1),
            remainingHours,
            remainingMins: remainingMinsDisplay,
            currentSegment,
            totalSegments: 96,
            time: now.toLocaleTimeString('en-GB', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            dateLabel: now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: '2-digit' }).toUpperCase()
        };
    }, [now]);

    if (!now || !stats) return <div className="h-screen bg-black" />;

    return (
        <main className="fixed inset-0 bg-[#000000] text-white flex flex-col p-5 sm:p-8 md:p-12 lg:p-16 pb-28 sm:pb-32 overflow-hidden select-none antialiased">

            {/* HEADER: Shielded Space */}
            <header className="flex-none mb-6 md:mb-10 bg-black/80 backdrop-blur-sm z-10 relative">
                <p className="font-mono text-[9px] md:text-[11px] tracking-[0.4em] text-[#444] uppercase">
                    DAILY.CHRONO.PROGRESS
                </p>

                <div className="flex items-baseline gap-x-2 sm:gap-x-4 mt-2">
                    <h1 className="text-[clamp(2.5rem,8vw,5.5rem)] font-black tracking-tighter leading-none">
                        {stats.percentage}%
                    </h1>
                    <h2 className="text-[clamp(1.5rem,5vw,3.5rem)] font-black tracking-tighter leading-none uppercase">
                        <span className="text-[#FF4500]">{stats.remainingHours}H {stats.remainingMins}M</span>
                        <span className="ml-3 hidden sm:inline text-[#222]">LEFT</span>
                    </h2>
                </div>

                <div className="flex flex-wrap gap-2 sm:gap-4 mt-3">
                    <p className="font-mono text-[8px] sm:text-[10px] tracking-[0.2em] text-[#333] uppercase">
                        SEGMENT_RESOLUTION: 15_MIN
                    </p>
                    <p className="font-mono text-[8px] sm:text-[10px] tracking-[0.2em] text-[#333] uppercase hidden xs:block">
                        CYCLE_ID: {now.getFullYear()}-{now.getMonth() + 1}-{now.getDate()}
                    </p>
                </div>
            </header>

            {/* GRID SECTION: Contained center hub */}
            <section className="flex-1 min-h-0 w-full flex items-center justify-center overflow-hidden relative">
                <div
                    className={`
                        grid w-full h-auto max-w-6xl mx-auto
                        /* Column breakpoints to prevent vertical overflow */
                        grid-cols-12 md:grid-cols-16 lg:grid-cols-24
                        gap-1.5 sm:gap-2 lg:gap-3
                    `}
                >
                    {Array.from({ length: stats.totalSegments }).map((_, i) => {
                        const isPast = i < stats.currentSegment;
                        const isCurrent = i === stats.currentSegment;

                        return (
                            <div key={i} className="relative w-full flex items-center justify-center">
                                <div
                                    className={`
                                        w-full aspect-square rounded-full
                                        transition-colors duration-500
                                        ${isPast ? 'bg-white shadow-[0_0_10px_rgba(255,255,255,0.1)]' : ''}
                                        ${isCurrent ? 'bg-[#FF4500] animate-pulse shadow-[0_0_15px_rgba(255,69,0,0.4)]' : ''}
                                        ${!isPast && !isCurrent ? 'bg-[#121212] border border-[#1a1a1a]' : ''}
                                    `}
                                />
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* FOOTER: Shielded Space */}
            <footer className="flex-none z-10 flex justify-between items-end border-t border-[#111] pt-6 mt-4 bg-black/80 backdrop-blur-sm relative">
                <div className="flex flex-col">
                    <span className="font-mono text-lg sm:text-2xl md:text-3xl font-bold tracking-[0.1em] leading-none text-white/90">
                        {stats.time}
                    </span>
                    <p className="font-mono text-[8px] sm:text-[10px] md:text-[11px] tracking-[0.4em] text-[#444] mt-2 uppercase">
                        {stats.dateLabel} // REMAINDER
                    </p>
                </div>

                <div className="text-right font-mono text-[8px] sm:text-[9px] md:text-[10px] tracking-[0.3em] text-[#444] space-y-1 hidden xs:block uppercase">
                    <p className="flex items-center justify-end gap-1.5 sm:gap-2">
                        <span className="w-1.2 h-1.2 rounded-full bg-[#FF4500] opacity-70" />
                        SYSTEM: <span className="text-[#666] ml-1">SYNCED</span>
                    </p>
                    <p className="opacity-50 text-[7px] tracking-[0.4em]">LATENCY: 0.0004ms // V.2.0.1</p>
                </div>
            </footer>

            {/* Layout Overrides */}
            <style jsx global>{`
                body { 
                    background: black; 
                    margin: 0; 
                    overflow: hidden; 
                    height: 100dvh; 
                }
                
                /* Strict enforcement of columns */
                .grid-cols-12 { grid-template-columns: repeat(12, minmax(0, 1fr)) !important; }
                
                @media (min-width: 768px) {
                    .md\:grid-cols-16 { grid-template-columns: repeat(16, minmax(0, 1fr)) !important; }
                }
                
                @media (min-width: 1024px) {
                    .lg\:grid-cols-24 { grid-template-columns: repeat(24, minmax(0, 1fr)) !important; }
                }
            `}</style>
        </main>
    );
}