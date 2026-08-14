/**
 * Keep documentation dates honest.
 *
 * `lastUpdated` and `DOC_VERSION` were hand-maintained, which means they are
 * wrong exactly when it matters — a page gets rewritten and the date stays put,
 * so a reader trusts stale guidance. This stamps a page only when its CONTENT
 * actually changed, by comparing a hash against a committed baseline.
 *
 * All 26 pages live in one file, so per-file git timestamps cannot work; the
 * hash is what gives per-page resolution.
 *
 *   pnpm docs:sync            update dates for pages whose content changed
 *   pnpm docs:check           exit 1 if anything is out of date (for CI)
 *   pnpm docs:sync --baseline <git-ref>
 *                             seed hashes from an older revision, so the first
 *                             run stamps only what genuinely changed since it
 *
 * Run it after editing docs and commit the result alongside.
 */

import "dotenv/config";

import { createHash } from "crypto";
import { execFileSync } from "child_process";
import { readFileSync, writeFileSync, existsSync, unlinkSync } from "fs";
import { pathToFileURL } from "url";
import path from "path";

import { docSections, DOC_VERSION } from "@/lib/docs/content";

const CONTENT_PATH = path.join(process.cwd(), "lib", "docs", "content.ts");
const HASH_PATH = path.join(process.cwd(), "lib", "docs", "doc-hashes.json");

const args = process.argv.slice(2);
const checkOnly = args.includes("--check");
const baselineIndex = args.indexOf("--baseline");
const baselineRef = baselineIndex >= 0 ? args[baselineIndex + 1] : null;

/**
 * Hash a page's content, with the doc version neutralised first.
 *
 * The introduction page embeds ${DOC_VERSION}, so bumping the version changes
 * that page's resolved content and would re-stamp it on every run - a page
 * marked "updated today" because the version changed, which is circular.
 */
const hash = (value: string, version: string) =>
  createHash("sha256")
    .update(version ? value.split(version).join("<VERSION>") : value)
    .digest("hex")
    .slice(0, 16);

const today = new Date().toISOString().slice(0, 10);

type Hashes = Record<string, string>;

/**
 * Hash every page as it exists at a git ref, so a first run can tell what
 * genuinely changed rather than stamping the whole set with today's date.
 */
async function baselineFromGit(ref: string): Promise<Hashes | null> {
  // Load the old file as a MODULE rather than regex-parsing it. Section
  // objects also have a `slug`, so pattern matching over the source
  // conflates sections with pages and produces nonsense.
  const temp = path.join(process.cwd(), "lib", "docs", "__baseline.ts");
  try {
    const source = execFileSync("git", ["show", `${ref}:lib/docs/content.ts`], {
      encoding: "utf8",
      maxBuffer: 20 * 1024 * 1024,
    });
    writeFileSync(temp, source, "utf8");

    const mod = (await import(pathToFileURL(temp).href)) as {
      docSections: typeof docSections;
      DOC_VERSION: string;
    };
    const result: Hashes = {};
    for (const section of mod.docSections) {
      for (const page of section.children ?? []) {
        result[page.slug] = hash(page.content, mod.DOC_VERSION);
      }
    }
    return Object.keys(result).length ? result : null;
  } catch (error) {
    console.error("Baseline load failed:", error);
    return null;
  } finally {
    if (existsSync(temp)) unlinkSync(temp);
  }
}

async function loadHashes(): Promise<Hashes> {
  if (existsSync(HASH_PATH)) {
    return JSON.parse(readFileSync(HASH_PATH, "utf8")) as Hashes;
  }
  if (baselineRef) {
    const seeded = await baselineFromGit(baselineRef);
    if (seeded) {
      console.log(
        `Seeded baseline from ${baselineRef} (${Object.keys(seeded).length} pages).`,
      );
      return seeded;
    }
    console.log(`Could not read ${baselineRef}; treating every page as new.`);
  }
  return {};
}

/**
 * Rewrite one page's date in place. Searches forward from the page's unique
 * slug and refuses to cross into the next page, so it cannot stamp a
 * neighbour.
 */
function setDate(source: string, slug: string, date: string): string {
  const slugAt = source.indexOf(`slug: "${slug}",`);
  if (slugAt === -1) return source;

  const nextSlugAt = source.indexOf('slug: "', slugAt + 10);
  const dateAt = source.indexOf("lastUpdated: \"", slugAt);
  if (dateAt === -1) return source;
  if (nextSlugAt !== -1 && dateAt > nextSlugAt) return source; // belongs to the next page

  const start = dateAt + 'lastUpdated: "'.length;
  return source.slice(0, start) + date + source.slice(start + 10);
}

async function main() {
  const pages = docSections.flatMap((section) =>
    (section.children ?? []).map((page) => ({
      slug: page.slug,
      title: page.title,
      content: page.content,
      lastUpdated: page.lastUpdated,
    })),
  );

  const previous = await loadHashes();
  const current: Hashes = {};
  const changed: string[] = [];

  for (const page of pages) {
    current[page.slug] = hash(page.content, DOC_VERSION);
    if (previous[page.slug] !== current[page.slug]) changed.push(page.slug);
  }

  const removed = Object.keys(previous).filter((slug) => !(slug in current));

  if (changed.length === 0 && removed.length === 0) {
    console.log(`All ${pages.length} pages up to date.`);
    return;
  }

  if (checkOnly) {
    console.error(
      `Documentation dates are stale. Changed: ${changed.join(", ") || "none"}.\n` +
        "Run `pnpm docs:sync` and commit the result.",
    );
    process.exit(1);
  }

  let source = readFileSync(CONTENT_PATH, "utf8");
  for (const slug of changed) source = setDate(source, slug, today);

  // Version is the date of the most recent change. A hand-incremented semver
  // says nothing a reader can act on; "when was this last true" does.
  const dates = pages
    .map((page) => (changed.includes(page.slug) ? today : page.lastUpdated))
    .filter((value): value is string => Boolean(value))
    .sort();
  const newest = dates[dates.length - 1] ?? today;
  source = source.replace(
    /export const DOC_VERSION = "[^"]*";/,
    `export const DOC_VERSION = "${newest.replace(/-/g, ".")}";`,
  );

  writeFileSync(CONTENT_PATH, source, "utf8");
  writeFileSync(HASH_PATH, `${JSON.stringify(current, null, 2)}\n`, "utf8");

  console.log(`Stamped ${changed.length} page(s) with ${today}:`);
  for (const slug of changed) console.log(`  - ${slug}`);
  if (removed.length) console.log(`Removed: ${removed.join(", ")}`);
  console.log(`DOC_VERSION → ${newest.replace(/-/g, ".")}`);
}

main();
