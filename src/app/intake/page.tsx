"use client";

import { useState } from "react";
import Link from "next/link";
import {
  MessageCircle,
  Plus,
  CheckCircle2,
  Clock,
  Send,
  AlertCircle,
} from "lucide-react";
import { mockIntakeClaims } from "@/lib/intake-data";
import type { IntakeClaim } from "@/types";

const STATUS_CONFIG: Record<
  IntakeClaim["status"],
  { label: string; color: string; icon: React.ElementType }
> = {
  intake: { label: "בתהליך קליטה", color: "bg-blue-100 text-blue-800", icon: MessageCircle },
  ready_for_review: { label: "מוכן לבדיקת סוכן", color: "bg-amber-100 text-amber-800", icon: Clock },
  approved_by_agent: { label: "אושר ע\"י סוכן", color: "bg-green-100 text-green-800", icon: CheckCircle2 },
  sent_to_inspector: { label: "נשלח למפקח", color: "bg-purple-100 text-purple-800", icon: Send },
};

export default function IntakeListPage() {
  const [claims] = useState<IntakeClaim[]>(mockIntakeClaims);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">קליטת תביעות</h1>
          <p className="text-gray-500 mt-1">
            סימולציית שיחת WhatsApp לקליטת תביעות רכב
          </p>
        </div>
        <Link
          href="/intake/new"
          className="inline-flex items-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          שיחה חדשה
        </Link>
      </div>

      {claims.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            אין שיחות קליטה
          </h3>
          <p className="text-gray-500 text-sm mb-4">
            התחל שיחה חדשה כדי לקלוט תביעת ביטוח רכב
          </p>
          <Link
            href="/intake/new"
            className="inline-flex items-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            התחל שיחה חדשה
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {claims.map((claim) => {
            const statusConf = STATUS_CONFIG[claim.status];
            const StatusIcon = statusConf.icon;
            return (
              <Link
                key={claim.id}
                href={`/intake/${claim.id}`}
                className="block bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <MessageCircle className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-gray-900">
                        {claim.customer_name}
                      </h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-sm text-gray-500 font-mono">
                          {claim.claim_number}
                        </span>
                        <span className="text-gray-300">|</span>
                        <span className="text-sm text-gray-500">
                          {claim.customer_phone}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Readiness Score */}
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            claim.readiness_score === 100
                              ? "bg-green-500"
                              : claim.readiness_score >= 70
                              ? "bg-amber-500"
                              : "bg-red-500"
                          }`}
                          style={{ width: `${claim.readiness_score}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-700 min-w-[40px]">
                        {claim.readiness_score}%
                      </span>
                    </div>

                    {/* Status Badge */}
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${statusConf.color}`}
                    >
                      <StatusIcon className="w-3.5 h-3.5" />
                      {statusConf.label}
                    </span>
                  </div>
                </div>

                {/* Missing items warning */}
                {(claim.missing_fields.length > 0 ||
                  claim.missing_documents.length > 0) && (
                  <div className="mt-3 flex items-center gap-2 text-amber-600 text-sm">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>
                      חסרים:{" "}
                      {[...claim.missing_fields, ...claim.missing_documents].join(
                        ", "
                      )}
                    </span>
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
