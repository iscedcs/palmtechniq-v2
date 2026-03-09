import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | PalmTechnIQ",
  description:
    "Learn how PalmTechnIQ collects, uses, and protects your personal information. GDPR compliant privacy policy.",
  robots: "index, follow",
};

export default function PrivacyPolicy() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 pt-24">
      <div className="mx-auto max-w-4xl px-6 py-12 sm:px-8">
        {/* Header */}
        <header className="mb-12">
          <Link
            href="/"
            className="mb-6 inline-block text-gray-500 hover:text-white">
            ← Back
          </Link>
          <h1 className="text-4xl font-bold text-white mb-4">Privacy Policy</h1>
          <p className="text-lg text-gray-500 mb-6">
            Your privacy is our priority. Learn how we collect, use, and protect
            your personal information.
          </p>
          <div className="flex flex-col gaps-2 sm:flex-row sm:gap-4">
            <span className="inline-block text-sm text-gray-500">
              Last Updated: January 15, 2024
            </span>
            <span className="inline-block text-sm text-green-600">
              ✓ GDPR Compliant
            </span>
          </div>
        </header>

        {/* Introduction */}
        <article className="prose prose-lg max-w-4xl mx-auto text-gray-400">
          <p className="mb-8 text-lg leading-relaxed">
            At PalmTechnIQ, we are committed to protecting your privacy and
            ensuring the security of your personal information. This Privacy
            Policy explains how we collect, use, disclose, and safeguard your
            information when you use our online learning platform.
          </p>

          {/* Section 1: Privacy Overview */}
          <section id="overview" className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-4">
              1. Privacy Overview
            </h2>
            <p>
              This Privacy Policy applies to all users of PalmTechnIQ, including
              students, instructors, and administrators. We believe in
              transparency and want you to understand:
            </p>
            <ul className="list-disc list-inside space-y-2">
              <li>What personal information we collect and why</li>
              <li>How we use and protect your information</li>
              <li>Your rights and choices regarding your data</li>
              <li>How to contact us with privacy concerns</li>
            </ul>
            <p>
              We are committed to GDPR compliance and follow industry best
              practices for data protection.
            </p>
          </section>

          <hr className="my-8" />

          {/* Section 2: Information We Collect */}
          <section id="collection" className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-4">
              2. Information We Collect
            </h2>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">
              Personal Information
            </h3>
            <p>We collect information you provide directly to us:</p>
            <ul className="list-disc list-inside space-y-2">
              <li>Name, email address, and profile information</li>
              <li>Payment information (processed securely by Paystack)</li>
              <li>Course enrollment and progress data</li>
              <li>Communications with instructors and support</li>
              <li>User-generated content (assignments, projects, reviews)</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">
              Automatically Collected Information
            </h3>
            <ul className="list-disc list-inside space-y-2">
              <li>Device information and IP address</li>
              <li>Browser type and operating system</li>
              <li>Usage patterns and learning analytics</li>
              <li>Cookies and similar tracking technologies</li>
            </ul>
          </section>

          <hr className="my-8" />

          {/* Section 3: How We Use Information */}
          <section id="usage" className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-4">
              3. How We Use Information
            </h2>
            <p>We use your information to:</p>
            <ul className="list-disc list-inside space-y-2">
              <li>Provide and improve our educational services</li>
              <li>Process payments and manage subscriptions</li>
              <li>Track learning progress and issue certificates</li>
              <li>Facilitate communication between users</li>
              <li>Send important updates and notifications</li>
              <li>Personalize your learning experience</li>
              <li>Prevent fraud and ensure platform security</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <hr className="my-8" />

          {/* Section 4: Information Sharing */}
          <section id="sharing" className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-4">
              4. Information Sharing
            </h2>
            <p>
              We do not sell your personal information. We may share information
              in these limited circumstances:
            </p>
            <ul className="list-disc list-inside space-y-2">
              <li>With instructors for course delivery and feedback</li>
              <li>With service providers (payment processing, hosting)</li>
              <li>When required by law or legal process</li>
              <li>To protect our rights and prevent fraud</li>
              <li>With your explicit consent</li>
            </ul>
            <p>
              All third-party service providers are bound by strict
              confidentiality agreements.
            </p>
          </section>

          <hr className="my-8" />

          {/* Section 5: Data Security */}
          <section id="security" className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-4">
              5. Data Security
            </h2>
            <p>
              We implement comprehensive security measures to protect your
              information:
            </p>
            <ul className="list-disc list-inside space-y-2">
              <li>SSL/TLS encryption for data transmission</li>
              <li>Encrypted data storage and regular backups</li>
              <li>Multi-factor authentication options</li>
              <li>Regular security audits and monitoring</li>
              <li>Employee training on data protection</li>
              <li>Incident response procedures</li>
            </ul>
            <p>
              While we strive to protect your information, no method of
              transmission over the internet is 100% secure.
            </p>
          </section>

          <hr className="my-8" />

          {/* Section 6: Cookies & Tracking */}
          <section id="cookies" className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-4">
              6. Cookies & Tracking
            </h2>
            <p>We use cookies and similar technologies to:</p>
            <ul className="list-disc list-inside space-y-2">
              <li>Remember your preferences and settings</li>
              <li>Analyze platform usage and performance</li>
              <li>Provide personalized content recommendations</li>
              <li>Ensure platform security and prevent fraud</li>
            </ul>
            <p>
              You can control cookie settings through your browser preferences.
              Note that disabling cookies may affect platform functionality.
            </p>
          </section>

          <hr className="my-8" />

          {/* Section 7: Your Privacy Rights */}
          <section id="rights" className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-4">
              7. Your Privacy Rights
            </h2>
            <p>
              You have the following rights regarding your personal information:
            </p>
            <ul className="list-disc list-inside space-y-2">
              <li>
                <strong>Access:</strong> Request a copy of your personal data
              </li>
              <li>
                <strong>Rectification:</strong> Correct inaccurate information
              </li>
              <li>
                <strong>Erasure:</strong> Request deletion of your data
              </li>
              <li>
                <strong>Portability:</strong> Export your data in a readable
                format
              </li>
              <li>
                <strong>Restriction:</strong> Limit how we process your data
              </li>
              <li>
                <strong>Objection:</strong> Object to certain data processing
              </li>
              <li>
                <strong>Withdraw Consent:</strong> Revoke previously given
                consent
              </li>
            </ul>
            <p>
              To exercise these rights, contact us at privacy@palmtechniq.com.
            </p>
          </section>

          <hr className="my-8" />

          {/* Section 8: Data Retention */}
          <section id="retention" className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-4">
              8. Data Retention
            </h2>
            <p>We retain your information for as long as necessary to:</p>
            <ul className="list-disc list-inside space-y-2">
              <li>Provide our services and maintain your account</li>
              <li>Comply with legal and regulatory requirements</li>
              <li>Resolve disputes and enforce agreements</li>
              <li>Improve our services and user experience</li>
            </ul>
            <p>
              When you delete your account, we will delete or anonymize your
              personal information within 30 days, except where retention is
              required by law.
            </p>
          </section>

          <hr className="my-8" />

          {/* Section 9: International Transfers */}
          <section id="international" className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-4">
              9. International Transfers
            </h2>
            <p>
              Your information may be transferred to and processed in countries
              other than your own. We ensure adequate protection through:
            </p>
            <ul className="list-disc list-inside space-y-2">
              <li>Standard contractual clauses approved by regulators</li>
              <li>Adequacy decisions by relevant authorities</li>
              <li>Certification schemes and codes of conduct</li>
              <li>Your explicit consent where required</li>
            </ul>
          </section>

          <hr className="my-8" />

          {/* Section 10: Children's Privacy */}
          <section id="children" className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-4">
              10. Children's Privacy
            </h2>
            <p>
              PalmTechnIQ is not intended for children under 13. We do not
              knowingly collect personal information from children under 13. If
              we become aware that we have collected such information, we will
              delete it promptly.
            </p>
            <p>
              For users between 13 and 18, we require parental consent before
              collecting personal information.
            </p>
          </section>

          <hr className="my-8" />

          {/* Section 11: Policy Changes */}
          <section id="changes" className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-4">
              11. Policy Changes
            </h2>
            <p>
              We may update this Privacy Policy from time to time. When we make
              changes:
            </p>
            <ul className="list-disc list-inside space-y-2">
              <li>We will post the updated policy on our website</li>
              <li>We will update the "Last Updated" date</li>
              <li>For significant changes, we will notify you by email</li>
              <li>Your continued use constitutes acceptance of changes</li>
            </ul>
          </section>

          <hr className="my-8" />

          {/* Section 12: Contact Us */}
          <section id="contact" className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-4">
              12. Contact Us
            </h2>
            <p>
              If you have questions about this Privacy Policy or our data
              practices, please contact us:
            </p>

            <div className="bg-primary/80 p-6 rounded-lg mt-6 space-y-4">
              <div>
                <h3 className="font-semibold text-white mb-2">
                  General Privacy Inquiries
                </h3>
                <p className="text-black text-sm">
                  <strong>Email:</strong> privacy@palmtechniq.com
                  <br />
                  <strong>Response Time:</strong> 48 hours
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-white mb-2">
                  Data Protection Officer
                </h3>
                <p className="text-black text-sm">
                  <strong>Email:</strong> dpo@palmtechniq.com
                  <br />
                  <strong>Phone:</strong> +234 (807) 956-8910
                </p>
              </div>

              <div className="pt-4 border-t border-gray-300">
                <p className="text-black text-sm">
                  <strong>Mailing Address:</strong>
                  <br />
                  PalmTechnIQ Privacy Team
                  <br />
                  1st Floor, (Festac Tower) Chicken Republic Building, 22Rd,
                  Festac Town, Lagos, Nigeria
                </p>
              </div>
            </div>
          </section>
        </article>
      </div>
    </main>
  );
}
