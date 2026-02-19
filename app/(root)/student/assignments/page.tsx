import { Suspense } from "react";
import StudentAssignmentsClient from "./student-assignments-client";
import AssignmentsLoading from "./loading";

export const dynamic = "force-dynamic";

export default function StudentAssignmentsPage() {
  return (
    <Suspense fallback={<AssignmentsLoading />}>
      <StudentAssignmentsClient />
    </Suspense>
  );
}
