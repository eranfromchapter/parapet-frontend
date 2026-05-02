'use client';

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Home, Search, FileText, User, Bell } from "lucide-react";

// Same-origin proxy (see next.config.mjs rewrites) — avoids Safari CORS preflight issues.
const API_URL = "/api/backend";

const navItems = [
  { path: "/dashboard", icon: Home, label: "Home" },
  { path: "/capture", icon: Search, label: "Discover" },
  // /bids and /payments don't ship yet — point at routes that exist today
  // so taps don't 404. The labels stay distinct from the items above so the
  // five-tab layout still reads cleanly.
  { path: "/documents", icon: FileText, label: "Docs" },
  { path: "/account", icon: User, label: "Account" },
  { path: "/notifications", icon: Bell, label: "Alerts" },
];

export default function BottomNav() {
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchUnread() {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("parapet_token") : null;
        if (!token) return;
        const res = await fetch(`${API_URL}/v1/notifications/unread-count`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });
        if (res.ok) {
          const data = await res.json();
          setUnreadCount(data.unread_count ?? 0);
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        /* fail silently for other errors */
      }
    }

    fetchUnread();
    const interval = setInterval(fetchUnread, 60000);
    return () => { controller.abort(); clearInterval(interval); };
  }, []);

  return (
    <nav className="bottom-nav bg-white dark:bg-[hsl(214,25%,13%)] border-t border-border/60" data-testid="bottom-nav">
      <div className="flex items-center justify-around py-2 pb-[max(8px,env(safe-area-inset-bottom))]">
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          const Icon = item.icon;
          const showBadge = item.path === "/notifications" && unreadCount > 0;
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
                <div className="relative">
                  <Icon size={20} strokeWidth={isActive ? 2.2 : 1.8} />
                  {showBadge && (
                    <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 flex items-center justify-center px-1 rounded-full bg-[#EF4444] text-white text-[9px] font-bold leading-none">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </div>
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
