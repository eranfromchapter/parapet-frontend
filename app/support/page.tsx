'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import { LifeBuoy, Mail } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import BottomNav from "@/components/BottomNav";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const API_URL = "/api/backend";

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

// Hardcoded fallback covers the full FAQ scope from the spec so the page is
// useful even when the support endpoint is down.
const FALLBACK_FAQ: FaqItem[] = [
  {
    id: "sign-in",
    question: "How do I sign in?",
    answer:
      "Enter the email you used to create your account on the sign-in page. We'll send a magic link or sign you straight in if you've already verified your email — no password to remember.",
  },
  {
    id: "verify-email",
    question: "How does email verification work?",
    answer:
      "After your first readiness report, we send a verification link to your inbox. Tap it to confirm your address. The link expires after 24 hours; you can request a new one from the sign-in page.",
  },
  {
    id: "space-scan",
    question: "How do I upload a space scan?",
    answer:
      "Use the Polycam app to scan your property and export the floor-plan PDF. From the Discover tab, tap LiDAR 3D Scan and pick the PDF — PARAPET parses the rooms automatically.",
  },
  {
    id: "ai-estimate",
    question: "How does the AI estimate work?",
    answer:
      "We combine your spatial scan, video walkthrough, and intake answers with our renovation pricing data to produce a low / expected / high cost range. Estimates are advisory and should be validated with a licensed contractor.",
  },
  {
    id: "design-studio",
    question: "How do I use Design Studio?",
    answer:
      "Open Design Studio from your dashboard, pick a room, describe your vision (or dictate it with the mic), and tap Generate. We'll produce a few concepts you can favorite, refine, and sync to your estimate.",
  },
  {
    id: "data",
    question: "What data do you collect?",
    answer:
      "We store the information you provide in the intake wizard (project scope, budget, contact info), the files you upload (scans, videos, photos), and the AI artifacts we generate from them (estimates, designs). See the Privacy Policy for the full list.",
  },
  {
    id: "contact",
    question: "How do I contact support?",
    answer:
      "Email support@parapet-ai.com and a human will get back to you within one business day.",
  },
  {
    id: "delete",
    question: "How do I delete my account?",
    answer:
      "Open the Account page from the bottom nav, scroll to the bottom, and tap Delete Account. You can also email support@parapet-ai.com to request deletion.",
  },
];

export default function SupportPage() {
  const [faq, setFaq] = useState<FaqItem[]>(FALLBACK_FAQ);

  // Best-effort fetch — if the API is down or hasn't shipped this endpoint
  // yet, the hardcoded list is already on screen.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_URL}/v1/support/faq`);
        if (!res.ok) return;
        const data = await res.json().catch(() => null);
        // Server may use {faq:[...]} | {items:[...]} | top-level array.
        // Each entry may use {question, answer} or {q, a} field names.
        type ServerFaqItem = { id?: string; question?: string; answer?: string; q?: string; a?: string };
        const rawItems: ServerFaqItem[] = Array.isArray(data?.faq)
          ? data.faq
          : Array.isArray(data?.items)
          ? data.items
          : Array.isArray(data)
          ? data
          : [];
        const normalized: FaqItem[] = rawItems
          .filter((it) => it && (it.question ?? it.q) && (it.answer ?? it.a))
          .map((it, i) => ({
            id: typeof it.id === "string" ? it.id : `srv-${i}`,
            question: (it.question ?? it.q) as string,
            answer: (it.answer ?? it.a) as string,
          }));
        if (!cancelled && normalized.length > 0) {
          setFaq(normalized);
        }
      } catch {
        /* keep fallback */
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="max-w-[430px] mx-auto min-h-[100dvh] flex flex-col bg-[#FAFBFC] relative shadow-xl">
      <PageHeader title="Help & Support" backPath="/account" />

      <div className="flex-1 px-4 pt-4 pb-4 overflow-y-auto">
        <div className="bg-white rounded-xl border border-border/50 p-4 mb-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-[#1E3A5F]/8 flex items-center justify-center shrink-0">
              <LifeBuoy size={20} className="text-[#1E3A5F]" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">Frequently asked questions</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Quick answers to the most common questions about PARAPET.
              </p>
            </div>
          </div>
        </div>

        <Accordion type="single" collapsible className="space-y-2">
          {faq.map((item) => (
            <AccordionItem
              key={item.id}
              value={item.id}
              className="bg-white rounded-xl border border-border/50 px-4"
            >
              <AccordionTrigger className="py-3 text-sm font-semibold text-foreground hover:no-underline">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="text-xs text-muted-foreground leading-relaxed pb-3">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="mt-6 rounded-xl border border-border/50 bg-white p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-[#2BCBBA]/15 flex items-center justify-center shrink-0">
              <Mail size={20} className="text-[#1E8A7E]" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">Need more help?</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Email{" "}
                <Link
                  href="mailto:support@parapet-ai.com"
                  className="font-semibold text-[#1E3A5F] underline-offset-2 hover:underline"
                >
                  support@parapet-ai.com
                </Link>{" "}
                and a human will reply within one business day.
              </p>
            </div>
          </div>
        </div>

        <div className="h-4" />
      </div>

      <BottomNav />
    </div>
  );
}
