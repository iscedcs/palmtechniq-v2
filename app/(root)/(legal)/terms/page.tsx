"use client";

import { motion } from "framer-motion";
import {
  ArrowLeft,
  FileText,
  Calendar,
  Globe,
  Shield,
  Users,
  CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function TermsOfService() {
  const sections = [
    { id: "acceptance", title: "Acceptance of Terms", icon: FileText },
    { id: "services", title: "Description of Services", icon: Globe },
    { id: "accounts", title: "User Accounts", icon: Users },
    { id: "payments", title: "Payment Terms", icon: CreditCard },
    { id: "content", title: "Content and Conduct", icon: Shield },
    { id: "privacy", title: "Privacy Policy", icon: Shield },
    { id: "termination", title: "Termination", icon: FileText },
    { id: "disclaimers", title: "Disclaimers", icon: Shield },
    { id: "limitation", title: "Limitation of Liability", icon: Shield },
    { id: "governing", title: "Governing Law", icon: Globe },
    { id: "contact", title: "Contact Information", icon: Users },
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
              Terms of Service
            </h1>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Please read these terms carefully before using PalmTechnIQ
              platform
            </p>
            <div className="flex items-center justify-center gap-4 mt-6">
              <Badge
                variant="outline"
                className="border-neon-blue text-neon-blue">
                <Calendar className="w-3 h-3 mr-1" />
                Last Updated: January 15, 2024
              </Badge>
              <Badge
                variant="outline"
                className="border-green-400 text-green-400">
                <FileText className="w-3 h-3 mr-1" />
                Version 2.1
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
                        <section.icon className="w-3 h-3" />
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
                      Welcome to PalmTechnIQ! These Terms of Service ("Terms")
                      govern your use of our online learning platform and
                      services. By accessing or using PalmTechnIQ, you agree to
                      be bound by these Terms.
                    </p>
                  </div>

                  {/* Section 1: Acceptance of Terms */}
                  <section id="acceptance" className="space-y-4">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                      <FileText className="w-6 h-6 text-neon-blue" />
                      1. Acceptance of Terms
                    </h2>
                    <div className="prose prose-invert max-w-none">
                      <p className="text-gray-300">
                        By creating an account, accessing, or using any part of
                        PalmTechnIQ, you acknowledge that you have read,
                        understood, and agree to be bound by these Terms. If you
                        do not agree to these Terms, you may not use our
                        services.
                      </p>
                      <p className="text-gray-300">
                        These Terms apply to all users of the platform,
                        including students, instructors, and administrators. We
                        reserve the right to modify these Terms at any time, and
                        such modifications will be effective immediately upon
                        posting.
                      </p>
                    </div>
                  </section>

                  <Separator className="bg-white/10" />

                  {/* Section 2: Description of Services */}
                  <section id="services" className="space-y-4">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                      <Globe className="w-6 h-6 text-neon-blue" />
                      2. Description of Services
                    </h2>
                    <div className="prose prose-invert max-w-none">
                      <p className="text-gray-300">
                        PalmTechnIQ is an online learning platform that
                        provides:
                      </p>
                      <ul className="text-gray-300 space-y-2 ml-6">
                        <li>
                          • Access to online courses and educational content
                        </li>
                        <li>• Interactive learning tools and assessments</li>
                        <li>• Mentorship and tutoring services</li>
                        <li>• AI-powered interview preparation</li>
                        <li>• Project-based learning opportunities</li>
                        <li>• Certification and progress tracking</li>
                      </ul>
                      <p className="text-gray-300">
                        Our services are provided "as is" and we reserve the
                        right to modify, suspend, or discontinue any aspect of
                        our services at any time.
                      </p>
                    </div>
                  </section>

                  <Separator className="bg-white/10" />

                  {/* Section 3: User Accounts */}
                  <section id="accounts" className="space-y-4">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                      <Users className="w-6 h-6 text-neon-blue" />
                      3. User Accounts
                    </h2>
                    <div className="prose prose-invert max-w-none">
                      <p className="text-gray-300">
                        To access certain features of PalmTechnIQ, you must
                        create an account. You agree to:
                      </p>
                      <ul className="text-gray-300 space-y-2 ml-6">
                        <li>• Provide accurate and complete information</li>
                        <li>
                          • Maintain the security of your account credentials
                        </li>
                        <li>• Notify us immediately of any unauthorized use</li>
                        <li>
                          • Be responsible for all activities under your account
                        </li>
                        <li>• Not share your account with others</li>
                      </ul>
                      <p className="text-gray-300">
                        You must be at least 13 years old to create an account.
                        Users under 18 must have parental consent.
                      </p>
                    </div>
                  </section>

                  <Separator className="bg-white/10" />

                  {/* Section 4: Payment Terms */}
                  <section id="payments" className="space-y-4">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                      <CreditCard className="w-6 h-6 text-neon-blue" />
                      4. Payment Terms
                    </h2>
                    <div className="prose prose-invert max-w-none">
                      <p className="text-gray-300">
                        Payment terms for PalmTechnIQ services:
                      </p>
                      <ul className="text-gray-300 space-y-2 ml-6">
                        <li>
                          • All payments are processed securely through Paystack
                        </li>
                        <li>• Course fees are due at the time of enrollment</li>
                        <li>
                          • Subscription fees are billed monthly or annually
                        </li>
                        <li>
                          • All prices are in USD unless otherwise specified
                        </li>
                        <li>
                          • Refunds are subject to our 30-day money-back
                          guarantee
                        </li>
                      </ul>
                      <p className="text-gray-300">
                        We reserve the right to change our pricing at any time.
                        Price changes will not affect existing enrollments.
                      </p>
                    </div>
                  </section>

                  <Separator className="bg-white/10" />

                  {/* Section 5: Content and Conduct */}
                  <section id="content" className="space-y-4">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                      <Shield className="w-6 h-6 text-neon-blue" />
                      5. Content and Conduct
                    </h2>
                    <div className="prose prose-invert max-w-none">
                      <p className="text-gray-300">
                        Users are prohibited from:
                      </p>
                      <ul className="text-gray-300 space-y-2 ml-6">
                        <li>
                          • Sharing copyrighted content without permission
                        </li>
                        <li>
                          • Engaging in harassment or discriminatory behavior
                        </li>
                        <li>• Attempting to hack or disrupt our services</li>
                        <li>
                          • Creating multiple accounts to circumvent
                          restrictions
                        </li>
                        <li>• Sharing course content outside the platform</li>
                      </ul>
                      <p className="text-gray-300">
                        We reserve the right to remove content and suspend
                        accounts that violate these guidelines.
                      </p>
                    </div>
                  </section>

                  <Separator className="bg-white/10" />

                  {/* Section 6: Privacy Policy */}
                  <section id="privacy" className="space-y-4">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                      <Shield className="w-6 h-6 text-neon-blue" />
                      6. Privacy Policy
                    </h2>
                    <div className="prose prose-invert max-w-none">
                      <p className="text-gray-300">
                        Your privacy is important to us. Our Privacy Policy
                        explains how we collect, use, and protect your
                        information. By using PalmTechnIQ, you consent to our
                        data practices as described in our Privacy Policy.
                      </p>
                      <p className="text-gray-300">
                        We implement industry-standard security measures to
                        protect your personal information and course progress
                        data.
                      </p>
                    </div>
                  </section>

                  <Separator className="bg-white/10" />

                  {/* Section 7: Termination */}
                  <section id="termination" className="space-y-4">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                      <FileText className="w-6 h-6 text-neon-blue" />
                      7. Termination
                    </h2>
                    <div className="prose prose-invert max-w-none">
                      <p className="text-gray-300">
                        Either party may terminate this agreement at any time.
                        Upon termination:
                      </p>
                      <ul className="text-gray-300 space-y-2 ml-6">
                        <li>• Your access to paid content will be revoked</li>
                        <li>
                          • Your account data may be deleted after 30 days
                        </li>
                        <li>• Outstanding payments remain due</li>
                        <li>
                          • Certain provisions of these Terms will survive
                          termination
                        </li>
                      </ul>
                    </div>
                  </section>

                  <Separator className="bg-white/10" />

                  {/* Section 8: Disclaimers */}
                  <section id="disclaimers" className="space-y-4">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                      <Shield className="w-6 h-6 text-neon-blue" />
                      8. Disclaimers
                    </h2>
                    <div className="prose prose-invert max-w-none">
                      <p className="text-gray-300">
                        PalmTechnIQ is provided "as is" without warranties of
                        any kind. We do not guarantee:
                      </p>
                      <ul className="text-gray-300 space-y-2 ml-6">
                        <li>• Uninterrupted or error-free service</li>
                        <li>• Specific learning outcomes or job placement</li>
                        <li>• Compatibility with all devices or browsers</li>
                        <li>• Accuracy of all course content</li>
                      </ul>
                    </div>
                  </section>

                  <Separator className="bg-white/10" />

                  {/* Section 9: Limitation of Liability */}
                  <section id="limitation" className="space-y-4">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                      <Shield className="w-6 h-6 text-neon-blue" />
                      9. Limitation of Liability
                    </h2>
                    <div className="prose prose-invert max-w-none">
                      <p className="text-gray-300">
                        To the maximum extent permitted by law, PalmTechnIQ
                        shall not be liable for any indirect, incidental,
                        special, or consequential damages arising from your use
                        of our services.
                      </p>
                      <p className="text-gray-300">
                        Our total liability shall not exceed the amount you paid
                        for the specific service that gave rise to the claim.
                      </p>
                    </div>
                  </section>

                  <Separator className="bg-white/10" />

                  {/* Section 10: Governing Law */}
                  <section id="governing" className="space-y-4">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                      <Globe className="w-6 h-6 text-neon-blue" />
                      10. Governing Law
                    </h2>
                    <div className="prose prose-invert max-w-none">
                      <p className="text-gray-300">
                        These Terms are governed by and construed in accordance
                        with the laws of [Your Jurisdiction]. Any disputes
                        arising from these Terms will be resolved in the courts
                        of [Your Jurisdiction].
                      </p>
                    </div>
                  </section>

                  <Separator className="bg-white/10" />

                  {/* Section 11: Contact Information */}
                  <section id="contact" className="space-y-4">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                      <Users className="w-6 h-6 text-neon-blue" />
                      11. Contact Information
                    </h2>
                    <div className="prose prose-invert max-w-none">
                      <p className="text-gray-300">
                        If you have questions about these Terms, please contact
                        us:
                      </p>
                      <div className="bg-white/5 p-4 rounded-lg mt-4">
                        <p className="text-gray-300">
                          <strong>Email:</strong> legal@palmtechniq.com
                          <br />
                          <strong>Address:</strong> 1st Floor, (Festac Tower)
                          Chicken Republic Building, 22Rd ,Festac Town, Lagos,
                          Nigeria.
                          <br />
                          <strong>Phone:</strong> +234 (807) 956-8910
                        </p>
                      </div>
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
