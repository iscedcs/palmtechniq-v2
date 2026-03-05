/**
 * YouTube Chunked Upload Utility
 *
 * Architecture: Client uploads chunks through our server to bypass CORS
 * Server proxies chunks to YouTube using resumable upload protocol
 *
 * Features:
 * - Chunked uploads (4MB) to stay under Vercel limits
 * - Detailed progress tracking (speed, ETA, bytes)
 * - Cancellation support via AbortController
 * - Resume interrupted uploads using localStorage
 */

// Chunk size: 4MB to stay under Vercel's 4.5MB request limit
const CHUNK_SIZE = 4 * 1024 * 1024;

// LocalStorage key prefix for resume data
const UPLOAD_STORAGE_KEY = "youtube_upload_";

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
 * Detailed progress information for UI
 */
export interface UploadProgress {
  /** Percentage complete (0-100) */
  percent: number;
  /** Bytes uploaded so far */
  bytesUploaded: number;
  /** Total bytes to upload */
  bytesTotal: number;
  /** Upload speed in bytes per second */
  speed: number;
  /** Estimated time remaining in seconds */
  eta: number;
  /** Human-readable speed (e.g., "2.5 MB/s") */
  speedFormatted: string;
  /** Human-readable ETA (e.g., "5 min 30 sec") */
  etaFormatted: string;
  /** Human-readable progress (e.g., "250 MB / 1 GB") */
  progressFormatted: string;
}

/**
 * Resume data stored in localStorage
 */
interface ResumeData {
  uploadUrl: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  bytesUploaded: number;
  createdAt: number;
}

/**
 * Format bytes to human readable string
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

/**
 * Format seconds to human readable duration
 */
function formatDuration(seconds: number): string {
  if (!isFinite(seconds) || seconds <= 0) return "calculating...";
  if (seconds < 60) return `${Math.round(seconds)} sec`;
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  if (mins < 60) return `${mins} min ${secs} sec`;
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  return `${hours} hr ${remainingMins} min`;
}

/**
 * Generate a unique key for storing upload resume data
 */
function getStorageKey(file: File): string {
  return `${UPLOAD_STORAGE_KEY}${file.name}_${file.size}_${file.lastModified}`;
}

/**
 * Save resume data to localStorage
 */
