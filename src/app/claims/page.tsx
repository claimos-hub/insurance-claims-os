"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Search, Filter } from "lucide-react";
import { mockClaims } from "@/lib/mock-data";
import { ClaimStatus, ClaimType, CLAIM_STATUS_LABELS, CLAIM_TYPE_LABELS } from "@/types";
import StatusBadge from "@/components/ui/StatusBadge";
import ClaimTypeBadge from "@/components/ui/ClaimTypeBadge";

export default function ClaimsListPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ClaimStatus | "all">("all");
  const [typeFilter, setTypeFilter] = useState<ClaimType | "all">("all");

  const filtered = mockClaims.filter((claim) => {
    const matchesSearch =
      search === "" ||
      claim.title.includes(search) ||
      claim.claim_number.includes(search) ||
      claim.customer?.full_name.includes(search);
    const matchesStatus =
      statusFilter === "all" || claim.status === statusFilter;
    const matchesType = typeFilter === "all" || claim.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">תביעות</h1>
          <p className="text-gray-500 mt-1">
            {filtered.length} תביעות מתוך {mockClaims.length}
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
                סכום
              </th>
              <th className="text-right text-xs font-medium text-gray-500 uppercase px-5 py-3">
                תאריך
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
                    {claim.title}
                  </Link>
                </td>
                <td className="px-5 py-4">
                  <Link
                    href={`/customers/${claim.customer_id}`}
                    className="text-sm text-gray-600 hover:text-blue-600"
                  >
                    {claim.customer?.full_name}
                  </Link>
                </td>
                <td className="px-5 py-4">
                  <ClaimTypeBadge type={claim.type} />
                </td>
                <td className="px-5 py-4">
                  <StatusBadge status={claim.status} />
                </td>
                <td className="px-5 py-4 text-sm text-gray-900">
                  {claim.claim_amount
                    ? `₪${claim.claim_amount.toLocaleString()}`
                    : "-"}
                </td>
                <td className="px-5 py-4 text-sm text-gray-500">
                  {new Date(claim.created_at).toLocaleDateString("he-IL")}
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
