import { SafeImage } from "@/components/safe-image";
import { EmptyState, Stars } from "@/components/ui";
import { formatRelative } from "@/lib/format";
import type { ProductReviews } from "@/lib/types";

export function ReviewList({ data, productName }: { data: ProductReviews; productName: string }) {
  if (data.reviews.length === 0) {
    return (
      <EmptyState
        title="No reviews yet"
        description={`Be the first to review ${productName} after your order arrives.`}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <span className="text-3xl font-extrabold text-ink">{data.ratingAvg.toFixed(1)}</span>
        <div>
          <Stars value={data.ratingAvg} />
          <p className="text-sm text-ink-muted">{data.ratingCount} reviews</p>
        </div>
      </div>
      <ul className="flex flex-col divide-y divide-line">
        {data.reviews.map((review) => (
          <li key={review.id} className="flex gap-3 py-4">
            <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-surface-muted">
              <SafeImage src={null} alt="" className="h-full w-full" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-ink">{review.userName}</span>
                {review.verifiedPurchase && (
                  <span className="rounded-full bg-success/10 px-2 py-0.5 text-[11px] font-semibold text-success">
                    Verified purchase
                  </span>
                )}
                <span className="text-xs text-ink-faint">{formatRelative(review.createdAt)}</span>
              </div>
              <div className="mt-1"><Stars value={review.rating} /></div>
              {review.title && <p className="mt-1 text-sm font-semibold text-ink">{review.title}</p>}
              {review.text && <p className="mt-1 whitespace-pre-line text-sm text-ink-muted">{review.text}</p>}
              {review.images.length > 0 && (
                <div className="mt-2 flex gap-2">
                  {review.images.map((image, index) => (
                    <div key={index} className="h-14 w-14 overflow-hidden rounded-lg border border-line">
                      <SafeImage src={image} alt="" className="h-full w-full" />
                    </div>
                  ))}
                </div>
              )}
              {review.sellerReply && (
                <div className="mt-2 rounded-lg bg-surface-muted p-3 text-sm">
                  <p className="font-semibold text-ink">Seller response</p>
                  <p className="text-ink-muted">{review.sellerReply.text}</p>
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
