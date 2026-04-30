"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  MessageCircle,
  Phone,
  Clock,
  CheckCircle2,
  FileText,
  Loader2,
  Eye,
} from "lucide-react";

interface IntakeSessionRow {
  id: string;
  phone: string;
  current_step: string;
  status: string;
  collected_data: Record<string, string>;
  message_count: number;
  created_at: string;
  updated_at: string;
  claim?: {
    id: string;
    claim_number: string;
    status: string;
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

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  active: { bg: "bg-blue-100", text: "text-blue-800", label: "פעילה" },
  completed: { bg: "bg-green-100", text: "text-green-800", label: "הושלמה" },
};

export default function IntakeSessionsPage() {
  const [sessions, setSessions] = useState<IntakeSessionRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/intake-sessions")
      .then((r) => r.json())
      .then((data) => {
        setSessions(data.sessions || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
        <span className="mr-2 text-gray-400">טוען שיחות קליטה...</span>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">שיחות קליטה - WhatsApp</h1>
        <p className="text-gray-500 mt-1">
          {sessions.length} שיחות סה״כ
        </p>
      </div>

      {sessions.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">אין שיחות קליטה עדיין</h2>
          <p className="text-gray-500 text-sm">
            שיחות יופיעו כאן כשלקוחות ישלחו הודעה בוואטסאפ
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-right text-xs font-medium text-gray-500 uppercase px-5 py-3">טלפון</th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase px-5 py-3">שלב נוכחי</th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase px-5 py-3">סטטוס</th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase px-5 py-3">הודעות</th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase px-5 py-3">תביעה</th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase px-5 py-3">שיחה</th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase px-5 py-3">נוצר</th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase px-5 py-3">עודכן</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sessions.map((session) => {
                const statusStyle = STATUS_STYLES[session.status] || STATUS_STYLES.active;
                return (
                  <tr key={session.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-mono text-gray-900">{session.phone}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        {session.current_step === "DONE" ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        ) : (
                          <Clock className="w-4 h-4 text-blue-500" />
                        )}
                        <span className="text-sm text-gray-700">
                          {STEP_LABELS[session.current_step] || session.current_step}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                        {statusStyle.label}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        <MessageCircle className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-700">{session.message_count}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {session.claim ? (
                        <Link
                          href={`/claims/${session.claim.id}`}
                          className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-mono"
                        >
                          <FileText className="w-4 h-4" />
                          {session.claim.claim_number}
                        </Link>
                      ) : (
                        <span className="text-sm text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      {session.claim ? (
                        <Link
                          href={`/claims/${session.claim.id}/conversation`}
                          className="inline-flex items-center gap-1 text-sm text-green-600 hover:text-green-700"
                        >
                          <Eye className="w-4 h-4" />
                          <span>צפייה</span>
                        </Link>
                      ) : (
                        <span className="text-sm text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-500">
                      {new Date(session.created_at).toLocaleString("he-IL")}
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-500">
                      {new Date(session.updated_at).toLocaleString("he-IL")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
