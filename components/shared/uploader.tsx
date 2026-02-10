"use client";
import { Input } from "@/components/ui/input";
import { courseSchema } from "@/schemas";
import { Loader2 } from "lucide-react";
import React, { Dispatch, SetStateAction, useState } from "react";
import { UseFormSetValue } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";
import { Button } from "../ui/button";

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
    if (!selectedFile) return;

    if (fieldName === "thumbnail") {
      const url = URL.createObjectURL(selectedFile);
      const image = new Image();
      image.onload = () => {
        const isPortrait = image.naturalHeight > image.naturalWidth;
        if (isPortrait) {
          toast.error(
            "Please upload a landscape thumbnail (16:9). Portrait images are not supported."
          );
          setFile(null);
          e.target.value = "";
        }
        URL.revokeObjectURL(url);
      };
      image.src = url;
      return;
    }

    const url = URL.createObjectURL(selectedFile);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.src = url;
    video.onloadedmetadata = () => {
      const isPortrait = video.videoHeight > video.videoWidth;
      if (isPortrait) {
        toast.error(
          "Please upload a landscape (16:9) video. Portrait videos become Shorts."
        );
        setFile(null);
        e.target.value = "";
      }
      URL.revokeObjectURL(url);
    };
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select a file to upload.");
      return;
    }

    setUploading(true);

    try {
      if (fieldName === "thumbnail") {
        const response = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: file.name,
            contentType: file.type,
            type: "image",
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
          formData.append(key, value as string)
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

      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", file.name);

      const response = await fetch("/api/youtube/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        toast.error(data.error || "Server error");
        console.error("Server Error:", data.error);
        return;
      }

      setValue(fieldName, data.embedUrl, { shouldDirty: true });
      toast.success("Video uploaded successfully!");
      setFile(null);
    } catch (error) {
      console.error("Unexpected Error:", error);
      toast("An unexpected error occurred.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <Input
        id={fieldName}
        type="file"
        accept={fieldName === "thumbnail" ? "image/*" : "video/*"}
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
            `Upload ${fieldName === "thumbnail" ? "Thumbnail" : "Video"}`
          )}
        </Button>
      )}
    </div>
  );
}