function saveResumeData(
  file: File,
  uploadUrl: string,
  bytesUploaded: number,
): void {
  const data: ResumeData = {
    uploadUrl,
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
    bytesUploaded,
    createdAt: Date.now(),
  };
  try {
    localStorage.setItem(getStorageKey(file), JSON.stringify(data));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Get resume data from localStorage
 */
function getResumeData(file: File): ResumeData | null {
  try {
    const data = localStorage.getItem(getStorageKey(file));
    if (!data) return null;

    const parsed = JSON.parse(data) as ResumeData;

    // Validate the data matches current file and isn't expired (24 hours)
    const isValid =
      parsed.fileName === file.name &&
      parsed.fileSize === file.size &&
      parsed.fileType === file.type &&
      Date.now() - parsed.createdAt < 24 * 60 * 60 * 1000;

    return isValid ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Clear resume data from localStorage
 */
function clearResumeData(file: File): void {
  try {
    localStorage.removeItem(getStorageKey(file));
  } catch {
    // Ignore storage errors
  }
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
  signal?: AbortSignal,
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
    signal,
  });

  const data = (await response.json()) as ChunkUploadResponse;

  if (!response.ok || !data.success) {
    throw new Error(data.error || "Chunk upload failed");
  }

  return data;
}

/**
 * Upload options for controlling the upload
 */
export interface UploadOptions {
  /** Callback for detailed progress updates */
  onProgress?: (progress: UploadProgress) => void;
  /** AbortController signal for cancellation */
  signal?: AbortSignal;
  /** Whether to try resuming a previous upload */
  resume?: boolean;
}

/**
 * Step 3: Upload file in chunks through our server to YouTube
 */
export async function uploadToYouTube(
  file: File,
  uploadUrl: string,
  options?: UploadOptions,
): Promise<string> {
  const { onProgress, signal, resume = true } = options || {};
  const totalSize = file.size;
  let uploadedBytes = 0;

  // Try to resume from previous upload
  if (resume) {
    const resumeData = getResumeData(file);
    if (resumeData && resumeData.uploadUrl === uploadUrl) {
      uploadedBytes = resumeData.bytesUploaded;
    }
  }

  // Track speed calculation
  const startTime = Date.now();
  let lastProgressTime = startTime;
  let lastProgressBytes = uploadedBytes;

  while (uploadedBytes < totalSize) {
    // Check for cancellation
    if (signal?.aborted) {
      throw new Error("Upload cancelled");
    }

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
      signal,
    );

    if (result.complete && result.videoId) {
      // Upload finished - clear resume data
      clearResumeData(file);

      // Final progress update
      onProgress?.({
        percent: 100,
        bytesUploaded: totalSize,
        bytesTotal: totalSize,
        speed: 0,
        eta: 0,
        speedFormatted: "Complete",
        etaFormatted: "Done!",
        progressFormatted: `${formatBytes(totalSize)} / ${formatBytes(totalSize)}`,
      });

      return result.videoId;
    }

    // Update progress
    uploadedBytes = result.bytesReceived || end + 1;

    // Save resume data
    saveResumeData(file, uploadUrl, uploadedBytes);

    // Calculate speed and ETA
    const now = Date.now();
    const elapsedSinceLastUpdate = (now - lastProgressTime) / 1000;
    const bytesSinceLastUpdate = uploadedBytes - lastProgressBytes;

    // Use a weighted average for smoother speed display
    const instantSpeed =
      elapsedSinceLastUpdate > 0
        ? bytesSinceLastUpdate / elapsedSinceLastUpdate
        : 0;

    const totalElapsed = (now - startTime) / 1000;
    const averageSpeed = totalElapsed > 0 ? uploadedBytes / totalElapsed : 0;

    // Blend instant and average speed (70% instant, 30% average)
    const speed = instantSpeed * 0.7 + averageSpeed * 0.3;

    const remainingBytes = totalSize - uploadedBytes;
    const eta = speed > 0 ? remainingBytes / speed : 0;
    const percent = Math.round((uploadedBytes / totalSize) * 100);

    onProgress?.({
      percent,
      bytesUploaded: uploadedBytes,
      bytesTotal: totalSize,
      speed,
      eta,
      speedFormatted: `${formatBytes(speed)}/s`,
      etaFormatted: formatDuration(eta),
      progressFormatted: `${formatBytes(uploadedBytes)} / ${formatBytes(totalSize)}`,
    });

    lastProgressTime = now;
    lastProgressBytes = uploadedBytes;
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
  options?: UploadOptions,
): Promise<{
  videoId: string;
  embedUrl: string;
  watchUrl: string;
}> {
  // Check for existing resume data
  const resumeData = getResumeData(file);
  let uploadUrl: string;

  if (resumeData && options?.resume !== false) {
    // Try to use existing upload URL
    uploadUrl = resumeData.uploadUrl;
  } else {
    // Initialize new upload session
    const session = await initializeYouTubeUpload(file, metadata);
    uploadUrl = session.uploadUrl;
  }

  // Upload file in chunks through our server
  const videoId = await uploadToYouTube(file, uploadUrl, options);

  return {
    videoId,
    embedUrl: `https://www.youtube.com/embed/${videoId}`,
    watchUrl: `https://www.youtube.com/watch?v=${videoId}`,
  };
}

/**
 * Check if a file has resumable upload data
 */
export function hasResumeData(file: File): boolean {
  return getResumeData(file) !== null;
}

/**
 * Clear resume data for a file (e.g., when user wants to start fresh)
 */
export function clearUploadResumeData(file: File): void {
  clearResumeData(file);
}
