'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, LayoutDashboard, FolderOpen, FileText, HardHat, User, Settings, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard', label: 'Projects', icon: FolderOpen },
  { href: '/dashboard', label: 'Reports', icon: FileText },
  { href: '/dashboard/contractors', label: 'Contractors', icon: HardHat },
  { href: '/dashboard', label: 'Profile', icon: User },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navContent = (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-6 py-5 border-b border-navy-600">
        <Home className="h-6 w-6 text-gold" />
        <span className="text-xl font-bold text-white tracking-tight">PARAPET</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href && item.label !== 'Projects' && item.label !== 'Reports' && item.label !== 'Profile'
            || (item.label === 'Contractors' && pathname === '/dashboard/contractors')
            || (item.label === 'Settings' && pathname === '/dashboard/settings')
            || (item.label === 'Dashboard' && pathname === '/dashboard');
          return (
            <Link
              key={item.label}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'text-gold bg-navy-600 border-l-4 border-gold'
                  : 'text-slate-300 hover:text-white hover:bg-navy-600'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-6 py-4 border-t border-navy-600">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-gold/20 flex items-center justify-center">
            <User className="h-4 w-4 text-gold" />
          </div>
          <div className="text-sm">
            <p className="text-white font-medium">Homeowner</p>
            <p className="text-slate-400 text-xs">Free Plan</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-navy text-white rounded-lg shadow-lg"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle sidebar"
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        'fixed lg:static inset-y-0 left-0 z-40 w-64 bg-navy transition-transform duration-300 lg:translate-x-0',
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        {navContent}
      </aside>
    </>
  );
}
