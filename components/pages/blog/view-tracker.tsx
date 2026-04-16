"use client";

import { useEffect } from "react";

function getSessionId() {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem("blog_session_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("blog_session_id", id);
  }
  return id;
}

export function ViewTracker({ postId }: { postId: string }) {
  useEffect(() => {
    const sessionId = getSessionId();
    fetch("/api/blog/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId, sessionId }),
    }).catch(() => {});
  }, [postId]);

  return null;
}
