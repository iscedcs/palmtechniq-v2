import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import type { Metadata } from "next";

import { auth } from "@/auth";
import { getPublicBundle } from "@/actions/bundles";
import { ReferralTracker } from "@/components/shared/referral-tracker";
import { REFERRAL_COOKIE_NAME } from "@/lib/referral";
import BundleLanding from "./bundle-landing";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const bundle = await getPublicBundle(slug);
  if (!bundle) return { title: "Bundle not found" };
  return {
    title: `${bundle.title} — PalmTechnIQ`,
    description:
      bundle.description ??
      `${bundle.courses.length} courses for ₦${bundle.price.toLocaleString()}.`,
  };
}

export default async function BundlePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ ref?: string }>;
}) {
  const { slug } = await params;
  const { ref } = await searchParams;

  const [bundle, session] = await Promise.all([getPublicBundle(slug), auth()]);
  if (!bundle) notFound();

  // A bundle link is a shareable acquisition surface, so it has to carry
  // referral attribution exactly as a course page does — otherwise a tutor
  // sharing their own bundle would silently lose the 50/50 rate.
  const cookieStore = await cookies();
  const referralCode = ref ?? cookieStore.get(REFERRAL_COOKIE_NAME)?.value;

  // Bundle links get shared publicly, so most visitors arrive signed out.
  // Send them to sign in and straight back here — keeping ?ref= so the
  // referral survives the round trip.
  const returnTo = `/bundles/${slug}${ref ? `?ref=${encodeURIComponent(ref)}` : ""}`;
  const loginUrl = `/login?callbackUrl=${encodeURIComponent(returnTo)}`;

  return (
    <>
      {ref && <ReferralTracker refCode={ref} />}
      <BundleLanding
        bundle={bundle}
        referralCode={referralCode}
        isAuthenticated={!!session?.user?.id}
        loginUrl={loginUrl}
      />
    </>
  );
}
