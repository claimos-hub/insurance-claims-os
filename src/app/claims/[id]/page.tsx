"use client";

import { useState, useEffect, use } from "react";
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
import type { ClaimType, ClaimStatus } from "@/types";

interface DbClaimData {
  id: string;
  claim_number: string;
  claim_type: string;
  status: string;
  event_date: string | null;
  event_location: string | null;
  description: string | null;
  vehicle_number: string | null;
  policy_number: string | null;
  injuries: boolean | null;
  third_party_involved: boolean | null;
  third_party_details: Record<string, string> | null;
  missing_documents: string[];
  readiness_score: number;
  ai_summary: string | null;
  inspector_message: string | null;
  created_at: string;
  updated_at: string;
  customer?: {
    id: string;
    full_name: string;
    phone: string;
    email: string | null;
  } | null;
  intake_session?: {
    id: string;
    collected_data: Record<string, string>;
  } | null;
}

interface DbMessage {
  id: string;
  direction: "inbound" | "outbound";
  message: string;
  created_at: string;
}

export default function ClaimDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  // DB state
  const [dbClaim, setDbClaim] = useState<DbClaimData | null>(null);
  const [dbMessages, setDbMessages] = useState<DbMessage[]>([]);
  const [isDbClaim, setIsDbClaim] = useState(false);
  const [loading, setLoading] = useState(true);

  // Mock data
  const mockClaim = getClaimById(id);
  const documents = mockClaim ? getClaimDocuments(id) : [];
  const missingDocs = mockClaim ? getClaimMissingDocs(id) : [];
  const notes = mockClaim ? getClaimNotes(id) : [];
  const activities = mockClaim ? getClaimActivities(id) : [];

  const [newNote, setNewNote] = useState("");
  const [activeTab, setActiveTab] = useState<"details" | "documents" | "notes" | "timeline" | "messages">("details");
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionModalContent, setActionModalContent] = useState({ title: "", message: "", icon: "send" as "send" | "docs" | "followup" });
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [actionDone, setActionDone] = useState(false);
  const [showFullSummary, setShowFullSummary] = useState(false);

  useEffect(() => {
    fetch(`/api/claims/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.claim) {
          setDbClaim(data.claim);
          setDbMessages(data.messages || []);
          setIsDbClaim(true);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-gray-400">טוען פרטי תביעה...</div>
      </div>
    );
  }

  // Use DB claim if available, otherwise mock
  const claim = isDbClaim ? dbClaim : mockClaim;

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

  // Normalize data for rendering
  const claimNumber = isDbClaim ? dbClaim!.claim_number : mockClaim!.claim_number;
  const claimType = (isDbClaim ? dbClaim!.claim_type : mockClaim!.type) as ClaimType;
  const claimStatus = (isDbClaim ? dbClaim!.status : mockClaim!.status) as ClaimStatus;
  const claimDescription = isDbClaim ? dbClaim!.description || "" : mockClaim!.description;
  const customerName = isDbClaim ? dbClaim!.customer?.full_name || "לקוח" : mockClaim!.customer?.full_name || "—";
  const customerPhone = isDbClaim ? dbClaim!.customer?.phone || "" : mockClaim!.customer?.phone || "";
  const customerEmail = isDbClaim ? dbClaim!.customer?.email || "" : mockClaim!.customer?.email || "";

  const missingNotReceived = isDbClaim
    ? dbClaim!.missing_documents || []
    : missingDocs.filter((d) => !d.is_received);

  const missingCount = isDbClaim ? missingNotReceived.length : (missingNotReceived as typeof missingDocs).length;

  // Next action
  const nextAction = isDbClaim
    ? {
        text: claimStatus === "new" ? "לטפל בתביעה חדשה" : "להמשיך טיפול",
        severity: (claimStatus === "new" ? "red" : claimStatus === "approved" ? "green" : "yellow") as NextActionSeverity,
        description: dbClaim!.ai_summary?.split("\n")[0] || "",
      }
    : getClaimNextAction(mockClaim!);

  const oneLineSummary = isDbClaim
    ? `${dbClaim!.claim_type === "car" ? "ביטוח רכב" : dbClaim!.claim_type} · ${dbClaim!.event_date || ""} · ${(dbClaim!.description || "").slice(0, 40)}${missingCount > 0 ? ` · ${missingCount} מסמכים חסרים` : ""}`
    : generateOneLineSummary(mockClaim!);

  const aiSummary = isDbClaim ? dbClaim!.ai_summary || "" : generateClaimAISummary(mockClaim!);
  const inspectorMsg = isDbClaim ? dbClaim!.inspector_message || "" : generateClaimInspectorMessage(mockClaim!);

  const handlePrimaryAction = () => {
    if (isDbClaim) {
      if (missingCount > 0) {
        const docList = (dbClaim!.missing_documents || []).map((d: string) => `• ${d}`).join("\n");
        setActionModalContent({
          title: "בקשת מסמכים מהלקוח",
          message: `שלום ${customerName},\n\nבהמשך לתביעה שלך (${claimNumber}), אנא שלח/י את המסמכים הבאים:\n\n${docList}\n\nתודה,\nClaimPilot`,
          icon: "docs",
        });
      } else {
        setActionModalContent({
          title: "הודעה למפקח חברת הביטוח",
          message: inspectorMsg,
          icon: "send",
        });
      }
    } else {
      // Mock claim logic
      const mc = mockClaim!;
      const mockMissing = missingDocs.filter((d) => !d.is_received);
      if (mc.status === "new" || mc.status === "waiting_customer_docs") {
        if (mockMissing.length > 0) {
          setActionModalContent({ title: "בקשת מסמכים מהלקוח", message: generateMissingDocsRequest(mc), icon: "docs" });
        } else {
          setActionModalContent({ title: "הודעה למפקח חברת הביטוח", message: generateClaimInspectorMessage(mc), icon: "send" });
        }
      } else if (mc.status === "waiting_insurance" || mc.status === "in_review") {
        setActionModalContent({ title: "מעקב מול חברת הביטוח", message: generateFollowUpMessage(mc), icon: "followup" });
      } else if (mc.status === "approved") {
        setActionModalContent({ title: "עדכון ללקוח — תביעה אושרה", message: `שלום ${mc.customer?.full_name || ""},\n\nהתביעה (${mc.claim_number}) אושרה!\n\nבברכה,\nClaimPilot`, icon: "send" });
      } else if (mc.status === "rejected") {
        setActionModalContent({ title: "עדכון ללקוח — תביעה נדחתה", message: `שלום ${mc.customer?.full_name || ""},\n\nהתביעה (${mc.claim_number}) נדחתה.\n\nבברכה,\nClaimPilot`, icon: "send" });
      } else {
        return;
      }
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

  const tabsBase = [
    { id: "details" as const, label: "פרטים", icon: FileText },
    { id: "documents" as const, label: `מסמכים${!isDbClaim ? ` (${documents.length})` : ""}`, icon: Upload },
  ];

  const tabs = isDbClaim
    ? [
        ...tabsBase,
        { id: "messages" as const, label: `שיחת WhatsApp (${dbMessages.length})`, icon: MessageSquare },
      ]
    : [
        ...tabsBase,
        { id: "notes" as const, label: `הערות (${notes.length})`, icon: MessageSquare },
        { id: "timeline" as const, label: "ציר זמן", icon: Clock },
      ];

  return (
    <div>
      {/* Minimal Header */}
      <div className="flex items-center gap-3 mb-5">
        <Link href="/claims" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowRight className="w-5 h-5 text-gray-600" />
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-sm font-mono text-gray-400">{claimNumber}</span>
          <ClaimTypeBadge type={claimType} />
          <StatusBadge status={claimStatus} />
        </div>
      </div>

      {/* ===== CONTROL CARD ===== */}
      <div className={`${SEVERITY_STYLES[nextAction.severity].bg} ${SEVERITY_STYLES[nextAction.severity].border} border rounded-2xl p-6 mb-6 shadow-lg ${SEVERITY_STYLES[nextAction.severity].glow}`}>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 text-purple-500" />
          <p className="text-sm text-gray-700 font-medium">{oneLineSummary}</p>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <div className={`w-8 h-8 ${SEVERITY_STYLES[nextAction.severity].icon} rounded-full flex items-center justify-center`}>
                <Zap className="w-4 h-4 text-white" />
              </div>
              <h2 className={`text-lg font-bold ${SEVERITY_STYLES[nextAction.severity].text}`}>{nextAction.text}</h2>
            </div>
            <p className={`text-sm mr-11 ${SEVERITY_STYLES[nextAction.severity].text} opacity-75`}>{nextAction.description}</p>
          </div>
          {claimStatus !== "closed" && !actionDone && (
            <button
              onClick={handlePrimaryAction}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-md hover:shadow-lg text-sm flex items-center gap-2 whitespace-nowrap"
            >
              <Send className="w-4 h-4" />
              המשך טיפול
            </button>
          )}
          {actionDone && (
            <div className="bg-green-600 text-white font-bold py-3 px-8 rounded-xl text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              בוצע
            </div>
          )}
        </div>
        <div className="flex items-center gap-3 mt-4 mr-11 flex-wrap">
          <span className="inline-flex items-center gap-1.5 text-xs bg-white/60 backdrop-blur-sm px-3 py-1.5 rounded-full text-gray-600">
            <User className="w-3 h-3" />{customerName}
          </span>
          {customerPhone && (
            <span className="inline-flex items-center gap-1.5 text-xs bg-white/60 backdrop-blur-sm px-3 py-1.5 rounded-full text-gray-600">
              <Phone className="w-3 h-3" />{customerPhone}
            </span>
          )}
          {isDbClaim && dbClaim!.event_date && (
            <span className="inline-flex items-center gap-1.5 text-xs bg-white/60 backdrop-blur-sm px-3 py-1.5 rounded-full text-gray-600">
              <Calendar className="w-3 h-3" />{dbClaim!.event_date}
            </span>
          )}
          {!isDbClaim && mockClaim && (
            <>
              <span className="inline-flex items-center gap-1.5 text-xs bg-white/60 backdrop-blur-sm px-3 py-1.5 rounded-full text-gray-600">
                <Building2 className="w-3 h-3" />{mockClaim.insurance_company}
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs bg-white/60 backdrop-blur-sm px-3 py-1.5 rounded-full text-gray-600">
                <Calendar className="w-3 h-3" />{new Date(mockClaim.incident_date).toLocaleDateString("he-IL")}
              </span>
              {mockClaim.claim_amount && (
                <span className="inline-flex items-center gap-1.5 text-xs bg-white/60 backdrop-blur-sm px-3 py-1.5 rounded-full text-gray-600">
                  <DollarSign className="w-3 h-3" />₪{mockClaim.claim_amount.toLocaleString()}
                </span>
              )}
            </>
          )}
          {missingCount > 0 && (
            <span className="inline-flex items-center gap-1.5 text-xs bg-red-100 px-3 py-1.5 rounded-full text-red-700 font-medium">
              <AlertTriangle className="w-3 h-3" />{missingCount} מסמכים חסרים
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
          {showFullSummary ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </button>
        {showFullSummary && (
          <div className="px-5 pb-4">
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-100 rounded-lg p-4">
              <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-line">{aiSummary}</p>
            </div>
          </div>
        )}
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

      {/* Tab Content — Details */}
      {activeTab === "details" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-base font-semibold text-gray-900 mb-4">פרטי תביעה</h3>
            <div className="space-y-3">
              {isDbClaim ? (
                <>
                  <InfoRow icon={Hash} label="מספר תביעה" value={claimNumber} />
                  {dbClaim!.event_date && <InfoRow icon={Calendar} label="תאריך אירוע" value={dbClaim!.event_date} />}
                  {dbClaim!.event_location && <InfoRow icon={MapPin} label="מיקום" value={dbClaim!.event_location} />}
                  {dbClaim!.vehicle_number && <InfoRow icon={Hash} label="מספר רכב" value={dbClaim!.vehicle_number} />}
                  {dbClaim!.policy_number && <InfoRow icon={Hash} label="מספר פוליסה" value={dbClaim!.policy_number} />}
                  {dbClaim!.injuries !== null && <InfoRow icon={AlertTriangle} label="פציעות" value={dbClaim!.injuries ? "כן" : "לא"} />}
                  {dbClaim!.third_party_involved !== null && <InfoRow icon={User} label="צד שלישי" value={dbClaim!.third_party_involved ? "כן" : "לא"} />}
                  {dbClaim!.readiness_score > 0 && <InfoRow icon={CheckCircle2} label="ציון מוכנות" value={`${dbClaim!.readiness_score}%`} />}
                </>
              ) : (
                <>
                  <InfoRow icon={Building2} label="חברת ביטוח" value={mockClaim!.insurance_company} />
                  <InfoRow icon={Hash} label="מספר פוליסה" value={mockClaim!.policy_number} />
                  <InfoRow icon={Calendar} label="תאריך אירוע" value={new Date(mockClaim!.incident_date).toLocaleDateString("he-IL")} />
                  <InfoRow icon={DollarSign} label="סכום תביעה" value={mockClaim!.claim_amount ? `₪${mockClaim!.claim_amount.toLocaleString()}` : "לא צוין"} />
                  {mockClaim!.approved_amount !== null && <InfoRow icon={DollarSign} label="סכום מאושר" value={`₪${mockClaim!.approved_amount.toLocaleString()}`} />}
                </>
              )}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-sm font-medium text-gray-700 mb-2">תיאור</p>
              <p className="text-sm text-gray-600 leading-relaxed">{claimDescription}</p>
            </div>
          </div>

          {/* Customer Info */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-base font-semibold text-gray-900 mb-4">פרטי לקוח</h3>
            <div className="space-y-3">
              <InfoRow icon={User} label="שם" value={customerName} />
              {customerPhone && <InfoRow icon={Phone} label="טלפון" value={customerPhone} />}
              {customerEmail && <InfoRow icon={Mail} label="אימייל" value={customerEmail} />}
              {!isDbClaim && mockClaim?.customer && (
                <>
                  <InfoRow icon={Hash} label="ת.ז" value={mockClaim.customer.id_number} />
                  <InfoRow icon={MapPin} label="כתובת" value={mockClaim.customer.address} />
                </>
              )}
            </div>
          </div>

          {/* Missing Documents */}
          {missingCount > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5 lg:col-span-2">
              <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                מסמכים חסרים ({missingCount})
              </h3>
              <div className="space-y-3">
                {isDbClaim
                  ? (dbClaim!.missing_documents || []).map((doc: string, i: number) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-amber-50">
                        <Circle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
                        <p className="text-sm font-medium text-amber-800">{doc}</p>
                      </div>
                    ))
                  : missingDocs.map((doc) => (
                      <div key={doc.id} className={`flex items-start gap-3 p-3 rounded-lg ${doc.is_received ? "bg-green-50" : "bg-amber-50"}`}>
                        {doc.is_received ? (
                          <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                        ) : (
                          <Circle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
                        )}
                        <div>
                          <p className={`text-sm font-medium ${doc.is_received ? "text-green-800" : "text-amber-800"}`}>{doc.name}</p>
                          <p className={`text-xs mt-0.5 ${doc.is_received ? "text-green-600" : "text-amber-600"}`}>{doc.description}</p>
                        </div>
                      </div>
                    ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Documents Tab */}
      {activeTab === "documents" && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-base font-semibold text-gray-900 mb-5">מסמכים</h3>
          {documents.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <FileText className="w-10 h-10 mx-auto mb-2" />
              <p>אין מסמכים עדיין</p>
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                      <p className="text-xs text-gray-500">{new Date(doc.uploaded_at).toLocaleDateString("he-IL")} • {doc.file_type}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Messages Tab (DB claims only) */}
      {activeTab === "messages" && isDbClaim && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-base font-semibold text-gray-900 mb-5">שיחת WhatsApp</h3>
          {dbMessages.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <MessageSquare className="w-10 h-10 mx-auto mb-2" />
              <p>אין הודעות</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {dbMessages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.direction === "inbound" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                    msg.direction === "inbound"
                      ? "bg-green-100 text-green-900 rounded-br-md"
                      : "bg-gray-100 text-gray-800 rounded-bl-md"
                  }`}>
                    <p className="whitespace-pre-line">{msg.message}</p>
                    <p className="text-[10px] text-gray-400 mt-1">{new Date(msg.created_at).toLocaleString("he-IL")}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Notes Tab (mock only) */}
      {activeTab === "notes" && !isDbClaim && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-base font-semibold text-gray-900 mb-5">הערות פנימיות</h3>
          <div className="mb-6">
            <div className="flex gap-3">
              <textarea value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder="כתוב הערה..." rows={3}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none" />
              <button disabled={!newNote.trim()} className="self-end inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50">
                <Send className="w-4 h-4" />שלח
              </button>
            </div>
          </div>
          <div className="space-y-4">
            {notes.map((note) => (
              <div key={note.id} className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900">סוכן ביטוח</span>
                  <span className="text-xs text-gray-500">{new Date(note.created_at).toLocaleString("he-IL")}</span>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{note.content}</p>
              </div>
            ))}
            {notes.length === 0 && <p className="text-center text-gray-400 py-6">אין הערות עדיין</p>}
          </div>
        </div>
      )}

      {/* Timeline Tab (mock only) */}
      {activeTab === "timeline" && !isDbClaim && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-base font-semibold text-gray-900 mb-5">ציר זמן</h3>
          <div className="relative">
            <div className="absolute right-4 top-0 bottom-0 w-0.5 bg-gray-200" />
            <div className="space-y-6">
              {activities.map((event, index) => (
                <div key={event.id} className="flex gap-4 relative">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 ${index === 0 ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-500"}`}>
                    {event.type === "status_change" && <Clock className="w-4 h-4" />}
                    {event.type === "note_added" && <MessageSquare className="w-4 h-4" />}
                    {event.type === "document_uploaded" && <Upload className="w-4 h-4" />}
                    {event.type === "document_requested" && <AlertTriangle className="w-4 h-4" />}
                    {event.type === "claim_created" && <FileText className="w-4 h-4" />}
                    {event.type === "amount_updated" && <DollarSign className="w-4 h-4" />}
                  </div>
                  <div className="pb-2">
                    <p className="text-sm text-gray-900">{event.description}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{new Date(event.created_at).toLocaleString("he-IL")}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Action Modal */}
      {showActionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  actionModalContent.icon === "docs" ? "bg-amber-100" : actionModalContent.icon === "followup" ? "bg-purple-100" : "bg-blue-100"
                }`}>
                  {actionModalContent.icon === "docs" ? <FileText className="w-5 h-5 text-amber-600" />
                    : actionModalContent.icon === "followup" ? <CalendarClock className="w-5 h-5 text-purple-600" />
                    : <Building2 className="w-5 h-5 text-blue-600" />}
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{actionModalContent.title}</h3>
              </div>
              <button onClick={() => setShowActionModal(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto mb-4">
              <textarea
                value={actionModalContent.message}
                onChange={(e) => setActionModalContent((prev) => ({ ...prev, message: e.target.value }))}
                rows={14}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm leading-relaxed focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none font-sans"
                dir="rtl"
              />
            </div>
            <p className="text-xs text-gray-400 mb-4 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />נוצר אוטומטית — ניתן לערוך לפני שליחה
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={handleCopy} className="inline-flex items-center gap-2 text-sm text-gray-600 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors font-medium">
                {copiedMessage ? (<><Check className="w-4 h-4 text-green-600" /><span className="text-green-600">הועתק!</span></>) : (<><Copy className="w-4 h-4" />העתק</>)}
              </button>
              <button onClick={handleMarkDone} className="inline-flex items-center gap-2 text-sm bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                <CheckCircle2 className="w-4 h-4" />סמן כבוצע
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="w-4 h-4 text-gray-400 shrink-0" />
      <span className="text-sm text-gray-500 min-w-[100px]">{label}</span>
      <span className="text-sm text-gray-900">{value}</span>
    </div>
  );
}
