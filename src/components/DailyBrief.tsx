"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  X,
  Sparkles,
  AlertTriangle,
  Clock,
  Shield,
  MessageCircle,
  ChevronLeft,
  Flame,
} from "lucide-react";
import { getDailyBrief, type DailyBriefData } from "@/lib/mock-data";

export default function DailyBrief() {
  const [visible, setVisible] = useState(false);
  const [brief, setBrief] = useState<DailyBriefData | null>(null);

  useEffect(() => {
    // Show once per session
    const key = "claimos_daily_brief_shown";
    const today = new Date().toDateString();
    if (sessionStorage.getItem(key) === today) return;
    sessionStorage.setItem(key, today);

    const data = getDailyBrief();
    setBrief(data);
    setVisible(true);
  }, []);

  if (!visible || !brief) return null;

  const hasIssues =
    brief.riskCustomers > 0 ||
    brief.stuckClaims > 0 ||
    brief.expiringWeek > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="bg-gradient-to-l from-blue-600 to-indigo-700 px-6 py-5 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold">{brief.greeting}, סוכן!</h2>
                <p className="text-sm text-blue-100">מה חשוב היום:</p>
              </div>
            </div>
            <button
              onClick={() => setVisible(false)}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Stats grid */}
        <div className="px-6 py-4">
          <div className="grid grid-cols-2 gap-3">
            {brief.riskCustomers > 0 && (
              <StatCard
                icon={<AlertTriangle className="w-4 h-4 text-red-500" />}
                value={brief.riskCustomers}
                label="לקוחות בסיכון"
                color="bg-red-50 border-red-100"
              />
            )}
            {brief.stuckClaims > 0 && (
              <StatCard
                icon={<Clock className="w-4 h-4 text-amber-500" />}
                value={brief.stuckClaims}
                label="תביעות תקועות"
                color="bg-amber-50 border-amber-100"
              />
            )}
            {brief.expiringToday > 0 && (
              <StatCard
                icon={<Flame className="w-4 h-4 text-red-600" />}
                value={brief.expiringToday}
                label="פוליסות פגות היום"
                color="bg-red-50 border-red-100"
              />
            )}
            {brief.expiringWeek > 0 && (
              <StatCard
                icon={<Shield className="w-4 h-4 text-blue-500" />}
                value={brief.expiringWeek}
                label="פוליסות פגות השבוע"
                color="bg-blue-50 border-blue-100"
              />
            )}
            <StatCard
              icon={<MessageCircle className="w-4 h-4 text-green-500" />}
              value={brief.openConversations}
              label="שיחות פתוחות"
              color="bg-green-50 border-green-100"
            />
          </div>

          {/* Top actions */}
          {brief.topActions.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-semibold text-gray-500 mb-2">פעולות ראשונות להיום:</p>
              <div className="space-y-1.5">
                {brief.topActions.map((action, i) => (
                  <Link
                    key={i}
                    href={action.href}
                    onClick={() => setVisible(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-sm text-gray-700 transition-colors group"
                  >
                    <span className="text-xs text-gray-400 font-mono">{i + 1}.</span>
                    <span className="flex-1 truncate">{action.text}</span>
                    <ChevronLeft className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {!hasIssues && (
            <div className="mt-4 text-center text-sm text-green-600 bg-green-50 rounded-lg p-3">
              הכל מסודר היום! אין פריטים דחופים.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-between">
          <button
            onClick={() => setVisible(false)}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            סגור
          </button>
          <Link
            href="/actions"
            onClick={() => setVisible(false)}
            className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
          >
            למרכז הפעולות
            <ChevronLeft className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  value,
  label,
  color,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  color: string;
}) {
  return (
    <div className={`rounded-xl border p-3 ${color}`}>
      <div className="flex items-center gap-2 mb-1">{icon}</div>
      <p className="text-xl font-bold text-gray-900">{value}</p>
      <p className="text-[11px] text-gray-600">{label}</p>
    </div>
  );
}
