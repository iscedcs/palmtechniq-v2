export const runtime = "nodejs";

import { auth } from "@/auth";
import { z } from "zod";

const YOUTUBE_UPLOAD_URL =
  "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status";
const MAX_UPLOAD_SIZE_BYTES = 2 * 1024 * 1024 * 1024; // 2GB

const metadataSchema = z.object({
  title: z.string().trim().max(180).optional(),
  description: z.string().trim().max(5000).optional(),
});

const getAccessToken = async () => {
  const clientId = process.env.YOUTUBE_CLIENT_ID ?? "";
  const clientSecret = process.env.YOUTUBE_CLIENT_SECRET ?? "";
  const refreshToken = process.env.YOUTUBE_REFRESH_TOKEN ?? "";

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("Missing YouTube OAuth credentials");
  }

  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`YouTube token error: ${message}`);
  }

  const data = (await response.json()) as { access_token?: string };
  if (!data.access_token) {
    throw new Error("YouTube token error: missing access token");
  }

  return data.access_token;
};

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "TUTOR" && session.user.role !== "ADMIN") {
    return Response.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const metadataParsed = metadataSchema.safeParse({
      title: (formData.get("title") as string | null) ?? undefined,
      description: (formData.get("description") as string | null) ?? undefined,
    });
    if (!metadataParsed.success) {
      return Response.json({ success: false, error: "Invalid upload metadata" }, { status: 400 });
    }

    if (!file) {
      return Response.json({ success: false, error: "No file provided" }, { status: 400 });
    }

    if (!file.type.startsWith("video/")) {
      return Response.json(
        { success: false, error: "Only video uploads are supported" },
        { status: 400 }
      );
    }
    if (file.size <= 0 || file.size > MAX_UPLOAD_SIZE_BYTES) {
      return Response.json(
        {
          success: false,
          error: "Video file is too large. Maximum allowed size is 2GB.",
        },
        { status: 400 }
      );
    }

    const accessToken = await getAccessToken();
    const metadata = {
      snippet: {
        title: metadataParsed.data.title || file.name,
        description: metadataParsed.data.description ?? "",
      },
      status: {
        privacyStatus: process.env.YOUTUBE_PRIVACY_STATUS ?? "unlisted",
      },
    };

    const initResponse = await fetch(YOUTUBE_UPLOAD_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json; charset=UTF-8",
        "X-Upload-Content-Type": file.type,
        "X-Upload-Content-Length": file.size.toString(),
      },
      body: JSON.stringify(metadata),
    });

    if (!initResponse.ok) {
      const message = await initResponse.text();
      return Response.json(
        { success: false, error: `YouTube init error: ${message}` },
        { status: 500 }
      );
    }

    const uploadUrl = initResponse.headers.get("location");
    if (!uploadUrl) {
      return Response.json(
        { success: false, error: "YouTube upload URL not returned" },
        { status: 500 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const uploadResponse = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Length": file.size.toString(),
        "Content-Type": file.type,
      },
      body: buffer,
    });

    if (!uploadResponse.ok) {
      const message = await uploadResponse.text();
      return Response.json(
        { success: false, error: `YouTube upload error: ${message}` },
        { status: 500 }
      );
    }

    const result = (await uploadResponse.json()) as { id?: string };
    if (!result.id) {
      return Response.json(
        { success: false, error: "YouTube response missing video ID" },
        { status: 500 }
      );
    }

    const embedUrl = `https://www.youtube.com/embed/${result.id}`;
    const watchUrl = `https://www.youtube.com/watch?v=${result.id}`;

    return Response.json({
      success: true,
      videoId: result.id,
      embedUrl,
      watchUrl,
    });
  } catch (error) {
    console.error("YouTube Upload Error:", error);
    return Response.json(
      { success: false, error: "Unknown YouTube upload error occurred" },
      { status: 500 }
    );
  }
}
