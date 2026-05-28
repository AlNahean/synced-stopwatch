import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get("year");

    const where = year
      ? { date: { startsWith: `${year}-` } }
      : {};

    const logs = await prisma.salatProgress.findMany({
      where,
      orderBy: { date: "asc" },
    });
    return NextResponse.json(logs);
  } catch (error) {
    console.error("Failed to fetch salat progress:", error);
    return NextResponse.json(
      { error: "Failed to fetch salat progress" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { date, prayer, completed } = body;

    if (!date || !prayer || typeof completed !== "boolean") {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const validPrayers = ["fajr", "dhuhr", "asr", "maghrib", "isha"];
    if (!validPrayers.includes(prayer)) {
      return NextResponse.json({ error: "Invalid prayer name" }, { status: 400 });
    }

    const updated = await prisma.salatProgress.upsert({
      where: { date },
      update: {
        [prayer]: completed,
      },
      create: {
        date,
        fajr: prayer === "fajr" ? completed : false,
        dhuhr: prayer === "dhuhr" ? completed : false,
        asr: prayer === "asr" ? completed : false,
        maghrib: prayer === "maghrib" ? completed : false,
        isha: prayer === "isha" ? completed : false,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update salat progress:", error);
    return NextResponse.json(
      { error: "Failed to update salat progress" },
      { status: 500 }
    );
  }
}
