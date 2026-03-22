import Link from "next/link";
import ParapetLogo from "@/components/ParapetLogo";
import { Button } from "@/components/ui/button";
import {
  Shield, Eye, Scale, Brain, BarChart3, Gavel,
  Clock, DollarSign, Camera, ArrowRight, AlertTriangle,
} from "lucide-react";

const platformNumbers = [
  { value: "37+", label: "AI-powered tools" },
  { value: "7\u201314d", label: "Early delay alerts" },
  { value: "100%", label: "Conflict-free" },
];

const coreCapabilities = [
  {
    icon: Brain,
    title: "AI Readiness Assessment",
    desc: "Know your project\u2019s feasibility, cost range, and risk profile before you spend a dollar.",
  },
  {
    icon: BarChart3,
    title: "Bid Normalization & Scoring",
    desc: "Compare contractor bids apples-to-apples. AI flags scope gaps, pricing risks, and missing coverage.",
  },
  {
    icon: Gavel,
    title: "Contract Risk Analysis",
    desc: "Every clause reviewed for liability, payment risk, and missing protections \u2014 in plain English.",
  },
  {
    icon: Clock,
    title: "Predictive Schedule Monitoring",
    desc: "Delay alerts 7\u201314 days before impact. Recovery options with cost and risk trade-offs, not surprises.",
  },
  {
    icon: DollarSign,
    title: "Payment Guardrails & Lien Shield",
    desc: "No payment releases without verified lien waivers. Your money stays protected at every milestone.",
  },
  {
    icon: Camera,
    title: "AI Defect Detection",
    desc: "Computer vision catches quality issues your eyes might miss. Documented, tracked, and resolved.",
  },
];

