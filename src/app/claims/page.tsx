"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Search, Filter, MessageSquare } from "lucide-react";
import { mockClaims } from "@/lib/mock-data";
import { ClaimStatus, ClaimType, CLAIM_STATUS_LABELS, CLAIM_TYPE_LABELS } from "@/types";
import StatusBadge from "@/components/ui/StatusBadge";
import ClaimTypeBadge from "@/components/ui/ClaimTypeBadge";
import { ReadinessRing } from "@/components/ui/ReadinessScore";

interface ClaimRow {
  id: string;
  claim_number: string;
  title?: string;
  description?: string | null;
  claim_type?: string;
  type?: ClaimType;
  status: ClaimStatus;
  claim_amount?: number | null;
  created_at: string;
  customer_id?: string;
  customer?: { full_name: string; id_number?: string } | null;
  event_date?: string | null;
  readiness_score?: number;
  intake_session_id?: string | null;
}

export default function ClaimsListPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ClaimStatus | "all">("all");
  const [typeFilter, setTypeFilter] = useState<ClaimType | "all">("all");
  const [claims, setClaims] = useState<ClaimRow[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/claims")
      .then((r) => r.json())
      .then((data) => {
        if (data.claims && data.claims.length > 0) {
          setClaims(data.claims);
        } else {
          // Fallback to mock
          setClaims(
            mockClaims.map((c) => ({
              ...c,
              customer: c.customer ? { full_name: c.customer.full_name, id_number: c.customer.id_number } : null,
            }))
          );
        }
        setLoaded(true);
      })
      .catch(() => {
        setClaims(
          mockClaims.map((c) => ({
            ...c,
            customer: c.customer ? { full_name: c.customer.full_name, id_number: c.customer.id_number } : null,
          }))
        );
        setLoaded(true);
      });
  }, []);

  function getTitle(c: ClaimRow): string {
    return c.title || c.description || `תביעת ${c.claim_type || "ביטוח"}`;
  }

  function getType(c: ClaimRow): ClaimType {
    return (c.type || c.claim_type || "car") as ClaimType;
  }

  const filtered = claims.filter((claim) => {
    const title = getTitle(claim);
    const name = claim.customer?.full_name || "";
    const matchesSearch =
      search === "" ||
      title.includes(search) ||
      claim.claim_number.includes(search) ||
      name.includes(search);
    const matchesStatus =
      statusFilter === "all" || claim.status === statusFilter;
    const claimType = getType(claim);
    const matchesType = typeFilter === "all" || claimType === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  if (!loaded) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-gray-400">טוען תביעות...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">תביעות</h1>
          <p className="text-gray-500 mt-1">
            {filtered.length} תביעות מתוך {claims.length}
          </p>
        </div>
        <Link
          href="/claims/new"
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          תביעה חדשה
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="חיפוש לפי שם, מספר תביעה או לקוח..."
                className="w-full pr-10 pl-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ClaimStatus | "all")}
            className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            <option value="all">כל הסטטוסים</option>
            {Object.entries(CLAIM_STATUS_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as ClaimType | "all")}
            className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            <option value="all">כל הסוגים</option>
            {Object.entries(CLAIM_TYPE_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Claims Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-right text-xs font-medium text-gray-500 uppercase px-5 py-3">
                מספר תביעה
              </th>
              <th className="text-right text-xs font-medium text-gray-500 uppercase px-5 py-3">
                כותרת
              </th>
              <th className="text-right text-xs font-medium text-gray-500 uppercase px-5 py-3">
                לקוח
              </th>
              <th className="text-right text-xs font-medium text-gray-500 uppercase px-5 py-3">
                סוג
              </th>
              <th className="text-right text-xs font-medium text-gray-500 uppercase px-5 py-3">
                סטטוס
              </th>
              <th className="text-right text-xs font-medium text-gray-500 uppercase px-5 py-3">
                מוכנות
              </th>
              <th className="text-right text-xs font-medium text-gray-500 uppercase px-5 py-3">
                תאריך
              </th>
              <th className="text-right text-xs font-medium text-gray-500 uppercase px-5 py-3">
                שיחה
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((claim) => (
              <tr
                key={claim.id}
                className="hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <td className="px-5 py-4">
                  <Link
                    href={`/claims/${claim.id}`}
                    className="text-sm font-mono text-blue-600 hover:text-blue-700"
                  >
                    {claim.claim_number}
                  </Link>
                </td>
                <td className="px-5 py-4">
                  <Link
                    href={`/claims/${claim.id}`}
                    className="text-sm font-medium text-gray-900 hover:text-blue-600"
                  >
                    {getTitle(claim)}
                  </Link>
                </td>
                <td className="px-5 py-4 text-sm text-gray-600">
                  {claim.customer?.full_name || "לקוח"}
                </td>
                <td className="px-5 py-4">
                  <ClaimTypeBadge type={getType(claim)} />
                </td>
                <td className="px-5 py-4">
                  <StatusBadge status={claim.status} />
                </td>
                <td className="px-5 py-4">
                  {claim.readiness_score != null ? (
                    <ReadinessRing score={claim.readiness_score} size={36} />
                  ) : (
                    <span className="text-xs text-gray-300">—</span>
                  )}
                </td>
                <td className="px-5 py-4 text-sm text-gray-500">
                  {new Date(claim.created_at).toLocaleDateString("he-IL")}
                </td>
                <td className="px-5 py-4">
                  {claim.intake_session_id ? (
                    <Link
                      href={`/claims/${claim.id}/conversation`}
                      className="inline-flex items-center gap-1 text-sm text-green-600 hover:text-green-700"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MessageSquare className="w-4 h-4" />
                    </Link>
                  ) : (
                    <span className="text-xs text-gray-300">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="p-12 text-center text-gray-400">
            <Filter className="w-10 h-10 mx-auto mb-3" />
            <p className="font-medium">לא נמצאו תביעות</p>
            <p className="text-sm mt-1">נסה לשנות את הפילטרים</p>
          </div>
        )}
      </div>
    </div>
  );
}
