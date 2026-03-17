import React from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { ArrowRight, TrendingUp, DollarSign, ShieldCheck, ClipboardCheck, BarChart3, FileText, Target, Lightbulb, Download, ListChecks } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Hero */}
      <section className="bg-navy text-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-20 sm:py-28 text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            Your Renovation. Your Advocate.<br />
            <span className="text-gold">Zero Conflicts.</span>
          </h1>
          <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto mb-10">
            Get a free AI-powered Readiness Report with cost estimates, risk assessment, and regulatory checklists — in minutes.
          </p>
          <Link href="/readiness">
            <Button variant="gold" size="lg" className="text-lg px-10 py-6 h-auto">
              Get Your Free Readiness Report <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="bg-slate-50 border-y border-slate-200">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
            <div className="flex flex-col items-center gap-2">
              <TrendingUp className="h-6 w-6 text-gold" />
              <p className="text-sm font-medium text-slate-700">75% of renovations go over budget</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <DollarSign className="h-6 w-6 text-gold" />
              <p className="text-sm font-medium text-slate-700">$425B annual renovation market</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-gold" />
              <p className="text-sm font-medium text-slate-700">$0 — we never charge contractors</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-navy text-center mb-12 tracking-tight">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                title: 'Tell Us About Your Project',
                desc: '5-minute questionnaire about your home, scope, budget, and timeline.',
                icon: ClipboardCheck,
              },
              {
                step: '2',
                title: 'Get Your Readiness Report',
                desc: 'AI-powered analysis with cost ranges, risk scores, and regulatory requirements.',
                icon: BarChart3,
              },
              {
                step: '3',
                title: 'Upgrade to Bidding Pro',
                desc: 'Get matched with 3 pre-vetted contractors, standardized bid packets, and scope documents.',
                icon: Target,
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="mx-auto h-16 w-16 rounded-full bg-gold/10 flex items-center justify-center mb-4">
                  <item.icon className="h-8 w-8 text-gold" />
                </div>
                <div className="inline-block bg-navy text-white text-xs font-bold px-2 py-1 rounded-full mb-3">
                  Step {item.step}
                </div>
                <h3 className="text-lg font-semibold text-navy mb-2">{item.title}</h3>
                <p className="text-sm text-slate-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What's In Your Free Report */}
      <section className="py-20 bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-navy text-center mb-12 tracking-tight">What&apos;s In Your Free Report</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: Lightbulb, label: 'AI-powered readiness assessment' },
              { icon: DollarSign, label: 'Cost range estimates (P10–P90)' },
              { icon: ClipboardCheck, label: 'Regulatory checklist' },
              { icon: BarChart3, label: 'Risk scoring (0–10 composite)' },
              { icon: ShieldCheck, label: 'Contractor screening guidance' },
              { icon: TrendingUp, label: 'Market context analysis' },
              { icon: Download, label: 'Downloadable PDF report' },
              { icon: ListChecks, label: 'Next steps action plan' },
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center text-center p-4 bg-white rounded-xl border border-slate-200">
                <item.icon className="h-8 w-8 text-gold mb-3" />
                <p className="text-sm font-medium text-slate-700">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why PARAPET */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-navy text-center mb-12 tracking-tight">Why PARAPET</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: 'Structurally Neutral',
                desc: 'We are paid by you. We never accept contractor commissions, referral fees, or vendor payments. Ever.',
                icon: ShieldCheck,
              },
              {
                title: 'AI-Powered Precision',
                desc: 'Our estimates use real NYC project data from hundreds of renovations — not generic national averages.',
                icon: Target,
              },
              {
                title: 'Your Data, Your Control',
                desc: 'Your budget is never shared with contractors. Every recommendation includes transparent confidence levels.',
                icon: FileText,
              },
            ].map((item) => (
              <div key={item.title} className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                <item.icon className="h-10 w-10 text-gold mb-4" />
                <h3 className="text-lg font-semibold text-navy mb-2">{item.title}</h3>
                <p className="text-sm text-slate-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-navy text-white py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4 tracking-tight">Ready to start?</h2>
          <p className="text-slate-300 mb-8">Get your free Readiness Report now.</p>
          <Link href="/readiness">
            <Button variant="gold" size="lg" className="text-lg px-10 py-6 h-auto">
              Get Your Free Readiness Report <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
