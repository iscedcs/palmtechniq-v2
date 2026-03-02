/**
 * YouTube Chunked Upload Utility
 *
 * Architecture: Client uploads chunks through our server to bypass CORS
 * Server proxies chunks to YouTube using resumable upload protocol
 *
 * Flow:
 * 1. Initialize upload session (get YouTube resumable URL)
 * 2. Upload file in chunks through our server (/api/youtube/upload/chunk)
 * 3. Server forwards each chunk to YouTube
 * 4. Return video ID when complete
 */

// Chunk size: 4MB to stay under Vercel's 4.5MB request limit
const CHUNK_SIZE = 4 * 1024 * 1024;

interface InitializeUploadResponse {
  success: boolean;
  uploadUrl?: string;
  expiresIn?: number;
  error?: string;
  details?: string;
}

interface ChunkUploadResponse {
  success: boolean;
  complete?: boolean;
  bytesReceived?: number;
  videoId?: string;
  embedUrl?: string;
  watchUrl?: string;
  error?: string;
}

/**
 * Step 1: Get a resumable upload session from your server
 * This returns the YouTube upload URL that we'll use for chunked uploads
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

  let data: InitializeUploadResponse;
  try {
    data = (await response.json()) as InitializeUploadResponse;
  } catch {
    throw new Error(`Server error: ${response.status} ${response.statusText}`);
  }

  if (!response.ok || !data.success || !data.uploadUrl) {
    const errorMsg = data.error || "Failed to initialize upload session";
    const details = data.details ? `\n${data.details}` : "";
    throw new Error(`${errorMsg}${details}`);
  }

  return {
    uploadUrl: data.uploadUrl,
    expiresIn: data.expiresIn || 24 * 60 * 60,
  };
}

/**
 * Step 2: Upload a single chunk through our server
 */
async function uploadChunk(
  chunk: Blob,
  uploadUrl: string,
  start: number,
  end: number,
  total: number,
  contentType: string,
): Promise<ChunkUploadResponse> {
  const formData = new FormData();
  formData.append("chunk", chunk);
  formData.append("uploadUrl", uploadUrl);
  formData.append("start", start.toString());
  formData.append("end", end.toString());
  formData.append("total", total.toString());
  formData.append("contentType", contentType);

  const response = await fetch("/api/youtube/upload/chunk", {
    method: "POST",
    body: formData,
  });

  const data = (await response.json()) as ChunkUploadResponse;

  if (!response.ok || !data.success) {
    throw new Error(data.error || "Chunk upload failed");
  }

  return data;
}

/**
 * Step 3: Upload file in chunks through our server to YouTube
 */
export async function uploadToYouTube(
  file: File,
  uploadUrl: string,
  onProgress?: (progress: number) => void,
): Promise<string> {
  const totalSize = file.size;
  let uploadedBytes = 0;

  while (uploadedBytes < totalSize) {
    const start = uploadedBytes;
    const end = Math.min(start + CHUNK_SIZE, totalSize) - 1;
    const chunk = file.slice(start, end + 1);

    const result = await uploadChunk(
      chunk,
      uploadUrl,
      start,
      end,
      totalSize,
      file.type,
    );

    if (result.complete && result.videoId) {
      // Upload finished!
      onProgress?.(100);
      return result.videoId;
    }

    // Update progress
    uploadedBytes = result.bytesReceived || end + 1;
    const progress = Math.round((uploadedBytes / totalSize) * 100);
    onProgress?.(progress);
  }

  throw new Error("Upload completed but no video ID received");
}

/**
 * Complete flow: Initialize session and upload file in chunks
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

  // Step 2: Upload file in chunks through our server
  const videoId = await uploadToYouTube(file, uploadUrl, onProgress);

  return {
    videoId,
    embedUrl: `https://www.youtube.com/embed/${videoId}`,
    watchUrl: `https://www.youtube.com/watch?v=${videoId}`,
  };
}
