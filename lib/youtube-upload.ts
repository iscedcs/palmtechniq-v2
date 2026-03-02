/**
 * YouTube Resumable Upload Utility
 *
 * Architecture: Client uploads directly to YouTube via resumable upload URL
 * Server only handles OAuth token generation and session initialization
 */

interface InitializeUploadResponse {
  success: boolean;
  uploadUrl?: string;
  expiresIn?: number;
  error?: string;
}

interface YouTubeUploadResponse {
  id?: string;
  error?: {
    errors: Array<{ message: string }>;
  };
}

/**
 * Step 1: Get a resumable upload session from your server
 * This returns the YouTube upload URL that the client can upload directly to
 */
export async function initializeYouTubeUpload(
  file: File,
  metadata?: {
    title?: string;
    description?: string;
  },
): Promise<{ uploadUrl: string; expiresIn: number }> {
  const response = await fetch("/api/youtube/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: metadata?.title || file.name,
      description: metadata?.description || "",
      fileSize: file.size,
      fileType: file.type,
    }),
  });

  const data = (await response.json()) as InitializeUploadResponse;

  if (!response.ok || !data.success || !data.uploadUrl) {
    throw new Error(data.error || "Failed to initialize upload session");
  }

  return {
    uploadUrl: data.uploadUrl,
    expiresIn: data.expiresIn || 24 * 60 * 60,
  };
}

/**
 * Step 2: Upload the file directly to YouTube using the resumable upload URL
 * This runs entirely on the client - no file passes through your server
 */
export async function uploadToYouTube(
  file: File,
  uploadUrl: string,
  onProgress?: (progress: number) => void,
): Promise<string> {
  // Convert file to buffer for upload
  const buffer = await file.arrayBuffer();

  const response = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Length": file.size.toString(),
      "Content-Type": file.type,
    },
    body: buffer,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`YouTube upload failed: ${error}`);
  }

  const data = (await response.json()) as YouTubeUploadResponse;

  if (!data.id) {
    throw new Error("YouTube response missing video ID");
  }

  return data.id;
}

/**
 * Complete flow: Initialize session and upload file
 * Returns video ID and URLs
 */
export async function uploadVideoToYouTube(
  file: File,
  metadata?: {
    title?: string;
    description?: string;
  },
  onProgress?: (progress: number) => void,
): Promise<{
  videoId: string;
  embedUrl: string;
  watchUrl: string;
}> {
  // Step 1: Initialize upload session
  const { uploadUrl } = await initializeYouTubeUpload(file, metadata);

  // Step 2: Upload file directly to YouTube
  const videoId = await uploadToYouTube(file, uploadUrl, onProgress);

  return {
    videoId,
    embedUrl: `https://www.youtube.com/embed/${videoId}`,
    watchUrl: `https://www.youtube.com/watch?v=${videoId}`,
  };
}
