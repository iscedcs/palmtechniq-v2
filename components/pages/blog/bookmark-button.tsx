"use client";

import { useState } from "react";
import { Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";

export function BookmarkButton({
  postId,
  initialBookmarked = false,
}: {
  postId: string;
  initialBookmarked?: boolean;
}) {
  const [bookmarked, setBookmarked] = useState(initialBookmarked);

  async function toggle() {
    try {
      const res = await fetch("/api/blog/bookmark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId }),
      });
      const data = await res.json();
      if (res.status === 401) return;
      setBookmarked(data.bookmarked);
    } catch {
      /* silent */
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggle}
      className={`gap-2 transition-all ${
        bookmarked
          ? "text-neon-blue hover:text-neon-blue/80"
          : "text-gray-400 hover:text-white"
      }`}
      aria-label={bookmarked ? "Remove bookmark" : "Bookmark this post"}
    >
      <Bookmark
        className={`w-5 h-5 ${bookmarked ? "fill-neon-blue" : ""}`}
      />
    </Button>
  );
}
