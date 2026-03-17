'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Home, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <Home className="h-6 w-6 text-navy" />
          <span className="text-xl font-bold text-navy tracking-tight">PARAPET</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/dashboard" className="text-sm font-medium text-slate-600 hover:text-navy transition-colors">
            Dashboard
          </Link>
          <Link href="/dashboard/contractors" className="text-sm font-medium text-slate-600 hover:text-navy transition-colors">
            Contractors
          </Link>
          <Link href="/auth/signin">
            <Button variant="outline" size="sm">Sign In</Button>
          </Link>
        </nav>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white">
          <nav className="flex flex-col p-4 space-y-3">
            <Link href="/dashboard" className="text-sm font-medium text-slate-600 hover:text-navy" onClick={() => setMobileOpen(false)}>
              Dashboard
            </Link>
            <Link href="/dashboard/contractors" className="text-sm font-medium text-slate-600 hover:text-navy" onClick={() => setMobileOpen(false)}>
              Contractors
            </Link>
            <Link href="/auth/signin" onClick={() => setMobileOpen(false)}>
              <Button variant="outline" size="sm" className="w-full">Sign In</Button>
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
