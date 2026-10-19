import type { Metadata } from "next";
import { getPublicPaymentLink } from "@/actions/program-payment-links";
import { PaymentLinkCheckout } from "@/components/payment-link/payment-link-checkout";

export const metadata: Metadata = {
  title: "Program Payment — PalmTechnIQ",
  robots: {
    index: false,
    follow: false,
  },
};

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ token: string }>;
};

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-gradient-to-b from-black via-gray-950 to-black pt-24 pb-16">
      <div className="container mx-auto px-6 max-w-2xl">{children}</div>
    </main>
  );
}

function Message(props: { title: string; body: string }) {
  return (
    <Shell>
      <div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center">
        <h1 className="text-2xl font-semibold text-white mb-3">{props.title}</h1>
        <p className="text-gray-400">{props.body}</p>
      </div>
    </Shell>
  );
}

export default async function PaymentLinkPage({ params }: Props) {
  const { token } = await params;
  const result = await getPublicPaymentLink(token);

  if (!result.ok) {
    return (
      <Message
        title="Link not found"
        body="This payment link does not exist or has been removed. Please contact us for help."
      />
    );
  }

  const link = result.link;

  if (link.status === "PAID") {
    return (
      <Message
        title="Payment received"
        body={`Thank you — the payment for ${link.studentName} has been received. Enrollment confirmation has been sent to ${link.email}.`}
      />
    );
  }

  if (link.status === "CANCELLED") {
    return (
      <Message
        title="This link is no longer available"
        body="This payment link has been cancelled. Please contact us and we will issue a new one."
      />
    );
  }

  if (link.status === "EXPIRED") {
    return (
      <Message
        title="This link has expired"
        body="This payment link has expired. Please contact us and we will issue a fresh one."
      />
    );
  }

  return (
    <Shell>
      <PaymentLinkCheckout
        token={token}
        studentName={link.studentName}
        email={link.email}
        amount={link.amount}
        currency={link.currency}
        expiresAt={link.expiresAt ? link.expiresAt.toISOString() : null}
        items={link.items.map((item: any) => ({
          programName: item.programName,
          cohortName: item.cohortName,
          listPrice: item.listPrice,
          amount: item.amount,
        }))}
      />
    </Shell>
  );
}
