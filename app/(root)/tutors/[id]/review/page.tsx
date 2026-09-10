import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { getTutorPublicReviewProfile } from "@/actions/review";
import { TutorPublicProfileClient } from "@/components/pages/tutor/tutor-public-profile-client";

interface TutorReviewPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: TutorReviewPageProps): Promise<Metadata> {
  const { id } = await params;
  const data = await getTutorPublicReviewProfile(id);

  if (!data?.tutor) {
    return {
      title: "Tutor Reviews | PalmTechnIQ",
      description: "Read verified student reviews for PalmTechnIQ tutors and instructors.",
    };
  }

  const tutor = data.tutor;
  const siteUrl = "https://www.palmtechniq.com";
  const canonicalPath = `/tutors/${id}/review`;
  const fullUrl = `${siteUrl}${canonicalPath}`;

  const tutorPhoto = tutor.avatar;
  const shareImage = tutorPhoto
    ? encodeURI(tutorPhoto.trim())
    : `${siteUrl}/opengraph-image`;

  const pageTitle = `Reviews for ${tutor.name} | PalmTechnIQ Instructor`;
  const pageDescription = `Read verified student reviews and leave feedback for ${tutor.name} (${tutor.title || "Instructor"}) on PalmTechnIQ.`;

  return {
    title: pageTitle,
    description: pageDescription,
    alternates: { canonical: canonicalPath },
    openGraph: {
      title: pageTitle,
      description: pageDescription,
      url: fullUrl,
      type: "profile",
      siteName: "PalmTechnIQ",
      images: [
        {
          url: shareImage,
          width: 1200,
          height: 630,
          alt: `${tutor.name} Reviews - PalmTechnIQ`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description: pageDescription,
      images: [shareImage],
      creator: "@palmtechniq",
    },
  };
}

export default async function TutorReviewPage({ params }: TutorReviewPageProps) {
  const { id } = await params;
  const session = await auth();

  const data = await getTutorPublicReviewProfile(id);

  if (!data?.tutor) {
    notFound();
  }

  return (
    <TutorPublicProfileClient
      tutor={data.tutor}
      reviews={data.reviews as any}
      userReview={data.userReview as any}
      studentContexts={data.studentContexts || []}
      isOwnProfile={Boolean(data.isOwnProfile)}
      isLoggedIn={Boolean(session?.user?.id)}
      currentUserId={session?.user?.id}
      currentUserRole={session?.user?.role}
      currentPath={`/tutors/${id}/review`}
      initialTab="reviews"
    />
  );
}
