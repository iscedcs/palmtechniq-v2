import { redirect } from "next/navigation";

interface TutorRedirectProps {
  params: Promise<{ id: string }>;
}

export default async function TutorPage({ params }: TutorRedirectProps) {
  const { id } = await params;
  redirect(`/tutors/${encodeURIComponent(id)}/review`);
}
