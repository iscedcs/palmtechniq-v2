import { Server as HttpServer } from "http";
import { NextApiRequest } from "next";
import { getToken } from "next-auth/jwt";
import { Server as IOServer } from "socket.io";
import { db } from "./db";

type IO = IOServer | null;

declare global {
  // eslint-disable-next-line no-var
  var _io: IO | undefined;
}

export function initIO(server: HttpServer) {
  if (!global._io) {
    const isProd = process.env.NODE_ENV === "production";
    const configuredOrigins = (process.env.SOCKET_ALLOWED_ORIGINS ?? "")
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean);
    const allowedOrigin = Array.from(
      new Set([
        process.env.NEXT_PUBLIC_URL,
        ...configuredOrigins,
        ...(isProd ? [] : ["http://localhost:2026"]),
      ].filter(Boolean))
    ) as string[];

    const io = new IOServer(server, {
      path: "/api/socket",
      cors: {
        origin: (origin, cb) => {
          if (!origin) return cb(null, true);
          if (allowedOrigin.includes(origin)) {
            return cb(null, true);
          }
          cb(new Error("Not allowed by CORS"));
        },
        credentials: true,
      },
    });

    io.use(async (socket, next) => {
      try {
        const req = socket.request as any;
        // const cookie = socket.request.headers.cookie ?? "";
        const token = await getToken({
          req,
          secret: process.env.AUTH_SECRET,
          // cookieName: "authjs.session-token",
        });
        if (!token?.sub) return next(new Error("Unauthorized"));

        (socket.data.user = {
          id: token.sub,
          role: (token as any).role ?? "USER",
        }),
          next();
      } catch (err) {
        next(err as Error);
      }
    });

    io.on("connection", async (socket) => {
      const { id: userId, role } = socket.data.user as {
        id: string;
        role: string;
      };

      socket.join(`user:${userId}`);
      socket.join(`role:${role}`);
      try {
        const enrollments = await db.enrollment.findMany({
          where: { userId, status: "ACTIVE" },
          select: { courseId: true },
        });
        enrollments.forEach(({ courseId }) => {
          socket.join(`course:${courseId}`);
        });
      } catch (e) {
        console.warn("Failed to join course rooms for", userId, e);
      }
      if (!isProd) {
        console.log("Socket connected:", socket.id, "user:", userId, "role:", role);
      }

      socket.emit("notification", {
        type: "info",
        title: "Connected",
        message: "You are now connected to the notification service",
      });

      socket.on("disconnect", () => {
        if (!isProd) {
          console.log("Socket disconnected:", socket.id);
        }
      });
    });

    global._io = io;
    if (!isProd) {
      console.log("Socket.IO initialized globally");
    }
  }

  return global._io!;
}

export function getIO() {
  return global._io ?? null;
}
