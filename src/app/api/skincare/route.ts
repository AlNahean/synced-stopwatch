import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get("year");
    const date = searchParams.get("date");

    if (date) {
      const log = await prisma.skincareProgress.findUnique({
        where: { date },
      });
      return NextResponse.json(log || {
        date,
        cleanseM: false,
        moistM: false,
        protectM: false,
        lipsM: false,
        cleanseE: false,
        moistE: false,
        matchaMask: false,
      });
    }

    const where = year
      ? { date: { startsWith: `${year}-` } }
      : {};

    const logs = await prisma.skincareProgress.findMany({
      where,
      orderBy: { date: "asc" },
    });
    return NextResponse.json(logs);
  } catch (error) {
    console.error("Failed to fetch skincare progress:", error);
    return NextResponse.json(
      { error: "Failed to fetch skincare progress" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { date, step, completed } = body;

    if (!date || !step || typeof completed !== "boolean") {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const validSteps = ["cleanseM", "moistM", "protectM", "lipsM", "cleanseE", "moistE", "matchaMask"];
    if (!validSteps.includes(step)) {
      return NextResponse.json({ error: "Invalid step name" }, { status: 400 });
    }

    const updated = await prisma.skincareProgress.upsert({
      where: { date },
      update: {
        [step]: completed,
      },
      create: {
        date,
        cleanseM: step === "cleanseM" ? completed : false,
        moistM: step === "moistM" ? completed : false,
        protectM: step === "protectM" ? completed : false,
        lipsM: step === "lipsM" ? completed : false,
        cleanseE: step === "cleanseE" ? completed : false,
        moistE: step === "moistE" ? completed : false,
        matchaMask: step === "matchaMask" ? completed : false,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update skincare progress:", error);
    return NextResponse.json(
      { error: "Failed to update skincare progress" },
      { status: 500 }
    );
  }
}
