"use client";

import ResourceUploaderFile from "@/components/shared/resources-uploader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function ResourceUploaderComponent({
  moduleId,
  lessonId,
}: {
  moduleId?: string;
  lessonId?: string;
}) {
  const [resources, setResources] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [type, setType] = useState("LINK");
  const [uploading, setUploading] = useState(false);
  const [url, setUrl] = useState("");
  const [loadingAdd, setLoadingAdd] = useState(false);
  const [loadingResources, setLoadingResources] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editType, setEditType] = useState("");

  useEffect(() => {
    const fetchResources = async () => {
      try {
        const query = lessonId
          ? `lessonId=${lessonId}`
          : `moduleId=${moduleId}`;
        const res = await fetch(`/api/resources?${query}`);
        const data = await res.json();
        if (res.ok && data.success) {
          setResources(data.resources || []);
        } else {
          toast.error("Failed to fetch resources");
        }
      } catch (err) {
        console.error("Error fetching resources:", err);
        toast.error("Error fetching resources");
      } finally {
        setLoadingResources(false);
      }
    };

    fetchResources();
  }, [lessonId, moduleId]);

  const handleUpload = async (fileUrl: string) => {
    if (!title || !fileUrl) {
      toast.error("Please fill title and upload/select resource first.");
      return;
    }

    setLoadingAdd(true);
    setUrl(fileUrl);

    try {
      const payload = { title, url: fileUrl, type, moduleId, lessonId };

      const res = await fetch("/api/resources", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("✅ Resource added!");
        setResources((prev) => [...prev, data.resource]);
        setTitle("");
        setUrl("");
      } else {
        toast.error(data.error || "Failed to add resource");
      }
    } catch (error) {
      console.error("Error adding resource:", error);
      toast.error("Unexpected error adding resource");
    } finally {
      setLoadingAdd(false);
    }
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/resources?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Resource deleted");
      setResources((prev) => prev.filter((r) => r.id !== id));
    } else {
      toast.error("Failed to delete resource");
    }
  };

  const handleEditSave = async (id: string) => {
    if (!editTitle.trim()) {
      toast.error("Title cannot be empty.");
      return;
    }

    try {
      const res = await fetch("/api/resources", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, title: editTitle, type: editType }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("Resource updated!");
        setResources((prev) =>
          prev.map((r) => (r.id === id ? data.resource : r))
        );
        setEditingId(null);
      } else {
        toast.error(data.error || "Failed to update resource");
      }
    } catch (error) {
      console.error("Error updating resource:", error);
      toast.error("Unexpected error updating resource");
    }
  };

  return (
    <div className="mt-4 border-t border-white/10 pt-3">
      <h4 className="text-white font-medium text-sm mb-2">Resources</h4>

      {/* Upload Section */}
      <div className="flex flex-col gap-2">
        <Input
          placeholder="Resource title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="bg-white/10 border-white/20 text-white"
        />

        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="bg-white/10 border-white/20 text-white">
            <SelectValue placeholder="Resource Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PDF">PDF</SelectItem>
            <SelectItem value="LINK">Link</SelectItem>
            <SelectItem value="DOCUMENT">Document</SelectItem>
          </SelectContent>
        </Select>

        {type === "LINK" ? (
          <Input
            placeholder="Paste resource URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="bg-white/10 border-white/20 text-white"
          />
        ) : (
          <ResourceUploaderFile
            uploading={uploading}
            setUploading={setUploading}
            onUploadSuccess={handleUpload}
          />
        )}

        <Button
          className="bg-gradient-to-r from-neon-green to-green-400 text-white"
          onClick={() => handleUpload(url)}
          disabled={!title || (!url && type === "LINK") || loadingAdd}>
          {loadingAdd ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Adding...
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 mr-2" /> Add Resource
            </>
          )}
        </Button>
      </div>

      {/* Resource List */}
      <div className="mt-3 space-y-2">
        {loadingResources ? (
          <p className="text-sm text-gray-400">Loading resources...</p>
        ) : resources.length > 0 ? (
          resources.map((res) => (
            <div
              key={res.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between bg-white/5 px-3 py-2 rounded-md">
              {editingId === res.id ? (
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full">
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="bg-white/10 border-white/20 text-white flex-1"
                  />
                  <Select value={editType} onValueChange={setEditType}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white w-32">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PDF">PDF</SelectItem>
                      <SelectItem value="LINK">Link</SelectItem>
                      <SelectItem value="DOCUMENT">Document</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleEditSave(res.id)}
                      className="bg-green-600 hover:bg-green-700">
                      <Save className="w-4 h-4 mr-1" /> Save
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setEditingId(null)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between w-full">
                  <span className="text-sm text-white truncate max-w-[60%]">
                    {res.title} ({res.type})
                  </span>
                  <div className="flex gap-3 items-center">
                    <a
                      href={res.url}
                      target="_blank"
                      className="text-xs text-neon-blue underline">
                      View
                    </a>
                    <Pencil
                      className="w-4 h-4 text-yellow-400 cursor-pointer"
                      onClick={() => {
                        setEditingId(res.id);
                        setEditTitle(res.title);
                        setEditType(res.type);
                      }}
                    />
                    <Trash2
                      className="w-4 h-4 text-red-400 cursor-pointer"
                      onClick={() => handleDelete(res.id)}
                    />
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-400 italic">
            No resources added yet.
          </p>
        )}
      </div>
    </div>
  );
}
