"use client";

import { ORG_EMAIL } from "@/lib/seo/structured-data";

import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  Calendar,
  Clock,
  CreditCard,
  FileText,
  Gift,
  GraduationCap,
  Mail,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function RefundPolicy() {
  const sections = [
    { id: "guarantee", title: "The 30-Day Guarantee", icon: Clock },
    { id: "courses", title: "Self-Paced Courses", icon: BookOpen },
    { id: "programs", title: "Programs and Bootcamps", icon: GraduationCap },
    { id: "mentorship", title: "Mentorship Sessions", icon: Users },
    { id: "credit", title: "Group Buying and Course Credit", icon: Gift },
    { id: "exclusions", title: "What Is Not Refundable", icon: AlertTriangle },
    { id: "request", title: "How to Request a Refund", icon: Mail },
    { id: "payment", title: "How Your Money Comes Back", icon: CreditCard },
    { id: "changes", title: "Changes to This Policy", icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 pt-24">
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}>
            <Button
              variant="ghost"
              className="mb-6 hover:bg-white/10"
              onClick={() => window.history.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="text-4xl md:text-5xl font-bold text-gradient mb-4">
              Refund Policy
            </h1>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Learn with confidence. If a purchase is not right for you, you
              have 30 days to ask for your money back.
            </p>
            <div className="flex items-center justify-center gap-4 mt-6">
              <Badge
                variant="outline"
                className="border-neon-blue text-neon-blue">
                <Calendar className="w-3 h-3 mr-1" />
                Last Updated: November 23, 2026
              </Badge>
              <Badge
                variant="outline"
                className="border-green-400 text-green-400">
                <FileText className="w-3 h-3 mr-1" />
                Version 1.0
              </Badge>
            </div>
          </motion.div>

          <div className="grid lg:grid-cols-4 gap-8">
            {/* Sidebar Navigation */}
            <motion.div
              className="lg:col-span-1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}>
              <Card className="glass-card border-white/10 sticky top-24">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-white mb-4">
                    Quick Navigation
                  </h3>
                  <nav className="space-y-2">
                    {sections.map((section) => (
                      <a
                        key={section.id}
                        href={`#${section.id}`}
                        className="flex items-center gap-2 text-sm text-gray-400 hover:text-neon-blue transition-colors duration-200 py-1">
                        <section.icon className="w-3 h-3 shrink-0" />
                        {section.title}
                      </a>
                    ))}
                  </nav>
                </CardContent>
              </Card>
            </motion.div>

            {/* Main Content */}
            <motion.div
              className="lg:col-span-3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}>
              <Card className="glass-card border-white/10">
                <CardContent className="p-8 space-y-8">
                  {/* Introduction */}
                  <div className="prose prose-invert max-w-none">
                    <p className="text-gray-300 text-lg leading-relaxed">
                      We want you to start learning without worrying about
                      whether you have made the right choice. This policy
                      explains when you can get your money back, when you
                      cannot, and exactly how to ask. It applies alongside our{" "}
                      <a
                        href="/terms"
                        className="text-neon-blue hover:underline">
                        Terms of Service
                      </a>
                      .
                    </p>
                  </div>

                  {/* 1. The guarantee */}
                  <section id="guarantee" className="space-y-4">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                      <Clock className="w-6 h-6 text-neon-blue" />
                      1. The 30-Day Guarantee
                    </h2>
                    <div className="prose prose-invert max-w-none">
                      <p className="text-gray-300">
                        You may request a refund within{" "}
                        <strong className="text-white">
                          30 days of your payment
                        </strong>
                        , subject to the conditions set out below for each type
                        of purchase. Where a refund is approved, you are
                        refunded in full, including the 7.5% VAT charged on the
                        purchase.
                      </p>
                      <p className="text-gray-300">
                        The 30 days run from the date of payment, not from the
                        date you first opened the course.
                      </p>
                      <div className="rounded-lg border border-neon-blue/30 bg-neon-blue/5 p-4 not-prose">
                        <p className="text-sm text-gray-300">
                          <strong className="text-white">
                            Why the window closes at 30 days.
                          </strong>{" "}
                          We hold every instructor&apos;s earnings for the first
                          30 days of a sale and pay them only once that window
                          has passed. That is what lets us refund you in full
                          with no argument during the window, and it is also why
                          we cannot process requests made after it: by then the
                          money has been paid to the instructor who taught you.
                          The guarantee protects you, and the deadline protects
                          them.
                        </p>
                      </div>
                    </div>
                  </section>

                  <Separator className="bg-white/10" />

                  {/* 2. Courses */}
                  <section id="courses" className="space-y-4">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                      <BookOpen className="w-6 h-6 text-neon-blue" />
                      2. Self-Paced Courses
                    </h2>
                    <div className="prose prose-invert max-w-none">
                      <p className="text-gray-300">
                        Individual courses and course bundles are refundable
                        within 30 days of payment. You do not need to give a
                        reason.
                      </p>
                      <ul className="text-gray-300 space-y-2 ml-6">
                        <li>
                          • A bundle is refunded as a whole. Individual courses
                          within a bundle cannot be refunded separately,
                          because the bundle price is a discount on buying them
                          together.
                        </li>
                        <li>
                          • Your access to the course is removed once the refund
                          is processed.
                        </li>
                        <li>
                          • If a certificate was issued to you for the course,
                          it may be revoked and will no longer verify.
                        </li>
                      </ul>
                    </div>
                  </section>

                  <Separator className="bg-white/10" />

                  {/* 3. Programs and bootcamps */}
                  <section id="programs" className="space-y-4">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                      <GraduationCap className="w-6 h-6 text-neon-blue" />
                      3. Professional Programs and Bootcamps
                    </h2>
                    <div className="prose prose-invert max-w-none">
                      <p className="text-gray-300">
                        Programs and bootcamps run as cohorts, with a fixed
                        start date, a limited number of seats and an instructor
                        engaged for the full duration. They are refundable
                        within 30 days of payment, but only{" "}
                        <strong className="text-white">
                          before your cohort has started
                        </strong>
                        .
                      </p>
                      <ul className="text-gray-300 space-y-2 ml-6">
                        <li>
                          • Before the cohort start date, and within 30 days of
                          payment, you receive a full refund.
                        </li>
                        <li>
                          • Once the cohort has started, the enrollment is not
                          refundable. Your seat has been held, the cohort has
                          been sized around it and teaching has begun.
                        </li>
                        <li>
                          • If we cancel or postpone a cohort, you are refunded
                          in full regardless of the 30 days, or you may move to
                          the next cohort.
                        </li>
                        <li>
                          • If you are paying in installments, a refund covers
                          what you have actually paid so far. Your remaining
                          installments are cancelled.
                        </li>
                      </ul>
                      <p className="text-gray-300">
                        If you are not sure your cohort suits you, tell us
                        before it begins rather than after.
                      </p>
                    </div>
                  </section>

                  <Separator className="bg-white/10" />

                  {/* 4. Mentorship */}
                  <section id="mentorship" className="space-y-4">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                      <Users className="w-6 h-6 text-neon-blue" />
                      4. Mentorship Sessions
                    </h2>
                    <div className="prose prose-invert max-w-none">
                      <p className="text-gray-300">
                        Mentorship is a mentor&apos;s time, booked for you
                        alone. A session that has been delivered is{" "}
                        <strong className="text-white">not refundable</strong>,
                        because the mentor has already given that hour.
                      </p>
                      <p className="text-gray-300">
                        You are still covered in every case where the session
                        did not happen:
                      </p>
                      <ul className="text-gray-300 space-y-2 ml-6">
                        <li>
                          • A session you cancel before it takes place is
                          refundable within 30 days of payment.
                        </li>
                        <li>
                          • If your mentor does not attend, or the session
                          cannot go ahead for a reason on our side, you are
                          refunded in full.
                        </li>
                        <li>
                          • For a multi-session package, sessions you have not
                          yet used are refundable. Sessions already delivered
                          are not, and are deducted at the package rate you
                          paid.
                        </li>
                      </ul>
                    </div>
                  </section>

                  <Separator className="bg-white/10" />

                  {/* 5. Group buying and credit */}
                  <section id="credit" className="space-y-4">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                      <Gift className="w-6 h-6 text-neon-blue" />
                      5. Group Buying and Course Credit
                    </h2>
                    <div className="prose prose-invert max-w-none">
                      <p className="text-gray-300">
                        A place bought through a group purchase is refundable on
                        the same terms as the course itself. Two things are
                        specific to groups:
                      </p>
                      <ul className="text-gray-300 space-y-2 ml-6">
                        <li>
                          • Leaving a group before it fills may stop the group
                          reaching its size, in which case the group discount
                          does not apply to the remaining members.
                        </li>
                        <li>
                          • Group cashback is{" "}
                          <strong className="text-white">course credit</strong>,
                          not cash. It is applied automatically to a future
                          purchase, cannot be withdrawn to a bank account, and
                          is not refundable as money.
                        </li>
                      </ul>
                      <p className="text-gray-300">
                        Where you paid partly with course credit, the credit
                        portion is returned to your credit balance and the rest
                        to your original payment method.
                      </p>
                    </div>
                  </section>

                  <Separator className="bg-white/10" />

                  {/* 6. Exclusions */}
                  <section id="exclusions" className="space-y-4">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                      <AlertTriangle className="w-6 h-6 text-neon-blue" />
                      6. What Is Not Refundable
                    </h2>
                    <div className="prose prose-invert max-w-none">
                      <ul className="text-gray-300 space-y-2 ml-6">
                        <li>
                          • Requests made more than 30 days after payment.
                        </li>
                        <li>
                          • Programs and bootcamps where the cohort has already
                          started.
                        </li>
                        <li>• Mentorship sessions already delivered.</li>
                        <li>
                          • Group cashback and any other course credit, which is
                          never paid out as cash.
                        </li>
                        <li>
                          • Purchases where we find evidence of abuse, such as
                          downloading or redistributing course material,
                          sharing account access, or a repeated pattern of
                          buying and refunding.
                        </li>
                      </ul>
                      <p className="text-gray-300">
                        We may decline a request that falls into the last
                        category even if it is made inside the 30 days. We will
                        tell you why.
                      </p>
                    </div>
                  </section>

                  <Separator className="bg-white/10" />

                  {/* 7. How to request */}
                  <section id="request" className="space-y-4">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                      <Mail className="w-6 h-6 text-neon-blue" />
                      7. How to Request a Refund
                    </h2>
                    <div className="prose prose-invert max-w-none">
                      <p className="text-gray-300">
                        Email{" "}
                        <a
                          href={`mailto:${ORG_EMAIL}`}
                          className="text-neon-blue hover:underline">
                          {ORG_EMAIL}
                        </a>{" "}
                        from the address on your account, and include:
                      </p>
                      <ul className="text-gray-300 space-y-2 ml-6">
                        <li>
                          • What you bought, and roughly when you bought it
                        </li>
                        <li>
                          • The payment reference from your receipt email, if
                          you still have it
                        </li>
                        <li>
                          • Anything you want us to know about why it was not
                          right for you
                        </li>
                      </ul>
                      <p className="text-gray-300">
                        The last point is genuinely optional inside the 30 days.
                        We ask because it tells us what to fix, not because your
                        refund depends on the answer.
                      </p>
                      <p className="text-gray-300">
                        A request counts as made on the day your email reaches
                        us, so if you are close to the deadline, send it and
                        follow up afterwards.
                      </p>
                    </div>
                  </section>

                  <Separator className="bg-white/10" />

                  {/* 8. How money comes back */}
                  <section id="payment" className="space-y-4">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                      <CreditCard className="w-6 h-6 text-neon-blue" />
                      8. How Your Money Comes Back
                    </h2>
                    <div className="prose prose-invert max-w-none">
                      <p className="text-gray-300">
                        Approved refunds are returned through Paystack to the
                        card or account you paid with. We cannot send a refund
                        to a different account from the one that made the
                        payment.
                      </p>
                      <p className="text-gray-300">
                        Once we have processed it on our side, how quickly the
                        money appears depends on your bank or card issuer rather
                        than on us. If it has not arrived and you think it is
                        taking too long, contact us and we will send you the
                        refund reference so you can raise it with your bank.
                      </p>
                    </div>
                  </section>

                  <Separator className="bg-white/10" />

                  {/* 9. Changes */}
                  <section id="changes" className="space-y-4">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                      <FileText className="w-6 h-6 text-neon-blue" />
                      9. Changes to This Policy
                    </h2>
                    <div className="prose prose-invert max-w-none">
                      <p className="text-gray-300">
                        We may update this policy. The version that applies to
                        your purchase is the one published on the day you paid,
                        so a change is never applied backwards to something you
                        have already bought.
                      </p>
                      <p className="text-gray-300">
                        Questions about a specific purchase are best sent to{" "}
                        <a
                          href={`mailto:${ORG_EMAIL}`}
                          className="text-neon-blue hover:underline">
                          {ORG_EMAIL}
                        </a>
                        , or through our{" "}
                        <a
                          href="/contact"
                          className="text-neon-blue hover:underline">
                          contact page
                        </a>
                        .
                      </p>
                    </div>
                  </section>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
