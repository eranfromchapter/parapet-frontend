'use client';

import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import BottomNav from "@/components/BottomNav";

export default function TermsOfServicePage() {
  return (
    <div className="max-w-[430px] mx-auto min-h-[100dvh] flex flex-col bg-[#FAFBFC] relative shadow-xl">
      <PageHeader
        title="Terms of Service"
        onBack={() => {
          // Return to wherever the user came from (intake review, landing
          // page footer, /privacy cross-link, etc.) instead of hard-coding "/".
          if (typeof window !== "undefined") window.history.back();
        }}
      />

      <div className="flex-1 overflow-y-auto px-5 py-4 pb-8">
        <p className="text-xs text-muted-foreground mb-6">Effective date: April 14, 2026</p>

        <p className="text-[15px] leading-relaxed text-foreground mb-6">
          Welcome to PARAPET. These Terms of Service (&quot;Terms&quot;) constitute a legally binding agreement between you and New Parapet LLC (&quot;Company,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) governing your access to and use of the PARAPET platform, website, and all related services (collectively, the &quot;Service&quot;). By accessing or using the Service, you agree to be bound by these Terms. If you do not agree, do not use the Service.
        </p>

        {/* Section 1: AI-Built Platform Disclosure */}
        <div className="border-l-4 border-[#F59E0B] bg-[rgba(245,158,11,0.06)] rounded-r-xl p-4 mb-8">
          <h2 className="text-base font-bold text-[#1E3A5F] mb-3">1. AI-Built Platform Disclosure</h2>
          <p className="text-[15px] leading-relaxed text-foreground mb-3">
            PARAPET is an AI-powered platform. The platform itself was designed and built using artificial intelligence tools. All reports, cost estimates, design concepts, scope analyses, and contractor information displayed by the platform are produced by artificial intelligence, not by licensed professionals.
          </p>
          <p className="text-[15px] leading-relaxed text-foreground mb-3">
            AI systems can and do make mistakes. The information provided by PARAPET may be inaccurate, incomplete, outdated, or inappropriate for your specific situation. You should independently verify all information before making any decisions.
          </p>
          <p className="text-[15px] leading-relaxed text-foreground">
            AI models can generate plausible-sounding but incorrect information (known as &quot;hallucination&quot;). Cost data may be outdated, incomplete, or not applicable to your specific project. Regulatory and permit information may not reflect the latest local requirements.
          </p>
        </div>

        {/* Section 2: AI Limitations & Disclaimer */}
        <div className="border-l-4 border-[#EF4444] bg-[rgba(239,68,68,0.05)] rounded-r-xl p-4 mb-8">
          <h2 className="text-base font-bold text-[#1E3A5F] mb-3">2. AI Limitations &amp; Disclaimer</h2>
          <div className="text-[14px] leading-relaxed text-foreground font-semibold uppercase space-y-3">
            <p>
              AI-GENERATED COST ESTIMATES ARE APPROXIMATIONS BASED ON AVAILABLE DATA AND MAY DIFFER SIGNIFICANTLY FROM ACTUAL COSTS.
            </p>
            <p>
              AI-GENERATED DESIGN CONCEPTS ARE FOR INSPIRATION AND INFORMATIONAL PURPOSES ONLY AND DO NOT CONSTITUTE PROFESSIONAL INTERIOR DESIGN, ARCHITECTURAL, OR ENGINEERING SERVICES.
            </p>
            <p>
              AI-GENERATED READINESS REPORTS AND SCOPE ANALYSES MAY CONTAIN ERRORS, OMISSIONS, OR INACCURACIES.
            </p>
            <p>
              CONTRACTOR INFORMATION DISPLAYED ON THE PLATFORM IS SOURCED FROM PUBLICLY AVAILABLE DATA AND MAY NOT REFLECT CURRENT LICENSING STATUS, INSURANCE COVERAGE, OR COMPLAINT HISTORY. PARAPET DOES NOT VET, ENDORSE, GUARANTEE, OR ENTER INTO ANY AGREEMENT WITH ANY CONTRACTOR.
            </p>
            <p>
              THE PLATFORM DOES NOT PROVIDE PROFESSIONAL ENGINEERING, ARCHITECTURAL, LEGAL, FINANCIAL, OR CONSTRUCTION MANAGEMENT ADVICE.
            </p>
            <p>
              USERS SHOULD INDEPENDENTLY VERIFY ALL AI-GENERATED INFORMATION BEFORE MAKING FINANCIAL, CONSTRUCTION, OR SAFETY-RELATED DECISIONS.
            </p>
            <p>
              PARAPET IS NOT RESPONSIBLE FOR DECISIONS MADE BASED ON AI-GENERATED CONTENT.
            </p>
          </div>
        </div>

        {/* Section 3: Nature of Service */}
        <div className="mb-8">
          <h2 className="text-base font-bold text-[#1E3A5F] mb-3">3. Nature of Service</h2>
          <p className="text-[15px] leading-relaxed text-foreground mb-3">
            PARAPET is an information and decision-support tool only. It is not a contractor, architect, engineer, real estate broker, escrow agent, or licensed professional of any kind. The platform does not perform renovation work, does not enter construction contracts, does not hold funds, does not act as a fiduciary, and does not guarantee contractor performance or availability.
          </p>
          <p className="text-[15px] leading-relaxed text-foreground mb-3">
            Contractor information displayed on the platform is sourced from publicly available data (e.g., NY Department of State, public complaint records). Display of contractor information does not constitute a referral, endorsement, recommendation, or guarantee of any kind. PARAPET has no contractual, financial, or agency relationship with any contractor displayed on the platform.
          </p>
          <p className="text-[15px] leading-relaxed text-foreground">
            The platform is homeowner-paid. PARAPET does not accept commissions, referral fees, advertising payments, or any other form of compensation from contractors, vendors, or service providers.
          </p>
        </div>

        {/* Section 4: No Professional Advice */}
        <div className="mb-8">
          <h2 className="text-base font-bold text-[#1E3A5F] mb-3">4. No Professional Advice</h2>
          <p className="text-[15px] leading-relaxed text-foreground mb-3">
            Nothing on this platform constitutes professional advice of any kind, including but not limited to: architectural, engineering, legal, financial, tax, insurance, or real estate advice. Users must consult appropriately licensed professionals before making decisions about renovation projects, construction contracts, permit applications, or financial commitments.
          </p>
          <p className="text-[15px] leading-relaxed text-foreground">
            AI-generated cost estimates are not appraisals, bids, or quotes. They are statistical approximations that may vary significantly from actual project costs.
          </p>
        </div>

        {/* Section 5: User Responsibilities */}
        <div className="mb-8">
          <h2 className="text-base font-bold text-[#1E3A5F] mb-3">5. User Responsibilities</h2>
          <p className="text-[15px] leading-relaxed text-foreground mb-2">
            By using the Service, you acknowledge and agree that:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-[15px] leading-relaxed text-foreground">
            <li>You are responsible for independently verifying all estimates, contractor information, regulatory guidance, and recommendations provided by the platform.</li>
            <li>You must consult licensed professionals (architects, engineers, attorneys, licensed contractors) for professional advice before acting on any information provided by the platform.</li>
            <li>You are responsible for obtaining all required permits and approvals from relevant authorities for your renovation project.</li>
            <li>You must not rely solely on AI-generated content for financial or safety-critical decisions.</li>
            <li>You are responsible for the accuracy of information you provide to the platform, and you understand that inaccurate inputs may result in inaccurate outputs.</li>
          </ul>
        </div>

        {/* Section 6: Intellectual Property */}
        <div className="mb-8">
          <h2 className="text-base font-bold text-[#1E3A5F] mb-3">6. Intellectual Property</h2>
          <p className="text-[15px] leading-relaxed text-foreground mb-3">
            All platform content, algorithms, software, designs, trademarks, and underlying technology are the exclusive property of New Parapet LLC. Patent pending. No part of the platform may be reproduced, distributed, or used for commercial purposes without the express written consent of New Parapet LLC.
          </p>
          <p className="text-[15px] leading-relaxed text-foreground mb-3">
            User-uploaded content (photos, documents, floor plans, videos) remains the property of the user. By uploading content, you grant New Parapet LLC a limited, non-exclusive, revocable license to process your uploaded content solely for the purpose of delivering the Service to you. Your content is not used to train AI models.
          </p>
        </div>

        {/* Section 7: Data & Privacy */}
        <div className="mb-8">
          <h2 className="text-base font-bold text-[#1E3A5F] mb-3">7. Data &amp; Privacy</h2>
          <p className="text-[15px] leading-relaxed text-foreground mb-3">
            Your use of the Service is also governed by our{" "}
            <Link href="/privacy" className="text-[#1E3A5F] underline font-medium">Privacy Policy</Link>, which describes how we collect, use, store, and protect your personal information. Please review it carefully.
          </p>
          <p className="text-[15px] leading-relaxed text-foreground mb-3">
            User data is stored securely using industry-standard encryption and access controls. We never sell your personal data to third parties.
          </p>
          <p className="text-[15px] leading-relaxed text-foreground">
            Anonymized, aggregated usage data (with all personally identifiable information removed) may be used to improve platform accuracy and service quality.
          </p>
        </div>

        {/* Section 8: Limitation of Liability */}
        <div className="border-l-4 border-[#EF4444] bg-[rgba(239,68,68,0.05)] rounded-r-xl p-4 mb-8">
          <h2 className="text-base font-bold text-[#1E3A5F] mb-3">8. Limitation of Liability</h2>
          <div className="text-[14px] leading-relaxed text-foreground font-semibold uppercase space-y-3">
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, NEW PARAPET LLC&apos;S TOTAL LIABILITY ARISING OUT OF OR RELATING TO THESE TERMS OR THE SERVICE SHALL NOT EXCEED THE TOTAL AMOUNT PAID BY YOU TO NEW PARAPET LLC IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM.
            </p>
            <p>
              IN NO EVENT SHALL NEW PARAPET LLC BE LIABLE FOR ANY CONSEQUENTIAL, INCIDENTAL, INDIRECT, SPECIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO: RENOVATION COST OVERRUNS, CONTRACTOR PERFORMANCE OR NON-PERFORMANCE, PERMIT DELAYS OR DENIALS, DESIGN OUTCOMES, PROPERTY DAMAGE, OR ANY LOSS RESULTING FROM RELIANCE ON AI-GENERATED CONTENT.
            </p>
            <p>
              SOME JURISDICTIONS DO NOT ALLOW THE EXCLUSION OR LIMITATION OF CERTAIN DAMAGES. IN SUCH JURISDICTIONS, NEW PARAPET LLC&apos;S LIABILITY SHALL BE LIMITED TO THE MAXIMUM EXTENT PERMITTED BY LAW.
            </p>
          </div>
        </div>

        {/* Section 9: Indemnification */}
        <div className="mb-8">
          <h2 className="text-base font-bold text-[#1E3A5F] mb-3">9. Indemnification</h2>
          <p className="text-[15px] leading-relaxed text-foreground">
            You agree to indemnify, defend, and hold harmless New Parapet LLC, its officers, directors, employees, agents, and affiliates from and against any and all claims, liabilities, damages, losses, costs, and expenses (including reasonable attorneys&apos; fees) arising out of or relating to: (a) your use of the Service; (b) your reliance on AI-generated content; (c) your violation of these Terms; or (d) your renovation activities, including any disputes with contractors, subcontractors, or other third parties.
          </p>
        </div>

        {/* Section 10: Dispute Resolution */}
        <div className="mb-8">
          <h2 className="text-base font-bold text-[#1E3A5F] mb-3">10. Dispute Resolution</h2>
          <p className="text-[15px] leading-relaxed text-foreground mb-3">
            Any dispute, controversy, or claim arising out of or relating to these Terms or the Service shall be resolved by binding arbitration administered by the American Arbitration Association (AAA) under its Consumer Arbitration Rules. The arbitration shall be conducted in New York County, New York. The arbitrator shall apply the laws of the State of New York.
          </p>
          <p className="text-[15px] leading-relaxed text-foreground mb-3">
            You and New Parapet LLC each waive the right to participate in a class action lawsuit or class-wide arbitration. All claims must be brought in your individual capacity, not as a plaintiff or class member in any purported class or representative proceeding.
          </p>
          <p className="text-[15px] leading-relaxed text-foreground">
            Notwithstanding the foregoing, either party may bring an individual action in small claims court if the claim qualifies under the court&apos;s jurisdictional limits.
          </p>
        </div>

        {/* Section 11: Governing Law */}
        <div className="mb-8">
          <h2 className="text-base font-bold text-[#1E3A5F] mb-3">11. Governing Law</h2>
          <p className="text-[15px] leading-relaxed text-foreground">
            These Terms shall be governed by and construed in accordance with the laws of the State of New York, without regard to its conflict of law principles.
          </p>
        </div>

        {/* Section 12: Modification & Termination */}
        <div className="mb-8">
          <h2 className="text-base font-bold text-[#1E3A5F] mb-3">12. Modification &amp; Termination</h2>
          <p className="text-[15px] leading-relaxed text-foreground mb-3">
            New Parapet LLC reserves the right to modify these Terms at any time. Material changes will be communicated via the email address associated with your account at least 30 days before taking effect. Your continued use of the Service after the effective date of any modifications constitutes your acceptance of the revised Terms.
          </p>
          <p className="text-[15px] leading-relaxed text-foreground">
            You may delete your account and request deletion of all associated data at any time by emailing support@parapet-ai.com. Upon account deletion, your stored data will be purged within 30 days, except where retention is required by applicable law.
          </p>
        </div>

        {/* Section 13: Severability */}
        <div className="mb-8">
          <h2 className="text-base font-bold text-[#1E3A5F] mb-3">13. Severability</h2>
          <p className="text-[15px] leading-relaxed text-foreground">
            If any provision of these Terms is found to be invalid, illegal, or unenforceable by a court of competent jurisdiction, such finding shall not affect the validity of the remaining provisions, which shall continue in full force and effect.
          </p>
        </div>

        {/* Section 14: Entire Agreement */}
        <div className="mb-8">
          <h2 className="text-base font-bold text-[#1E3A5F] mb-3">14. Entire Agreement</h2>
          <p className="text-[15px] leading-relaxed text-foreground">
            These Terms, together with the{" "}
            <Link href="/privacy" className="text-[#1E3A5F] underline font-medium">Privacy Policy</Link>, constitute the entire agreement between you and New Parapet LLC with respect to the Service and supersede all prior or contemporaneous understandings, communications, or agreements, whether written or oral.
          </p>
        </div>

        {/* Section 15: Contact */}
        <div className="mb-8">
          <h2 className="text-base font-bold text-[#1E3A5F] mb-3">15. Contact</h2>
          <p className="text-[15px] leading-relaxed text-foreground">
            If you have questions about these Terms, please contact us:
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
{/* LEGAL REVIEW REQUIRED BEFORE PUBLICATION */}
