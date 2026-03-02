export const runtime = "nodejs";
export const maxDuration = 60; // 1 minute per chunk should be plenty

import { auth } from "@/auth";

// Max chunk size: 4MB to stay well under Vercel's 4.5MB limit
const MAX_CHUNK_SIZE = 4 * 1024 * 1024;

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }
  if (session.user.role !== "TUTOR" && session.user.role !== "ADMIN") {
    return Response.json(
      { success: false, error: "Forbidden" },
      { status: 403 },
    );
  }

  try {
    const formData = await request.formData();
    const chunk = formData.get("chunk") as Blob | null;
    const uploadUrl = formData.get("uploadUrl") as string | null;
    const start = parseInt(formData.get("start") as string, 10);
    const end = parseInt(formData.get("end") as string, 10);
    const total = parseInt(formData.get("total") as string, 10);
    const contentType = formData.get("contentType") as string;

    if (!chunk || !uploadUrl || isNaN(start) || isNaN(end) || isNaN(total)) {
      return Response.json(
        { success: false, error: "Missing required chunk upload parameters" },
        { status: 400 },
      );
    }

    if (chunk.size > MAX_CHUNK_SIZE) {
      return Response.json(
        {
          success: false,
          error: `Chunk too large. Max size: ${MAX_CHUNK_SIZE} bytes`,
        },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await chunk.arrayBuffer());

    // Upload chunk to YouTube
    const response = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Length": buffer.length.toString(),
        "Content-Type": contentType,
        "Content-Range": `bytes ${start}-${end}/${total}`,
      },
      body: buffer,
    });

    // YouTube returns different status codes during resumable upload:
    // - 308: Chunk received, upload incomplete (more chunks needed)
    // - 200/201: Upload complete, video created
    // - 503: Server error, retry
    // - 404: Upload session expired

    if (response.status === 308) {
      // Upload incomplete, get the range that YouTube has received
      const range = response.headers.get("Range");
      const bytesReceived = range
        ? parseInt(range.split("-")[1], 10) + 1
        : end + 1;

      return Response.json({
        success: true,
        complete: false,
        bytesReceived,
      });
    }

    if (response.status === 200 || response.status === 201) {
      // Upload complete
      const result = (await response.json()) as { id?: string };

      if (!result.id) {
        return Response.json(
          { success: false, error: "YouTube response missing video ID" },
          { status: 500 },
        );
      }

      return Response.json({
        success: true,
        complete: true,
        videoId: result.id,
        embedUrl: `https://www.youtube.com/embed/${result.id}`,
        watchUrl: `https://www.youtube.com/watch?v=${result.id}`,
      });
    }

    // Error response
    const errorText = await response.text();
    return Response.json(
      {
        success: false,
        error: `YouTube chunk upload failed (${response.status}): ${errorText}`,
      },
      { status: response.status === 404 ? 410 : 500 },
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("YouTube chunk upload error:", errorMessage);

    return Response.json(
      { success: false, error: errorMessage },
      { status: 500 },
    );
  }
}
