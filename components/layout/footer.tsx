import React from 'react';
import Link from 'next/link';
import { Home } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row justify-between items-start gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Home className="h-5 w-5 text-navy" />
              <span className="text-lg font-bold text-navy">PARAPET</span>
            </div>
            <p className="text-sm text-slate-500 max-w-xs">
              Your Renovation. Your Advocate. Zero Conflicts.
            </p>
          </div>

          <div className="flex gap-8 text-sm text-slate-500">
            <Link href="#" className="hover:text-navy transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-navy transition-colors">Terms of Service</Link>
            <Link href="#" className="hover:text-navy transition-colors">Contact</Link>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-slate-400">
          <p>&copy; 2026 Hello Chapter / HAP Construction</p>
          <p>Patent Pending</p>
        </div>
      </div>
    </footer>
  );
}
