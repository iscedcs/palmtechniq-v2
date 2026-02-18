"use client";

import { motion } from "framer-motion";
import {
  ArrowLeft,
  Shield,
  Eye,
  Database,
  Lock,
  Globe,
  Users,
  Settings,
  FileText,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function PrivacyPolicy() {
  const sections = [
    { id: "overview", title: "Privacy Overview", icon: Eye },
    { id: "collection", title: "Information We Collect", icon: Database },
    { id: "usage", title: "How We Use Information", icon: Settings },
    { id: "sharing", title: "Information Sharing", icon: Users },
    { id: "security", title: "Data Security", icon: Lock },
    { id: "cookies", title: "Cookies & Tracking", icon: Globe },
    { id: "rights", title: "Your Privacy Rights", icon: Shield },
    { id: "retention", title: "Data Retention", icon: FileText },
    { id: "international", title: "International Transfers", icon: Globe },
    { id: "children", title: "Children's Privacy", icon: Users },
    { id: "changes", title: "Policy Changes", icon: Settings },
    { id: "contact", title: "Contact Us", icon: Users },
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
              Privacy Policy
            </h1>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Your privacy is our priority. Learn how we collect, use, and
              protect your personal information.
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
                <Shield className="w-3 h-3 mr-1" />
                GDPR Compliant
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
                      At PalmTechnIQ, we are committed to protecting your
                      privacy and ensuring the security of your personal
                      information. This Privacy Policy explains how we collect,
                      use, disclose, and safeguard your information when you use
                      our online learning platform.
                    </p>
                  </div>

                  {/* Section 1: Privacy Overview */}
                  <section id="overview" className="space-y-4">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                      <Eye className="w-6 h-6 text-neon-blue" />
                      1. Privacy Overview
                    </h2>
                    <div className="prose prose-invert max-w-none">
                      <p className="text-gray-300">
                        This Privacy Policy applies to all users of PalmTechnIQ,
                        including students, instructors, and administrators. We
                        believe in transparency and want you to understand:
                      </p>
                      <ul className="text-gray-300 space-y-2 ml-6">
                        <li>• What personal information we collect and why</li>
                        <li>• How we use and protect your information</li>
                        <li>• Your rights and choices regarding your data</li>
                        <li>• How to contact us with privacy concerns</li>
                      </ul>
                      <p className="text-gray-300">
                        We are committed to GDPR compliance and follow industry
                        best practices for data protection.
                      </p>
                    </div>
                  </section>

                  <Separator className="bg-white/10" />

                  {/* Section 2: Information We Collect */}
                  <section id="collection" className="space-y-4">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                      <Database className="w-6 h-6 text-neon-blue" />
                      2. Information We Collect
                    </h2>
                    <div className="prose prose-invert max-w-none">
                      <h3 className="text-lg font-semibold text-white">
                        Personal Information
                      </h3>
                      <p className="text-gray-300">
                        We collect information you provide directly to us:
                      </p>
                      <ul className="text-gray-300 space-y-2 ml-6">
                        <li>• Name, email address, and profile information</li>
                        <li>
                          • Payment information (processed securely by Paystack)
                        </li>
                        <li>• Course enrollment and progress data</li>
                        <li>• Communications with instructors and support</li>
                        <li>
                          • User-generated content (assignments, projects,
                          reviews)
                        </li>
                      </ul>

                      <h3 className="text-lg font-semibold text-white mt-6">
                        Automatically Collected Information
                      </h3>
                      <ul className="text-gray-300 space-y-2 ml-6">
                        <li>• Device information and IP address</li>
                        <li>• Browser type and operating system</li>
                        <li>• Usage patterns and learning analytics</li>
                        <li>• Cookies and similar tracking technologies</li>
                      </ul>
                    </div>
                  </section>

                  <Separator className="bg-white/10" />

                  {/* Section 3: How We Use Information */}
                  <section id="usage" className="space-y-4">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                      <Settings className="w-6 h-6 text-neon-blue" />
                      3. How We Use Information
                    </h2>
                    <div className="prose prose-invert max-w-none">
                      <p className="text-gray-300">
                        We use your information to:
                      </p>
                      <ul className="text-gray-300 space-y-2 ml-6">
                        <li>• Provide and improve our educational services</li>
                        <li>• Process payments and manage subscriptions</li>
                        <li>
                          • Track learning progress and issue certificates
                        </li>
                        <li>• Facilitate communication between users</li>
                        <li>• Send important updates and notifications</li>
                        <li>• Personalize your learning experience</li>
                        <li>• Prevent fraud and ensure platform security</li>
                        <li>• Comply with legal obligations</li>
                      </ul>
                    </div>
                  </section>

                  <Separator className="bg-white/10" />

                  {/* Section 4: Information Sharing */}
                  <section id="sharing" className="space-y-4">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                      <Users className="w-6 h-6 text-neon-blue" />
                      4. Information Sharing
                    </h2>
                    <div className="prose prose-invert max-w-none">
                      <p className="text-gray-300">
                        We do not sell your personal information. We may share
                        information in these limited circumstances:
                      </p>
                      <ul className="text-gray-300 space-y-2 ml-6">
                        <li>
                          • With instructors for course delivery and feedback
                        </li>
                        <li>
                          • With service providers (payment processing, hosting)
                        </li>
                        <li>• When required by law or legal process</li>
                        <li>• To protect our rights and prevent fraud</li>
                        <li>• With your explicit consent</li>
                      </ul>
                      <p className="text-gray-300">
                        All third-party service providers are bound by strict
                        confidentiality agreements.
                      </p>
                    </div>
                  </section>

                  <Separator className="bg-white/10" />

                  {/* Section 5: Data Security */}
                  <section id="security" className="space-y-4">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                      <Lock className="w-6 h-6 text-neon-blue" />
                      5. Data Security
                    </h2>
                    <div className="prose prose-invert max-w-none">
                      <p className="text-gray-300">
                        We implement comprehensive security measures to protect
                        your information:
                      </p>
                      <ul className="text-gray-300 space-y-2 ml-6">
                        <li>• SSL/TLS encryption for data transmission</li>
                        <li>• Encrypted data storage and regular backups</li>
                        <li>• Multi-factor authentication options</li>
                        <li>• Regular security audits and monitoring</li>
                        <li>• Employee training on data protection</li>
                        <li>• Incident response procedures</li>
                      </ul>
                      <p className="text-gray-300">
                        While we strive to protect your information, no method
                        of transmission over the internet is 100% secure.
                      </p>
                    </div>
                  </section>

                  <Separator className="bg-white/10" />

                  {/* Section 6: Cookies & Tracking */}
                  <section id="cookies" className="space-y-4">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                      <Globe className="w-6 h-6 text-neon-blue" />
                      6. Cookies & Tracking
                    </h2>
                    <div className="prose prose-invert max-w-none">
                      <p className="text-gray-300">
                        We use cookies and similar technologies to:
                      </p>
                      <ul className="text-gray-300 space-y-2 ml-6">
                        <li>• Remember your preferences and settings</li>
                        <li>• Analyze platform usage and performance</li>
                        <li>• Provide personalized content recommendations</li>
                        <li>• Ensure platform security and prevent fraud</li>
                      </ul>
                      <p className="text-gray-300">
                        You can control cookie settings through your browser
                        preferences. Note that disabling cookies may affect
                        platform functionality.
                      </p>
                    </div>
                  </section>

                  <Separator className="bg-white/10" />

                  {/* Section 7: Your Privacy Rights */}
                  <section id="rights" className="space-y-4">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                      <Shield className="w-6 h-6 text-neon-blue" />
                      7. Your Privacy Rights
                    </h2>
                    <div className="prose prose-invert max-w-none">
                      <p className="text-gray-300">
                        You have the following rights regarding your personal
                        information:
                      </p>
                      <ul className="text-gray-300 space-y-2 ml-6">
                        <li>
                          • <strong>Access:</strong> Request a copy of your
                          personal data
                        </li>
                        <li>
                          • <strong>Rectification:</strong> Correct inaccurate
                          information
                        </li>
                        <li>
                          • <strong>Erasure:</strong> Request deletion of your
                          data
                        </li>
                        <li>
                          • <strong>Portability:</strong> Export your data in a
                          readable format
                        </li>
                        <li>
                          • <strong>Restriction:</strong> Limit how we process
                          your data
                        </li>
                        <li>
                          • <strong>Objection:</strong> Object to certain data
                          processing
                        </li>
                        <li>
                          • <strong>Withdraw Consent:</strong> Revoke previously
                          given consent
                        </li>
                      </ul>
                      <p className="text-gray-300">
                        To exercise these rights, contact us at
                        privacy@palmtechniq.com.
                      </p>
                    </div>
                  </section>

                  <Separator className="bg-white/10" />

                  {/* Section 8: Data Retention */}
                  <section id="retention" className="space-y-4">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                      <FileText className="w-6 h-6 text-neon-blue" />
                      8. Data Retention
                    </h2>
                    <div className="prose prose-invert max-w-none">
                      <p className="text-gray-300">
                        We retain your information for as long as necessary to:
                      </p>
                      <ul className="text-gray-300 space-y-2 ml-6">
                        <li>
                          • Provide our services and maintain your account
                        </li>
                        <li>• Comply with legal and regulatory requirements</li>
                        <li>• Resolve disputes and enforce agreements</li>
                        <li>• Improve our services and user experience</li>
                      </ul>
                      <p className="text-gray-300">
                        When you delete your account, we will delete or
                        anonymize your personal information within 30 days,
                        except where retention is required by law.
                      </p>
                    </div>
                  </section>

                  <Separator className="bg-white/10" />

                  {/* Section 9: International Transfers */}
                  <section id="international" className="space-y-4">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                      <Globe className="w-6 h-6 text-neon-blue" />
                      9. International Transfers
                    </h2>
                    <div className="prose prose-invert max-w-none">
                      <p className="text-gray-300">
                        Your information may be transferred to and processed in
                        countries other than your own. We ensure adequate
                        protection through:
                      </p>
                      <ul className="text-gray-300 space-y-2 ml-6">
                        <li>
                          • Standard contractual clauses approved by regulators
                        </li>
                        <li>• Adequacy decisions by relevant authorities</li>
                        <li>• Certification schemes and codes of conduct</li>
                        <li>• Your explicit consent where required</li>
                      </ul>
                    </div>
                  </section>

                  <Separator className="bg-white/10" />

                  {/* Section 10: Children's Privacy */}
                  <section id="children" className="space-y-4">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                      <Users className="w-6 h-6 text-neon-blue" />
                      10. Children's Privacy
                    </h2>
                    <div className="prose prose-invert max-w-none">
                      <p className="text-gray-300">
                        PalmTechnIQ is not intended for children under 13. We do
                        not knowingly collect personal information from children
                        under 13. If we become aware that we have collected such
                        information, we will delete it promptly.
                      </p>
                      <p className="text-gray-300">
                        For users between 13 and 18, we require parental consent
                        before collecting personal information.
                      </p>
                    </div>
                  </section>

                  <Separator className="bg-white/10" />

                  {/* Section 11: Policy Changes */}
                  <section id="changes" className="space-y-4">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                      <Settings className="w-6 h-6 text-neon-blue" />
                      11. Policy Changes
                    </h2>
                    <div className="prose prose-invert max-w-none">
                      <p className="text-gray-300">
                        We may update this Privacy Policy from time to time.
                        When we make changes:
                      </p>
                      <ul className="text-gray-300 space-y-2 ml-6">
                        <li>
                          • We will post the updated policy on our website
                        </li>
                        <li>• We will update the "Last Updated" date</li>
                        <li>
                          • For significant changes, we will notify you by email
                        </li>
                        <li>
                          • Your continued use constitutes acceptance of changes
                        </li>
                      </ul>
                    </div>
                  </section>

                  <Separator className="bg-white/10" />

                  {/* Section 12: Contact Us */}
                  <section id="contact" className="space-y-4">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                      <Users className="w-6 h-6 text-neon-blue" />
                      12. Contact Us
                    </h2>
                    <div className="prose prose-invert max-w-none">
                      <p className="text-gray-300">
                        If you have questions about this Privacy Policy or our
                        data practices, please contact us:
                      </p>
                      <div className="bg-white/5 p-6 rounded-lg mt-4">
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-semibold text-white mb-2">
                              General Privacy Inquiries
                            </h4>
                            <p className="text-gray-300 text-sm">
                              <strong>Email:</strong> privacy@palmtechniq.com
                              <br />
                              <strong>Response Time:</strong> 48 hours
                            </p>
                          </div>
                          <div>
                            <h4 className="font-semibold text-white mb-2">
                              Data Protection Officer
                            </h4>
                            <p className="text-gray-300 text-sm">
                              <strong>Email:</strong> dpo@palmtechniq.com
                              <br />
                              <strong>Phone:</strong> +234 (807) 956-8910
                            </p>
                          </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-white/10">
                          <p className="text-gray-300 text-sm">
                            <strong>Mailing Address:</strong>
                            <br />
                            PalmTechnIQ Privacy Team
                            <br />
                            1st Floor, (Festac Tower) Chicken Republic Building,
                            22Rd ,Festac Town, Lagos, Nigeria.
                            <br />
                            Lagos, NG
                          </p>
                        </div>
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
