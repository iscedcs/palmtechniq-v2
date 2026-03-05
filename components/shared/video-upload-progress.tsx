"use client";

import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { X, Upload, Clock, Gauge, HardDrive } from "lucide-react";
import type { UploadProgress } from "@/lib/youtube-upload";

interface VideoUploadProgressProps {
  /** Current upload progress */
  progress: UploadProgress | null;
  /** File being uploaded */
  file: File | null;
  /** Whether upload is in progress */
  isUploading: boolean;
  /** Callback to cancel the upload */
  onCancel?: () => void;
  /** Whether there's resumable data for this file */
  canResume?: boolean;
}

export function VideoUploadProgress({
  progress,
  file,
  isUploading,
  onCancel,
  canResume,
}: VideoUploadProgressProps) {
  if (!isUploading || !progress) {
    return null;
  }

  return (
    <div className="w-full space-y-3 rounded-lg border border-white/10 bg-white/5 p-4">
      {/* Header with file name and cancel button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-white/80">
          <Upload className="h-4 w-4" />
          <span className="truncate max-w-[200px]">
            {file?.name || "Uploading..."}
          </span>
          {canResume && (
            <span className="text-xs text-green-400">(Resuming)</span>
          )}
        </div>
        {onCancel && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="h-6 w-6 p-0 text-white/60 hover:text-white hover:bg-white/10">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <Progress value={progress.percent} className="h-3" />
        <div className="flex justify-between text-xs text-white/60">
          <span>{progress.percent}%</span>
          <span>{progress.progressFormatted}</span>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 text-xs">
        {/* Speed */}
        <div className="flex items-center gap-1.5 text-white/70">
          <Gauge className="h-3.5 w-3.5 text-blue-400" />
          <span>{progress.speedFormatted}</span>
        </div>

        {/* ETA */}
        <div className="flex items-center gap-1.5 text-white/70">
          <Clock className="h-3.5 w-3.5 text-yellow-400" />
          <span>{progress.etaFormatted}</span>
        </div>

        {/* Total size */}
        <div className="flex items-center gap-1.5 text-white/70">
          <HardDrive className="h-3.5 w-3.5 text-purple-400" />
          <span>{file ? formatFileSize(file.size) : "—"}</span>
        </div>
      </div>

      {/* Tip for large uploads */}
      {progress.eta > 60 && (
        <p className="text-xs text-white/50 italic">
          💡 Large upload in progress. You can continue working - the upload
          will continue in the background.
        </p>
      )}
    </div>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}
