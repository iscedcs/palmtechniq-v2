"use client";

import { useEffect, useState, useTransition } from "react";
import type { ChangeEvent } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, UploadCloud } from "lucide-react";
import {
  studentSubmissionSchema,
  type StudentSubmissionFormData,
} from "@/schemas";
import { submitProjectWork } from "@/actions/student-projects";
import { toast } from "sonner";

interface SubmitProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: { id: string; title: string } | null;
  onSuccess?: () => void;
}

export function SubmitProjectModal({
  open,
  onOpenChange,
  project,
  onSuccess,
}: SubmitProjectModalProps) {
  const [isPending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const form = useForm<StudentSubmissionFormData>({
    resolver: zodResolver(
      studentSubmissionSchema
    ) as Resolver<StudentSubmissionFormData>,
    defaultValues: {
      projectId: "",
      githubUrl: "",
      liveUrl: "",
      notes: "",
      fileUrl: "",
    },
  });

  useEffect(() => {
    if (project && open) {
      form.reset({
        projectId: project.id,
        githubUrl: "",
        liveUrl: "",
        notes: "",
        fileUrl: "",
      });
      setFile(null);
    }
  }, [project, open, form]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] || null;
    setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select a file to upload.");
      return;
    }

    setUploading(true);
    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          folder: "project-submissions",
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
        form.setValue("fileUrl", fileUrl, { shouldValidate: true });
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

  const onSubmit = (data: StudentSubmissionFormData) => {
    startTransition(async () => {
      const result = await submitProjectWork(data);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Submission sent!");
        onOpenChange(false);
        onSuccess?.();
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-background border-white/10">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white">
            Submit Project
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            {project ? `Submit work for ${project.title}` : "Submit your work"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="projectId"
              render={({ field }) => <input type="hidden" {...field} />}
            />

            <FormField
              control={form.control}
              name="githubUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">GitHub URL</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="https://github.com/username/repo"
                      className="bg-white/5 border-white/10 text-white placeholder-gray-400"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="liveUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Live URL</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="https://your-demo.com"
                      className="bg-white/5 border-white/10 text-white placeholder-gray-400"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={3}
                      placeholder="Any extra notes for your tutor..."
                      className="bg-white/5 border-white/10 text-white placeholder-gray-400"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="fileUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Upload File</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <Input
                        type="file"
                        onChange={handleFileChange}
                        disabled={uploading}
                        className="bg-white/5 border-white/10 text-white file:text-white"
                      />
                      {file && (
                        <Button
                          type="button"
                          onClick={handleUpload}
                          disabled={uploading}
                          className="bg-gradient-to-r from-neon-blue to-neon-purple text-white">
                          {uploading ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <UploadCloud className="w-4 h-4 mr-2" />
                              Upload File
                            </>
                          )}
                        </Button>
                      )}
                      {field.value && (
                        <p className="text-xs text-gray-400 break-all">
                          Uploaded: {field.value}
                        </p>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="border-white/20 text-white hover:bg-white/10">
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="bg-gradient-to-r from-neon-blue to-neon-purple text-white">
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Work"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
