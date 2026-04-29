"use client";

import { useState, use } from "react";
import Link from "next/link";
import {
  ArrowRight,
  User,
  Phone,
  Mail,
  MapPin,
  FileText,
  Upload,
  CheckCircle2,
  Circle,
  Clock,
  MessageSquare,
  Send,
  Calendar,
  Building2,
  Hash,
  DollarSign,
  AlertTriangle,
  Sparkles,
  Copy,
  Check,
  Zap,
  ChevronDown,
  ChevronUp,
  CalendarClock,
} from "lucide-react";
import {
  getClaimById,
  getClaimDocuments,
  getClaimMissingDocs,
  getClaimNotes,
  getClaimActivities,
  generateClaimAISummary,
  generateClaimInspectorMessage,
  generateOneLineSummary,
  generateMissingDocsRequest,
  generateFollowUpMessage,
  getClaimNextAction,
} from "@/lib/mock-data";
import type { NextActionSeverity } from "@/lib/mock-data";
import StatusBadge from "@/components/ui/StatusBadge";
import ClaimTypeBadge from "@/components/ui/ClaimTypeBadge";

export default function ClaimDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const claim = getClaimById(id);
  const documents = getClaimDocuments(id);
  const missingDocs = getClaimMissingDocs(id);
  const notes = getClaimNotes(id);
  const activities = getClaimActivities(id);

  const [newNote, setNewNote] = useState("");
  const [activeTab, setActiveTab] = useState<"details" | "documents" | "notes" | "timeline">("details");
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionModalContent, setActionModalContent] = useState({ title: "", message: "", icon: "send" as "send" | "docs" | "followup" });
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [actionDone, setActionDone] = useState(false);
  const [showFullSummary, setShowFullSummary] = useState(false);

  if (!claim) {
    return (
      <div className="text-center py-20">
        <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900">תביעה לא נמצאה</h2>
        <Link href="/claims" className="text-blue-600 hover:text-blue-700 mt-2 inline-block">
          חזור לרשימת התביעות
        </Link>
      </div>
    );
  }

  const nextAction = getClaimNextAction(claim);
  const oneLineSummary = generateOneLineSummary(claim);
  const missingNotReceived = missingDocs.filter((d) => !d.is_received);

  // Determine what the primary action button does
  const handlePrimaryAction = () => {
    if (claim.status === "new" || claim.status === "waiting_customer_docs") {
      if (missingNotReceived.length > 0) {
        // Missing docs → generate request message
        setActionModalContent({
          title: "בקשת מסמכים מהלקוח",
          message: generateMissingDocsRequest(claim),
          icon: "docs",
        });
      } else {
        // Ready → generate inspector message
        setActionModalContent({
          title: "הודעה למפקח חברת הביטוח",
          message: generateClaimInspectorMessage(claim),
          icon: "send",
        });
      }
    } else if (claim.status === "waiting_insurance" || claim.status === "in_review") {
      // Waiting → follow-up
      setActionModalContent({
        title: "מעקב מול חברת הביטוח",
        message: generateFollowUpMessage(claim),
        icon: "followup",
      });
    } else if (claim.status === "approved") {
      setActionModalContent({
        title: "עדכון ללקוח — תביעה אושרה",
        message: `שלום ${claim.customer?.full_name || ""},\n\nשמחים לעדכן שהתביעה שלך (${claim.claim_number}) אושרה!\n${claim.approved_amount ? `סכום מאושר: ₪${claim.approved_amount.toLocaleString()}` : ""}\n\nהסוכן שלך יחזור אליך עם פרטים נוספים.\n\nבברכה,\nClaimPilot`,
        icon: "send",
      });
    } else if (claim.status === "rejected") {
      setActionModalContent({
        title: "עדכון ללקוח — תביעה נדחתה",
        message: `שלום ${claim.customer?.full_name || ""},\n\nלצערנו, התביעה (${claim.claim_number}) נדחתה על ידי ${claim.insurance_company}.\n\nהסוכן שלך ייצור איתך קשר לבחינת אפשרויות ערעור.\n\nבברכה,\nClaimPilot`,
        icon: "send",
      });
    } else {
      return; // closed — no action
    }
    setShowActionModal(true);
    setCopiedMessage(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(actionModalContent.message);
    setCopiedMessage(true);
    setTimeout(() => setCopiedMessage(false), 2000);
  };

  const handleMarkDone = () => {
    setActionDone(true);
    setShowActionModal(false);
  };

  const SEVERITY_STYLES: Record<NextActionSeverity, { bg: string; border: string; text: string; icon: string; glow: string }> = {
    red: { bg: "bg-gradient-to-l from-red-50 to-red-100", border: "border-red-200", text: "text-red-800", icon: "bg-red-600", glow: "shadow-red-100" },
    yellow: { bg: "bg-gradient-to-l from-amber-50 to-amber-100", border: "border-amber-200", text: "text-amber-800", icon: "bg-amber-500", glow: "shadow-amber-100" },
    green: { bg: "bg-gradient-to-l from-green-50 to-green-100", border: "border-green-200", text: "text-green-800", icon: "bg-green-600", glow: "shadow-green-100" },
  };

  const PRIMARY_BUTTON_LABELS: Record<string, string> = {
    new: missingNotReceived.length > 0 ? "בקש מסמכים מהלקוח" : "שלח למפקח",
    waiting_customer_docs: "בקש מסמכים מהלקוח",
    waiting_insurance: "שלח מעקב לחברת הביטוח",
    in_review: "שלח מעקב לחברת הביטוח",
    approved: "עדכן את הלקוח",
    rejected: "עדכן את הלקוח",
    closed: "הטיפול הושלם",
  };

  return (
    <div>
      {/* Minimal Header */}
      <div className="flex items-center gap-3 mb-5">
        <Link
          href="/claims"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowRight className="w-5 h-5 text-gray-600" />
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-sm font-mono text-gray-400">{claim.claim_number}</span>
          <ClaimTypeBadge type={claim.type} />
          <StatusBadge status={claim.status} />
        </div>
      </div>

      {/* ===== CONTROL CARD — The Hero ===== */}
      <div className={`${SEVERITY_STYLES[nextAction.severity].bg} ${SEVERITY_STYLES[nextAction.severity].border} border rounded-2xl p-6 mb-6 shadow-lg ${SEVERITY_STYLES[nextAction.severity].glow}`}>
        {/* One-line AI Summary */}
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 text-purple-500" />
          <p className="text-sm text-gray-700 font-medium">{oneLineSummary}</p>
        </div>

        {/* Action Area */}
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <div className={`w-8 h-8 ${SEVERITY_STYLES[nextAction.severity].icon} rounded-full flex items-center justify-center`}>
                <Zap className="w-4 h-4 text-white" />
              </div>
              <h2 className={`text-lg font-bold ${SEVERITY_STYLES[nextAction.severity].text}`}>
                {nextAction.text}
              </h2>
            </div>
            <p className={`text-sm mr-11 ${SEVERITY_STYLES[nextAction.severity].text} opacity-75`}>
              {nextAction.description}
            </p>
          </div>

          {/* Primary CTA */}
          {claim.status !== "closed" && !actionDone && (
            <button
              onClick={handlePrimaryAction}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-md hover:shadow-lg text-sm flex items-center gap-2 whitespace-nowrap"
            >
              <Send className="w-4 h-4" />
              {PRIMARY_BUTTON_LABELS[claim.status]}
            </button>
          )}

          {actionDone && (
            <div className="bg-green-600 text-white font-bold py-3 px-8 rounded-xl text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              בוצע
            </div>
          )}
        </div>

        {/* Quick info chips */}
        <div className="flex items-center gap-3 mt-4 mr-11">
          <span className="inline-flex items-center gap-1.5 text-xs bg-white/60 backdrop-blur-sm px-3 py-1.5 rounded-full text-gray-600">
            <User className="w-3 h-3" />
            {claim.customer?.full_name || "—"}
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs bg-white/60 backdrop-blur-sm px-3 py-1.5 rounded-full text-gray-600">
            <Building2 className="w-3 h-3" />
            {claim.insurance_company}
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs bg-white/60 backdrop-blur-sm px-3 py-1.5 rounded-full text-gray-600">
            <Calendar className="w-3 h-3" />
            {new Date(claim.incident_date).toLocaleDateString("he-IL")}
          </span>
          {claim.claim_amount && (
            <span className="inline-flex items-center gap-1.5 text-xs bg-white/60 backdrop-blur-sm px-3 py-1.5 rounded-full text-gray-600">
              <DollarSign className="w-3 h-3" />
              ₪{claim.claim_amount.toLocaleString()}
            </span>
          )}
          {missingNotReceived.length > 0 && (
            <span className="inline-flex items-center gap-1.5 text-xs bg-red-100 px-3 py-1.5 rounded-full text-red-700 font-medium">
              <AlertTriangle className="w-3 h-3" />
              {missingNotReceived.length} מסמכים חסרים
            </span>
          )}
        </div>
      </div>

      {/* Full AI Summary (Collapsible) */}
      <div className="bg-white rounded-xl border border-gray-200 mb-6">
        <button
          onClick={() => setShowFullSummary(!showFullSummary)}
          className="w-full flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors rounded-xl"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-500" />
            <span className="text-sm font-medium text-gray-700">סיכום מלא</span>
            <span className="text-xs text-gray-400">ClaimPilot AI</span>
          </div>
          {showFullSummary ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </button>
        {showFullSummary && (
          <div className="px-5 pb-4">
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-100 rounded-lg p-4">
              <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-line">
                {generateClaimAISummary(claim)}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Tabs — Secondary Data */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-6">
          {[
            { id: "details" as const, label: "פרטים", icon: FileText },
            { id: "documents" as const, label: `מסמכים (${documents.length})`, icon: Upload },
            { id: "notes" as const, label: `הערות (${notes.length})`, icon: MessageSquare },
            { id: "timeline" as const, label: "ציר זמן", icon: Clock },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 pb-3 px-1 border-b-2 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "details" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Claim Info */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-base font-semibold text-gray-900 mb-4">פרטי תביעה</h3>
            <div className="space-y-3">
              <InfoRow icon={Building2} label="חברת ביטוח" value={claim.insurance_company} />
              <InfoRow icon={Hash} label="מספר פוליסה" value={claim.policy_number} />
              <InfoRow
                icon={Calendar}
                label="תאריך אירוע"
                value={new Date(claim.incident_date).toLocaleDateString("he-IL")}
              />
              <InfoRow
                icon={DollarSign}
                label="סכום תביעה"
                value={claim.claim_amount ? `₪${claim.claim_amount.toLocaleString()}` : "לא צוין"}
              />
              {claim.approved_amount !== null && (
                <InfoRow
                  icon={DollarSign}
                  label="סכום מאושר"
                  value={`₪${claim.approved_amount.toLocaleString()}`}
                />
              )}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-sm font-medium text-gray-700 mb-2">תיאור</p>
              <p className="text-sm text-gray-600 leading-relaxed">{claim.description}</p>
            </div>
          </div>

          {/* Customer Info */}
          {claim.customer && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-gray-900">פרטי לקוח</h3>
                <Link
                  href={`/customers/${claim.customer_id}`}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  צפה בכרטיס לקוח
                </Link>
              </div>
              <div className="space-y-3">
                <InfoRow icon={User} label="שם מלא" value={claim.customer.full_name} />
                <InfoRow icon={Hash} label="ת.ז" value={claim.customer.id_number} />
                <InfoRow icon={Phone} label="טלפון" value={claim.customer.phone} />
                <InfoRow icon={Mail} label="אימייל" value={claim.customer.email} />
                <InfoRow icon={MapPin} label="כתובת" value={claim.customer.address} />
              </div>
            </div>
          )}

          {/* Missing Documents */}
          {missingDocs.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5 lg:col-span-2">
              <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                מסמכים חסרים ({missingNotReceived.length})
              </h3>
              <div className="space-y-3">
                {missingDocs.map((doc) => (
                  <div
                    key={doc.id}
                    className={`flex items-start gap-3 p-3 rounded-lg ${
                      doc.is_received ? "bg-green-50" : "bg-amber-50"
                    }`}
                  >
                    {doc.is_received ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                    ) : (
                      <Circle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
                    )}
                    <div>
                      <p className={`text-sm font-medium ${doc.is_received ? "text-green-800" : "text-amber-800"}`}>
                        {doc.name}
                      </p>
                      <p className={`text-xs mt-0.5 ${doc.is_received ? "text-green-600" : "text-amber-600"}`}>
                        {doc.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "documents" && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-semibold text-gray-900">מסמכים</h3>
            <button className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
              <Upload className="w-4 h-4" />
              העלאת מסמך
            </button>
          </div>
          {documents.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <FileText className="w-10 h-10 mx-auto mb-2" />
              <p>אין מסמכים עדיין</p>
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(doc.uploaded_at).toLocaleDateString("he-IL")} • {doc.file_type}
                      </p>
                    </div>
                  </div>
                  <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">הורדה</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "notes" && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-base font-semibold text-gray-900 mb-5">הערות פנימיות</h3>
          <div className="mb-6">
            <div className="flex gap-3">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="כתוב הערה..."
                rows={3}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
              />
              <button
                disabled={!newNote.trim()}
                className="self-end inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                שלח
              </button>
            </div>
          </div>
          <div className="space-y-4">
            {notes.map((note) => (
              <div key={note.id} className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900">סוכן ביטוח</span>
                  <span className="text-xs text-gray-500">
                    {new Date(note.created_at).toLocaleString("he-IL")}
                  </span>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{note.content}</p>
              </div>
            ))}
            {notes.length === 0 && (
              <p className="text-center text-gray-400 py-6">אין הערות עדיין</p>
            )}
          </div>
        </div>
      )}

      {activeTab === "timeline" && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-base font-semibold text-gray-900 mb-5">ציר זמן</h3>
          <div className="relative">
            <div className="absolute right-4 top-0 bottom-0 w-0.5 bg-gray-200" />
            <div className="space-y-6">
              {activities.map((event, index) => (
                <div key={event.id} className="flex gap-4 relative">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 ${
                      index === 0 ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {event.type === "status_change" && <Clock className="w-4 h-4" />}
                    {event.type === "note_added" && <MessageSquare className="w-4 h-4" />}
                    {event.type === "document_uploaded" && <Upload className="w-4 h-4" />}
                    {event.type === "document_requested" && <AlertTriangle className="w-4 h-4" />}
                    {event.type === "claim_created" && <FileText className="w-4 h-4" />}
                    {event.type === "amount_updated" && <DollarSign className="w-4 h-4" />}
                  </div>
                  <div className="pb-2">
                    <p className="text-sm text-gray-900">{event.description}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {new Date(event.created_at).toLocaleString("he-IL")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===== Action Modal ===== */}
      {showActionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  actionModalContent.icon === "docs"
                    ? "bg-amber-100"
                    : actionModalContent.icon === "followup"
                      ? "bg-purple-100"
                      : "bg-blue-100"
                }`}>
                  {actionModalContent.icon === "docs" ? (
                    <FileText className="w-5 h-5 text-amber-600" />
                  ) : actionModalContent.icon === "followup" ? (
                    <CalendarClock className="w-5 h-5 text-purple-600" />
                  ) : (
                    <Building2 className="w-5 h-5 text-blue-600" />
                  )}
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {actionModalContent.title}
                </h3>
              </div>
              <button
                onClick={() => setShowActionModal(false)}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto mb-4">
              <textarea
                value={actionModalContent.message}
                onChange={(e) =>
                  setActionModalContent((prev) => ({
                    ...prev,
                    message: e.target.value,
                  }))
                }
                rows={14}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm leading-relaxed focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none font-sans"
                dir="rtl"
              />
            </div>
            <p className="text-xs text-gray-400 mb-4 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              נוצר אוטומטית — ניתן לערוך לפני שליחה
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-2 text-sm text-gray-600 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                {copiedMessage ? (
                  <>
                    <Check className="w-4 h-4 text-green-600" />
                    <span className="text-green-600">הועתק!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    העתק
                  </>
                )}
              </button>
              <button
                onClick={handleMarkDone}
                className="inline-flex items-center gap-2 text-sm bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <CheckCircle2 className="w-4 h-4" />
                סמן כבוצע
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="w-4 h-4 text-gray-400 shrink-0" />
      <span className="text-sm text-gray-500 min-w-[100px]">{label}</span>
      <span className="text-sm text-gray-900">{value}</span>
    </div>
  );
}
