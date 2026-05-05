"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { MessageCircle, Pencil, Send, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface CommentItem {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  canEdit: boolean;
  canDelete: boolean;
  deleteLabel: "Delete" | "Remove";
  user: {
    id: string;
    name: string;
    image?: string | null;
  };
}

export function CommentsSection({
  postId,
  postSlug,
}: {
  postId: string;
  postSlug: string;
}) {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [content, setContent] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [canComment, setCanComment] = useState(false);
  const [isPending, startTransition] = useTransition();

  const commentCount = comments.length;

  const loadComments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/blog/comments?postId=${postId}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Failed to load comments");
      }
      setComments(Array.isArray(data.comments) ? data.comments : []);
      setCanComment(!!data.canComment);
    } catch {
      toast.error("Failed to load comments");
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  const submitDisabled = useMemo(() => {
    return isPending || content.trim().length < 3;
  }, [isPending, content]);

  const editDisabled = useMemo(() => {
    return isPending || editingContent.trim().length < 3;
  }, [isPending, editingContent]);

  const handleSubmit = () => {
    if (!canComment) {
      toast.error("Please login to comment");
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch("/api/blog/comments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ postId, content: content.trim() }),
        });

        const data = await res.json();
        if (!res.ok) {
          toast.error(data?.error || "Failed to post comment");
          return;
        }

        setComments((prev) => [data.comment, ...prev]);
        setContent("");
        toast.success("Comment posted");
      } catch {
        toast.error("Failed to post comment");
      }
    });
  };

  const handleDelete = (commentId: string) => {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/blog/comments?commentId=${commentId}`, {
          method: "DELETE",
        });
        const data = await res.json();

        if (!res.ok) {
          toast.error(data?.error || "Failed to delete comment");
          return;
        }

        setComments((prev) => prev.filter((item) => item.id !== commentId));
        toast.success("Comment deleted");
      } catch {
        toast.error("Failed to delete comment");
      }
    });
  };

  const startEdit = (comment: CommentItem) => {
    setEditingCommentId(comment.id);
    setEditingContent(comment.content);
  };

  const cancelEdit = () => {
    setEditingCommentId(null);
    setEditingContent("");
  };

  const handleUpdate = (commentId: string) => {
    startTransition(async () => {
      try {
        const res = await fetch("/api/blog/comments", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            commentId,
            content: editingContent.trim(),
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          toast.error(data?.error || "Failed to update comment");
          return;
        }

        setComments((prev) =>
          prev.map((item) => (item.id === commentId ? data.comment : item)),
        );
        cancelEdit();
        toast.success("Comment updated");
      } catch {
        toast.error("Failed to update comment");
      }
    });
  };

  return (
    <section className="rounded-xl border border-white/10 bg-white/5 p-6">
      <div className="flex items-center gap-2 mb-4">
        <MessageCircle className="w-5 h-5 text-neon-blue" />
        <h2 className="text-xl font-semibold text-white">Comments</h2>
        <span className="text-sm text-gray-400">({commentCount})</span>
      </div>

      <div className="space-y-4">
        {canComment ? (
          <div className="space-y-3">
            <Textarea
              placeholder="Share your thoughts about this post..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[96px] bg-white/10 border-white/20 text-white placeholder:text-gray-400"
            />
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-gray-500">
                Be respectful and keep comments constructive.
              </p>
              <Button
                onClick={handleSubmit}
                disabled={submitDisabled}
                className="bg-gradient-to-r from-neon-blue to-neon-purple text-white"
              >
                <Send className="w-4 h-4 mr-2" />
                Post Comment
              </Button>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-white/10 bg-black/20 p-4 text-sm text-gray-300">
            <p>
              You need to be signed in to comment. 
              <Link
                href={`/login?callbackUrl=${encodeURIComponent(`/blog/${postSlug}`)}`}
                className="text-neon-blue hover:underline ml-1"
              >
                Login now
              </Link>
            </p>
          </div>
        )}

        <div className="space-y-3 pt-2">
          {loading ? (
            <p className="text-sm text-gray-400">Loading comments...</p>
          ) : comments.length === 0 ? (
            <p className="text-sm text-gray-400">No comments yet. Be the first to comment.</p>
          ) : (
            comments.map((comment) => (
              <div
                key={comment.id}
                className="rounded-lg border border-white/10 bg-black/20 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {comment.user.image ? (
                      <Image
                        src={comment.user.image}
                        alt={comment.user.name}
                        width={36}
                        height={36}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-neon-blue/30 to-neon-purple/30" />
                    )}
                    <div>
                      <p className="text-sm font-semibold text-white">{comment.user.name}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(comment.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                        {comment.updatedAt !== comment.createdAt ? " • edited" : ""}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {comment.canEdit && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-gray-400 hover:text-neon-blue"
                        onClick={() => startEdit(comment)}
                        disabled={isPending}
                      >
                        <Pencil className="w-3.5 h-3.5 mr-1" />
                        Edit
                      </Button>
                    )}
                    {comment.canDelete && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-gray-400 hover:text-rose-400"
                        onClick={() => handleDelete(comment.id)}
                        disabled={isPending}
                        aria-label={comment.deleteLabel + " comment"}
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" />
                        {comment.deleteLabel}
                      </Button>
                    )}
                  </div>
                </div>

                {editingCommentId === comment.id ? (
                  <div className="mt-3 space-y-2">
                    <Textarea
                      value={editingContent}
                      onChange={(e) => setEditingContent(e.target.value)}
                      className="min-h-[88px] bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                    />
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={cancelEdit}
                        disabled={isPending}
                        className="text-gray-300 hover:text-white"
                      >
                        <X className="w-3.5 h-3.5 mr-1" />
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleUpdate(comment.id)}
                        disabled={editDisabled}
                        className="bg-gradient-to-r from-neon-blue to-neon-purple text-white"
                      >
                        Save
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-300 mt-3 whitespace-pre-wrap">
                    {comment.content}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
