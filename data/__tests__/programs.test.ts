import { describe, expect, it } from "vitest";

import {
  PROGRAMS,
  getDurationsForProgram,
  getProgramByNameAndDuration,
  getUniqueProgramNames,
  type ProgramDurationKey,
} from "../programs";

/**
 * The "PalmTechnIQ Pricing Framework" price list, transcribed. Every row here
 * must exist in PROGRAMS at exactly this price. The reverse is not required:
 * the catalogue may carry programs the framework document does not list.
 */
const FRAMEWORK: { name: string; duration: ProgramDurationKey; price: number }[] = [
  // Crash courses (1 month)
  { name: "Digital Marketing", duration: "ONE_MONTH", price: 90_000 },
  { name: "Backend Development", duration: "ONE_MONTH", price: 90_000 },
  { name: "Frontend Development", duration: "ONE_MONTH", price: 90_000 },
  { name: "Fullstack Development", duration: "ONE_MONTH", price: 90_000 },
  { name: "Data Analytics", duration: "ONE_MONTH", price: 90_000 },
  { name: "Cybersecurity", duration: "ONE_MONTH", price: 90_000 },
  { name: "Smart Home Automation", duration: "ONE_MONTH", price: 90_000 },
  { name: "Mobile App Development", duration: "ONE_MONTH", price: 90_000 },
  { name: "Project Management", duration: "ONE_MONTH", price: 90_000 },
  { name: "UI/UX Design", duration: "ONE_MONTH", price: 90_000 },
  { name: "Product Management", duration: "ONE_MONTH", price: 90_000 },
  { name: "Vibe Coding (AI-Assisted Coding)", duration: "ONE_MONTH", price: 120_000 },
  // 3-month programs
  { name: "Digital Marketing", duration: "THREE_MONTHS", price: 300_000 },
  { name: "Backend Development", duration: "THREE_MONTHS", price: 400_000 },
  { name: "Frontend Development", duration: "THREE_MONTHS", price: 350_000 },
  { name: "Data Analytics", duration: "THREE_MONTHS", price: 350_000 },
  { name: "Cybersecurity", duration: "THREE_MONTHS", price: 400_000 },
  { name: "Smart Home Automation", duration: "THREE_MONTHS", price: 300_000 },
  { name: "Project Management", duration: "THREE_MONTHS", price: 300_000 },
  { name: "UI/UX Design", duration: "THREE_MONTHS", price: 300_000 },
  { name: "Vibe Coding (AI-Assisted Coding)", duration: "THREE_MONTHS", price: 350_000 },
  // 6-month programs
  { name: "Digital Marketing", duration: "SIX_MONTHS", price: 600_000 },
  { name: "Backend Development", duration: "SIX_MONTHS", price: 900_000 },
  { name: "Frontend Development", duration: "SIX_MONTHS", price: 800_000 },
  { name: "Data Analytics", duration: "SIX_MONTHS", price: 800_000 },
  { name: "Smart Home Automation", duration: "SIX_MONTHS", price: 800_000 },
  { name: "Project Management", duration: "SIX_MONTHS", price: 700_000 },
  { name: "UI/UX Design", duration: "SIX_MONTHS", price: 800_000 },
  { name: "Product Management", duration: "SIX_MONTHS", price: 800_000 },
  // 1-year programs
  { name: "Fullstack Development", duration: "ONE_YEAR", price: 1_400_000 },
  { name: "Cybersecurity", duration: "ONE_YEAR", price: 1_400_000 },
  { name: "Mobile App Development", duration: "ONE_YEAR", price: 1_000_000 },
];

describe("program catalogue vs the pricing framework", () => {
  it.each(FRAMEWORK)(
    "lists $name ($duration) at ₦$price",
    ({ name, duration, price }) => {
      const program = getProgramByNameAndDuration(name, duration);
      expect(program, `${name} (${duration}) is missing`).toBeDefined();
      expect(program?.fullPrice).toBe(price);
    },
  );
});

describe("Graphic Design", () => {
  // Not in the framework document. Decided 2026-11-08: priced as UI/UX Design.
  it.each(["ONE_MONTH", "THREE_MONTHS", "SIX_MONTHS"] as ProgramDurationKey[])(
    "is priced exactly as UI/UX Design at %s",
    (duration) => {
      const graphic = getProgramByNameAndDuration("Graphic Design", duration);
      const uiux = getProgramByNameAndDuration("UI/UX Design", duration);
      expect(graphic).toBeDefined();
      expect(uiux).toBeDefined();
      expect({
        fullPrice: graphic?.fullPrice,
        installTotal: graphic?.installTotal,
        firstInstall: graphic?.firstInstall,
        secondInstall: graphic?.secondInstall,
      }).toEqual({
        fullPrice: uiux?.fullPrice,
        installTotal: uiux?.installTotal,
        firstInstall: uiux?.firstInstall,
        secondInstall: uiux?.secondInstall,
      });
    },
  );
});

describe("program catalogue integrity", () => {
  it("has unique slugs", () => {
    const slugs = PROGRAMS.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("has at most one program per name and duration", () => {
    const keys = PROGRAMS.map((p) => `${p.name.replace(/\s*\(Crash Course\)$/, "")}|${p.duration}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it.each(PROGRAMS.map((p) => [p.slug, p] as const))(
    "%s: instalments add up and follow the 70/30 split",
    (_slug, p) => {
      expect(p.firstInstall + p.secondInstall).toBe(p.installTotal);
      expect(p.firstInstall).toBe(Math.round(p.installTotal * 0.7));
      expect(p.installTotal).toBeGreaterThanOrEqual(p.fullPrice);
    },
  );

  it.each(PROGRAMS.map((p) => [p.slug, p] as const))(
    "%s: has outcomes and a curriculum",
    (_slug, p) => {
      expect(p.careerOutcomes.length).toBeGreaterThan(0);
      expect(p.curriculum.length).toBeGreaterThan(0);
    },
  );

  it("groups crash and 3-month Vibe Coding under one name", () => {
    const names = getUniqueProgramNames();
    expect(names.filter((n) => n.startsWith("Vibe Coding"))).toEqual([
      "Vibe Coding (AI-Assisted Coding)",
    ]);
    expect(
      getDurationsForProgram("Vibe Coding (AI-Assisted Coding)").map((d) => d.duration),
    ).toEqual(["ONE_MONTH", "THREE_MONTHS"]);
  });
});
