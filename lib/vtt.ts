/**
 * A small, dependency-free WebVTT parser: just enough to drive a caption
 * overlay and a clickable transcript list. It does not implement the full
 * spec (styling cues, regions, nested tags) — only what those two UI pieces
 * need: a start time, an end time, and the cue's text.
 */

export type VttCue = {
  start: number;
  end: number;
  text: string;
};

const TIMESTAMP = /(\d{2}:)?(\d{2}):(\d{2})[.,](\d{3})/;

function parseTimestamp(raw: string): number | null {
  const match = raw.match(TIMESTAMP);
  if (!match) return null;
  const hours = match[1] ? parseInt(match[1], 10) : 0;
  const minutes = parseInt(match[2], 10);
  const seconds = parseInt(match[3], 10);
  const millis = parseInt(match[4], 10);
  return hours * 3600 + minutes * 60 + seconds + millis / 1000;
}

/** Strips inline VTT/HTML-ish tags (<b>, <v Speaker>, <00:00:01.000>) from cue text. */
function stripTags(text: string): string {
  return text.replace(/<[^>]*>/g, "").trim();
}

export function parseVtt(source: string): VttCue[] {
  const normalized = source.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const blocks = normalized.split(/\n\n+/);
  const cues: VttCue[] = [];

  for (const block of blocks) {
    const lines = block.split("\n").filter((line) => line.trim().length > 0);
    if (lines.length === 0) continue;

    // A cue's timing line contains "-->"; skip an optional leading cue
    // identifier line, and skip the WEBVTT header / NOTE blocks entirely.
    const timingIndex = lines.findIndex((line) => line.includes("-->"));
    if (timingIndex === -1) continue;

    const [startRaw, endRaw] = lines[timingIndex].split("-->");
    const start = parseTimestamp(startRaw ?? "");
    const end = parseTimestamp(endRaw ?? "");
    if (start === null || end === null) continue;

    const text = stripTags(lines.slice(timingIndex + 1).join(" "));
    if (!text) continue;

    cues.push({ start, end, text });
  }

  return cues.sort((a, b) => a.start - b.start);
}

export async function fetchVttCues(url: string): Promise<VttCue[]> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load captions (${res.status})`);
  const text = await res.text();
  return parseVtt(text);
}

export function findActiveCueIndex(cues: VttCue[], time: number): number {
  // Cues are sorted by start, so a linear scan from the end is fine for the
  // cue counts a lesson transcript realistically has (tens to low hundreds).
  for (let i = cues.length - 1; i >= 0; i -= 1) {
    if (time >= cues[i].start && time <= cues[i].end) return i;
  }
  return -1;
}

export function formatCueTimestamp(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
