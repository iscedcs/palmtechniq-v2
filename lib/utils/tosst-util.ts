import { toast } from "sonner";

export function showUndoToast({
  message,
  undoLabel = "Undo",
  dismissLabel = "Dismiss",
  onUndo,
}: IUndoToastOptions) {
  toast.success(message, {
    duration: 10000,
    action: {
      label: undoLabel,
      onClick: async () => {
        try {
          await onUndo();
          toast.success("Restored successfully");
        } catch (err) {
          console.error(err);
          toast.error("Failed to restore");
        }
      },
    },
    cancel: {
      label: dismissLabel,
      onClick: () => {
        toast.dismiss();
      },
    },
  });
}
