import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { getTutorPublicReviewProfile } from "@/actions/review";
import { TutorPublicProfileClient } from "@/components/pages/tutor/tutor-public-profile-client";
import { SITE_URL, absoluteUrl } from "@/lib/site";
import { JsonLd } from "@/components/seo/json-ld";
import { ORG_ID, breadcrumbJsonLd } from "@/lib/seo/structured-data";

interface TutorPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: TutorPageProps): Promise<Metadata> {
  const { id } = await params;
  const data = await getTutorPublicReviewProfile(id);

  if (!data?.tutor) {
    return {
      title: "Instructor Not Found",
      description: "The instructor profile you are looking for does not exist.",
    };
  }

  const tutor = data.tutor;
  const siteUrl = SITE_URL;
  const canonicalPath = `/tutors/${id}`;
  const fullUrl = `${siteUrl}${canonicalPath}`;

  const tutorPhoto = tutor.avatar;
  const shareImage = tutorPhoto
    ? encodeURI(tutorPhoto.trim())
    : `${siteUrl}/opengraph-image`;

  const tutorTitle = tutor.title ? `${tutor.name} (${tutor.title})` : tutor.name;
  const pageTitle = `${tutorTitle} | PalmTechnIQ Instructor`;

  const expertiseText =
    Array.isArray(tutor.expertise) && tutor.expertise.length > 0
      ? ` Expertise in ${tutor.expertise.slice(0, 4).join(", ")}.`
      : "";

  const cleanBio = tutor.bio ? tutor.bio.replace(/\s+/g, " ").trim() : "";
  const pageDescription = cleanBio
    ? cleanBio.length > 155
      ? `${cleanBio.slice(0, 152)}...`
      : cleanBio
    : `Explore practical tech courses, live cohorts, and 1-on-1 mentorship with ${tutor.name} on PalmTechnIQ.${expertiseText}`;

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

  const tutor = data.tutor;

  // A tutor page with no Person markup is just prose to a crawler. `worksFor`
  // ties the instructor to the organisation, which is what lets a search for
  // the tutor's name surface the platform alongside them.
  const personJsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: tutor.name,
    url: absoluteUrl(`/tutors/${id}`),
    ...(tutor.title && { jobTitle: tutor.title }),
    ...(tutor.bio && { description: tutor.bio.slice(0, 300) }),
    ...(tutor.avatar && { image: encodeURI(tutor.avatar.trim()) }),
    worksFor: { "@id": ORG_ID },
  };

  const structuredData = [
    personJsonLd,
    // No "/tutors" crumb: there is no instructor index page, and a breadcrumb
    // item pointing at a 404 devalues the whole trail.
    breadcrumbJsonLd([{ name: tutor.name, path: `/tutors/${id}` }]),
  ];

  return (
    <>
      <JsonLd data={structuredData} />
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
    </>
  );
}
