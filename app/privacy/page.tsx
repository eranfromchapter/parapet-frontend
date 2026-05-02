'use client';

import { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import BottomNav from "@/components/BottomNav";

function PrivacyPolicyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from');
  const crossLinkHref = `/terms${from ? `?from=${from}` : ''}`;

  // Soft-nav back so the IntakeWizardProvider keeps its in-memory state and
  // never reaches the default-then-hydrate flash that a hard reload causes.
  const handleBack = () => {
    if (from === 'intake') {
      router.push('/intake/review');
    } else if (from === 'home') {
      router.push('/');
    } else if (from === 'account') {
      router.push('/account');
    } else {
      router.back();
    }
  };

  return (
    <div className="max-w-[430px] mx-auto min-h-[100dvh] flex flex-col bg-[#FAFBFC] relative shadow-xl">
      <PageHeader title="Privacy Policy" onBack={handleBack} />

      <div className="flex-1 overflow-y-auto px-5 py-4 pb-8">
        <p className="text-xs text-muted-foreground mb-1">Effective date: April 14, 2026</p>
        <p className="text-xs text-muted-foreground mb-6">Last updated: April 14, 2026</p>

        <p className="text-[15px] leading-relaxed text-foreground mb-6">
          New Parapet LLC (&quot;Company,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) operates the PARAPET platform. This Privacy Policy explains how we collect, use, disclose, and protect your personal information when you use our platform and services (collectively, the &quot;Service&quot;). This policy is designed to comply with the New York SHIELD Act and the California Online Privacy Protection Act (CalOPPA). By using the Service, you consent to the practices described in this Privacy Policy. Please also review our{" "}
          <Link href={crossLinkHref} replace className="text-[#1E3A5F] underline font-medium">Terms of Service</Link>.
        </p>

        {/* Section 1: AI Data Processing Disclosure */}
        <div className="border-l-4 border-[#F59E0B] bg-[rgba(245,158,11,0.06)] rounded-r-xl p-4 mb-8">
          <h2 className="text-base font-bold text-[#1E3A5F] mb-3">1. AI Data Processing Disclosure</h2>
          <p className="text-[15px] leading-relaxed text-foreground mb-3">
            This platform uses artificial intelligence to process your data. When you submit project information, upload documents, or request reports, your data is transmitted to third-party AI language model providers (currently OpenAI, accessed via Microsoft Azure infrastructure) for processing.
          </p>
          <p className="text-[15px] leading-relaxed text-foreground mb-3">
            This platform was built using AI tools. AI systems can make mistakes, and we encourage you to verify all outputs independently.
          </p>
          <p className="text-[15px] leading-relaxed text-foreground mb-2 font-medium">
            Data processed by AI includes:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-[15px] leading-relaxed text-foreground mb-3">
            <li>Project descriptions and free-text inputs</li>
            <li>Property addresses and ZIP codes</li>
            <li>Budget ranges and timeline preferences</li>
            <li>Uploaded photos and floor plans (as images)</li>
            <li>Uploaded PDF documents (text extracted for processing)</li>
            <li>Video recordings (audio transcribed to text)</li>
            <li>Scope selections and project parameters</li>
          </ul>
          <p className="text-[15px] leading-relaxed text-foreground">
            AI processing happens on third-party cloud infrastructure: Microsoft Azure (compute and AI models) and OpenAI (language model API). Your data is processed under OpenAI&apos;s data processing terms, which prohibit the use of API data for model training.
          </p>
        </div>

        {/* Section 2: Information We Collect */}
        <div className="mb-8">
          <h2 className="text-base font-bold text-[#1E3A5F] mb-3">2. Information We Collect</h2>

          <h3 className="text-sm font-semibold text-[#1E3A5F] mb-2">Information You Provide Directly</h3>
          <ul className="list-disc pl-5 space-y-1 text-[15px] leading-relaxed text-foreground mb-4">
            <li>Full name and email address</li>
            <li>Phone number (optional)</li>
            <li>Property address and ZIP code</li>
            <li>Home type (apartment, house, etc.)</li>
            <li>Project scope selections</li>
            <li>Budget range and timeline preferences</li>
            <li>Free-text project descriptions</li>
            <li>Photos and floor plan documents (PDF)</li>
            <li>Video recordings with audio narration</li>
          </ul>

          <h3 className="text-sm font-semibold text-[#1E3A5F] mb-2">Information Collected Automatically</h3>
          <ul className="list-disc pl-5 space-y-1 text-[15px] leading-relaxed text-foreground mb-4">
            <li>IP address</li>
            <li>Browser type and version</li>
            <li>Device type and operating system</li>
            <li>Pages visited within the platform</li>
            <li>Timestamps of interactions</li>
            <li>Referral source</li>
          </ul>

          <h3 className="text-sm font-semibold text-[#1E3A5F] mb-2">Information from Third-Party Sources</h3>
          <ul className="list-disc pl-5 space-y-1 text-[15px] leading-relaxed text-foreground mb-4">
            <li>Contractor licensing data from the New York Department of State (publicly available)</li>
            <li>Publicly available complaint and review data</li>
          </ul>

          <h3 className="text-sm font-semibold text-[#1E3A5F] mb-2">Information We Do NOT Collect</h3>
          <p className="text-[15px] leading-relaxed text-foreground">
            We do not collect Social Security numbers, bank account or financial account numbers, health information, biometric data, precise geolocation (only ZIP code), or information from social media profiles.
          </p>
        </div>

        {/* Section 3: How We Use Your Information */}
        <div className="mb-8">
          <h2 className="text-base font-bold text-[#1E3A5F] mb-3">3. How We Use Your Information</h2>
          <ul className="list-disc pl-5 space-y-2 text-[15px] leading-relaxed text-foreground">
            <li>To generate AI-powered readiness reports, cost estimates, design concepts, and scope analyses using your project details.</li>
            <li>To display publicly available contractor information relevant to your project location and scope.</li>
            <li>To send you transactional emails (report completion notifications, account communications) via our email delivery provider (SendGrid, a Twilio company).</li>
            <li>To authenticate your account and maintain session security.</li>
            <li>To improve platform accuracy using anonymized, aggregated data from which all personally identifiable information has been removed. Individual user data is not used to train third-party AI models.</li>
            <li>To comply with legal obligations.</li>
          </ul>
        </div>

        {/* Section 4: Data Sharing and Third-Party Processors */}
        <div className="mb-8">
          <h2 className="text-base font-bold text-[#1E3A5F] mb-3">4. Data Sharing &amp; Third-Party Processors</h2>
          <p className="text-[15px] leading-relaxed text-foreground mb-3">
            We share your data only with the following categories of service providers, solely for the purposes described:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-[15px] leading-relaxed text-foreground mb-4">
            <li><span className="font-medium">AI processing:</span> OpenAI (via Microsoft Azure) receives your project details, uploaded content, and scope selections to generate reports and design concepts. Subject to OpenAI&apos;s data processing terms, which prohibit use of API data for model training.</li>
            <li><span className="font-medium">Email delivery:</span> SendGrid (Twilio) receives your name and email address to deliver transactional emails such as report notifications.</li>
            <li><span className="font-medium">Cloud infrastructure:</span> Railway (backend hosting), Vercel (frontend hosting), and MongoDB Atlas (database) process and store your data as part of platform operations.</li>
          </ul>

          <p className="text-[15px] leading-relaxed text-foreground mb-2 font-medium">
            We do NOT:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-[15px] leading-relaxed text-foreground">
            <li>Sell, rent, or trade personal data to any third party.</li>
            <li>Share personal data with contractors. Contractors do not receive your personal information, project details, or contact information through the platform. Contractor information displayed on the platform is sourced from publicly available data.</li>
            <li>Share data with advertisers or advertising networks.</li>
            <li>Use data for behavioral advertising or targeted marketing.</li>
          </ul>
          <p className="text-[15px] leading-relaxed text-foreground mt-3">
            We may disclose data if required by law, court order, or government request, or to protect the safety of users or the public.
          </p>
        </div>

        {/* Section 5: Data Security (NY SHIELD Act) */}
        <div className="mb-8">
          <h2 className="text-base font-bold text-[#1E3A5F] mb-3">5. Data Security (NY SHIELD Act Compliance)</h2>

          <h3 className="text-sm font-semibold text-[#1E3A5F] mb-2">Administrative Safeguards</h3>
          <p className="text-[15px] leading-relaxed text-foreground mb-3">
            New Parapet LLC designates a security coordinator responsible for the data security program. We conduct periodic risk assessments of data handling practices.
          </p>

          <h3 className="text-sm font-semibold text-[#1E3A5F] mb-2">Technical Safeguards</h3>
          <ul className="list-disc pl-5 space-y-1 text-[15px] leading-relaxed text-foreground mb-3">
            <li>All data is encrypted in transit using TLS 1.2 or higher.</li>
            <li>Database access requires authenticated credentials.</li>
            <li>User sessions are secured via JWT tokens with expiration.</li>
            <li>API endpoints require authentication.</li>
            <li>User data is isolated — each user can only access their own data.</li>
          </ul>

          <h3 className="text-sm font-semibold text-[#1E3A5F] mb-2">Physical Safeguards</h3>
          <p className="text-[15px] leading-relaxed text-foreground mb-3">
            All data is stored on SOC 2 Type II certified cloud infrastructure providers (Microsoft Azure, MongoDB Atlas). We do not maintain physical servers.
          </p>

          <h3 className="text-sm font-semibold text-[#1E3A5F] mb-2">Breach Notification</h3>
          <p className="text-[15px] leading-relaxed text-foreground">
            In the event of a data breach affecting your personal information, we will notify affected users within 30 days as required by the NY SHIELD Act. We will also notify the New York Attorney General, the Department of State, and the Division of State Police as required by law.
          </p>
        </div>

        {/* Section 6: Your Rights */}
        <div className="mb-8">
          <h2 className="text-base font-bold text-[#1E3A5F] mb-3">6. Your Rights</h2>
          <ul className="list-disc pl-5 space-y-2 text-[15px] leading-relaxed text-foreground">
            <li><span className="font-medium">Access:</span> You may request a copy of all personal data we hold about you.</li>
            <li><span className="font-medium">Deletion:</span> You may request deletion of your account and all associated personal data. Deletion will be completed within 30 days.</li>
            <li><span className="font-medium">Portability:</span> You may request export of your reports and documents in standard formats (PDF).</li>
            <li><span className="font-medium">Correction:</span> You may update inaccurate personal information through your account settings or by contacting us.</li>
          </ul>
          <p className="text-[15px] leading-relaxed text-foreground mt-3">
            To exercise any of these rights, email support@parapet-ai.com. We will respond within 30 days and verify your identity before processing requests.
          </p>
        </div>

        {/* Section 7: Data Retention */}
        <div className="mb-8">
          <h2 className="text-base font-bold text-[#1E3A5F] mb-3">7. Data Retention</h2>
          <ul className="list-disc pl-5 space-y-2 text-[15px] leading-relaxed text-foreground">
            <li><span className="font-medium">Active accounts:</span> Data is retained while your account is active and for 30 days after account deletion.</li>
            <li><span className="font-medium">Deleted accounts:</span> All personal data is purged within 30 days of a deletion request, except where retention is required by applicable law.</li>
            <li><span className="font-medium">Anonymized analytics data:</span> Data from which all personally identifiable information has been permanently removed is retained indefinitely. This data cannot be traced back to any individual.</li>
            <li><span className="font-medium">AI-generated reports:</span> Stored as long as your account is active and deleted with your account.</li>
          </ul>
        </div>

        {/* Section 8: Cookies and Tracking */}
        <div className="mb-8">
          <h2 className="text-base font-bold text-[#1E3A5F] mb-3">8. Cookies &amp; Tracking</h2>
          <p className="text-[15px] leading-relaxed text-foreground mb-3">
            We use strictly essential cookies only: JWT authentication session tokens required for the platform to function. These are first-party, HttpOnly, Secure cookies.
          </p>
          <p className="text-[15px] leading-relaxed text-foreground mb-3">
            We do not use advertising cookies, third-party tracking pixels, social media trackers, or analytics cookies that track individual users across websites.
          </p>
          <p className="text-[15px] leading-relaxed text-foreground">
            Because we use only essential first-party cookies required for platform functionality, no cookie consent banner is required under current US law.
          </p>
        </div>

        {/* Section 9: Children's Privacy */}
        <div className="mb-8">
          <h2 className="text-base font-bold text-[#1E3A5F] mb-3">9. Children&apos;s Privacy</h2>
          <p className="text-[15px] leading-relaxed text-foreground">
            PARAPET is not directed at individuals under 18 years of age. We do not knowingly collect personal information from anyone under 18. If we learn we have collected data from a minor, we will delete it promptly. Contact support@parapet-ai.com to report any concerns.
          </p>
        </div>

        {/* Section 10: California Residents (CalOPPA) */}
        <div className="mb-8">
          <h2 className="text-base font-bold text-[#1E3A5F] mb-3">10. California Residents (CalOPPA Compliance)</h2>
          <p className="text-[15px] leading-relaxed text-foreground mb-3">
            We do not sell personal information as defined by the California Consumer Privacy Act (CCPA/CPRA). We honor Do Not Track (DNT) browser signals and Global Privacy Control (GPC) signals.
          </p>
          <p className="text-[15px] leading-relaxed text-foreground mb-2 font-medium">
            Categories of personal information collected:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-[15px] leading-relaxed text-foreground mb-3">
            <li>Identifiers (name, email, phone)</li>
            <li>Property-related information (address, ZIP code)</li>
            <li>Project information (scope, budget, timeline)</li>
            <li>Internet activity (pages visited, timestamps)</li>
            <li>User-generated content (photos, documents, videos)</li>
          </ul>
          <p className="text-[15px] leading-relaxed text-foreground">
            Purpose of collection: to provide the AI-powered renovation planning service as described in Section 3 of this Privacy Policy.
          </p>
        </div>

        {/* Section 11: Changes to This Policy */}
        <div className="mb-8">
          <h2 className="text-base font-bold text-[#1E3A5F] mb-3">11. Changes to This Policy</h2>
          <p className="text-[15px] leading-relaxed text-foreground">
            We will notify users of material changes to this Privacy Policy via the email address associated with their account at least 30 days before changes take effect. The &quot;Last updated&quot; date at the top of this page will be revised accordingly. Continued use of the platform after the effective date of changes constitutes acceptance of the revised Privacy Policy.
          </p>
        </div>

        {/* Section 12: Contact */}
        <div className="mb-8">
          <h2 className="text-base font-bold text-[#1E3A5F] mb-3">12. Contact</h2>
          <p className="text-[15px] leading-relaxed text-foreground">
            If you have questions about this Privacy Policy or wish to exercise your data rights, please contact us:
          </p>
          <div className="mt-2 text-[15px] leading-relaxed text-foreground">
            <p className="font-medium">New Parapet LLC</p>
            <p>345 7th Avenue, 9th Floor</p>
            <p>New York, NY 10001</p>
            <p>support@parapet-ai.com</p>
          </div>
        </div>

        <div className="h-4" />
      </div>

      <BottomNav />
    </div>
  );
}

export default function PrivacyPolicyPage() {
  return (
    <Suspense fallback={<div className="max-w-[430px] mx-auto min-h-[100dvh] bg-[#FAFBFC]" />}>
      <PrivacyPolicyContent />
    </Suspense>
  );
}
{/* LEGAL REVIEW REQUIRED BEFORE PUBLICATION */}
