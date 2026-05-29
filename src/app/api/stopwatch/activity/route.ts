import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const activities = await prisma.activityLog.findMany({
      where: { stopwatchId: "singleton" },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(activities);
  } catch (error) {
    console.error("Failed to fetch activity log:", error);
    return NextResponse.json(
      { error: "Failed to fetch activity log" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const { id, comment } = await request.json();
    if (!id) {
      return NextResponse.json(
        { error: "Activity log ID is required" },
        { status: 400 }
      );
    }
    const updated = await prisma.activityLog.update({
      where: { id },
      data: { comment },
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update activity log comment:", error);
    return NextResponse.json(
      { error: "Failed to update activity log comment" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    await prisma.activityLog.deleteMany({
      where: { stopwatchId: "singleton" },
    });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Failed to clear activity log:", error);
    return NextResponse.json(
      { error: "Failed to clear activity log" },
      { status: 500 }
    );
  }
}

