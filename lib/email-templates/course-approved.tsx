import { Text } from "@react-email/components";
import React from "react";

import { EmailButton, EmailLayout, EmailSignOff } from "./email-layout";

/**
 * Which approval this is.
 *
 *   first   — the tutor's first approved course: the celebration, plus the
 *             getting-started steps.
 *   later   — a further new course: short, because the fifth "congratulations
 *             on your first course" would be absurd.
 *   updated — an edit to a course that was already live, now re-approved.
 *             Every edit is reviewed before it goes back live, so this is the
 *             tutor's confirmation that the review is done.
 */
export type CourseApprovalKind = "first" | "later" | "updated";

interface CourseApprovedEmailProps {
  name?: string;
  courseTitle: string;
  /** Public page for the course. */
  courseUrl: string;
  /** Where the tutor manages things. */
  dashboardUrl: string;
  kind: CourseApprovalKind;
}

export const CourseApprovedEmail = ({
  name,
  courseTitle,
  courseUrl,
  dashboardUrl,
  kind,
}: CourseApprovedEmailProps) => {
  const displayName = name?.trim() || "there";

  const preview =
    kind === "first"
      ? "Congratulations — your first course is live on PalmTechnIQ"
      : kind === "updated"
        ? `Your changes to "${courseTitle}" are now live`
        : `Your course "${courseTitle}" is now live on PalmTechnIQ`;

  const heading =
    kind === "first"
      ? "🎉 Congratulations — your first course is live!"
      : kind === "updated"
        ? "✅ Your changes are now live"
        : "✅ Your course has been approved";

  return (
    <EmailLayout
      preview={preview}
      footerReason={
        kind === "updated"
          ? "You are receiving this email because changes you made to a course on PalmTechnIQ were approved."
          : "You are receiving this email because a course you created on PalmTechnIQ was approved."
      }>
      <Text className="mt-[20px] text-[20px] font-bold mb-3">{heading}</Text>

      <Text className="text-gray-800 text-base leading-relaxed">
        Hi, <strong>{displayName}</strong>
      </Text>

      {kind === "updated" ? (
        <>
          <Text className="text-base leading-relaxed">
            Good news — our team has reviewed the changes you made to{" "}
            <strong>&ldquo;{courseTitle}&rdquo;</strong> and approved them. The
            updated course is live on PalmTechnIQ again.
          </Text>

          <div
            style={{
              backgroundColor: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              padding: "14px 18px",
              margin: "18px 0",
              fontSize: "14px",
              color: "#475569",
              lineHeight: "1.6",
            }}>
            Changes to a published course are reviewed by our team before they
            go live. That&apos;s what keeps every course on PalmTechnIQ up to
            standard for the students who buy it — thank you for your patience
            while we checked yours.
          </div>
        </>
      ) : (
        <Text className="text-base leading-relaxed">
          Great news — our team has reviewed{" "}
          <strong>&ldquo;{courseTitle}&rdquo;</strong> and approved it. It is
          now live on PalmTechnIQ, and students can find it, enrol and start
          learning from you today.
        </Text>
      )}

      {kind === "first" ? (
        <>
          {/* Milestone callout */}
          <div
            style={{
              backgroundColor: "#f0fdf4",
              borderLeft: "4px solid #16a34a",
              padding: "12px 16px",
              borderRadius: "4px",
              margin: "18px 0",
              fontSize: "14px",
              color: "#166534",
              lineHeight: "1.6",
            }}>
            <strong>This is a real milestone.</strong>
            <p style={{ margin: "4px 0 0 0" }}>
              Plenty of people have knowledge worth sharing and never get
              around to putting it into a course. You did. Publishing your first
              one is the hardest step — everything after it builds on this.
            </p>
          </div>

          {/* Next steps */}
          <div
            style={{
              backgroundColor: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              padding: "14px 18px",
              margin: "18px 0",
              fontSize: "14px",
              color: "#475569",
              lineHeight: "1.6",
            }}>
            <p
              style={{
                margin: "0 0 6px 0",
                fontWeight: "bold",
                color: "#0f172a",
              }}>
              Three things that help a new course get going:
            </p>
            <p style={{ margin: "6px 0" }}>
              <strong>1. Tell people about it.</strong> Share your course link
              with your network — WhatsApp, LinkedIn, Instagram, anyone who
              already knows and trusts you. First enrolments very often come
              from people who know the tutor.
            </p>
            <p style={{ margin: "6px 0" }}>
              <strong>2. Keep your profile sharp.</strong> A clear photo and a
              short, honest bio help a stranger decide to learn from you.
            </p>
            <p style={{ margin: "6px 0" }}>
              <strong>3. Watch your dashboard.</strong> We&apos;ll email you as
              soon as someone enrols, and your earnings appear in your wallet.
            </p>
          </div>
        </>
      ) : null}

      {kind === "later" ? (
        <Text className="text-base leading-relaxed">
          Share the link with your network to start bringing students in, and
          we&apos;ll email you as soon as someone enrols.
        </Text>
      ) : null}

      <EmailButton href={courseUrl}>View your live course</EmailButton>

      <Text className="text-sm text-gray-600 text-center leading-relaxed">
        Or head to your{" "}
        <a
          href={dashboardUrl}
          style={{ color: "#16a34a", textDecoration: "underline" }}>
          tutor dashboard
        </a>
        .
      </Text>

      <Text className="text-base leading-relaxed">
        {kind === "first"
          ? "We're really glad to have you teaching on PalmTechnIQ."
          : "Thank you for continuing to teach on PalmTechnIQ."}
      </Text>

      <EmailSignOff />
    </EmailLayout>
  );
};

export default CourseApprovedEmail;
