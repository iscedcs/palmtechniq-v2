"use client";

import { useEffect, useState } from "react";
import { Eye } from "lucide-react";

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
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    const sessionId = getSessionId();

    fetch("/api/blog/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId, sessionId }),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to track view");
        const data = await res.json();
        if (typeof data.count === "number") {
          setCount(data.count);
          return;
        }
        throw new Error("Invalid count response");
      })
      .catch(async () => {
        // Fallback to a read-only count if tracking fails for any reason.
        try {
          const res = await fetch(`/api/blog/view?postId=${postId}`);
          if (!res.ok) return;
          const data = await res.json();
          if (typeof data.count === "number") {
            setCount(data.count);
          }
        } catch {
          // Silent fallback
        }
      });
  }, [postId]);

  return (
    <div className="flex items-center gap-2">
      <Eye className="w-4 h-4" />
      <span>{count ?? 0} views</span>
    </div>
  );
}
