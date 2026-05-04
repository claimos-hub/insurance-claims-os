"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Clock,
  TrendingUp,
  FileText,
  Phone,
  MessageCircle,
  ChevronLeft,
  Flame,
  RefreshCw,
} from "lucide-react";
import {
  getUrgentActions,
  getFollowUpActions,
  getOpportunityActions,
  type ActionItem,
  type ActionPriority,
} from "@/lib/mock-data";

const priorityStyles: Record<ActionPriority, { border: string; bg: string; dot: string }> = {
  red: { border: "border-red-200", bg: "bg-red-50", dot: "bg-red-500" },
  orange: { border: "border-amber-200", bg: "bg-amber-50", dot: "bg-amber-500" },
  green: { border: "border-green-200", bg: "bg-green-50", dot: "bg-green-500" },
};

const ctaIcons: Record<string, typeof FileText> = {
  open_claim: FileText,
  open_whatsapp: MessageCircle,
  call: Phone,
  open_customer: ChevronLeft,
};

const ctaStyles: Record<string, string> = {
  open_claim: "bg-blue-600 hover:bg-blue-700 text-white",
  open_whatsapp: "bg-green-600 hover:bg-green-700 text-white",
  call: "bg-slate-700 hover:bg-slate-800 text-white",
  open_customer: "bg-indigo-600 hover:bg-indigo-700 text-white",
};

function ActionCard({ item }: { item: ActionItem }) {
  const styles = priorityStyles[item.priority];
  const CtaIcon = ctaIcons[item.cta] || FileText;

  return (
    <div className={`rounded-xl border ${styles.border} ${styles.bg} p-4 transition-shadow hover:shadow-md`}>
      <div className="flex items-start gap-3">
        <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${styles.dot}`} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900">{item.customerName}</p>
          <p className="text-sm text-gray-600 mt-0.5">{item.issue}</p>
          {item.customerPhone && (
            <p className="text-xs text-gray-400 mt-1">{item.customerPhone}</p>
          )}
        </div>
        <Link
          href={item.linkHref}
          className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${ctaStyles[item.cta]}`}
        >
          <CtaIcon className="w-3.5 h-3.5" />
          {item.ctaLabel}
        </Link>
      </div>
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  count,
  color,
}: {
  icon: typeof AlertTriangle;
  title: string;
  count: number;
  color: string;
}) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <h2 className="text-lg font-bold text-gray-900">{title}</h2>
      {count > 0 && (
        <span className="text-xs font-semibold bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">
          {count}
        </span>
      )}
    </div>
  );
}

export default function ActionsPage() {
  const [urgent, setUrgent] = useState<ActionItem[]>([]);
  const [followUp, setFollowUp] = useState<ActionItem[]>([]);
  const [opportunities, setOpportunities] = useState<ActionItem[]>([]);

  useEffect(() => {
    setUrgent(getUrgentActions());
    setFollowUp(getFollowUpActions());
    setOpportunities(getOpportunityActions());
  }, []);

  const totalUrgent = urgent.filter((i) => i.priority === "red").length;

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Flame className="w-7 h-7 text-orange-500" />
            מרכז פעולות
          </h1>
          <p className="text-gray-500 mt-1">
            כל המשימות שלך במקום אחד — {urgent.length + followUp.length + opportunities.length} פריטים פתוחים
            {totalUrgent > 0 && (
              <span className="text-red-600 font-semibold mr-1">
                ({totalUrgent} דחופים)
              </span>
            )}
          </p>
        </div>
        <button
          onClick={() => {
            setUrgent(getUrgentActions());
            setFollowUp(getFollowUpActions());
            setOpportunities(getOpportunityActions());
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          רענן
        </button>
      </div>

      {/* Urgent Tasks */}
      <section className="mb-8">
        <SectionHeader
          icon={AlertTriangle}
          title="דחוף — דורש טיפול מיידי"
          count={urgent.length}
          color="bg-red-100 text-red-600"
        />
        {urgent.length === 0 ? (
          <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-center text-green-700">
            אין משימות דחופות כרגע
          </div>
        ) : (
          <div className="space-y-3">
            {urgent.map((item) => (
              <ActionCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </section>

      {/* Follow-ups */}
      <section className="mb-8">
        <SectionHeader
          icon={Clock}
          title="מעקבים — שיחות ותביעות פתוחות"
          count={followUp.length}
          color="bg-amber-100 text-amber-600"
        />
        {followUp.length === 0 ? (
          <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-center text-green-700">
            אין מעקבים פתוחים
          </div>
        ) : (
          <div className="space-y-3">
            {followUp.map((item) => (
              <ActionCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </section>

      {/* Opportunities */}
      <section className="mb-8">
        <SectionHeader
          icon={TrendingUp}
          title="הזדמנויות — upsell וקשר עם לקוחות"
          count={opportunities.length}
          color="bg-green-100 text-green-600"
        />
        {opportunities.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 text-center text-gray-500">
            אין הזדמנויות חדשות כרגע
          </div>
        ) : (
          <div className="space-y-3">
            {opportunities.map((item) => (
              <ActionCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
