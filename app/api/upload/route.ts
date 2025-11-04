import { S3Client } from "@aws-sdk/client-s3";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: Request) {
  try {
    const { filename, contentType } = await request.json();

    const getFolder = (mime: string) => {
      if (mime.startsWith("image/")) return "images";
      if (mime.startsWith("video/")) return "videos";
      if (mime.startsWith("application/pdf")) return "pdfs";
      if (mime.includes("officedocument") || mime.includes("msword"))
        return "docs";
      return "files";
    };

    const folder = getFolder(contentType);
    const type = folder === "videos" ? "video" : "file";
    const maxSize = type === "video" ? 100 * 1024 * 1024 : 20 * 1024 * 1024;

    const client = new S3Client({
      region: process.env.AWS_REGION ?? "us-east-1",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "",
      },
    });

    const { url, fields } = await createPresignedPost(client, {
      Bucket: process.env.AWS_BUCKET_NAME ?? "",
      Key: `${folder}/${uuidv4()}-${filename}`,
      Conditions: [["content-length-range", 0, maxSize]],
      Fields: {
        acl: "public-read",
        "Content-Type": contentType,
      },
      Expires: 600,
    });

    console.log({ fields, url });
    return Response.json({ success: true, url, fields });
  } catch (error) {
    console.error("Upload Error:", error);
    return Response.json(
      { success: false, error: "Unknown upload error occurred" },
      { status: 500 }
    );
  }
}
