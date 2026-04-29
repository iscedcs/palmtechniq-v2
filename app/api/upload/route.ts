import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { auth } from "@/auth";
import { rateLimiter, RateLimitError } from "@/lib/rate-limit";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";

const requestSchema = z.object({
  filename: z.string().trim().min(1).max(200),
  contentType: z.string().trim().min(1).max(200),
  folder: z.string().trim().min(1).max(80).nullable().optional(),
  visibility: z.enum(["public", "private"]).nullable().optional(),
});

function getUploadFolder(mime: string) {
  if (mime.startsWith("image/")) return "images";
  if (mime.startsWith("video/")) return "videos";
  if (mime.startsWith("application/pdf")) return "pdfs";
  if (mime.includes("officedocument") || mime.includes("msword")) return "docs";
  return "files";
}

function getObjectAcl(
  role: string | null | undefined,
  requestedVisibility: "public" | "private" | undefined,
  folder: string,
) {
  void role;
  if (folder === "project-submissions") return "private";
  if (requestedVisibility === "public") {
    return "public-read";
  }
  return "private";
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  try {
    await rateLimiter({
      key: `upload:${session.user.id}`,
      limit: 30,
      window: 60,
    });

    const formData = await request.formData().catch((err) => {
      console.error("FormData parsing error:", {
        message: err.message,
        contentType: request.headers.get("content-type"),
        method: request.method,
      });
      return null;
    });
    if (!formData) {
      return Response.json(
        {
          success: false,
          error: "Invalid form data - could not parse request",
          debug: {
            contentType: request.headers.get("content-type"),
            method: request.method,
          },
        },
        { status: 400 },
      );
    }

    console.log("FormData received, keys:", Array.from(formData.keys()));

    const file = formData.get("file") as File | null;
    const filename = formData.get("filename") as string | null;
    const contentType =
      (formData.get("contentType") as string | null) ||
      "application/octet-stream";
    const folder = formData.get("folder") as string | null;
    const visibility = formData.get("visibility") as
      | "public"
      | "private"
      | null;

    console.log("Parsed FormData:", {
      hasFile: !!file,
      fileSize: file?.size,
      filename,
      contentType,
      folder,
      visibility,
    });

    if (!file || !filename) {
      console.error("Missing required fields:", { file: !!file, filename });
      return Response.json(
        { success: false, error: "Missing required fields: file and filename" },
        { status: 400 },
      );
    }

    const parsed = requestSchema.safeParse({
      filename,
      contentType,
      folder,
      visibility,
    });

    if (!parsed.success) {
      const validationErrors = parsed.error.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join(", ");
      console.error("Upload validation failed:", {
        validationErrors,
        filename,
        contentType,
        folder,
        visibility,
      });
      return Response.json(
        {
          success: false,
          error: `Validation failed: ${validationErrors}`,
        },
        { status: 400 },
      );
    }

    const allowedFolders = new Set(["project-submissions"]);
    const requestedFolderSafe = folder ?? "";
    const uploadFolder = allowedFolders.has(requestedFolderSafe)
      ? requestedFolderSafe
      : getUploadFolder(contentType);
    const type = uploadFolder === "videos" ? "video" : "file";
    const maxSize = type === "video" ? 100 * 1024 * 1024 : 20 * 1024 * 1024;

    if (file.size > maxSize) {
      return Response.json(
        {
          success: false,
          error: `File too large. Maximum size: ${maxSize / (1024 * 1024)}MB`,
        },
        { status: 400 },
      );
    }

    const accessKeyId = process.env.DO_SPACES_KEY;
    const secretAccessKey = process.env.DO_SPACES_SECRET;
    const bucketName = process.env.DO_SPACES_BUCKET;
    const endpoint = process.env.DO_SPACES_ENDPOINT;
    const publicBase = process.env.DO_SPACES_PUBLIC_BASE;

    if (
      !accessKeyId ||
      !secretAccessKey ||
      !bucketName ||
      !endpoint ||
      !publicBase
    ) {
      return Response.json(
        { success: false, error: "Upload service is not configured" },
        { status: 500 },
      );
    }

    const client = new S3Client({
      region: process.env.DO_SPACES_REGION ?? "fra1",
      endpoint: endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    const acl = getObjectAcl(
      session.user.role,
      visibility ?? "private",
      uploadFolder,
    );
    const key = `${uploadFolder}/${uuidv4()}-${filename}`;

    const arrayBuffer = await file.arrayBuffer();

    await client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: Buffer.from(arrayBuffer),
        ContentType: contentType,
        ACL: acl,
      }),
    );

    const fileUrl = `${publicBase}/${key}`;
    console.log("✅ Upload successful:", {
      filename,
      fileUrl,
      uploadFolder,
      fileSize: file.size,
    });
    return Response.json({ success: true, fileUrl });
  } catch (error) {
    if (error instanceof RateLimitError) {
      return Response.json(
        { success: false, error: error.message },
        { status: 429 },
      );
    }
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Upload Error:", {
      message: errorMessage,
      error: error,
      stack: error instanceof Error ? error.stack : undefined,
    });
    return Response.json(
      { success: false, error: `Upload failed: ${errorMessage}` },
      { status: 500 },
    );
  }
}
