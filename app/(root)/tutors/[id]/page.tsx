import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { getTutorPublicReviewProfile } from "@/actions/review";
import { TutorPublicProfileClient } from "@/components/pages/tutor/tutor-public-profile-client";

interface TutorPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: TutorPageProps) {
  const { id } = await params;
  const data = await getTutorPublicReviewProfile(id);

  if (!data?.tutor) {
    return {
      title: "Instructor Not Found | PalmTechnIQ",
      description: "The instructor profile you are looking for does not exist.",
    };
  }

  return {
    title: `${data.tutor.name} (${data.tutor.title}) | PalmTechnIQ Instructor`,
    description: `Explore tech courses, live cohorts, and 1-on-1 mentorship with ${data.tutor.name} on PalmTechnIQ.`,
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
