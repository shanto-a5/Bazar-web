"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button, EmptyState, Spinner, Stars } from "@/components/ui";
import { getBrowserApi } from "@/lib/api/bazar-api";
import { formatRelative } from "@/lib/format";
import type { ReviewDto } from "@/lib/types";

export default function MyReviewsPage() {
  const api = getBrowserApi();
  const [reviews, setReviews] = useState<ReviewDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    api
      .myReviews()
      .then((result) => active && setReviews(result.reviews))
      .catch(() => active && setError("Could not load your reviews."));
    return () => {
      active = false;
    };
  }, [api]);

  async function remove(id: string) {
    setBusyId(id);
    setError(null);
    try {
      await api.deleteReview(id);
      setReviews((prev) => (prev ? prev.filter((review) => review.id !== id) : prev));
    } catch {
      setError("Could not delete the review.");
    } finally {
      setBusyId(null);
    }
  }

  if (error && !reviews) return <EmptyState title="Something went wrong" description={error} />;
  if (!reviews) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="text-brand-500" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-bold text-ink">My reviews</h1>
      {error && <p className="text-sm text-danger">{error}</p>}
      {reviews.length === 0 ? (
        <EmptyState title="No reviews yet" description="Reviews you write for delivered orders will appear here." />
      ) : (
        <ul className="flex flex-col gap-3">
          {reviews.map((review) => (
            <li key={review.id} className="rounded-[var(--radius-card)] border border-line bg-surface p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Stars value={review.rating} />
                <span className="text-xs text-ink-faint">{formatRelative(review.createdAt)}</span>
              </div>
              {review.title && <p className="mt-1 font-semibold text-ink">{review.title}</p>}
              {review.text && <p className="mt-1 whitespace-pre-line text-sm text-ink-muted">{review.text}</p>}
              <div className="mt-2">
                <Link href={`/product/${review.productId}`} className="text-sm font-medium text-brand-600 hover:underline">
                  View product
                </Link>
              </div>
              {review.sellerReply && (
                <div className="mt-2 rounded-lg bg-surface-muted p-3 text-sm">
                  <p className="font-semibold text-ink">Seller response</p>
                  <p className="text-ink-muted">{review.sellerReply.text}</p>
                </div>
              )}
              <div className="mt-3">
                <Button size="sm" variant="ghost" disabled={busyId === review.id} onClick={() => remove(review.id)}>
                  Delete review
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
