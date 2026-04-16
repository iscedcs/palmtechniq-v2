"use client";

import { useState } from "react";
import {
  Share2,
  Twitter,
  Facebook,
  Linkedin,
  Link2,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface ShareButtonsProps {
  title: string;
  slug: string;
}

export function ShareButtons({ title, slug }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const url =
    typeof window !== "undefined"
      ? `${window.location.origin}/blog/${slug}`
      : `https://palmtechniq.com/blog/${slug}`;
  const encoded = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  function copyLink() {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="flex items-center gap-1">
      <span className="text-gray-400 text-sm mr-1 hidden sm:inline">
        <Share2 className="w-4 h-4" />
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="w-8 h-8 text-gray-400 hover:text-[#1DA1F2]"
        asChild
      >
        <a
          href={`https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encoded}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Share on X/Twitter"
        >
          <Twitter className="w-4 h-4" />
        </a>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="w-8 h-8 text-gray-400 hover:text-[#0A66C2]"
        asChild
      >
        <a
          href={`https://www.linkedin.com/sharing/share-offsite/?url=${encoded}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Share on LinkedIn"
        >
          <Linkedin className="w-4 h-4" />
        </a>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="w-8 h-8 text-gray-400 hover:text-[#1877F2]"
        asChild
      >
        <a
          href={`https://www.facebook.com/sharer/sharer.php?u=${encoded}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Share on Facebook"
        >
          <Facebook className="w-4 h-4" />
        </a>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="w-8 h-8 text-gray-400 hover:text-neon-blue"
        onClick={copyLink}
        aria-label="Copy link"
      >
        {copied ? (
          <Check className="w-4 h-4 text-green-400" />
        ) : (
          <Link2 className="w-4 h-4" />
        )}
      </Button>
    </div>
  );
}
