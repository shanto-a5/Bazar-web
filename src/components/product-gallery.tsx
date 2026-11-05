"use client";

import { useState } from "react";
import { SafeImage } from "@/components/safe-image";
import { cn } from "@/components/ui";

export function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const gallery = images.filter(Boolean);
  const [active, setActive] = useState(0);
  const current = gallery[active];

  return (
    <div className="flex min-w-0 flex-col items-center gap-2 sm:gap-3 lg:items-stretch">
      <div className="aspect-square w-full max-w-[15rem] overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface sm:max-w-[22rem] lg:max-w-none">
        <SafeImage src={current} alt={name} className="h-full w-full" />
      </div>
      {gallery.length > 1 && (
        <div className="no-scrollbar flex w-full max-w-[15rem] gap-2 overflow-x-auto sm:max-w-[22rem] lg:max-w-none">
          {gallery.map((image, index) => (
            <button
              key={`${image}-${index}`}
              type="button"
              onClick={() => setActive(index)}
              className={cn(
                "h-14 w-14 shrink-0 overflow-hidden rounded-lg border bg-surface sm:h-16 sm:w-16",
                index === active ? "border-brand-500" : "border-line",
              )}
              aria-label={`${name} image ${index + 1}`}
              aria-current={index === active}
            >
              <SafeImage src={image} alt="" className="h-full w-full" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
