"use client";

import { useState, use } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Bot,
  User,
  Image,
  FileText,
  CheckCircle2,
  Circle,
  AlertCircle,
  Gauge,
  Send,
  MessageSquare,
  Sparkles,
  Building2,
  Copy,
  Check,
  AlertTriangle,
} from "lucide-react";
import { getIntakeClaimById } from "@/lib/intake-data";
import { getIntakeNextAction } from "@/lib/mock-data";
import type { NextActionSeverity } from "@/lib/mock-data";
import type { IntakeClaim } from "@/types";

type TabId = "chat" | "details" | "ai_summary" | "inspector";

export default function IntakeClaimDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const claim = getIntakeClaimById(id);
  const [activeTab, setActiveTab] = useState<TabId>("details");
  const [claimStatus, setClaimStatus] = useState<IntakeClaim["status"]>(
    claim?.status || "intake"
  );
  const [copiedInspector, setCopiedInspector] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);

  if (!claim) {
    return (
      <div className="text-center py-20">
        <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900">תביעה לא נמצאה</h2>
        <Link
          href="/intake"
          className="text-blue-600 hover:text-blue-700 mt-2 inline-block"
        >
          חזור לרשימת השיחות
        </Link>
      </div>
    );
  }

  const data = claim.intake_data;

  const nextAction = getIntakeNextAction(claimStatus, claim.missing_fields, claim.missing_documents);

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

  const handleApprove = () => {
    setClaimStatus("approved_by_agent");
    setShowApproveModal(false);
  };

  const handleSendToInspector = () => {
    setClaimStatus("sent_to_inspector");
  };

  const handleCopyInspectorMessage = () => {
    navigator.clipboard.writeText(claim.ai_inspector_message);
    setCopiedInspector(true);
    setTimeout(() => setCopiedInspector(false), 2000);
  };

  const STATUS_LABELS: Record<IntakeClaim["status"], { label: string; color: string }> = {
    intake: { label: "בתהליך קליטה", color: "bg-blue-100 text-blue-800" },
    ready_for_review: { label: "מוכן לבדיקת סוכן", color: "bg-amber-100 text-amber-800" },
    approved_by_agent: { label: "אושר ע\"י סוכן", color: "bg-green-100 text-green-800" },
    sent_to_inspector: { label: "נשלח למפקח", color: "bg-purple-100 text-purple-800" },
  };

  const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
    { id: "details", label: "פרטים ומסמכים", icon: FileText },
    { id: "chat", label: "שיחת WhatsApp", icon: MessageSquare },
    { id: "ai_summary", label: "סיכום AI", icon: Sparkles },
    { id: "inspector", label: "הודעה למפקח", icon: Building2 },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/intake"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowRight className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">
                {claim.customer_name} - תביעת רכב
              </h1>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${STATUS_LABELS[claimStatus].color}`}
              >
                {STATUS_LABELS[claimStatus].label}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
              <span className="font-mono">{claim.claim_number}</span>
              <span>|</span>
              <span>{claim.customer_phone}</span>
              <span>|</span>
              <span>
                נוצרה{" "}
                {new Date(claim.created_at).toLocaleDateString("he-IL")}
              </span>
            </div>
          </div>
        </div>

        {/* Readiness Score Badge */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
            <Gauge className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-gray-700">מוכנות:</span>
            <span
              className={`text-sm font-bold ${
                claim.readiness_score === 100
                  ? "text-green-600"
                  : claim.readiness_score >= 70
                  ? "text-amber-600"
                  : "text-red-600"
              }`}
            >
              {claim.readiness_score}%
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      {claimStatus === "ready_for_review" && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            <p className="text-sm font-medium text-amber-800">
              התביעה מוכנה לבדיקה. בדוק את הפרטים ואשר לפני שליחה למפקח.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setActiveTab("inspector")}
              className="text-sm text-amber-700 border border-amber-300 bg-white px-4 py-2 rounded-lg hover:bg-amber-50 transition-colors font-medium"
            >
              בקש מידע חסר מהלקוח
            </button>
            <button
              onClick={() => setShowApproveModal(true)}
              className="text-sm bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              אשר ושלח למפקח
            </button>
          </div>
        </div>
      )}

      {claimStatus === "approved_by_agent" && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <p className="text-sm font-medium text-green-800">
              התביעה אושרה. מוכנה לשליחה למפקח חברת הביטוח.
            </p>
          </div>
          <button
            onClick={handleSendToInspector}
            className="text-sm bg-purple-600 text-white px-5 py-2 rounded-lg hover:bg-purple-700 transition-colors font-medium inline-flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            שלח למפקח
          </button>
        </div>
      )}

      {claimStatus === "sent_to_inspector" && (
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-6 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-purple-600" />
          <p className="text-sm font-medium text-purple-800">
            התביעה נשלחה למפקח חברת הביטוח בהצלחה.
          </p>
        </div>
      )}

      {/* Next Action Banner */}
      <div className={`${SEVERITY_STYLES[nextAction.severity].bg} ${SEVERITY_STYLES[nextAction.severity].border} border rounded-xl p-4 mb-6`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className={`w-5 h-5 ${SEVERITY_STYLES[nextAction.severity].text}`} />
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
          <span className={`text-xs font-bold px-3 py-1 rounded-full ${SEVERITY_STYLES[nextAction.severity].badge}`}>
            {SEVERITY_LABELS[nextAction.severity]}
          </span>
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
            {claim.ai_summary}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-6">
          {tabs.map((tab) => {
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

      {/* Tab: Details */}
      {activeTab === "details" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Collected Answers */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-base font-semibold text-gray-900 mb-4">
              תשובות הלקוח
            </h3>
            <div className="space-y-3">
              <DetailRow label="תאריך אירוע" value={data.event_date} />
              <DetailRow label="שעת אירוע" value={data.event_time} />
              <DetailRow label="מיקום" value={data.event_location} />
              <DetailRow label="מספר רכב" value={data.plate_number} />
              <DetailRow label="מספר פוליסה" value={data.policy_number} />
              <DetailRow
                label="פציעות"
                value={
                  data.has_injuries === null
                    ? "לא צוין"
                    : data.has_injuries
                    ? `כן - ${data.injury_details}`
                    : "לא"
                }
              />
              <DetailRow
                label="רכב נוסף מעורב"
                value={
                  data.other_vehicle_involved === null
                    ? "לא צוין"
                    : data.other_vehicle_involved
                    ? "כן"
                    : "לא"
                }
              />
              {data.other_vehicle_involved && (
                <>
                  <DetailRow label="שם צד שלישי" value={data.third_party_name} />
                  <DetailRow label="טלפון צד שלישי" value={data.third_party_phone} />
                  <DetailRow label="לוחית צד שלישי" value={data.third_party_plate} />
                  <DetailRow
                    label="ביטוח צד שלישי"
                    value={data.third_party_insurance}
                  />
                </>
              )}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-sm font-medium text-gray-700 mb-2">
                תיאור האירוע
              </p>
              <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-3 rounded-lg">
                {data.description || "לא סופק"}
              </p>
            </div>
          </div>

          {/* Documents Checklist */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-base font-semibold text-gray-900 mb-4">
              רשימת מסמכים
            </h3>
            <div className="space-y-3">
              <DocCheckItem
                label="צילומי נזק"
                received={data.photos_uploaded.length > 0}
                detail={
                  data.photos_uploaded.length > 0
                    ? `${data.photos_uploaded.length} קבצים: ${data.photos_uploaded.join(", ")}`
                    : undefined
                }
              />
              <DocCheckItem
                label="רישיון נהיגה"
                received={data.driver_license_uploaded}
              />
              <DocCheckItem
                label="רישיון רכב"
                received={data.vehicle_license_uploaded}
              />
              <DocCheckItem
                label="דוח משטרה"
                received={data.police_report_uploaded}
                optional={!data.police_report_needed}
              />
            </div>

            {/* Missing items */}
            {(claim.missing_fields.length > 0 ||
              claim.missing_documents.length > 0) && (
              <div className="mt-6 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                  <h4 className="text-sm font-semibold text-amber-700">
                    פריטים חסרים
                  </h4>
                </div>
                <div className="space-y-1.5">
                  {[...claim.missing_fields, ...claim.missing_documents].map(
                    (item) => (
                      <p
                        key={item}
                        className="text-sm text-amber-600 flex items-center gap-2"
                      >
                        <Circle className="w-3 h-3 shrink-0" />
                        {item}
                      </p>
                    )
                  )}
                </div>
              </div>
            )}

            {claim.missing_fields.length === 0 &&
              claim.missing_documents.length === 0 && (
                <div className="mt-6 pt-4 border-t border-gray-100 flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="w-5 h-5" />
                  <p className="text-sm font-medium">
                    כל הפרטים והמסמכים התקבלו!
                  </p>
                </div>
              )}
          </div>
        </div>
      )}

      {/* Tab: Chat History */}
      {activeTab === "chat" && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden max-w-3xl mx-auto">
          <div className="bg-[#075e54] text-white px-4 py-3 flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <p className="font-medium text-sm">
                שיחה עם {claim.customer_name}
              </p>
              <p className="text-xs text-white/70">
                {new Date(claim.created_at).toLocaleDateString("he-IL")}
              </p>
            </div>
          </div>

          <div
            className="p-4 space-y-3 max-h-[600px] overflow-y-auto"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23e5ddd5' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
              backgroundColor: "#ece5dd",
            }}
          >
            {claim.messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${
                  msg.sender === "customer" ? "justify-start" : "justify-end"
                }`}
              >
                <div
                  className={`max-w-[75%] rounded-lg px-3 py-2 shadow-sm ${
                    msg.sender === "customer"
                      ? "bg-white text-gray-900 rounded-tr-none"
                      : "bg-[#dcf8c6] text-gray-900 rounded-tl-none"
                  }`}
                >
                  {msg.type === "file_upload" ? (
                    <div className="flex items-center gap-2 py-1">
                      {msg.file_name?.match(/\.(jpg|jpeg|png)$/i) ? (
                        <Image className="w-4 h-4 text-blue-600" />
                      ) : (
                        <FileText className="w-4 h-4 text-red-600" />
                      )}
                      <span className="text-sm font-medium">
                        {msg.file_name}
                      </span>
                    </div>
                  ) : (
                    <p className="text-sm whitespace-pre-line leading-relaxed">
                      {msg.text}
                    </p>
                  )}
                  <p
                    className={`text-[10px] mt-1 ${
                      msg.sender === "customer"
                        ? "text-gray-400"
                        : "text-green-800/50"
                    } text-left`}
                  >
                    {new Date(msg.timestamp).toLocaleTimeString("he-IL", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: AI Summary */}
      {activeTab === "ai_summary" && (
        <div className="max-w-3xl">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <h3 className="text-base font-semibold text-gray-900">
                סיכום AI של התביעה
              </h3>
            </div>
            <div className="bg-purple-50 border border-purple-100 rounded-lg p-4">
              <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-line">
                {claim.ai_summary}
              </p>
            </div>
            <p className="text-xs text-gray-400 mt-3 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              נוצר אוטומטית על ידי ClaimPilot AI
            </p>
          </div>
        </div>
      )}

      {/* Tab: Inspector Message */}
      {activeTab === "inspector" && (
        <div className="max-w-3xl">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-semibold text-gray-900">
                  הודעה למפקח חברת הביטוח
                </h3>
              </div>
              <button
                onClick={handleCopyInspectorMessage}
                className="inline-flex items-center gap-2 text-sm text-gray-600 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {copiedInspector ? (
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
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <pre className="text-sm text-gray-800 leading-relaxed whitespace-pre-line font-sans">
                {claim.ai_inspector_message}
              </pre>
            </div>
            <p className="text-xs text-gray-400 mt-3 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              נוצר אוטומטית על ידי ClaimPilot AI - ניתן לערוך לפני שליחה
            </p>

            {/* Action buttons at bottom */}
            {claimStatus === "ready_for_review" && (
              <div className="mt-6 pt-4 border-t border-gray-100 flex gap-3 justify-end">
                <button className="text-sm text-gray-600 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors font-medium">
                  בקש מידע חסר מהלקוח
                </button>
                <button
                  onClick={() => setShowApproveModal(true)}
                  className="text-sm bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium inline-flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  אשר ושלח למפקח
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Approve Modal */}
      {showApproveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                אישור שליחה למפקח
              </h3>
            </div>
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
              אתה עומד לאשר את התביעה {claim.claim_number} של{" "}
              {claim.customer_name}. ההודעה שנוצרה על ידי AI תישלח למפקח חברת
              הביטוח.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowApproveModal(false)}
                className="text-sm text-gray-600 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                ביטול
              </button>
              <button
                onClick={handleApprove}
                className="text-sm bg-green-600 text-white px-5 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                אשר
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 py-1.5 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-500 min-w-[110px] shrink-0">
        {label}
      </span>
      <span className="text-sm text-gray-900 font-medium">{value || "—"}</span>
    </div>
  );
}

function DocCheckItem({
  label,
  received,
  detail,
  optional,
}: {
  label: string;
  received: boolean;
  detail?: string;
  optional?: boolean;
}) {
  return (
    <div
      className={`flex items-start gap-3 p-3 rounded-lg ${
        received ? "bg-green-50" : optional ? "bg-gray-50" : "bg-amber-50"
      }`}
    >
      {received ? (
        <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
      ) : optional ? (
        <Circle className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
      ) : (
        <Circle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
      )}
      <div>
        <p
          className={`text-sm font-medium ${
            received
              ? "text-green-800"
              : optional
              ? "text-gray-600"
              : "text-amber-800"
          }`}
        >
          {label}
          {optional && !received && (
            <span className="text-xs text-gray-400 mr-2">(לא נדרש)</span>
          )}
        </p>
        {detail && (
          <p className="text-xs text-green-600 mt-0.5">{detail}</p>
        )}
      </div>
    </div>
  );
}
