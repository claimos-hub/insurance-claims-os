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
  Sparkles,
  Copy,
  Check,
  X,
  Send,
  CheckCircle2,
} from "lucide-react";
import {
  getUrgentActions,
  getFollowUpActions,
  getOpportunityActions,
  getActionRecommendation,
  generateActionMessage,
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

function ActionCard({
  item,
  onGenerateMessage,
  onMarkDone,
  isDone,
}: {
  item: ActionItem;
  onGenerateMessage: (item: ActionItem) => void;
  onMarkDone: (id: string) => void;
  isDone: boolean;
}) {
  const styles = priorityStyles[item.priority];
  const CtaIcon = ctaIcons[item.cta] || FileText;
  const rec = getActionRecommendation(item);

  if (isDone) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50/50 p-4 opacity-60">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-500" />
          <p className="text-sm text-green-700 line-through">{item.issue}</p>
          <span className="text-xs text-green-600 mr-auto">טופל</span>
        </div>
      </div>
    );
  }

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

          {/* AI Recommendation */}
          <div className="mt-2 flex items-start gap-1.5 bg-white/70 rounded-lg px-3 py-2 border border-gray-100">
            <Sparkles className="w-3.5 h-3.5 text-purple-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-medium text-purple-700">{rec.text}</p>
              <p className="text-[10px] text-gray-500 mt-0.5">{rec.reason}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick actions row */}
      <div className="mt-3 flex items-center gap-2 flex-wrap">
        <Link
          href={item.linkHref}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors"
        >
          <CtaIcon className="w-3.5 h-3.5" />
          {item.ctaLabel}
        </Link>

        {item.customerPhone && (
          <a
            href={`tel:${item.customerPhone.replace(/-/g, "")}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-700 hover:bg-slate-800 text-white transition-colors"
          >
            <Phone className="w-3.5 h-3.5" />
            התקשר
          </a>
        )}

        {item.customerPhone && (
          <a
            href={`https://wa.me/972${item.customerPhone.replace(/^0/, "").replace(/-/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-green-600 hover:bg-green-700 text-white transition-colors"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            WhatsApp
          </a>
        )}

        <button
          onClick={() => onGenerateMessage(item)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-purple-100 hover:bg-purple-200 text-purple-700 transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5" />
          צור הודעה
        </button>

        <button
          onClick={() => onMarkDone(item.id)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors mr-auto"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          טופל
        </button>
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
  const [doneItems, setDoneItems] = useState<Set<string>>(new Set());
  const [messageModal, setMessageModal] = useState<{ item: ActionItem; message: string } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setUrgent(getUrgentActions());
    setFollowUp(getFollowUpActions());
    setOpportunities(getOpportunityActions());
  }, []);

  const totalUrgent = urgent.filter((i) => i.priority === "red").length;
  const activeCount =
    urgent.filter((i) => !doneItems.has(i.id)).length +
    followUp.filter((i) => !doneItems.has(i.id)).length +
    opportunities.filter((i) => !doneItems.has(i.id)).length;

  function handleGenerateMessage(item: ActionItem) {
    const message = generateActionMessage(item);
    setMessageModal({ item, message });
    setCopied(false);
  }

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleMarkDone(id: string) {
    setDoneItems((prev) => new Set(prev).add(id));
  }

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
            {activeCount} פריטים פתוחים
            {totalUrgent > 0 && (
              <span className="text-red-600 font-semibold mr-1">
                ({totalUrgent} דחופים)
              </span>
            )}
            {doneItems.size > 0 && (
              <span className="text-green-600 mr-1">
                · {doneItems.size} טופלו
              </span>
            )}
          </p>
        </div>
        <button
          onClick={() => {
            setUrgent(getUrgentActions());
            setFollowUp(getFollowUpActions());
            setOpportunities(getOpportunityActions());
            setDoneItems(new Set());
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
          count={urgent.filter((i) => !doneItems.has(i.id)).length}
          color="bg-red-100 text-red-600"
        />
        {urgent.length === 0 ? (
          <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-center text-green-700">
            אין משימות דחופות כרגע
          </div>
        ) : (
          <div className="space-y-3">
            {urgent.map((item) => (
              <ActionCard
                key={item.id}
                item={item}
                onGenerateMessage={handleGenerateMessage}
                onMarkDone={handleMarkDone}
                isDone={doneItems.has(item.id)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Follow-ups */}
      <section className="mb-8">
        <SectionHeader
          icon={Clock}
          title="מעקבים — שיחות ותביעות פתוחות"
          count={followUp.filter((i) => !doneItems.has(i.id)).length}
          color="bg-amber-100 text-amber-600"
        />
        {followUp.length === 0 ? (
          <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-center text-green-700">
            אין מעקבים פתוחים
          </div>
        ) : (
          <div className="space-y-3">
            {followUp.map((item) => (
              <ActionCard
                key={item.id}
                item={item}
                onGenerateMessage={handleGenerateMessage}
                onMarkDone={handleMarkDone}
                isDone={doneItems.has(item.id)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Opportunities */}
      <section className="mb-8">
        <SectionHeader
          icon={TrendingUp}
          title="הזדמנויות — upsell וקשר עם לקוחות"
          count={opportunities.filter((i) => !doneItems.has(i.id)).length}
          color="bg-green-100 text-green-600"
        />
        {opportunities.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 text-center text-gray-500">
            אין הזדמנויות חדשות כרגע
          </div>
        ) : (
          <div className="space-y-3">
            {opportunities.map((item) => (
              <ActionCard
                key={item.id}
                item={item}
                onGenerateMessage={handleGenerateMessage}
                onMarkDone={handleMarkDone}
                isDone={doneItems.has(item.id)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Generate Message Modal */}
      {messageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <div>
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-500" />
                  הודעה מוכנה
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  {messageModal.item.customerName} — {messageModal.item.customerPhone}
                </p>
              </div>
              <button
                onClick={() => setMessageModal(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-5 flex-1 overflow-y-auto">
              <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                <pre className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800 font-sans">
                  {messageModal.message}
                </pre>
              </div>
            </div>

            <div className="p-4 border-t border-gray-200 flex justify-between gap-3">
              <a
                href={`https://wa.me/972${messageModal.item.customerPhone?.replace(/^0/, "").replace(/-/g, "")}?text=${encodeURIComponent(messageModal.message)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
              >
                <Send className="w-4 h-4" />
                שלח ב-WhatsApp
              </a>
              <button
                onClick={() => handleCopy(messageModal.message)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    הועתק!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    העתק
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
