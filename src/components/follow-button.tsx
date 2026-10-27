"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { useSession } from "@/components/session-provider";
import { getBrowserApi } from "@/lib/api/bazar-api";
import { ApiError } from "@/lib/api/client";

export function FollowButton({ storeId }: { storeId: string }) {
  const router = useRouter();
  const { status } = useSession();
  const api = getBrowserApi();
  const [followState, setFollowState] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (status !== "authenticated") return;
    let cancelled = false;
    api
      .followState(storeId)
      .then((state) => {
        if (!cancelled) setFollowState(state.following);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [api, status, storeId]);

  const following = status === "authenticated" && followState;

  async function toggle() {
    if (status !== "authenticated") {
      router.push(`/login?next=${encodeURIComponent(`/store/${storeId}`)}`);
      return;
    }
    setBusy(true);
    try {
      if (following) await api.unfollowStore(storeId);
      else await api.followStore(storeId);
      setFollowState(!following);
    } catch (err) {
      if (err instanceof ApiError) return;
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button variant={following ? "outline" : "primary"} onClick={toggle} disabled={busy}>
      {following ? "Following" : "Follow store"}
    </Button>
  );
}
