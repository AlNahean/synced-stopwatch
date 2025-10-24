import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export async function POST(request: Request) {
  try {
    const { action, currentTime } = await request.json();

    let stopwatch = await prisma.stopwatch.findUnique({
      where: { id: "singleton" },
    });

    if (!stopwatch) {
      stopwatch = await prisma.stopwatch.create({ data: { id: "singleton" } });
    }

    let logAction: string = action.toUpperCase();
    let logDetails: string | undefined = undefined;

    switch (action) {
      case "start":
        if (stopwatch.isRunning) return NextResponse.json(stopwatch);
        await prisma.stopwatch.update({
          where: { id: "singleton" },
          data: {
            isRunning: true,
            startTime: new Date(Date.now() - Number(stopwatch.elapsedTime)),
          },
        });
        break;

      case "pause":
        if (!stopwatch.isRunning) return NextResponse.json(stopwatch);
        const elapsedTime = BigInt(Date.now() - stopwatch.startTime.getTime());
        await prisma.stopwatch.update({
          where: { id: "singleton" },
          data: { isRunning: false, elapsedTime },
        });
        break;

      case "lap":
        if (!stopwatch.isRunning)
          return NextResponse.json(
            { error: "Stopwatch not running" },
            { status: 400 }
          );
        await prisma.lap.create({
          data: { stopwatchId: "singleton", time: BigInt(currentTime) },
        });
        logDetails = `Time: ${currentTime}ms`;
        break;

      case "reset":
        await prisma.$transaction([
          prisma.lap.deleteMany({ where: { stopwatchId: "singleton" } }),
          prisma.stopwatch.update({
            where: { id: "singleton" },
            data: {
              isRunning: false,
              startTime: new Date(),
              elapsedTime: BigInt(0),
            },
          }),
        ]);
        break;

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // Create an activity log for the action
    await prisma.activityLog.create({
      data: {
        stopwatchId: "singleton",
        action: logAction,
        details: logDetails,
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error(`Failed to perform action:`, error);
    return NextResponse.json(
      { error: "Failed to update stopwatch" },
      { status: 500 }
    );
  }
}
