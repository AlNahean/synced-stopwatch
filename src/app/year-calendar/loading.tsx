import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
    return (
        <main className="fixed inset-0 bg-background text-foreground flex flex-col p-5 md:p-10 lg:p-16 pb-28 sm:pb-32 overflow-hidden select-none antialiased">
            {/* HEADER SKELETON */}
            <header className="flex-none mb-6 md:mb-12 bg-background/80 backdrop-blur-sm z-10 relative">
                <Skeleton className="h-3 w-48 opacity-20 uppercase tracking-[0.4em]" />
                <div className="flex items-baseline gap-x-2 md:gap-x-4 mt-1">
                    <Skeleton className="h-[max(4vw,2.5rem)] w-32 opacity-30" />
                    <Skeleton className="h-[max(4vw,2.5rem)] w-48 opacity-20" />
                </div>
                <Skeleton className="h-3 w-40 mt-4 opacity-15" />
            </header>

            {/* GRID SKELETON */}
            <section className="flex-1 min-h-0 w-full flex items-center justify-center overflow-hidden relative">
                <div className="grid w-full h-full content-center justify-items-center grid-cols-15 md:grid-cols-25 lg:grid-cols-45 gap-1 lg:gap-2">
                    {Array.from({ length: 365 }).map((_, i) => (
                        <div key={i} className="aspect-square rounded-full w-full max-w-[min(1.8vh,20px)] bg-muted/30 border border-border/10" />
                    ))}
                </div>
            </section>

            {/* FOOTER SKELETON */}
            <footer className="flex-none flex justify-between items-end border-t border-border pt-6 mt-4 bg-background/80 backdrop-blur-sm z-10 relative">
                <div className="flex flex-col gap-2">
                    <Skeleton className="h-6 w-40 opacity-20" />
                    <Skeleton className="h-3 w-48 opacity-15" />
                </div>
                <div className="flex flex-col gap-2 items-end">
                    <Skeleton className="h-3 w-32 opacity-15" />
                    <Skeleton className="h-3 w-24 opacity-10" />
                </div>
            </footer>
        </main>
    );
}
