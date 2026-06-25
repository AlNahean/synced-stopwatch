import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get("year");
    const date = searchParams.get("date");

    if (date) {
      const log = await prisma.workoutProgress.findUnique({
        where: { date },
      });
      return NextResponse.json(log || {
        date,
        pullups: 0,
        pushups: 0,
        squats: 0,
        expander: 0,
        curls: 0,
        core: 0,
        grip: 0,
      });
    }

    const where = year
      ? { date: { startsWith: `${year}-` } }
      : {};

    const logs = await prisma.workoutProgress.findMany({
      where,
      orderBy: { date: "asc" },
    });
    return NextResponse.json(logs);
  } catch (error) {
    console.error("Failed to fetch workout progress:", error);
    return NextResponse.json(
      { error: "Failed to fetch workout progress" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { date, exercise, count } = body;

    if (!date || !exercise || typeof count !== "number") {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const validExercises = ["pullups", "pushups", "squats", "expander", "curls", "core", "grip"];
    if (!validExercises.includes(exercise)) {
      return NextResponse.json({ error: "Invalid exercise name" }, { status: 400 });
    }

    const updated = await prisma.workoutProgress.upsert({
      where: { date },
      update: {
        [exercise]: count,
      },
      create: {
        date,
        pullups: exercise === "pullups" ? count : 0,
        pushups: exercise === "pushups" ? count : 0,
        squats: exercise === "squats" ? count : 0,
        expander: exercise === "expander" ? count : 0,
        curls: exercise === "curls" ? count : 0,
        core: exercise === "core" ? count : 0,
        grip: exercise === "grip" ? count : 0,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update workout progress:", error);
    return NextResponse.json(
      { error: "Failed to update workout progress" },
      { status: 500 }
    );
  }
}
