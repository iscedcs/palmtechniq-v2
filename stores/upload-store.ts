/**
 * Global Upload Manager Store
 *
 * Manages multiple concurrent video uploads with:
 * - Parallel uploads (no blocking)
 * - Progress tracking per upload
 * - Cancel/retry functionality
 * - Persistence across navigation
 */

import { create } from "zustand";
import {
  initializeYouTubeUpload,
  uploadToYouTube,
  type UploadProgress,
} from "@/lib/youtube-upload";

export type UploadStatus =
  | "queued"
  | "initializing"
  | "uploading"
  | "complete"
  | "error"
  | "cancelled";

export interface UploadItem {
  /** Unique ID for this upload */
  id: string;
  /** Original file being uploaded */
  file: File;
  /** Display name for the upload */
  name: string;
  /** Current status */
  status: UploadStatus;
  /** Upload progress details */
  progress: UploadProgress | null;
  /** YouTube embed URL when complete */
  embedUrl?: string;
  /** Video ID when complete */
  videoId?: string;
  /** Error message if failed */
  error?: string;
  /** AbortController for cancellation */
  abortController?: AbortController;
  /** Callback when upload completes */
  onComplete?: (embedUrl: string) => void;
  /** When the upload was started */
  startedAt: number;
}

interface UploadStore {
  /** All uploads (active and completed) */
  uploads: Map<string, UploadItem>;
  /** Whether the upload panel is expanded */
  isPanelOpen: boolean;

  /** Add a new upload to the queue and start it */
  startUpload: (
    file: File,
    options?: {
      name?: string;
      onComplete?: (embedUrl: string) => void;
    },
  ) => string;

  /** Cancel an upload */
  cancelUpload: (id: string) => void;

  /** Retry a failed upload */
  retryUpload: (id: string) => void;

  /** Remove an upload from the list */
  removeUpload: (id: string) => void;

  /** Clear all completed/failed uploads */
  clearCompleted: () => void;

  /** Toggle panel visibility */
  togglePanel: () => void;

  /** Set panel visibility */
  setPanelOpen: (open: boolean) => void;
}

