import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    let stopwatch = await prisma.stopwatch.findUnique({
      where: { id: "singleton" },
      include: { laps: { orderBy: { createdAt: "desc" } } },
    });

    if (!stopwatch) {
      stopwatch = await prisma.stopwatch.create({
        data: {
          id: "singleton",
        },
        include: { laps: true },
      });
    }

    // Convert BigInt to string for JSON serialization
    const serializedStopwatch = {
      ...stopwatch,
      elapsedTime: stopwatch.elapsedTime.toString(),
      laps: stopwatch.laps.map((lap) => ({
        ...lap,
        time: lap.time.toString(),
      })),
    };

    return NextResponse.json(serializedStopwatch);
  } catch (error) {
    console.error("Failed to fetch stopwatch state:", error);
    return NextResponse.json(
      { error: "Failed to fetch stopwatch state" },
      { status: 500 }
    );
  }
}
