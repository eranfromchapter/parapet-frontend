'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Check, ShieldCheck, Clock, Award } from 'lucide-react';
import { api } from '@/lib/api-client';

export default function PricingPage() {
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistSubmitted, setWaitlistSubmitted] = useState(false);
  const [upgradeLoading, setUpgradeLoading] = useState(false);

  const handleUpgrade = async () => {
    setUpgradeLoading(true);
    try {
      await api.submitUpgrade({ tier: 'bidding_pro' });
      alert('Upgrade request submitted! We will contact you shortly.');
    } catch {
      alert('Something went wrong. Please try again.');
    } finally {
      setUpgradeLoading(false);
    }
  };

  const handleWaitlist = async () => {
    if (!waitlistEmail) return;
    try {
      await api.joinWaitlist({ email: waitlistEmail });
      setWaitlistSubmitted(true);
    } catch {
      alert('Something went wrong. Please try again.');
    }
  };

  const tiers = [
    {
      name: 'Free',
      price: '$0',
      description: 'Renovation Readiness Report',
      features: [
        'AI-powered readiness assessment',
        'Cost range estimates',
        'Regulatory checklist',
        'Risk scoring',
        'Downloadable PDF report',
      ],
      cta: (
        <Link href="/intake/home-type">
          <Button variant="outline" className="w-full">Current Plan</Button>
        </Link>
      ),
    },
    {
      name: 'Bidding Pro',
      price: '$299',
      period: '/per project',
      description: 'Get matched with vetted contractors and compare bids',
      popular: true,
      features: [
        'Everything in Free',
        '3 pre-vetted contractor matches',
        'Standardized bid packets',
        'Bid comparison matrix',
        'Scope-of-work templates',
        'Email support',
      ],
      cta: (
        <Button variant="gold" className="w-full" onClick={handleUpgrade} disabled={upgradeLoading}>
          {upgradeLoading ? 'Processing...' : 'Upgrade Now'}
        </Button>
      ),
    },
    {
      name: "Full Owner's Rep",
      price: '$1,499+',
      period: '/per project',
      description: 'End-to-end project management from start to finish',
      comingSoon: true,
      features: [
        'Everything in Bidding Pro',
        'Dedicated project manager',
        'Contract review & negotiation',
        'Weekly progress reports',
        'Change-order management',
        'Final walkthrough & punch list',
      ],
      cta: waitlistSubmitted ? (
        <p className="text-sm text-green-600 font-medium text-center">You&apos;re on the list!</p>
      ) : (
        <div className="flex gap-2">
          <Input
            placeholder="your@email.com"
            value={waitlistEmail}
            onChange={(e) => setWaitlistEmail(e.target.value)}
            type="email"
          />
          <Button variant="outline" onClick={handleWaitlist}>Join</Button>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold text-navy tracking-tight mb-4">From Report to Renovation</h1>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
              Your free Readiness Report is just the start. Upgrade to get matched with vetted contractors, compare bids side-by-side, and keep your project on track.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {tiers.map((tier) => (
              <Card key={tier.name} className={tier.popular ? 'border-2 border-gold relative' : ''}>
                {tier.popular && (
                  <Badge variant="default" className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gold text-white">
                    Most Popular
                  </Badge>
                )}
                {tier.comingSoon && (
                  <Badge variant="outline" className="absolute -top-3 left-1/2 -translate-x-1/2">
                    Coming Soon
                  </Badge>
                )}
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-xl">{tier.name}</CardTitle>
                  <div className="mt-2">
                    <span className="text-4xl font-bold text-navy">{tier.price}</span>
                    {tier.period && <span className="text-sm text-slate-500">{tier.period}</span>}
                  </div>
                  <p className="text-sm text-slate-500 mt-2">{tier.description}</p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <ul className="space-y-3">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm text-slate-700">
                        <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  {tier.cta}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Trust indicators */}
          <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
            {[
              { icon: ShieldCheck, label: 'Vetted Contractors' },
              { icon: Clock, label: '24-Hour Response' },
              { icon: Award, label: 'Satisfaction Guarantee' },
            ].map((item) => (
              <div key={item.label} className="flex flex-col items-center gap-2">
                <item.icon className="h-8 w-8 text-gold" />
                <p className="text-sm font-medium text-slate-700">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
