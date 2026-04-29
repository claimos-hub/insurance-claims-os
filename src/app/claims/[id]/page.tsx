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
} from "lucide-react";
import {
  getClaimById,
  getClaimDocuments,
  getClaimMissingDocs,
  getClaimNotes,
  getClaimActivities,
  generateClaimAISummary,
  generateClaimInspectorMessage,
  getClaimNextAction,
} from "@/lib/mock-data";
import type { NextActionSeverity } from "@/lib/mock-data";
import {
  ClaimStatus,
  CLAIM_STATUS_LABELS,
  CLAIM_STATUS_COLORS,
  CLAIM_TYPE_LABELS,
} from "@/types";
import StatusBadge from "@/components/ui/StatusBadge";
import ClaimTypeBadge from "@/components/ui/ClaimTypeBadge";

const STATUS_FLOW: ClaimStatus[] = [
  "new",
  "waiting_customer_docs",
  "waiting_insurance",
  "in_review",
  "approved",
];

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
  const [showInspectorModal, setShowInspectorModal] = useState(false);
  const [inspectorMessage, setInspectorMessage] = useState("");
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [sentToInspector, setSentToInspector] = useState(false);

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

  const currentStepIndex = STATUS_FLOW.indexOf(claim.status);
  const aiSummary = generateClaimAISummary(claim);
  const nextAction = getClaimNextAction(claim);

  const handleGenerateInspectorMessage = () => {
    setInspectorMessage(generateClaimInspectorMessage(claim));
    setShowInspectorModal(true);
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(inspectorMessage);
    setCopiedMessage(true);
    setTimeout(() => setCopiedMessage(false), 2000);
  };

  const handleMarkSent = () => {
    setSentToInspector(true);
    setShowInspectorModal(false);
  };

  const SEVERITY_STYLES: Record<NextActionSeverity, { bg: string; border: string; text: string; badge: string }> = {
    red: { bg: "bg-red-50", border: "border-red-200", text: "text-red-800", badge: "bg-red-600 text-white" },
    yellow: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-800", badge: "bg-amber-500 text-white" },
    green: { bg: "bg-green-50", border: "border-green-200", text: "text-green-800", badge: "bg-green-600 text-white" },
  };

  const SEVERITY_LABELS: Record<NextActionSeverity, string> = {
    red: "דורש טיפול",
    yellow: "ממתין",
    green: "מוכן / הושלם",
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/claims"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowRight className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">
                {claim.title}
              </h1>
              <StatusBadge status={claim.status} />
            </div>
            <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
              <span className="font-mono">{claim.claim_number}</span>
              <span>•</span>
              <ClaimTypeBadge type={claim.type} />
              <span>•</span>
              <span>
                נוצרה {new Date(claim.created_at).toLocaleDateString("he-IL")}
              </span>
            </div>
          </div>
        </div>

        <select
          defaultValue={claim.status}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
        >
          {Object.entries(CLAIM_STATUS_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Status Progress */}
      {claim.status !== "rejected" && claim.status !== "closed" && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
          <div className="flex items-center justify-between">
            {STATUS_FLOW.map((status, index) => {
              const isCompleted = index < currentStepIndex;
              const isCurrent = index === currentStepIndex;
              return (
                <div key={status} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        isCompleted
                          ? "bg-green-500 text-white"
                          : isCurrent
                          ? "bg-blue-600 text-white"
                          : "bg-gray-200 text-gray-500"
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        index + 1
                      )}
                    </div>
                    <span
                      className={`text-xs mt-1.5 ${
                        isCurrent
                          ? "text-blue-600 font-medium"
                          : "text-gray-500"
                      }`}
                    >
                      {CLAIM_STATUS_LABELS[status]}
                    </span>
                  </div>
                  {index < STATUS_FLOW.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-2 ${
                        isCompleted ? "bg-green-500" : "bg-gray-200"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Next Action Banner */}
      <div className={`${SEVERITY_STYLES[nextAction.severity].bg} ${SEVERITY_STYLES[nextAction.severity].border} border rounded-xl p-4 mb-6`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Zap className={`w-5 h-5 ${SEVERITY_STYLES[nextAction.severity].text}`} />
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-bold ${SEVERITY_STYLES[nextAction.severity].text}`}>
                  פעולה הבאה:
                </span>
                <span className={`text-sm font-semibold ${SEVERITY_STYLES[nextAction.severity].text}`}>
                  {nextAction.text}
                </span>
              </div>
              <p className={`text-xs mt-0.5 ${SEVERITY_STYLES[nextAction.severity].text} opacity-75`}>
                {nextAction.description}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${SEVERITY_STYLES[nextAction.severity].badge}`}>
              {SEVERITY_LABELS[nextAction.severity]}
            </span>
            {!sentToInspector && claim.status !== "closed" && (
              <button
                onClick={handleGenerateInspectorMessage}
                className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium inline-flex items-center gap-2"
              >
                <Building2 className="w-4 h-4" />
                צור הודעה למפקח
              </button>
            )}
            {sentToInspector && (
              <span className="text-sm text-purple-700 bg-purple-100 px-3 py-1.5 rounded-lg font-medium inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                נשלח למפקח
              </span>
            )}
          </div>
        </div>
      </div>

      {/* AI Claim Summary Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-purple-600" />
          </div>
          <h3 className="text-base font-semibold text-gray-900">
            סיכום תביעה אוטומטי
          </h3>
          <span className="text-xs text-gray-400 mr-auto">נוצר ע״י ClaimPilot AI</span>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-100 rounded-lg p-4">
          <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-line">
            {aiSummary}
          </p>
        </div>
      </div>

      {/* Tabs */}
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
            <h3 className="text-base font-semibold text-gray-900 mb-4">
              פרטי תביעה
            </h3>
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
              <p className="text-sm text-gray-600 leading-relaxed">
                {claim.description}
              </p>
            </div>
          </div>

          {/* Customer Info */}
          {claim.customer && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-gray-900">
                  פרטי לקוח
                </h3>
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
                מסמכים חסרים ({missingDocs.filter((d) => !d.is_received).length})
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
                      <p
                        className={`text-sm font-medium ${
                          doc.is_received ? "text-green-800" : "text-amber-800"
                        }`}
                      >
                        {doc.name}
                      </p>
                      <p
                        className={`text-xs mt-0.5 ${
                          doc.is_received ? "text-green-600" : "text-amber-600"
                        }`}
                      >
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
                      <p className="text-sm font-medium text-gray-900">
                        {doc.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(doc.uploaded_at).toLocaleDateString("he-IL")} •{" "}
                        {doc.file_type}
                      </p>
                    </div>
                  </div>
                  <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                    הורדה
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "notes" && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-base font-semibold text-gray-900 mb-5">
            הערות פנימיות
          </h3>

          {/* Add Note */}
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

          {/* Notes List */}
          <div className="space-y-4">
            {notes.map((note) => (
              <div
                key={note.id}
                className="p-4 bg-gray-50 rounded-lg border border-gray-100"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900">
                    סוכן ביטוח
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(note.created_at).toLocaleString("he-IL")}
                  </span>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {note.content}
                </p>
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
          <h3 className="text-base font-semibold text-gray-900 mb-5">
            ציר זמן
          </h3>
          <div className="relative">
            <div className="absolute right-4 top-0 bottom-0 w-0.5 bg-gray-200" />
            <div className="space-y-6">
              {activities.map((event, index) => (
                <div key={event.id} className="flex gap-4 relative">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 ${
                      index === 0
                        ? "bg-blue-100 text-blue-600"
                        : "bg-gray-100 text-gray-500"
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

      {/* Inspector Message Modal */}
      {showInspectorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  הודעה למפקח חברת הביטוח
                </h3>
              </div>
              <button
                onClick={() => setShowInspectorModal(false)}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto mb-4">
              <textarea
                value={inspectorMessage}
                onChange={(e) => setInspectorMessage(e.target.value)}
                rows={18}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm leading-relaxed focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none font-sans"
                dir="rtl"
              />
            </div>
            <p className="text-xs text-gray-400 mb-4 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              נוצר אוטומטית על ידי ClaimPilot AI — ניתן לערוך לפני שליחה
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleCopyMessage}
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
                    העתק הודעה
                  </>
                )}
              </button>
              <button
                onClick={handleMarkSent}
                className="inline-flex items-center gap-2 text-sm bg-purple-600 text-white px-5 py-2 rounded-lg hover:bg-purple-700 transition-colors font-medium"
              >
                <Send className="w-4 h-4" />
                סמן כנשלח למפקח
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
