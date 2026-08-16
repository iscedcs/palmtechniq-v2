import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import type { Metadata } from "next";

import { auth } from "@/auth";
import { getPublicBundle } from "@/actions/bundles";
import { ReferralTracker } from "@/components/shared/referral-tracker";
import { REFERRAL_COOKIE_NAME, getTutorReferralCode } from "@/lib/referral";
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

  // The saving is the reason anyone opens a shared bundle link, so it leads
  // the description rather than sitting behind the tutor's own blurb.
  const pitch = [
    `${bundle.courses.length} ${bundle.courses.length === 1 ? "course" : "courses"} for ₦${bundle.price.toLocaleString()}`,
    bundle.savingsPercent > 0 ? `save ${bundle.savingsPercent}%` : null,
    bundle.description,
  ]
    .filter(Boolean)
    .join(" · ");

  const title = `${bundle.title} — Course Bundle | PalmTechnIQ`;
  const url = `/bundles/${slug}`;

  return {
    title,
    description: pitch,
    alternates: { canonical: url },
    // `images` is deliberately absent: the opengraph-image.tsx in this folder
    // is picked up by convention, and naming an image here would override it.
    openGraph: {
      type: "website",
      title,
      description: pitch,
      url,
      siteName: "PalmTechnIQ",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: pitch,
    },
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

  // A tutor viewing any bundle shares it with their own code attached, so
  // promoting someone else's bundle earns them the referral rate instead of
  // quietly handing the sale to the platform. Returns null for everyone else,
  // who then share a plain link.
  const viewerReferralCode = session?.user?.id
    ? await getTutorReferralCode(session.user.id)
    : null;

  const shareUrl = viewerReferralCode
    ? `/bundles/${slug}?ref=${encodeURIComponent(viewerReferralCode)}`
    : `/bundles/${slug}`;

  return (
    <>
      {ref && <ReferralTracker refCode={ref} />}
      <BundleLanding
        bundle={bundle}
        referralCode={referralCode}
        isAuthenticated={!!session?.user?.id}
        loginUrl={loginUrl}
        shareUrl={shareUrl}
        shareIsAttributed={!!viewerReferralCode}
      />
    </>
  );
}
