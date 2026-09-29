import "server-only";

import ffmpegPath from "@ffmpeg-installer/ffmpeg";
import ffmpeg from "fluent-ffmpeg";
import { randomUUID } from "node:crypto";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import OpenAI from "openai";
import { toFile } from "openai/uploads";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

ffmpeg.setFfmpegPath(ffmpegPath.path);

// Whisper's hard cap on an uploaded audio file.
const WHISPER_MAX_BYTES = 25 * 1024 * 1024;
// A safety cap independent of file size — bounds worst-case transcription
// cost/time even for an oddly-compressed long recording.
export const MAX_TRANSCRIBE_DURATION_SECONDS = 90 * 60;

/** Extracts a compressed, mono, low-bitrate audio track from a video file —
 * small enough to fit Whisper's 25MB cap for lessons up to ~90 minutes,
 * where sending the original video would blow well past it. */
async function extractAudio(videoBuffer: Buffer): Promise<Buffer> {
  const dir = await mkdtemp(path.join(tmpdir(), "lesson-audio-"));
  const inputPath = path.join(dir, "input");
  const outputPath = path.join(dir, "audio.mp3");

  try {
    await writeFile(inputPath, videoBuffer);

    await new Promise<void>((resolve, reject) => {
      ffmpeg(inputPath)
        .noVideo()
        .audioChannels(1)
        .audioBitrate("64k")
        .audioCodec("libmp3lame")
        .format("mp3")
        .on("error", reject)
        .on("end", () => resolve())
        .save(outputPath);
    });

    return await readFile(outputPath);
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}

async function uploadVttToSpaces(
  vtt: string,
  lessonId: string,
): Promise<string> {
  const accessKeyId = process.env.DO_SPACES_KEY;
  const secretAccessKey = process.env.DO_SPACES_SECRET;
  const bucketName = process.env.DO_SPACES_BUCKET;
  const endpoint = process.env.DO_SPACES_ENDPOINT;
  const publicBase = process.env.DO_SPACES_PUBLIC_BASE;

  if (!accessKeyId || !secretAccessKey || !bucketName || !endpoint || !publicBase) {
    throw new Error("Upload service is not configured");
  }

  const client = new S3Client({
    region: process.env.DO_SPACES_REGION ?? "fra1",
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
  });

  const key = `captions/${lessonId}-${randomUUID()}.vtt`;

  await client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: Buffer.from(vtt, "utf-8"),
      ContentType: "text/vtt",
      ACL: "public-read",
    }),
  );

  return `${publicBase}/${key}`;
}

export type TranscribeResult =
  | { success: true; captionsUrl: string }
  | { success: false; skipped: true; reason: string }
  | { success: false; skipped: false; error: string };

/** Transcribes a lesson's video into WebVTT captions via OpenAI Whisper and
 * uploads the result to storage. Never throws — every failure mode is a
 * soft skip, since this always runs alongside the real video upload and
 * must never be able to break it. */
export async function transcribeLessonVideo({
  lessonId,
  videoBuffer,
}: {
  lessonId: string;
  videoBuffer: Buffer;
}): Promise<TranscribeResult> {
  if (!process.env.OPENAI_API_KEY) {
    return { success: false, skipped: true, reason: "Transcription is not configured" };
  }

  let audioBuffer: Buffer;
  try {
    audioBuffer = await extractAudio(videoBuffer);
  } catch (error) {
    console.error("[transcribeLessonVideo] audio extraction failed:", error);
    return { success: false, skipped: false, error: "Could not read audio from this video" };
  }

  if (audioBuffer.byteLength > WHISPER_MAX_BYTES) {
    return {
      success: false,
      skipped: true,
      reason: "Lesson is too long for automatic captions (try uploading a .vtt manually)",
    };
  }

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const file = await toFile(audioBuffer, "audio.mp3", { type: "audio/mpeg" });

    const vtt = await client.audio.transcriptions.create({
      file,
      model: "whisper-1",
      response_format: "vtt",
    });

    const vttText = typeof vtt === "string" ? vtt : String(vtt);
    if (!vttText.trim()) {
      return { success: false, skipped: false, error: "Transcription came back empty" };
    }

    const captionsUrl = await uploadVttToSpaces(vttText, lessonId);
    return { success: true, captionsUrl };
  } catch (error) {
    console.error("[transcribeLessonVideo] transcription failed:", error);
    return { success: false, skipped: false, error: "Automatic transcription failed" };
  }
}
