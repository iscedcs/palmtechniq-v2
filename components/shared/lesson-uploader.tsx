"use client";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import React, { Dispatch, SetStateAction, useState } from "react";
import { Button } from "../ui/button";
import { toast } from "sonner";
import { uploadVideoToYouTube } from "@/lib/youtube-upload";

interface LessonUploadFileProps {
  onUploadSuccess: (url: string) => void;
  onDuration?: (minutes: number) => void;
  uploading: boolean;
  setUploading: Dispatch<SetStateAction<boolean>>;
}

export default function LessonUploadFile({
  onUploadSuccess,
  onDuration,
  uploading,
  setUploading,
}: LessonUploadFileProps) {
  const [file, setFile] = useState<File | null>(null);

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

  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select a file to upload.");
      return;
    }

    setUploading(true);

    try {
      const { embedUrl } = await uploadVideoToYouTube(file, {
        title: file.name,
      });

      onUploadSuccess(embedUrl);
      toast.success("Lesson video uploaded successfully!");
      setFile(null);
    } catch (error) {
      console.error("YouTube Upload Error:", error);
      const message =
        error instanceof Error
          ? error.message
          : "An unexpected error occurred.";
      toast.error(message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <Input
        type="file"
        accept="video/*"
        disabled={uploading}
        onChange={handleFileChange}
        className="shadow-lg bg-white/10 border-white/20 text-white"
      />
      {file && (
        <Button
          type="button"
          onClick={handleUpload}
          disabled={uploading}
          className="bg-gradient-to-r from-primary to-neon-purple">
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Upload Lesson Video"
          )}
        </Button>
      )}
    </div>
  );
}
