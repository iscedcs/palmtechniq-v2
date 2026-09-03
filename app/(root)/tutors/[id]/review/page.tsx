import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { getTutorPublicReviewProfile } from "@/actions/review";
import { TutorReviewClient } from "@/components/pages/tutor/tutor-review-client";

interface TutorReviewPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: TutorReviewPageProps) {
  const { id } = await params;
  const data = await getTutorPublicReviewProfile(id);

  if (!data?.tutor) {
    return {
      title: "Tutor Reviews | PalmTechnIQ",
      description: "Read verified student reviews for PalmTechnIQ tutors and instructors.",
    };
  }

  return {
    title: `Review ${data.tutor.name} | PalmTechnIQ Tutor Reviews`,
    description: `Leave a verified review for ${data.tutor.name} (${data.tutor.title}) on PalmTechnIQ.`,
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
    <TutorReviewClient
      tutor={data.tutor}
      reviews={data.reviews as any}
      userReview={data.userReview as any}
      studentContexts={data.studentContexts || []}
      isOwnProfile={Boolean(data.isOwnProfile)}
      isLoggedIn={Boolean(session?.user?.id)}
      currentUserId={session?.user?.id}
      currentUserRole={session?.user?.role}
      currentPath={`/tutors/${id}/review`}
    />
  );
}
