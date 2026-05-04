"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Users,
  Plus,
  LogOut,
  Shield,
  MessageCircle,
  Zap,
  PhoneIncoming,
  Flame,
} from "lucide-react";

const navItems = [
  { href: "/actions", label: "מרכז פעולות", icon: Flame },
  { href: "/dashboard", label: "דשבורד", icon: LayoutDashboard },
  { href: "/automation", label: "סוכן אוטומטי", icon: Zap },
  { href: "/intake", label: "קליטת תביעות", icon: MessageCircle },
  { href: "/claims", label: "תביעות", icon: FileText },
  { href: "/claims/new", label: "תביעה חדשה", icon: Plus },
  { href: "/customers", label: "לקוחות", icon: Users },
  { href: "/inbox", label: "תיבת WhatsApp", icon: PhoneIncoming },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed right-0 top-0 h-full w-64 bg-slate-900 text-slate-200 flex flex-col z-40">
      <div className="p-6 border-b border-slate-700">
        <Link href="/actions" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">ClaimPilot</h1>
            <p className="text-xs text-slate-400">ניהול תביעות חכם</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && item.href !== "/actions" && pathname.startsWith(item.href) && item.href !== "/claims/new");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-700">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="w-8 h-8 bg-slate-600 rounded-full flex items-center justify-center text-sm font-bold">
            ש
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">סוכן ביטוח</p>
            <p className="text-xs text-slate-400 truncate">agent@claimpilot.com</p>
          </div>
        </div>
        <Link
          href="/login"
          className="flex items-center gap-3 px-4 py-2 mt-2 rounded-lg text-sm text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <LogOut className="w-4 h-4" />
          התנתק
        </Link>
      </div>
    </aside>
  );
}
