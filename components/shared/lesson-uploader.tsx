"use client";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import React, { Dispatch, SetStateAction, useState } from "react";
import { Button } from "../ui/button";
import { toast } from "sonner";

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

    if (selected && onDuration) {
      const url = URL.createObjectURL(selected);
      const video = document.createElement("video");
      video.preload = "metadata";
      video.src = url;
      video.onloadedmetadata = () => {
        const minutes = Math.ceil(video.duration / 60);
        onDuration(minutes);
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
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_URL}/api/upload`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: file.name,
            contentType: file.type,
            type: "video",
          }),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error || "Server error");
        return;
      }

      const uploadUrl = data.url;
      const fields = data.fields;
      const fileUrl = `${data.url}${data.fields.key}`;

      const formData = new FormData();
      Object.entries(fields).forEach(([key, value]) =>
        formData.append(key, value as string)
      );
      formData.append("file", file);

      const uploadResponse = await fetch(uploadUrl, {
        method: "POST",
        body: formData,
      });

      if (uploadResponse.ok) {
        onUploadSuccess(fileUrl);
        toast.success("Lesson video uploaded successfully!");
        setFile(null);
      } else {
        toast.error("Upload failed.");
      }
    } catch (error) {
      console.error("Unexpected Error:", error);
      toast.error("An unexpected error occurred.");
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
