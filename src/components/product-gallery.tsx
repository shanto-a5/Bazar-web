"use client";

import { useState } from "react";
import { SafeImage } from "@/components/safe-image";
import { cn } from "@/components/ui";

export function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const gallery = images.filter(Boolean);
  const [active, setActive] = useState(0);
  const current = gallery[active];

  return (
    <div className="flex flex-col gap-3">
      <div className="aspect-square w-full overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface">
        <SafeImage src={current} alt={name} className="h-full w-full" />
      </div>
      {gallery.length > 1 && (
        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          {gallery.map((image, index) => (
            <button
              key={`${image}-${index}`}
              type="button"
              onClick={() => setActive(index)}
              className={cn(
                "h-16 w-16 shrink-0 overflow-hidden rounded-lg border bg-surface",
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
