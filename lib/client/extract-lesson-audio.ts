"use client";

// ffmpeg.wasm is loaded lazily and only on the client — it's a large binary
// and has no reason to touch any server bundle.
let ffmpegPromise: Promise<import("@ffmpeg/ffmpeg").FFmpeg> | null = null;

async function getFfmpeg() {
  if (!ffmpegPromise) {
    ffmpegPromise = (async () => {
      const { FFmpeg } = await import("@ffmpeg/ffmpeg");
      const { toBlobURL } = await import("@ffmpeg/util");
      const ffmpeg = new FFmpeg();
      const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
      });
      return ffmpeg;
    })();
  }
  return ffmpegPromise;
}

/** Extracts a compressed, mono, low-bitrate audio track from a video file
 * entirely in the browser. Sending the raw video to our own API route would
 * blow past Vercel's request-body limit for any real lesson; the resulting
 * audio here is a fraction of the size — comfortably under both that limit
 * and Whisper's 25MB cap for lessons up to a few hours. */
export async function extractLessonAudio(videoFile: File): Promise<File> {
  const { fetchFile } = await import("@ffmpeg/util");
  const ffmpeg = await getFfmpeg();

  const inputName = "input";
  const outputName = "audio.mp3";

  await ffmpeg.writeFile(inputName, await fetchFile(videoFile));
  try {
    await ffmpeg.exec([
      "-i",
      inputName,
      "-vn",
      "-ac",
      "1",
      "-b:a",
      "32k",
      outputName,
    ]);
    const data = await ffmpeg.readFile(outputName);
    const bytes = data instanceof Uint8Array ? data : new TextEncoder().encode(String(data));
    return new File([bytes as BlobPart], "lesson-audio.mp3", { type: "audio/mpeg" });
  } finally {
    await ffmpeg.deleteFile(inputName).catch(() => {});
    await ffmpeg.deleteFile(outputName).catch(() => {});
  }
}
