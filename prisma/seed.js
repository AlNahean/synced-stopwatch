const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // 1. Seed Stopwatch singleton
  console.log("Initializing Stopwatch singleton...");
  await prisma.stopwatch.upsert({
    where: { id: "singleton" },
    update: {},
    create: {
      id: "singleton",
      isRunning: false,
      elapsedTime: 0,
      startTime: new Date(),
    },
  });

  // 2. Seed Stopwatch Laps
  console.log("Seeding Stopwatch Laps...");
  await prisma.lap.deleteMany({ where: { stopwatchId: "singleton" } });
  const laps = [
    { stopwatchId: "singleton", time: BigInt(15430) },
    { stopwatchId: "singleton", time: BigInt(42100) },
    { stopwatchId: "singleton", time: BigInt(89050) },
  ];
  for (const lap of laps) {
    await prisma.lap.create({ data: lap });
  }

  // 3. Seed Stopwatch Activity Logs
  console.log("Seeding Stopwatch Activity Logs...");
  await prisma.activityLog.deleteMany({ where: { stopwatchId: "singleton" } });
  const activities = [
    { stopwatchId: "singleton", action: "START", details: null, comment: "Session started" },
    { stopwatchId: "singleton", action: "LAP", details: "Time: 15430ms", comment: "First lap completed, ahead of pace" },
    { stopwatchId: "singleton", action: "LAP", details: "Time: 42100ms", comment: "Pushed harder on lap 2, steady cadence" },
    { stopwatchId: "singleton", action: "PAUSE", details: null, comment: "Taking a short breathing break" },
    { stopwatchId: "singleton", action: "START", details: null, comment: "Resumed training session" },
    { stopwatchId: "singleton", action: "LAP", details: "Time: 89050ms", comment: "Completed final interval" },
    { stopwatchId: "singleton", action: "PAUSE", details: null, comment: "Finished training session" },
  ];
  for (const act of activities) {
    await prisma.activityLog.create({ data: act });
  }

  // 4. Seed Salat Progress Logs (last 60 days)
  console.log("Seeding Salat Progress Logs (past 60 days)...");
  await prisma.salatProgress.deleteMany({});
  
  const today = new Date();
  for (let i = 0; i < 60; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    
    // Choose how many prayers are done on this day (realistic weightings: 5/5 is common, some 3/5 or 4/5, rarely 0-2/5)
    const r = Math.random();
    let numPrayers = 5;
    if (r < 0.05) numPrayers = 0;
    else if (r < 0.1) numPrayers = 2;
    else if (r < 0.25) numPrayers = 3;
    else if (r < 0.5) numPrayers = 4;
    else numPrayers = 5;
    
    // Select which specific prayers are completed randomly matching the count
    const prayers = ["fajr", "dhuhr", "asr", "maghrib", "isha"];
    // Shuffle
    const shuffled = prayers.sort(() => Math.random() - 0.5);
    
    const data = {
      date: dateStr,
      fajr: false,
      dhuhr: false,
      asr: false,
      maghrib: false,
      isha: false,
    };
    
    for (let j = 0; j < numPrayers; j++) {
      data[shuffled[j]] = true;
    }
    
    await prisma.salatProgress.create({
      data
    });
  }

  // 5. Seed Workout Progress Logs (last 60 days)
  console.log("Seeding Workout Progress Logs (past 60 days)...");
  await prisma.workoutProgress.deleteMany({});
  
  for (let i = 0; i < 60; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    
    // Realistic workout distribution: 50% hit exactly 1000 target, 30% partial, 20% rest days (0 reps)
    const r = Math.random();
    
    let pullups = 0;
    let pushups = 0;
    let squats = 0;
    let expander = 0;
    let curls = 0;
    let core = 0;
    let grip = 0;

    if (r < 0.5) {
      // Completed (1000 reps)
      pullups = 50;
      pushups = 200;
      squats = 250;
      expander = 200;
      curls = 150;
      core = 150;
      grip = Math.floor(Math.random() * 250);
    } else if (r < 0.8) {
      // Partial workout
      pullups = Math.floor(Math.random() * 10) * 5; // steps of 5
      pushups = Math.floor(Math.random() * 20) * 10;
      squats = Math.floor(Math.random() * 25) * 10;
      expander = Math.floor(Math.random() * 20) * 10;
      curls = Math.floor(Math.random() * 15) * 10;
      core = Math.floor(Math.random() * 15) * 10;
      grip = Math.floor(Math.random() * 150);
    }
    
    await prisma.workoutProgress.create({
      data: {
        date: dateStr,
        pullups,
        pushups,
        squats,
        expander,
        curls,
        core,
        grip,
      }
    });
  }

  // 6. Seed Skincare Progress Logs (last 60 days)
  console.log("Seeding Skincare Progress Logs (past 60 days)...");
  await prisma.skincareProgress.deleteMany({});

  for (let i = 0; i < 60; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    
    // Realistic skincare compliance (high probability of cleansing/moisturizing, matching twice a week matcha mask)
    const dayOfWeek = d.getDay(); // 0 = Sunday, 3 = Wednesday (let's say matcha mask on Wed and Sun)
    const isMatchaNight = (dayOfWeek === 0 || dayOfWeek === 3) && Math.random() < 0.9;

    await prisma.skincareProgress.create({
      data: {
        date: dateStr,
        cleanseM: Math.random() < 0.95,
        moistM: Math.random() < 0.95,
        protectM: Math.random() < 0.85,
        lipsM: Math.random() < 0.8,
        cleanseE: Math.random() < 0.9,
        moistE: Math.random() < 0.9,
        matchaMask: isMatchaNight,
      }
    });
  }

  console.log("Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
