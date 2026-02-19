import { S3Client } from "@aws-sdk/client-s3";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import { auth } from "@/auth";
import { rateLimiter, RateLimitError } from "@/lib/rate-limit";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";

const requestSchema = z.object({
  filename: z
    .string()
    .trim()
    .min(1)
    .max(200)
    .regex(/^[a-zA-Z0-9._\-() ]+$/, "Invalid filename"),
  contentType: z.string().trim().min(3).max(120),
  folder: z.string().trim().min(1).max(80).optional(),
  visibility: z.enum(["public", "private"]).optional(),
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
  folder: string
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
    return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    await rateLimiter({
      key: `upload:${session.user.id}`,
      limit: 30,
      window: 60,
    });

    const body = await request.json().catch(() => ({}));
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ success: false, error: "Invalid upload payload" }, { status: 400 });
    }
    const { filename, contentType, folder: requestedFolder, visibility } = parsed.data;

    const allowedFolders = new Set(["project-submissions"]);
    const requestedFolderSafe = requestedFolder ?? "";
    const folder = allowedFolders.has(requestedFolderSafe)
      ? requestedFolderSafe
      : getUploadFolder(contentType);
    const type = folder === "videos" ? "video" : "file";
    const maxSize = type === "video" ? 100 * 1024 * 1024 : 20 * 1024 * 1024;

    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
    const bucketName = process.env.AWS_BUCKET_NAME;
    if (!accessKeyId || !secretAccessKey || !bucketName) {
      return Response.json(
        { success: false, error: "Upload service is not configured" },
        { status: 500 }
      );
    }

    const client = new S3Client({
      region: process.env.AWS_REGION ?? "us-east-1",
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    const acl = getObjectAcl(session.user.role, visibility, folder);

    const { url, fields } = await createPresignedPost(client, {
      Bucket: bucketName,
      Key: `${folder}/${uuidv4()}-${filename}`,
      Conditions: [["content-length-range", 0, maxSize]],
      Fields: {
        acl,
        "Content-Type": contentType,
      },
      Expires: 600,
    });

    return Response.json({ success: true, url, fields });
  } catch (error) {
    if (error instanceof RateLimitError) {
      return Response.json({ success: false, error: error.message }, { status: 429 });
    }
    console.error("Upload Error:", error);
    return Response.json(
      { success: false, error: "Unknown upload error occurred" },
      { status: 500 }
    );
  }
}
