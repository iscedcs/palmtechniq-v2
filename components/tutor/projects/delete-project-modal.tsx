"use client";

import { useTransition } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { deleteProject } from "@/actions/project";
import { toast } from "sonner";

interface DeleteProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: { id: string; title: string } | null;
  onSuccess?: () => void;
}

export function DeleteProjectModal({
  open,
  onOpenChange,
  project,
  onSuccess,
}: DeleteProjectModalProps) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (!project) return;

    startTransition(async () => {
      const result = await deleteProject(project.id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Project deleted");
        onOpenChange(false);
        onSuccess?.();
      }
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-background border-white/10">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-white">
            Delete project?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-gray-400">
            This will permanently delete {project?.title || "this project"} and
            its submissions. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="border-white/20 text-white hover:bg-white/10">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isPending}
            className="bg-red-500 text-white hover:bg-red-600">
            {isPending ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
