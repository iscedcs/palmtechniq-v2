"use client";

import ResourceUploaderFile from "@/components/shared/resources-uploader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export default function CaptionsUploadField({
  value,
  onChange,
}: {
  value?: string;
  onChange: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [manualUrl, setManualUrl] = useState("");

  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-400">
        Upload Your lesson transcript if available (optional)
      </p>

      {value ? (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Input
              readOnly
              value={value}
              className="bg-white/10 border-white/20 text-xs text-white"
            />
            <a
              href={value}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-neon-blue underline underline-offset-4 whitespace-nowrap">
              View
            </a>
          </div>
          <button
            type="button"
            onClick={() => onChange("")}
            className="text-xs text-red-400 underline underline-offset-4">
            Remove captions
          </button>
        </div>
      ) : (
        <p className="text-xs text-gray-400 italic">No captions uploaded yet</p>
      )}

      <ResourceUploaderFile
        uploading={uploading}
        setUploading={setUploading}
        allowedTypes=".vtt,text/vtt"
        label="Upload Captions"
        onUploadSuccess={(url) => onChange(url)}
      />

      <div className="flex gap-2">
        <Input
          placeholder="Or paste a .vtt URL"
          value={manualUrl}
          onChange={(e) => setManualUrl(e.target.value)}
          className="bg-white/10 border-white/20 text-xs text-white"
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={!manualUrl.trim()}
          onClick={() => {
            onChange(manualUrl.trim());
            setManualUrl("");
          }}
          className="border-white/20 text-white whitespace-nowrap">
          Use URL
        </Button>
      </div>
    </div>
  );
}
