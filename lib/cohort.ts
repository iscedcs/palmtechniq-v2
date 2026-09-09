/**
 * PalmTechnIQ Cohort Naming System
 *
 * Uses the "Agile Cycle" pattern with "Version Control" elements.
 * Format: Cycle {cycleNumber} · {2-digit year}{Quarter} {Phonetic}
 *
 * Example: "Cycle 42 · 26Q2 Delta" (April 2026)
 */

const PHONETIC_ALPHABET: Record<number, string> = {
  1: "Alpha",
  2: "Bravo",
  3: "Charlie",
  4: "Delta",
  5: "Echo",
  6: "Foxtrot",
  7: "Golf",
  8: "Hotel",
  9: "India",
  10: "Juliet",
  11: "Kilo",
  12: "Lima",
};

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function getQuarter(month: number): string {
  if (month <= 3) return "Q1";
  if (month <= 6) return "Q2";
  if (month <= 9) return "Q3";
  return "Q4";
}

// Starting cycle number. April 2026 = Cycle 1.
// Each subsequent month increments by 1.
const BASE_CYCLE = 1;
const BASE_YEAR = 2026;
const BASE_MONTH = 4; // April

function getCycleNumber(year: number, month: number): number {
  const monthsFromBase = (year - BASE_YEAR) * 12 + (month - BASE_MONTH);
  return BASE_CYCLE + monthsFromBase;
}

export interface CohortOption {
  cycleNumber: number;
  year: number;
  month: number;
  quarterLabel: string;
  phoneticLabel: string;
  displayName: string;
  monthName: string;
  startDate: Date;
  value: string; // Unique identifier for form selection
}

/**
 * Generate the display name for a cohort.
 * Format: "Cycle 1 · 26Q2 Delta"
 */
export function formatCohortName(
  cycleNumber: number,
  year: number,
  month: number,
): string {
  const shortYear = String(year).slice(-2);
  const quarter = getQuarter(month);
  const phonetic = PHONETIC_ALPHABET[month] || "Unknown";
  return `Cycle ${cycleNumber} · ${shortYear}${quarter} ${phonetic}`;
}

/**
 * Generate all available cohort options from April 2026 through March 2027,
 * excluding any months that have already passed based on the current date.
 */
export function getAvailableCohorts(): CohortOption[] {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-indexed

  const cohorts: CohortOption[] = [];

  // April 2026 (month 4) through December 2026 (month 12)
  for (let m = 4; m <= 12; m++) {
    if (2026 < currentYear || (2026 === currentYear && m < currentMonth)) {
      continue; // Skip past months
    }
    const cycleNumber = getCycleNumber(2026, m);
    const quarterLabel = getQuarter(m);
    const phoneticLabel = PHONETIC_ALPHABET[m];
    const displayName = formatCohortName(cycleNumber, 2026, m);
    cohorts.push({
      cycleNumber,
      year: 2026,
      month: m,
      quarterLabel,
      phoneticLabel,
      displayName,
      monthName: MONTH_NAMES[m - 1],
      startDate: new Date(2026, m - 1, 1),
      value: `${cycleNumber}-2026-${String(m).padStart(2, "0")}`,
    });
  }

  // January 2027 (month 1) through March 2027 (month 3)
  for (let m = 1; m <= 3; m++) {
    if (2027 < currentYear || (2027 === currentYear && m < currentMonth)) {
      continue;
    }
    const cycleNumber = getCycleNumber(2027, m);
    const quarterLabel = getQuarter(m);
    const phoneticLabel = PHONETIC_ALPHABET[m];
    const displayName = formatCohortName(cycleNumber, 2027, m);
    cohorts.push({
      cycleNumber,
      year: 2027,
      month: m,
      quarterLabel,
      phoneticLabel,
      displayName,
      monthName: MONTH_NAMES[m - 1],
      startDate: new Date(2027, m - 1, 1),
      value: `${cycleNumber}-2027-${String(m).padStart(2, "0")}`,
    });
  }

  return cohorts;
}

/**
 * Parse a cohort value string back into its components.
 */
export function parseCohortValue(value: string): {
  cycleNumber: number;
  year: number;
  month: number;
} | null {
  const parts = value.split("-");
  if (parts.length !== 3) return null;
  return {
    cycleNumber: parseInt(parts[0], 10),
    year: parseInt(parts[1], 10),
    month: parseInt(parts[2], 10),
  };
}

function getOrdinalSuffix(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

/**
 * Automatically calculates the next upcoming cohort intake date dynamically.
 * Intakes run on the 3rd Monday of each month.
 * If today is on or past the intake date, it automatically rolls over to the next month's intake.
 * This guarantees zero manual maintenance.
 */
export function getNextCohortInfo(): {
  dateLabel: string;
  cycleName: string;
  monthName: string;
  year: number;
  day: number;
  startDate: Date;
  enrollUrl: string;
} {
  const now = new Date();

  function getIntakeDate(year: number, monthIndex: number): Date {
    const firstDay = new Date(year, monthIndex, 1);
    const dayOfWeek = firstDay.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
    const firstMondayDate =
      dayOfWeek <= 1 ? 1 - dayOfWeek + 1 : 7 - dayOfWeek + 2;
    const thirdMondayDate = firstMondayDate + 14;
    return new Date(year, monthIndex, thirdMondayDate);
  }

  let year = now.getFullYear();
  let monthIndex = now.getMonth();
  let intake = getIntakeDate(year, monthIndex);

  // If today is already past or on the intake date, roll over to next month
  if (now.getTime() >= intake.getTime()) {
    monthIndex++;
    if (monthIndex > 11) {
      monthIndex = 0;
      year++;
    }
    intake = getIntakeDate(year, monthIndex);
  }

  const monthName = MONTH_NAMES[intake.getMonth()];
  const day = intake.getDate();
  const dateLabel = `${monthName} ${day}${getOrdinalSuffix(day)}`;
  const cycleNumber = getCycleNumber(year, intake.getMonth() + 1);
  const cycleName = formatCohortName(cycleNumber, year, intake.getMonth() + 1);

  return {
    dateLabel,
    cycleName,
    monthName,
    year,
    day,
    startDate: intake,
    enrollUrl: "/enroll",
  };
}

