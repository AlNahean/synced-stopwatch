import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
    return (
        <main className="fixed inset-0 bg-background text-foreground flex flex-col p-5 sm:p-8 md:p-12 lg:p-16 pb-28 sm:pb-32 overflow-hidden select-none antialiased">
            {/* HEADER SKELETON */}
            <header className="flex-none mb-6 md:mb-10 bg-background/80 backdrop-blur-sm z-10 relative">
                <Skeleton className="h-3 w-48 opacity-20 uppercase tracking-[0.4em]" />
                <div className="flex items-baseline gap-x-2 sm:gap-x-4 mt-2">
                    <Skeleton className="h-[max(4vw,2.5rem)] w-32 opacity-30" />
                    <Skeleton className="h-[max(2.5vw,1.5rem)] w-40 opacity-20" />
                </div>
                <div className="flex flex-wrap gap-2 sm:gap-4 mt-3">
                    <Skeleton className="h-3 w-32 opacity-20" />
                    <Skeleton className="h-3 w-48 opacity-20" />
                </div>
            </header>

            {/* GRID SKELETON */}
            <section className="flex-1 min-h-0 w-full flex items-center justify-center overflow-hidden relative">
                <div className="grid w-full h-auto max-w-6xl mx-auto grid-cols-12 md:grid-cols-16 lg:grid-cols-24 gap-1.5 sm:gap-2 lg:gap-3">
                    {Array.from({ length: 96 }).map((_, i) => (
                        <div key={i} className="relative w-full flex items-center justify-center">
                            <div className="w-full aspect-square rounded-full bg-muted/40 border border-border/20" />
                        </div>
                    ))}
                </div>
            </section>

            {/* FOOTER SKELETON */}
            <footer className="flex-none z-10 flex justify-between items-end border-t border-border pt-6 mt-4 bg-background/80 backdrop-blur-sm relative">
                <div className="flex flex-col gap-2">
                    <Skeleton className="h-8 w-40 opacity-20" />
                    <Skeleton className="h-3 w-32 opacity-15" />
                </div>
                <div className="flex flex-col gap-2 items-end">
                    <Skeleton className="h-3 w-24 opacity-15" />
                    <Skeleton className="h-3 w-32 opacity-10" />
                </div>
            </footer>
        </main>
    );
}
