"use client";

import { useEffect } from "react";

/**
 * Client component that tracks a tutor referral by calling the API
 * to set the referral cookie when a user visits via ?ref=CODE.
 */
export function ReferralTracker({ refCode }: { refCode: string }) {
  useEffect(() => {
    if (!refCode) return;
    fetch(`/api/referral/track?ref=${encodeURIComponent(refCode)}`).catch(
      () => {},
    );
  }, [refCode]);

  return null;
}
