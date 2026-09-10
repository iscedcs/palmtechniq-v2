import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { getTutorPublicReviewProfile } from "@/actions/review";
import { TutorPublicProfileClient } from "@/components/pages/tutor/tutor-public-profile-client";

interface TutorPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: TutorPageProps): Promise<Metadata> {
  const { id } = await params;
  const data = await getTutorPublicReviewProfile(id);

  if (!data?.tutor) {
    return {
      title: "Instructor Not Found | PalmTechnIQ",
      description: "The instructor profile you are looking for does not exist.",
    };
  }

  const tutor = data.tutor;
  const siteUrl = "https://palmtechniq.com";
  const canonicalPath = `/tutors/${id}`;
  const fullUrl = `${siteUrl}${canonicalPath}`;
  const shareImage = `${fullUrl}/opengraph-image`;

  const tutorTitle = tutor.title ? `${tutor.name} (${tutor.title})` : tutor.name;
  const pageTitle = `${tutorTitle} | PalmTechnIQ Instructor`;

  const expertiseText =
    Array.isArray(tutor.expertise) && tutor.expertise.length > 0
      ? ` Expertise in ${tutor.expertise.slice(0, 4).join(", ")}.`
      : "";

  const pageDescription =
    tutor.bio?.trim()
      ? `${tutor.bio.slice(0, 140)}... Learn with ${tutor.name} on PalmTechnIQ.`
      : `Explore tech courses, live cohorts, and 1-on-1 mentorship with ${tutor.name} on PalmTechnIQ.${expertiseText}`;

  return {
    title: pageTitle,
    description: pageDescription,
    alternates: {
      canonical: canonicalPath,
    },
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
          alt: `${tutor.name} - PalmTechnIQ Instructor`,
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

export default async function TutorPage({ params }: TutorPageProps) {
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
      currentPath={`/tutors/${id}`}
      initialTab="courses"
    />
  );
}
