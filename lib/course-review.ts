import type { CourseStatus } from "@prisma/client";

/**
 * How saving a course affects its review state.
 *
 * THE RULE, AND WHY IT IS DELIBERATE
 *
 * When a tutor saves changes to a course that is live, it goes back to DRAFT
 * and stays there until an admin approves it again. That looks like a bug — a
 * routine edit takes a course offline — and it is not. It is the review gate:
 * an edit must not reach students until someone has checked it against
 * platform policy, because a course that breaks the rules and is already
 * being sold damages the platform's reputation and the students who bought it.
 * Do not "fix" this by keeping the course published.
 *
 * WHAT THIS RETURNS
 *
 *   - status. PUBLISHED only when an admin is doing the saving; DRAFT
 *     otherwise.
 *   - reapprovalPendingSince. Set when a NON-ADMIN save takes a LIVE course to
 *     DRAFT. It records "this course was live and is waiting for review of an
 *     edit", which is what separates a re-approval (tell the tutor their
 *     changes are live) from a first approval (congratulate them). It is not
 *     set when an admin chooses to unpublish, and not when a course that was
 *     never live is saved as a draft.
 *   - publishedAt. The FIRST time the course went live, and never cleared.
 *     Both save actions used to write `null` here whenever the course was not
 *     being published, so every tutor edit erased the publish date — which is
 *     why datePublished in the structured data was missing on edited courses.
 */
export function reviewFieldsForSave(input: {
  currentStatus: CourseStatus;
  currentPublishedAt: Date | null;
  /** Is this save publishing the course? Only ever true for an admin. */
  publish: boolean;
  actorIsAdmin: boolean;
  now?: Date;
}): {
  status: CourseStatus;
  publishedAt?: Date;
  reapprovalPendingSince?: Date;
} {
  const now = input.now ?? new Date();

  if (input.publish) {
    return {
      status: "PUBLISHED",
      publishedAt: input.currentPublishedAt ?? now,
    };
  }

  return {
    status: "DRAFT",
    ...(!input.actorIsAdmin && input.currentStatus === "PUBLISHED"
      ? { reapprovalPendingSince: now }
      : {}),
  };
}
