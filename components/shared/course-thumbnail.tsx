"use client";

import { useState } from "react";
import { generateRandomAvatar } from "@/lib/utils";

/**
 * Course thumbnail with a fallback that survives dead URLs.
 *
 * `thumbnail || generateRandomAvatar()` only covers a MISSING value. It cannot
 * help when the value is present but no longer resolves — which is the case
 * for every course uploaded before the move from AWS S3 to DigitalOcean
 * Spaces, since that S3 bucket no longer exists. Those rows hold a perfectly
 * well-formed URL that 404s, so the fallback was never reached and the card
 * rendered a broken image.
 *
 * Falling back on the load error as well means a thumbnail degrades to the
 * generated avatar whether it is absent OR broken, and stays robust against
 * any future storage move.
 */
export function CourseThumbnail({
  src,
  alt,
  className,
  seed,
}: {
  src?: string | null;
  alt: string;
  className?: string;
  /** Stable seed so the placeholder does not change on every render. */
  seed?: string;
}) {
  const fallback = generateRandomAvatar(seed ?? alt);
  const [current, setCurrent] = useState(src || fallback);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={current}
      alt={alt}
      className={className}
      onError={() => {
        if (current !== fallback) setCurrent(fallback);
      }}
    />
  );
}
