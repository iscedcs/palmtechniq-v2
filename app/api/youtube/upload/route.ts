export const runtime = "nodejs";
export const maxDuration = 300; // 5 minutes for large uploads
export const preferredRegion = "auto";

import { auth } from "@/auth";
import { z } from "zod";

const YOUTUBE_UPLOAD_URL =
  "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status";

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

interface InitializeUploadRequest {
  title?: string;
  description?: string;
  fileSize: number;
  fileType: string;
}

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
    const body = (await request.json()) as InitializeUploadRequest;

    const metadataParsed = metadataSchema.safeParse({
      title: body.title,
      description: body.description,
    });

    if (!metadataParsed.success) {
      return Response.json(
        { success: false, error: "Invalid upload metadata" },
        { status: 400 },
      );
    }

    if (!body.fileSize || body.fileSize <= 0) {
      return Response.json(
        { success: false, error: "Invalid file size" },
        { status: 400 },
      );
    }

    if (!body.fileType || !body.fileType.startsWith("video/")) {
      return Response.json(
        { success: false, error: "Only video uploads are supported" },
        { status: 400 },
      );
    }

    const accessToken = await getAccessToken();
    const metadata = {
      snippet: {
        title: metadataParsed.data.title || "Untitled Video",
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
        "X-Upload-Content-Type": body.fileType,
        "X-Upload-Content-Length": body.fileSize.toString(),
      },
      body: JSON.stringify(metadata),
    });

    if (!initResponse.ok) {
      const message = await initResponse.text();
      return Response.json(
        { success: false, error: `YouTube init error: ${message}` },
        { status: 500 },
      );
    }

    const uploadUrl = initResponse.headers.get("location");
    if (!uploadUrl) {
      return Response.json(
        { success: false, error: "YouTube upload URL not returned" },
        { status: 500 },
      );
    }

    return Response.json({
      success: true,
      uploadUrl,
      expiresIn: 24 * 60 * 60, // YouTube resumable sessions expire in 24 hours
    });
  } catch (error) {
    console.error("YouTube Upload Initialization Error:", error);
    return Response.json(
      { success: false, error: "Failed to initialize upload session" },
      { status: 500 },
    );
  }
}
