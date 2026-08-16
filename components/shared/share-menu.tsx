"use client";

import { useEffect, useState } from "react";
import {
  Check,
  Facebook,
  Link2,
  Linkedin,
  MessageCircle,
  Share2,
  Twitter,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type ShareMenuProps = {
  /** Absolute or root-relative URL to share. Relative paths are resolved
   *  against the current origin so preview deployments share themselves. */
  url: string;
  /** Headline for the share text. */
  title: string;
  /** Optional second line, used by the native share sheet and WhatsApp. */
  text?: string;
  label?: string;
  className?: string;
  variant?: "outline" | "ghost" | "secondary";
  size?: "sm" | "default" | "icon";
};

/**
 * Share control used on any public, linkable page.
 *
 * WhatsApp sits first on purpose. It is where course links actually travel in
 * Nigeria, and burying it under the western networks would be copying a US
 * product's ordering rather than matching how our audience shares.
 *
 * The native share sheet is offered only when the browser really supports it.
 * `navigator.share` exists on some desktop browsers but throws or silently
 * does nothing, so the check runs after mount and the menu always keeps the
 * per-network links as a working path.
 */
export function ShareMenu({
  url,
  title,
  text,
  label = "Share",
  className,
  variant = "outline",
  size = "sm",
}: ShareMenuProps) {
  const [absoluteUrl, setAbsoluteUrl] = useState(url);
  const [canNativeShare, setCanNativeShare] = useState(false);
  const [copied, setCopied] = useState(false);

  // Resolved after mount: `window` does not exist during the server render,
  // and the URL must be identical in both passes to avoid a hydration error.
  useEffect(() => {
    setAbsoluteUrl(new URL(url, window.location.origin).toString());
    setCanNativeShare(
      typeof navigator !== "undefined" &&
        typeof navigator.share === "function" &&
        // Coarse pointer is the honest proxy for "has a real share sheet".
        window.matchMedia("(pointer: coarse)").matches,
    );
  }, [url]);

  const encodedUrl = encodeURIComponent(absoluteUrl);
  const encodedTitle = encodeURIComponent(title);
  const encodedMessage = encodeURIComponent(
    text ? `${title}\n\n${text}\n${absoluteUrl}` : `${title}\n${absoluteUrl}`,
  );

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(absoluteUrl);
      setCopied(true);
      toast.success("Link copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy the link");
    }
  };

  const nativeShare = async () => {
    try {
      await navigator.share({ title, text, url: absoluteUrl });
    } catch {
      // The user dismissing the sheet rejects the promise too, so this is
      // not worth surfacing as an error.
    }
  };

  const networks = [
    {
      key: "whatsapp",
      label: "WhatsApp",
      icon: MessageCircle,
      href: `https://wa.me/?text=${encodedMessage}`,
      hover: "hover:text-[#25D366]",
    },
    {
      key: "x",
      label: "X",
      icon: Twitter,
      href: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
      hover: "hover:text-[#1DA1F2]",
    },
    {
      key: "linkedin",
      label: "LinkedIn",
      icon: Linkedin,
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      hover: "hover:text-[#0A66C2]",
    },
    {
      key: "facebook",
      label: "Facebook",
      icon: Facebook,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      hover: "hover:text-[#1877F2]",
    },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={cn("gap-2", className)}
          aria-label="Share">
          <Share2 className="h-4 w-4" />
          {size !== "icon" && label}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-52">
        {canNativeShare && (
          <>
            <DropdownMenuItem onClick={nativeShare} className="gap-2">
              <Share2 className="h-4 w-4" />
              Share via…
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}

        {networks.map((network) => (
          <DropdownMenuItem key={network.key} asChild>
            <a
              href={network.href}
              target="_blank"
              rel="noopener noreferrer"
              className={cn("flex items-center gap-2", network.hover)}>
              <network.icon className="h-4 w-4" />
              {network.label}
            </a>
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={copyLink} className="gap-2">
          {copied ? (
            <Check className="h-4 w-4 text-emerald-500" />
          ) : (
            <Link2 className="h-4 w-4" />
          )}
          {copied ? "Copied" : "Copy link"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
