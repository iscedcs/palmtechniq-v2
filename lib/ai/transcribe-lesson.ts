import "server-only";

import { randomUUID } from "node:crypto";
import OpenAI from "openai";
import { toFile } from "openai/uploads";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// Whisper's hard cap on an uploaded audio file. The client extracts audio
// before ever sending us bytes, so real lessons land well under this.
export const WHISPER_MAX_BYTES = 25 * 1024 * 1024;

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

/** Transcribes an already-extracted lesson audio track into WebVTT captions
 * via OpenAI Whisper and uploads the result to storage. Never throws —
 * every failure mode is a soft skip, since this always runs alongside the
 * real video upload and must never be able to break it. */
export async function transcribeLessonAudio({
  lessonId,
  audioBuffer,
}: {
  lessonId: string;
  audioBuffer: Buffer;
}): Promise<TranscribeResult> {
  if (!process.env.OPENAI_API_KEY) {
    return { success: false, skipped: true, reason: "Transcription is not configured" };
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
    console.error("[transcribeLessonAudio] transcription failed:", error);
    return { success: false, skipped: false, error: "Automatic transcription failed" };
  }
}
