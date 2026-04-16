/**
 * Seed volunteer certificates from CSV export of the old database.
 *
 * Run with: npx tsx scripts/seed-volunteer-certificates.ts
 */
import "dotenv/config";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { readFileSync } from "fs";
import { resolve } from "path";

// Required for Node.js — Neon serverless driver needs a WebSocket implementation
neonConfig.webSocketConstructor = ws;

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is not set. Make sure .env is configured.");
  process.exit(1);
}

const adapter = new PrismaNeon({ connectionString });
const db = new PrismaClient({ adapter });

function parseCsv(filePath: string) {
  const raw = readFileSync(filePath, "utf-8");
  const lines = raw.trim().split("\n");
  const headers = lines[0].split(",").map((h) => h.replace(/"/g, "").trim());

  return lines.slice(1).map((line) => {
    const values: string[] = [];
    let current = "";
    let inQuotes = false;

    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        values.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    const record: Record<string, string> = {};
    headers.forEach((h, i) => {
      record[h] = values[i] ?? "";
    });
    return record;
  });
}

export async function seedVolunteer() {
  const csvPath = resolve(__dirname, "..", "VolunteerCertificate.csv");

  let records: Record<string, string>[];
  try {
    records = parseCsv(csvPath);
  } catch {
    console.error(
      `Could not read CSV at ${csvPath}. Place VolunteerCertificate.csv in the project root.`,
    );
    process.exit(1);
  }

  console.log(`Parsed ${records.length} volunteer certificate(s) from CSV.`);

  let created = 0;
  let skipped = 0;

  for (const row of records) {
    const certCode = row["certCode"];
    if (!certCode) {
      console.warn("Skipping row with missing certCode:", row);
      skipped++;
      continue;
    }

    const existing = await db.volunteerCertificate.findUnique({
      where: { certCode },
    });

    if (existing) {
      console.log(`Skipping ${certCode} — already exists.`);
      skipped++;
      continue;
    }

    await db.volunteerCertificate.create({
      data: {
        id: row["id"] || undefined,
        certCode,
        volunteerName: row["fullName"] || "Unknown",
        eventName: "PalmTechnIQ Community Volunteer Program",
        role: row["role"] || null,
        description: row["remarks"] || null,
        issuedAt: row["issuedDate"] ? new Date(row["issuedDate"]) : new Date(),
        certificateUrl: row["certificateUrl"] || "",
      },
    });

    console.log(`Created: ${certCode} — ${row["fullName"]}`);
    created++;
  }

  console.log(`\nDone. Created: ${created}, Skipped: ${skipped}`);
  await db.$disconnect();
}
