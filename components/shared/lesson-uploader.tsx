"use client";
import { Input } from "@/components/ui/input";
import { Upload } from "lucide-react";
import React, { useState, useRef } from "react";
import { Button } from "../ui/button";
import { toast } from "sonner";
import { useUploadStore } from "@/stores/upload-store";

interface LessonUploadFileProps {
  onUploadSuccess: (url: string) => void;
  onDuration?: (minutes: number) => void;
  /** When set (a real, already-persisted lesson with no captions yet), the
   * uploaded video's audio is also sent off in the background to generate
   * WebVTT captions automatically. Never blocks or fails the video upload
   * itself — see lib/ai/transcribe-lesson.ts for the guardrails. */
  lessonId?: string;
  hasCaptions?: boolean;
  onCaptionsReady?: (url: string) => void;
}

export default function LessonUploadFile({
  onUploadSuccess,
  onDuration,
  lessonId,
  hasCaptions,
  onCaptionsReady,
}: LessonUploadFileProps) {
  const [file, setFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const startUpload = useUploadStore((s) => s.startUpload);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] || null;
    setFile(selected);

    if (selected) {
      const url = URL.createObjectURL(selected);
      const video = document.createElement("video");
      video.preload = "metadata";
      video.src = url;
      video.onloadedmetadata = () => {
        const isPortrait = video.videoHeight > video.videoWidth;
        if (isPortrait) {
          toast.error(
            "Please upload a landscape (16:9) video. Portrait videos become Shorts.",
          );
          setFile(null);
          e.target.value = "";
          URL.revokeObjectURL(url);
          return;
        }

        const minutes = Math.ceil(video.duration / 60);
        if (onDuration) {
          onDuration(minutes);
        }
        URL.revokeObjectURL(url);
      };
    }
  };

  const autoGenerateCaptions = async (videoFile: File) => {
    if (!lessonId || hasCaptions || !onCaptionsReady) return;
    if (lessonId.startsWith("temp-")) return;

    try {
      // Extracted in the browser rather than sent server-side: the raw
      // video is easily tens of MB, well past what a serverless function's
      // request body can accept, while the audio-only track for a lesson
      // this length is a fraction of that.
      const { extractLessonAudio } = await import(
        "@/lib/client/extract-lesson-audio"
      );
      const audioFile = await extractLessonAudio(videoFile);

      const formData = new FormData();
      formData.append("file", audioFile);

      const res = await fetch(`/api/lessons/${lessonId}/transcribe`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (data?.success && data.captionsUrl) {
        onCaptionsReady(data.captionsUrl);
        toast.success("Captions auto-generated for this lesson.");
      }
      // Skipped/failed cases are silent by design — auto-captions are a
      // best-effort bonus, not something that should interrupt a tutor
      // mid-upload. They can always add captions manually.
    } catch (error) {
      console.error("Auto-caption generation failed:", error);
    }
  };

  const handleUpload = () => {
    if (!file) {
      toast.error("Please select a file to upload.");
      return;
    }

    const videoFile = file;

    // Start upload in background via global store
    startUpload(videoFile, {
      name: videoFile.name,
      onComplete: (embedUrl) => {
        onUploadSuccess(embedUrl);
        toast.success("Lesson video uploaded successfully!");
      },
    });

    void autoGenerateCaptions(videoFile);

    // Clear the form immediately so user can upload more
    setFile(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }

    toast.info("Upload started! You can continue adding more lessons.");
  };

  return (
    <div className="flex flex-col gap-3">
      <Input
        ref={inputRef}
        type="file"
        accept="video/*"
        onChange={handleFileChange}
        className="shadow-lg bg-white/10 border-white/20 text-white"
      />

      {file && (
        <Button
          type="button"
          onClick={handleUpload}
          className="bg-gradient-to-r from-primary to-neon-purple">
          <Upload className="mr-2 h-4 w-4" />
          Start Upload
        </Button>
      )}

      <p className="text-xs text-white/50">
        💡 Uploads run in the background. You can upload multiple videos at
        once.
      </p>
    </div>
  );
}
