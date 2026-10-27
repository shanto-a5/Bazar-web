"use client";

import { useState } from "react";
import { cn } from "@/components/ui";

/**
 * A plain `<img>` with a graceful fallback. Product images are remote and can be
 * missing, so a failed load must not leave a broken icon; the API does not
 * guarantee an optimisable host, so we do not route these through `next/image`.
 */
export function SafeImage({
  src,
  alt,
  className,
  fallbackLabel,
}: {
  src?: string | null;
  alt: string;
  className?: string;
  fallbackLabel?: string;
}) {
  const [failed, setFailed] = useState(false);
  const showFallback = !src || failed;

  if (showFallback) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={cn(
          "flex items-center justify-center bg-gradient-to-br from-brand-100 to-brand-200 text-brand-600",
          className,
        )}
      >
        <span className="px-2 text-center text-xs font-semibold uppercase tracking-wide">
          {fallbackLabel ?? alt.trim().charAt(0).toUpperCase()}
        </span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className={cn("object-cover", className)}
    />
  );
}
