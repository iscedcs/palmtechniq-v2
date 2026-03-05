"use client";
import { Input } from "@/components/ui/input";
import { courseSchema } from "@/schemas";
import { Loader2 } from "lucide-react";
import React, { Dispatch, SetStateAction, useState, useRef } from "react";
import { UseFormSetValue } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";
import { Button } from "../ui/button";
import {
  uploadVideoToYouTube,
  hasResumeData,
  clearUploadResumeData,
  type UploadProgress,
} from "@/lib/youtube-upload";
import { VideoUploadProgress } from "./video-upload-progress";

type CourseFormValues = z.infer<typeof courseSchema>;

interface UploadFileProps {
  setValue: UseFormSetValue<CourseFormValues>;
  fieldName: "thumbnail" | "previewVideo";
  uploading: boolean;
  setUploading: Dispatch<SetStateAction<boolean>>;
}

export default function UploadFile({
  setValue,
  fieldName,
  uploading,
  setUploading,
}: UploadFileProps) {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [canResume, setCanResume] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
    setProgress(null);

    if (!selectedFile) {
      setCanResume(false);
      return;
    }

    if (fieldName === "thumbnail") {
      const url = URL.createObjectURL(selectedFile);
      const image = new Image();
      image.onload = () => {
        const isPortrait = image.naturalHeight > image.naturalWidth;
        if (isPortrait) {
          toast.error(
            "Please upload a landscape thumbnail (16:9). Portrait images are not supported.",
          );
          setFile(null);
          e.target.value = "";
        }
        URL.revokeObjectURL(url);
      };
      image.src = url;
      return;
    }

    // Video file - check for resume data
    setCanResume(hasResumeData(selectedFile));

    const url = URL.createObjectURL(selectedFile);
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
        setCanResume(false);
        e.target.value = "";
      }
      URL.revokeObjectURL(url);
    };
  };

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setUploading(false);
    setProgress(null);
    toast.info("Upload cancelled. You can resume later.");
  };

  const handleClearResume = () => {
    if (file) {
      clearUploadResumeData(file);
      setCanResume(false);
      toast.info("Previous upload data cleared. Will start fresh.");
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select a file to upload.");
      return;
    }

    setUploading(true);
    setProgress(null);

    try {
      if (fieldName === "thumbnail") {
        const response = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: file.name,
            contentType: file.type,
            type: "image",
            visibility: "public",
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          toast.error(data.error || "Server error");
          console.error("Server Error:", data.error);
          return;
        }

        const uploadUrl = data.url;
        const fields = data.fields;
        const fileUrl = data.success
          ? `${data.url}${data.fields.key}`
          : `${data.url}${data.imageUrl.split("/").pop()}`;

        if (!uploadUrl || !fields) {
          toast.error("Invalid server response.");
          return;
        }

        const formData = new FormData();
        Object.entries(fields).forEach(([key, value]) =>
          formData.append(key, value as string),
        );
        formData.append("file", file);

        const uploadResponse = await fetch(uploadUrl, {
          method: "POST",
          body: formData,
        });

        if (uploadResponse.ok) {
          setValue(fieldName, fileUrl, { shouldDirty: true });

          toast.success("Thumbnail uploaded successfully!");
          setFile(null);
        } else {
          console.error("S3 Upload Error:", await uploadResponse.text());
          toast("Upload failed.");
        }
        return;
      }

      // Video upload with progress tracking
      abortControllerRef.current = new AbortController();

      const { embedUrl } = await uploadVideoToYouTube(
        file,
        { title: file.name },
        {
          onProgress: setProgress,
          signal: abortControllerRef.current.signal,
          resume: canResume,
        },
      );

      setValue(fieldName, embedUrl, { shouldDirty: true });
      toast.success("Video uploaded successfully!");
      setFile(null);
      setProgress(null);
      setCanResume(false);
    } catch (error) {
      if (error instanceof Error && error.message === "Upload cancelled") {
        return;
      }
      console.error("Unexpected Error:", error);
      toast("An unexpected error occurred.");
    } finally {
      setUploading(false);
      abortControllerRef.current = null;
    }
  };

  const isVideoUpload = fieldName === "previewVideo";

  return (
    <div className="flex flex-col gap-3">
      <Input
        id={fieldName}
        type="file"
        accept={fieldName === "thumbnail" ? "image/*" : "video/*"}
        disabled={uploading}
        onChange={handleFileChange}
        className="shadow-lg bg-white/10 border-white/20 text-white"
      />

      {/* Video upload progress */}
      {isVideoUpload && (
        <VideoUploadProgress
          progress={progress}
          file={file}
          isUploading={uploading}
          onCancel={handleCancel}
          canResume={canResume}
        />
      )}

      {/* Action buttons */}
      {file && !uploading && (
        <div className="flex gap-2">
          <Button
            type="button"
            onClick={handleUpload}
            disabled={uploading}
            className="flex-1 bg-gradient-to-r from-primary to-neon-purple">
            {isVideoUpload && canResume
              ? "Resume Upload"
              : `Upload ${fieldName === "thumbnail" ? "Thumbnail" : "Video"}`}
          </Button>
          {isVideoUpload && canResume && (
            <Button
              type="button"
              variant="outline"
              onClick={handleClearResume}
              className="text-white/70 border-white/20 hover:bg-white/10">
              Start Fresh
            </Button>
          )}
        </div>
      )}

      {/* Uploading state without progress yet (for thumbnails or initializing) */}
      {uploading && !progress && (
        <div className="flex items-center justify-center gap-2 text-white/70">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>
            {isVideoUpload ? "Initializing upload..." : "Uploading..."}
          </span>
        </div>
      )}
    </div>
  );
}