// Generate unique ID
const generateId = () =>
  `upload_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

export const useUploadStore = create<UploadStore>((set, get) => ({
  uploads: new Map(),
  isPanelOpen: false,

  startUpload: (file, options) => {
    const id = generateId();
    const abortController = new AbortController();

    const uploadItem: UploadItem = {
      id,
      file,
      name: options?.name || file.name,
      status: "initializing",
      progress: null,
      abortController,
      onComplete: options?.onComplete,
      startedAt: Date.now(),
    };

    // Add to store
    set((state) => {
      const newUploads = new Map(state.uploads);
      newUploads.set(id, uploadItem);
      return { uploads: newUploads, isPanelOpen: true };
    });

    // Start the upload process
    processUpload(id, get, set);

    return id;
  },

  cancelUpload: (id) => {
    const upload = get().uploads.get(id);
    if (upload?.abortController) {
      upload.abortController.abort();
    }

    set((state) => {
      const newUploads = new Map(state.uploads);
      const item = newUploads.get(id);
      if (item) {
        newUploads.set(id, { ...item, status: "cancelled" });
      }
      return { uploads: newUploads };
    });
  },

  retryUpload: (id) => {
    const upload = get().uploads.get(id);
    if (
      !upload ||
      upload.status === "uploading" ||
      upload.status === "initializing"
    ) {
      return;
    }

    const newAbortController = new AbortController();

    set((state) => {
      const newUploads = new Map(state.uploads);
      newUploads.set(id, {
        ...upload,
        status: "initializing",
        progress: null,
        error: undefined,
        abortController: newAbortController,
        startedAt: Date.now(),
      });
      return { uploads: newUploads };
    });

    processUpload(id, get, set);
  },

  removeUpload: (id) => {
    const upload = get().uploads.get(id);
    if (
      upload?.abortController &&
      (upload.status === "uploading" || upload.status === "initializing")
    ) {
      upload.abortController.abort();
    }

    set((state) => {
      const newUploads = new Map(state.uploads);
      newUploads.delete(id);
      return { uploads: newUploads };
    });
  },

  clearCompleted: () => {
    set((state) => {
      const newUploads = new Map(state.uploads);
      for (const [id, upload] of newUploads) {
        if (
          upload.status === "complete" ||
          upload.status === "error" ||
          upload.status === "cancelled"
        ) {
          newUploads.delete(id);
        }
      }
      return { uploads: newUploads };
    });
  },

  togglePanel: () => {
    set((state) => ({ isPanelOpen: !state.isPanelOpen }));
  },

  setPanelOpen: (open) => {
    set({ isPanelOpen: open });
  },
}));

/**
 * Process an upload in the background
 */
async function processUpload(
  id: string,
  get: () => UploadStore,
  set: (
    partial:
      | Partial<UploadStore>
      | ((state: UploadStore) => Partial<UploadStore>),
  ) => void,
) {
  const upload = get().uploads.get(id);
  if (!upload) return;

  try {
    // Initialize upload session
    const { uploadUrl } = await initializeYouTubeUpload(upload.file, {
      title: upload.name,
    });

    // Check if cancelled during initialization
    if (upload.abortController?.signal.aborted) {
      return;
    }

    // Update status to uploading
    set((state) => {
      const newUploads = new Map(state.uploads);
      const item = newUploads.get(id);
      if (item) {
        newUploads.set(id, { ...item, status: "uploading" });
      }
      return { uploads: newUploads };
    });

    // Upload with progress tracking
    const videoId = await uploadToYouTube(upload.file, uploadUrl, {
      signal: upload.abortController?.signal,
      onProgress: (progress) => {
        set((state) => {
          const newUploads = new Map(state.uploads);
          const item = newUploads.get(id);
          if (item && item.status === "uploading") {
            newUploads.set(id, { ...item, progress });
          }
          return { uploads: newUploads };
        });
      },
    });

    const embedUrl = `https://www.youtube.com/embed/${videoId}`;

    // Mark as complete
    set((state) => {
      const newUploads = new Map(state.uploads);
      const item = newUploads.get(id);
      if (item) {
        newUploads.set(id, {
          ...item,
          status: "complete",
          videoId,
          embedUrl,
          progress: {
            percent: 100,
            bytesUploaded: upload.file.size,
            bytesTotal: upload.file.size,
            speed: 0,
            eta: 0,
            speedFormatted: "Complete",
            etaFormatted: "Done!",
            progressFormatted: `${formatBytes(upload.file.size)} / ${formatBytes(upload.file.size)}`,
          },
        });
      }
      return { uploads: newUploads };
    });

    // Call onComplete callback
    upload.onComplete?.(embedUrl);
  } catch (error) {
    if (error instanceof Error && error.message === "Upload cancelled") {
      set((state) => {
        const newUploads = new Map(state.uploads);
        const item = newUploads.get(id);
        if (item) {
          newUploads.set(id, { ...item, status: "cancelled" });
        }
        return { uploads: newUploads };
      });
      return;
    }

    const errorMessage =
      error instanceof Error ? error.message : "Upload failed";

    set((state) => {
      const newUploads = new Map(state.uploads);
      const item = newUploads.get(id);
      if (item) {
        newUploads.set(id, { ...item, status: "error", error: errorMessage });
      }
      return { uploads: newUploads };
    });
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

// Selectors for common queries
export const selectActiveUploads = (state: UploadStore) =>
  Array.from(state.uploads.values()).filter(
    (u) =>
      u.status === "uploading" ||
      u.status === "initializing" ||
      u.status === "queued",
  );

export const selectCompletedUploads = (state: UploadStore) =>
  Array.from(state.uploads.values()).filter((u) => u.status === "complete");

export const selectFailedUploads = (state: UploadStore) =>
  Array.from(state.uploads.values()).filter(
    (u) => u.status === "error" || u.status === "cancelled",
  );

export const selectAllUploads = (state: UploadStore) =>
  Array.from(state.uploads.values()).sort((a, b) => b.startedAt - a.startedAt);

export const selectHasActiveUploads = (state: UploadStore) =>
  Array.from(state.uploads.values()).some(
    (u) => u.status === "uploading" || u.status === "initializing",
  );
