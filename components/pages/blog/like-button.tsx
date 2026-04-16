"use client";

import { useState, useEffect, useCallback } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

function getSessionId() {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem("blog_session_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("blog_session_id", id);
  }
  return id;
}

export function LikeButton({ postId }: { postId: string }) {
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(0);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    const sessionId = getSessionId();
    fetch(`/api/blog/like?postId=${postId}&sessionId=${sessionId}`)
      .then((r) => r.json())
      .then((data) => {
        setLiked(data.liked);
        setCount(data.count);
      })
      .catch(() => {});
  }, [postId]);

  const toggle = useCallback(async () => {
    const sessionId = getSessionId();
    setAnimating(true);
    setTimeout(() => setAnimating(false), 300);

    try {
      const res = await fetch("/api/blog/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, sessionId }),
      });
      const data = await res.json();
      setLiked(data.liked);
      setCount(data.count);
    } catch {
      /* silent */
    }
  }, [postId]);

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggle}
      className={`gap-2 transition-all ${
        liked
          ? "text-rose-400 hover:text-rose-300"
          : "text-gray-400 hover:text-white"
      }`}
    >
      <Heart
        className={`w-5 h-5 transition-transform ${
          animating ? "scale-125" : "scale-100"
        } ${liked ? "fill-rose-400" : ""}`}
      />
      <span className="text-sm font-medium">{count > 0 ? count : ""}</span>
    </Button>
  );
}
