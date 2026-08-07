import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
  Tailwind,
} from "@react-email/components";

/**
 * One template for the three exam emails a student receives: scheduled,
 * reminder, and results. They share a structure — heading, a few facts, one
 * button — so a single component keeps the wording and the styling consistent
 * across all three rather than letting them drift apart.
 */

export type ExamEmailVariant = "SCHEDULED" | "REMINDER" | "RESULTS";

interface ExamNotificationProps {
  variant: ExamEmailVariant;
  studentName?: string;
  examTitle: string;
  courseTitle?: string | null;
  opensAt?: string | null;
  closesAt?: string | null;
  durationMinutes?: number | null;
  questionCount?: number | null;
  examUrl: string;
  /** RESULTS only */
  percentage?: number | null;
  passed?: boolean | null;
  /** REMINDER only — e.g. "in 24 hours" */
  startsIn?: string | null;
}

const COPY: Record<
  ExamEmailVariant,
  { preview: (t: string) => string; heading: string; cta: string }
> = {
  SCHEDULED: {
    preview: (t) => `You have an exam scheduled: ${t}`,
    heading: "You have an exam scheduled",
    cta: "View exam details",
  },
  REMINDER: {
    preview: (t) => `Reminder: ${t} is coming up`,
    heading: "Your exam is coming up",
    cta: "Get ready",
  },
  RESULTS: {
    preview: (t) => `Your result for ${t} is available`,
    heading: "Your result is available",
    cta: "View your result",
  },
};

const ExamNotification = ({
  variant,
  studentName = "there",
  examTitle,
  courseTitle,
  opensAt,
  closesAt,
  durationMinutes,
  questionCount,
  examUrl,
  percentage,
  passed,
  startsIn,
}: ExamNotificationProps) => {
  const copy = COPY[variant];
  const year = new Date().getFullYear();

  const facts: [string, string][] = [];
  if (courseTitle) facts.push(["Course", courseTitle]);
  if (opensAt) facts.push(["Opens", opensAt]);
  if (closesAt) facts.push(["Closes", closesAt]);
  if (durationMinutes) facts.push(["Duration", `${durationMinutes} minutes`]);
  if (questionCount) facts.push(["Questions", String(questionCount)]);

  return (
    <Tailwind>
      <Html>
        <Head>
          <Preview>{copy.preview(examTitle)}</Preview>
        </Head>
        <Body className="w-full">
          <Container className="w-full">
            <Section className="bg-[#021A1A]">
              <Img
                className="mx-auto h-full object-cover py-3"
                src="https://www.palmtechniq.com/assets/palmtechniqlogo.png"
                width="200"
                height="200"
              />
            </Section>

            <Section>
              <Text className="mt-[20px] text-center text-[20px] font-bold md:text-left">
                {copy.heading}
              </Text>
              <Text className="text-center md:text-left">Hi {studentName},</Text>

              {variant === "SCHEDULED" && (
                <Text className="text-center md:text-left">
                  Your tutor has scheduled <b>{examTitle}</b>. The details are below —
                  make a note of when it opens, because the window closes on time.
                </Text>
              )}

              {variant === "REMINDER" && (
                <Text className="text-center md:text-left">
                  This is a reminder that <b>{examTitle}</b> starts{" "}
                  {startsIn ?? "soon"}. Once you begin, the timer runs on our servers
                  and does not pause, so start when you are ready to sit it.
                </Text>
              )}

              {variant === "RESULTS" && (
                <Text className="text-center md:text-left">
                  Your result for <b>{examTitle}</b> has been released.
                  {typeof percentage === "number" && (
                    <>
                      {" "}
                      You scored <b>{percentage.toFixed(0)}%</b>
                      {typeof passed === "boolean" && (
                        <> — {passed ? "a pass" : "below the pass mark"}.</>
                      )}
                    </>
                  )}
                </Text>
              )}
            </Section>

            {facts.length > 0 && variant !== "RESULTS" && (
              <Section className="px-[20px]">
                {facts.map(([label, value]) => (
                  <Text key={label} className="my-[4px] text-[14px]">
                    <b>{label}:</b> {value}
                  </Text>
                ))}
              </Section>
            )}

            <Section className="text-center md:text-left">
              <Button
                href={examUrl}
                className="cursor-pointer rounded-full bg-green-600 text-[13px] text-white"
                style={{ padding: "10px 20px", margin: "0 auto" }}>
                {copy.cta}
              </Button>
            </Section>

            <Section className="text-center md:text-left">
              <Text>
                Good luck, <br />
                <b>PalmTechnIQ Team</b>
              </Text>
            </Section>

            <Hr className="mt-[30px]" />

            <Section className="text-center text-[#333333]">
              <Text>
                <p>Copyright © {year} PalmTechnIQ, All Rights Reserved.</p>
                <p>
                  You are receiving this because you are enrolled for an assessment on
                  PalmTechnIQ.
                </p>
                <p>
                  Mailing Address: 1st Floor, (Festac Tower) Chicken Republic Building,
                  22Rd, Festac Town, Lagos, Nigeria.
                </p>
              </Text>
            </Section>
          </Container>
        </Body>
      </Html>
    </Tailwind>
  );
};

export default ExamNotification;