export default function WelcomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Hero — full-width navy gradient, centered content */}
      <div className="parapet-gradient w-full">
        <div className="max-w-3xl mx-auto flex flex-col items-center justify-center px-6 pt-16 pb-10 md:pt-24 md:pb-16 text-white">
          <ParapetLogo size={56} className="text-white mb-5 md:mb-6" />
          <h1 className="text-2xl md:text-4xl font-bold tracking-tight text-center mb-2">
            PARAPET
          </h1>
          <p className="text-[15px] md:text-lg text-white/90 text-center max-w-[300px] md:max-w-md leading-relaxed font-medium mb-1">
            The only one on the job site who works for you.
          </p>
          <p className="text-xs md:text-sm text-white/55 text-center max-w-[260px] md:max-w-sm leading-relaxed">
            AI-powered renovation governance that protects your budget, timeline, and peace of mind.
          </p>
        </div>
      </div>

      {/* Social proof strip */}
      <div className="bg-[#1E3A5F]/[0.04] border-b border-border/30 py-4 px-6">
        <div className="max-w-2xl mx-auto grid grid-cols-3 gap-2">
          {platformNumbers.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-base md:text-lg font-bold text-[#1E3A5F]">{stat.value}</p>
              <p className="text-[9px] md:text-xs text-muted-foreground leading-tight mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Our Promise — cards side-by-side on desktop */}
      <div className="px-6 pt-7 pb-2 md:pt-12 md:pb-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-xs md:text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 md:mb-6 md:text-center">
            Our Promise
          </h2>

          <div className="space-y-5 md:space-y-0 md:grid md:grid-cols-3 md:gap-6">
            <div className="md:bg-card md:rounded-2xl md:border md:border-border/50 md:p-6 md:shadow-sm flex items-start gap-3.5 md:flex-col md:items-center md:text-center">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-[#1E3A5F]/10 flex items-center justify-center flex-shrink-0">
                <Shield size={18} className="text-[#1E3A5F] md:!w-5 md:!h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Conflict-Free Governance</h3>
                <p className="text-xs text-muted-foreground mt-0.5 md:mt-2 leading-relaxed">
                  We earn no fees, commissions, or referral payments from contractors, vendors, or anyone involved in your project. Our only client is you. Our only revenue source is you. Our loyalty is undivided.
                </p>
              </div>
            </div>

            <div className="md:bg-card md:rounded-2xl md:border md:border-border/50 md:p-6 md:shadow-sm flex items-start gap-3.5 md:flex-col md:items-center md:text-center">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                <Eye size={18} className="text-emerald-600 md:!w-5 md:!h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Full Transparency</h3>
                <p className="text-xs text-muted-foreground mt-0.5 md:mt-2 leading-relaxed">
                  Every recommendation shows the evidence behind it — the data sources, confidence levels, and reasoning. When we flag a risk, you see exactly what triggered it and why it matters. No black boxes.
                </p>
              </div>
            </div>

            <div className="md:bg-card md:rounded-2xl md:border md:border-border/50 md:p-6 md:shadow-sm flex items-start gap-3.5 md:flex-col md:items-center md:text-center">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                <Scale size={18} className="text-amber-600 md:!w-5 md:!h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">We Recommend. You Decide.</h3>
                <p className="text-xs text-muted-foreground mt-0.5 md:mt-2 leading-relaxed">
                  We conduct thorough due diligence on every contractor, bid, contract, and change order — so you don&apos;t have to. But every decision remains yours. We never act without your approval.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* What You Get — 2-column grid on desktop */}
      <div className="px-6 pt-6 pb-2 md:pt-10 md:pb-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-xs md:text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 md:mb-6 md:text-center">
            What You Get
          </h2>
          <div className="space-y-3.5 md:space-y-0 md:grid md:grid-cols-2 md:gap-5">
            {coreCapabilities.map((cap) => (
              <div key={cap.title} className="flex items-start gap-3 md:bg-card md:rounded-xl md:border md:border-border/50 md:p-4 md:shadow-sm">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-[#1E3A5F]/[0.08] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <cap.icon size={14} className="text-[#1E3A5F] md:!w-[18px] md:!h-[18px]" />
                </div>
                <div>
                  <p className="text-[13px] md:text-sm font-semibold text-foreground leading-tight">{cap.title}</p>
                  <p className="text-[11px] md:text-xs text-muted-foreground mt-0.5 leading-relaxed">{cap.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* The Reality — amber callout */}
      <div className="px-6 pt-7 pb-6 md:pt-10 md:pb-10">
        <div className="max-w-2xl mx-auto">
          <div className="bg-amber-50 border border-amber-200/60 rounded-2xl p-5 md:p-8">
            <div className="flex items-center gap-2 mb-2.5 md:mb-3">
              <AlertTriangle size={16} className="text-amber-600 md:!w-5 md:!h-5" />
              <p className="text-xs md:text-sm font-bold text-amber-800 uppercase tracking-wider">The Reality</p>
            </div>
            <p className="text-[13px] md:text-base text-amber-900 leading-relaxed font-medium mb-2 md:mb-3">
              80% of home renovations go over budget. 70% run past deadline. Most homeowners have no independent advocate reviewing their contractor&apos;s work.
            </p>
            <p className="text-xs md:text-sm text-amber-700/80 leading-relaxed">
              PARAPET changes that. We sit between you and the complexity — analyzing bids, reviewing contracts, monitoring schedules, verifying payments, and flagging problems before they compound. Like having a seasoned owner&apos;s representative in your pocket, powered by AI.
            </p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="px-6 pt-4 pb-10 md:pt-6 md:pb-16">
        <div className="max-w-md mx-auto space-y-4">
          <Link href="/intake/home-type">
            <Button
              className="w-full h-12 md:h-14 bg-[#1E3A5F] hover:bg-[#2A4F7A] text-white font-semibold text-sm md:text-base rounded-xl shadow-lg shadow-[#1E3A5F]/20"
            >
              <span>Get Your Free Readiness Report</span>
              <ArrowRight size={16} className="ml-2" />
            </Button>
          </Link>
          <p className="text-[10px] md:text-xs text-center text-muted-foreground">
            No credit card required. Your complimentary AI assessment takes 5 minutes.
          </p>
          <p className="text-[10px] md:text-xs text-center text-muted-foreground/70 font-medium italic">
            Renovation without the fiction.
          </p>
        </div>
      </div>
    </div>
  );
}
