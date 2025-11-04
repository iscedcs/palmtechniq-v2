"use client";
import React, { Dispatch, SetStateAction, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ResourceUploaderProps {
  onUploadSuccess: (url: string, file: File) => void;
  setUploading: Dispatch<SetStateAction<boolean>>;
  uploading: boolean;
  allowedTypes?: string; // e.g. "video/*,application/pdf,image/*"
  label?: string;
}

export default function ResourceUploaderFile({
  onUploadSuccess,
  uploading,
  setUploading,
  allowedTypes = "*/*",
  label = "Upload File",
}: ResourceUploaderProps) {
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] || null);
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select a file to upload.");
      return;
    }

    setUploading(true);

    try {
      const response = await fetch(`/api/upload`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        toast.error(data.error || "Upload initialization failed.");
        return;
      }

      const uploadUrl = data.url;
      const fields = data.fields;
      const fileUrl = `${uploadUrl}${fields.key}`;

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
        onUploadSuccess(fileUrl, file);
        toast.success("File uploaded successfully!");
        setFile(null);
      } else {
        toast.error("Upload failed.");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("An unexpected error occurred during upload.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <Input
        type="file"
        accept={allowedTypes}
        onChange={handleFileChange}
        disabled={uploading}
        className="shadow-lg bg-white/10 border-white/20 text-white"
      />

      {file && (
        <Button
          type="button"
          onClick={handleUpload}
          disabled={uploading}
          className="bg-gradient-to-r from-neon-blue to-neon-purple text-white">
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            `${label}: ${file.name}`
          )}
        </Button>
      )}
    </div>
  );
}
