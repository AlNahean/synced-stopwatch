import { Server, type Socket } from "socket.io";
import { prisma } from "@/lib/prisma";
import type { Server as HTTPServer } from "http";
import type { Socket as NetSocket } from "net";
import type { NextApiRequest, NextApiResponse } from "next";

interface SocketServer extends HTTPServer {
  io?: Server | undefined;
}

interface SocketWithIO extends NetSocket {
  server: SocketServer;
}

interface NextApiResponseWithSocket extends NextApiResponse {
  socket: SocketWithIO;
}

// In-memory store for connected clients
const connectedClients = new Map<string, { id: string; connectedAt: Date }>();

// Helper to serialize BigInt values in the stopwatch state
const serializeStopwatch = (stopwatch: any) => ({
  ...stopwatch,
  elapsedTime: stopwatch.elapsedTime.toString(),
  laps: stopwatch.laps.map((lap: any) => ({
    ...lap,
    time: lap.time.toString(),
  })),
});

export default function socketHandler(
  req: NextApiRequest,
  res: NextApiResponseWithSocket
) {
  if (res.socket.server.io) {
    res.end();
    return;
  }

  const io = new Server(res.socket.server);
  res.socket.server.io = io;

  io.on("connection", (socket: Socket) => {
    console.log("A client connected:", socket.id);
    connectedClients.set(socket.id, { id: socket.id, connectedAt: new Date() });

    // Broadcast the updated client list to all clients
    io.emit("client_list_update", Array.from(connectedClients.values()));

    socket.on("action", async (data) => {
      try {
        const { action, currentTime } = data;
        let stopwatch = await prisma.stopwatch.findUnique({
          where: { id: "singleton" },
        });

        if (!stopwatch) {
          stopwatch = await prisma.stopwatch.create({
            data: { id: "singleton" },
          });
        }

        switch (action) {
          case "start":
            await prisma.stopwatch.update({
              where: { id: "singleton" },
              data: {
                isRunning: true,
                startTime: new Date(Date.now() - Number(stopwatch.elapsedTime)),
              },
            });
            break;
          case "pause":
            const elapsedTime = BigInt(
              Date.now() - stopwatch.startTime.getTime()
            );
            await prisma.stopwatch.update({
              where: { id: "singleton" },
              data: { isRunning: false, elapsedTime },
            });
            break;
          case "lap":
            if (!stopwatch.isRunning) return;
            await prisma.lap.create({
              data: { stopwatchId: "singleton", time: BigInt(currentTime) },
            });
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
        }

        const updatedStopwatch = await prisma.stopwatch.findUnique({
          where: { id: "singleton" },
          include: { laps: { orderBy: { createdAt: "desc" } } },
        });

        if (updatedStopwatch) {
          io.emit("state_update", serializeStopwatch(updatedStopwatch));
        }
      } catch (error) {
        console.error(`Socket action '${data.action}' failed:`, error);
      }
    });

    socket.on("disconnect", () => {
      console.log("A client disconnected:", socket.id);
      connectedClients.delete(socket.id);
      // Broadcast the updated client list to all clients
      io.emit("client_list_update", Array.from(connectedClients.values()));
    });
  });

  res.end();
}
