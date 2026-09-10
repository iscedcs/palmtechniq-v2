import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";

neonConfig.webSocketConstructor = globalThis.WebSocket;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  const isPlaceholderUrl =
    !connectionString ||
    connectionString.includes("localhost:5432/postgres") ||
    connectionString === "ci-placeholder";
  
  // During build time or CI without real DB, DATABASE_URL might not be available
  // In this case, we return a lazy-loading client that will work at runtime
  if (isPlaceholderUrl) {
    console.warn(
      "DATABASE_URL not available or set to placeholder during build. The app will use database at runtime."
    );
    
    // Create a lazy Prisma client that will work when DATABASE_URL is available
    const lazyDb = new Proxy(
      {},
      {
        get: () => {
          throw new Error(
            "DATABASE_URL environment variable is not set or is a CI placeholder. " +
              "Make sure your .env file is loaded with a valid DATABASE_URL."
          );
        },
      }
    ) as any;
    
    return lazyDb;
  }

  const adapter = new PrismaNeon({ connectionString });

  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });
}

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

export default db;
