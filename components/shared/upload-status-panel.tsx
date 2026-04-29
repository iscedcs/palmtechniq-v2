"use client";

import { useState, useMemo } from "react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  X,
  ChevronDown,
  ChevronUp,
  Upload,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Trash2,
  Minimize2,
  Maximize2,
} from "lucide-react";
import {
  useUploadStore,
  type UploadItem,
  type UploadStatus,
} from "@/stores/upload-store";
import { useShallow } from "zustand/react/shallow";
import { cn } from "@/lib/utils";

export function UploadStatusPanel() {
  const [isMinimized, setIsMinimized] = useState(false);

  // Use useShallow to prevent infinite loops from array selectors
  const uploads = useUploadStore(
    useShallow((state) =>
      Array.from(state.uploads.values()).sort(
        (a, b) => b.startedAt - a.startedAt,
      ),
    ),
  );
  const hasActiveUploads = useUploadStore((state) =>
    Array.from(state.uploads.values()).some(
      (u) => u.status === "uploading" || u.status === "initializing",
    ),
  );
  const isPanelOpen = useUploadStore((s) => s.isPanelOpen);
  const setPanelOpen = useUploadStore((s) => s.setPanelOpen);
  const clearCompleted = useUploadStore((s) => s.clearCompleted);

  if (!isPanelOpen || uploads.length === 0) {
    return null;
  }

  const activeCount = uploads.filter(
    (u) => u.status === "uploading" || u.status === "initializing",
  ).length;
  const completedCount = uploads.filter((u) => u.status === "complete").length;

  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 z-50 w-96 rounded-lg border border-white/10 bg-gray-900/95 shadow-2xl backdrop-blur-sm transition-all duration-300",
        isMinimized ? "h-auto" : "max-h-[60vh]",
      )}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-2">
          <Upload className="h-4 w-4 text-primary" />
          <span className="font-medium text-white">
            Uploads
            {activeCount > 0 && (
              <span className="ml-1 text-sm text-white/60">
                ({activeCount} active)
              </span>
            )}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {completedCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearCompleted}
              className="h-7 px-2 text-xs text-white/60 hover:text-white hover:bg-white/10">
              Clear done
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMinimized(!isMinimized)}
            className="h-7 w-7 text-white/60 hover:text-white hover:bg-white/10">
            {isMinimized ? (
              <Maximize2 className="h-4 w-4" />
            ) : (
              <Minimize2 className="h-4 w-4" />
            )}
          </Button>
          {!hasActiveUploads && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setPanelOpen(false)}
              className="h-7 w-7 text-white/60 hover:text-white hover:bg-white/10">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Upload list */}
      {!isMinimized && (
        <div className="max-h-[calc(60vh-56px)] overflow-y-auto">
          {uploads.map((upload) => (
            <UploadItemRow key={upload.id} upload={upload} />
          ))}
        </div>
      )}

      {/* Minimized summary */}
      {isMinimized && activeCount > 0 && (
        <div className="px-4 py-2 text-sm text-white/70">
          {activeCount} upload{activeCount !== 1 ? "s" : ""} in progress...
        </div>
      )}
    </div>
  );
}

function UploadItemRow({ upload }: { upload: UploadItem }) {
  const [expanded, setExpanded] = useState(false);
  const cancelUpload = useUploadStore((s) => s.cancelUpload);
  const retryUpload = useUploadStore((s) => s.retryUpload);
  const removeUpload = useUploadStore((s) => s.removeUpload);

  const statusConfig: Record<
    UploadStatus,
    { icon: React.ReactNode; color: string; label: string }
  > = {
    queued: {
      icon: <Upload className="h-4 w-4" />,
      color: "text-gray-400",
      label: "Queued",
    },
    initializing: {
      icon: <RefreshCw className="h-4 w-4 animate-spin" />,
      color: "text-blue-400",
      label: "Initializing...",
    },
    uploading: {
      icon: <Upload className="h-4 w-4" />,
      color: "text-blue-400",
      label: "Uploading",
    },
    complete: {
      icon: <CheckCircle2 className="h-4 w-4" />,
      color: "text-green-400",
      label: "Complete",
    },
    error: {
      icon: <XCircle className="h-4 w-4" />,
      color: "text-red-400",
      label: "Failed",
    },
    cancelled: {
      icon: <XCircle className="h-4 w-4" />,
      color: "text-yellow-400",
      label: "Cancelled",
    },
  };

  const config = statusConfig[upload.status];
  const isActive =
    upload.status === "uploading" || upload.status === "initializing";
  const canRetry = upload.status === "error" || upload.status === "cancelled";

  return (
    <div className="border-b border-white/5 px-4 py-3 last:border-b-0">
      {/* Main row */}
      <div className="flex items-center gap-3">
        <div className={cn("flex-shrink-0", config.color)}>{config.icon}</div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm text-white" title={upload.name}>
              {upload.name}
            </span>
            {upload.status === "uploading" && upload.progress && (
              <span className="text-xs text-white/50">
                {upload.progress.percent}%
              </span>
            )}
          </div>

          {/* Progress bar for active uploads */}
          {isActive && upload.progress && (
            <Progress
              value={upload.progress.percent}
              className="mt-1.5 h-1.5"
            />
          )}

          {/* Status text */}
          <div className="mt-1 flex items-center gap-2 text-xs">
            <span className={config.color}>{config.label}</span>
            {upload.status === "uploading" && upload.progress && (
              <>
                <span className="text-white/40">•</span>
                <span className="text-white/50">
                  {upload.progress.speedFormatted}
                </span>
                <span className="text-white/40">•</span>
                <span className="text-white/50">
                  {upload.progress.etaFormatted}
                </span>
              </>
            )}
            {upload.status === "error" && (
              <span className="text-red-400/70 truncate" title={upload.error}>
                {upload.error}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {isActive && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => cancelUpload(upload.id)}
              className="h-7 w-7 text-white/50 hover:text-white hover:bg-white/10"
              title="Cancel upload">
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
          {canRetry && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => retryUpload(upload.id)}
              className="h-7 w-7 text-white/50 hover:text-white hover:bg-white/10"
              title="Retry upload">
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          )}
          {!isActive && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => removeUpload(upload.id)}
              className="h-7 w-7 text-white/50 hover:text-red-400 hover:bg-white/10"
              title="Remove">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Expanded details */}
      {expanded && upload.progress && (
        <div className="mt-2 grid grid-cols-3 gap-2 rounded bg-white/5 p-2 text-xs">
          <div>
            <div className="text-white/40">Uploaded</div>
            <div className="text-white/80">
              {upload.progress.progressFormatted}
            </div>
          </div>
          <div>
            <div className="text-white/40">Speed</div>
            <div className="text-white/80">
              {upload.progress.speedFormatted}
            </div>
          </div>
          <div>
            <div className="text-white/40">Remaining</div>
            <div className="text-white/80">{upload.progress.etaFormatted}</div>
          </div>
        </div>
      )}
    </div>
  );
}
