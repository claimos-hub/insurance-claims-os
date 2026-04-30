"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Phone,
  MessageCircle,
  Bot,
  User,
  Loader2,
  CheckCircle2,
  Clock,
  FileText,
} from "lucide-react";
import { ReadinessBadge } from "@/components/ui/ReadinessScore";

interface Message {
  id: string;
  direction: "inbound" | "outbound";
  message: string;
  created_at: string;
}

interface ClaimData {
  id: string;
  claim_number: string;
  status: string;
  readiness_score: number;
  event_date: string | null;
  description: string | null;
  customer?: { full_name: string; phone: string } | null;
  intake_session?: {
    id: string;
    phone: string;
    current_step: string;
    status: string;
    collected_data: Record<string, string>;
  } | null;
}

const STEP_LABELS: Record<string, string> = {
  START: "התחלה",
  ASK_EVENT_DATE: "תאריך אירוע",
  ASK_LOCATION: "מיקום",
  ASK_DESCRIPTION: "תיאור",
  ASK_VEHICLE: "מספר רכב",
  ASK_POLICY: "פוליסה",
  ASK_INJURIES: "פציעות",
  ASK_INJURY_DETAILS: "פרטי פציעות",
  ASK_OTHER_VEHICLE: "צד שלישי",
  ASK_THIRD_PARTY: "פרטי צד שלישי",
  ASK_DOCUMENTS: "מסמכים",
  DONE: "הושלם",
};

export default function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [claimId, setClaimId] = useState<string>("");
  const [claim, setClaim] = useState<ClaimData | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    params.then((p) => setClaimId(p.id));
  }, [params]);

  useEffect(() => {
    if (!claimId) return;
    fetch(`/api/claims/${claimId}`)
      .then((r) => r.json())
      .then((data) => {
        setClaim(data.claim || null);
        setMessages(data.messages || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [claimId]);

  useEffect(() => {
    if (!loading) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [loading, messages]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
        <span className="mr-2 text-gray-400">טוען שיחה...</span>
      </div>
    );
  }

  if (!claim) {
    return (
      <div className="text-center py-20">
        <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">תביעה לא נמצאה</p>
        <Link href="/claims" className="text-blue-600 text-sm mt-2 inline-block hover:underline">
          חזרה לרשימת התביעות
        </Link>
      </div>
    );
  }

  const phone = claim.intake_session?.phone || claim.customer?.phone || "";
  const step = claim.intake_session?.current_step || "DONE";
  const sessionStatus = claim.intake_session?.status || "completed";

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href={`/claims/${claimId}`}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowRight className="w-4 h-4" />
          חזרה לתביעה {claim.claim_number}
        </Link>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Phone className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">
                  שיחת WhatsApp — {claim.claim_number}
                </h1>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-sm text-gray-500 font-mono">{phone}</span>
                  <span className="text-gray-300">|</span>
                  <span className="flex items-center gap-1 text-sm text-gray-500">
                    {sessionStatus === "completed" ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                    ) : (
                      <Clock className="w-3.5 h-3.5 text-blue-500" />
                    )}
                    {STEP_LABELS[step] || step}
                  </span>
                  <span className="text-gray-300">|</span>
                  <span className="text-sm text-gray-500">{messages.length} הודעות</span>
                </div>
              </div>
            </div>
            <ReadinessBadge score={claim.readiness_score} />
          </div>
        </div>
      </div>

      {/* Chat area */}
      <div className="bg-[#e5ddd5] rounded-xl border border-gray-200 overflow-hidden">
        {/* Chat header bar */}
        <div className="bg-[#075e54] px-5 py-3 flex items-center gap-3">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            <MessageCircle className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-medium text-white">
              {claim.customer?.full_name || phone}
            </p>
            <p className="text-xs text-white/70">
              {sessionStatus === "completed" ? "שיחה הושלמה" : "שיחה פעילה"}
            </p>
          </div>
        </div>

        {/* Messages */}
        <div className="p-4 space-y-2 max-h-[600px] overflow-y-auto">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle className="w-10 h-10 text-gray-400/50 mx-auto mb-2" />
              <p className="text-sm text-gray-500/70">אין הודעות עדיין</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isInbound = msg.direction === "inbound";
              return (
                <div key={msg.id} className={`flex ${isInbound ? "justify-start" : "justify-end"}`}>
                  <div
                    className={`relative max-w-[75%] px-3 py-2 rounded-lg text-sm shadow-sm ${
                      isInbound
                        ? "bg-white text-gray-900 rounded-tr-none"
                        : "bg-[#dcf8c6] text-gray-900 rounded-tl-none"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-0.5">
                      {isInbound ? (
                        <User className="w-3 h-3 text-gray-400" />
                      ) : (
                        <Bot className="w-3 h-3 text-green-600" />
                      )}
                      <span className="text-[10px] font-medium text-gray-400">
                        {isInbound ? "לקוח" : "ClaimPilot"}
                      </span>
                    </div>
                    <p className="whitespace-pre-line leading-relaxed">{msg.message}</p>
                    <p className="text-[10px] text-gray-400 mt-1 text-left">
                      {new Date(msg.created_at).toLocaleString("he-IL", {
                        hour: "2-digit",
                        minute: "2-digit",
                        day: "2-digit",
                        month: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Collected data summary */}
      {claim.intake_session?.collected_data && Object.keys(claim.intake_session.collected_data).length > 0 && (
        <div className="mt-6 bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-bold text-gray-900 mb-3">נתונים שנאספו מהשיחה</h2>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(claim.intake_session.collected_data).map(([key, value]) => (
              <div key={key} className="bg-gray-50 rounded-lg px-3 py-2">
                <p className="text-[11px] text-gray-400 font-medium">{formatFieldName(key)}</p>
                <p className="text-sm text-gray-900 mt-0.5">{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function formatFieldName(key: string): string {
  const map: Record<string, string> = {
    event_date: "תאריך אירוע",
    event_location: "מיקום אירוע",
    description: "תיאור",
    plate_number: "מספר רכב",
    policy_number: "מספר פוליסה",
    has_injuries: "פציעות",
    injury_details: "פרטי פציעות",
    other_vehicle: "רכב נוסף מעורב",
    third_party_info: "פרטי צד שלישי",
  };
  return map[key] || key;
}
