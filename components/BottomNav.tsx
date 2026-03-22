'use client';

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Home, Search, FileText, Shield, Bell } from "lucide-react";

const navItems = [
  { path: "/dashboard", icon: Home, label: "Home" },
  { path: "/capture", icon: Search, label: "Discover" },
  { path: "/bids", icon: FileText, label: "Bids" },
  { path: "/payments", icon: Shield, label: "Payments" },
  { path: "/notifications", icon: Bell, label: "Alerts" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="bottom-nav bg-white dark:bg-[hsl(214,25%,13%)] border-t border-border/60" data-testid="bottom-nav">
      <div className="flex items-center justify-around py-2 pb-[max(8px,env(safe-area-inset-bottom))]">
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              href={item.path}
              data-testid={`nav-${item.label.toLowerCase()}`}
            >
              <div className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors ${
                isActive
                  ? "text-[#1E3A5F] dark:text-[#6BA3D6]"
                  : "text-[#64748B] dark:text-[#64748B]"
              }`}>
                <Icon size={20} strokeWidth={isActive ? 2.2 : 1.8} />
                <span className="text-[10px] font-medium tracking-wide">
                  {item.label}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
