"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Search,
  User,
  Phone,
  Mail,
  Shield,
  Clock,
  AlertTriangle,
  Users,
  CalendarClock,
  PhoneCall,
  X,
  Copy,
  Check,
  Percent,
} from "lucide-react";
import {
  mockCustomers,
  getCustomerClaims,
  getAllRetentionInfo,
  generateRetentionCallScript,
} from "@/lib/mock-data";
import {
  RetentionStatus,
  RETENTION_STATUS_LABELS,
  RETENTION_STATUS_COLORS,
  CustomerRetentionInfo,
  CLAIM_TYPE_LABELS,
  ClaimType,
} from "@/types";

const FILTER_OPTIONS: { value: RetentionStatus | "all"; label: string }[] = [
  { value: "all", label: "כל הלקוחות" },
  { value: "needs_call", label: "דורש שיחה" },
  { value: "urgent", label: "דחוף" },
  { value: "handled", label: "טופל" },
];

export default function CustomersPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<RetentionStatus | "all">("all");
  const [modalInfo, setModalInfo] = useState<CustomerRetentionInfo | null>(null);
  const [copied, setCopied] = useState(false);

  const allRetention = getAllRetentionInfo();

  // Summary stats
  const totalCustomers = allRetention.length;
  const expiring7 = allRetention.filter(
    (r) => r.daysUntilExpiry !== null && r.daysUntilExpiry >= 0 && r.daysUntilExpiry <= 7
  ).length;
  const expiring30 = allRetention.filter(
    (r) => r.daysUntilExpiry !== null && r.daysUntilExpiry >= 0 && r.daysUntilExpiry <= 30
  ).length;
  const openCalls = allRetention.filter(
    (r) => r.retentionStatus === "needs_call" || r.retentionStatus === "urgent"
  ).length;

  // Filter + search
  const filtered = allRetention.filter((r) => {
    const c = r.customer;
    const matchSearch =
      search === "" ||
      c.full_name.includes(search) ||
      c.id_number.includes(search) ||
      c.phone.includes(search);
    const matchFilter =
      filter === "all" || r.retentionStatus === filter;
    return matchSearch && matchFilter;
  });

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">לקוחות</h1>
        <p className="text-gray-500 mt-1">
          {mockCustomers.length} לקוחות רשומים
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <SummaryCard
          icon={<Users className="w-5 h-5 text-blue-600" />}
          label="סה״כ לקוחות"
          value={totalCustomers}
          bg="bg-blue-50"
        />
        <SummaryCard
          icon={<AlertTriangle className="w-5 h-5 text-red-600" />}
          label="פוליסות פגות ב-7 ימים"
          value={expiring7}
          bg="bg-red-50"
        />
        <SummaryCard
          icon={<CalendarClock className="w-5 h-5 text-amber-600" />}
          label="פוליסות פגות ב-30 ימים"
          value={expiring30}
          bg="bg-amber-50"
        />
        <SummaryCard
          icon={<PhoneCall className="w-5 h-5 text-purple-600" />}
          label="שיחות שימור פתוחות"
          value={openCalls}
          bg="bg-purple-50"
        />
      </div>

      {/* Search + Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="חיפוש לפי שם, ת.ז או טלפון..."
              className="w-full pr-10 pl-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {FILTER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setFilter(opt.value)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === opt.value
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Customer Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((info) => {
          const claims = getCustomerClaims(info.customer.id);
          return (
            <div
              key={info.customer.id}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-all"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <Link
                  href={`/customers/${info.customer.id}`}
                  className="flex items-center gap-3 hover:opacity-80"
                >
                  <div className="w-11 h-11 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {info.customer.full_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      ת.ז: {info.customer.id_number}
                    </p>
                  </div>
                </Link>
                <RetentionBadge status={info.retentionStatus} />
              </div>

              {/* Contact */}
              <div className="space-y-1.5 text-sm text-gray-600 mb-3">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-gray-400" />
                  {info.customer.phone}
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-gray-400" />
                  {info.customer.email}
                </div>
              </div>

              {/* Retention Info */}
              <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-gray-600">
                    <Shield className="w-3.5 h-3.5" />
                    פוליסות פעילות
                  </span>
                  <span className="font-semibold">{info.activePoliciesCount}</span>
                </div>
                {info.daysUntilExpiry !== null && (
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-gray-600">
                      <Clock className="w-3.5 h-3.5" />
                      ימים לפקיעת פוליסה
                    </span>
                    <DaysLeftBadge days={info.daysUntilExpiry} />
                  </div>
                )}
                {info.hasDiscountExpiring && (
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-amber-600">
                      <Percent className="w-3.5 h-3.5" />
                      הנחה עומדת לפוג!
                    </span>
                    <span className="text-xs font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                      תוך 14 יום
                    </span>
                  </div>
                )}
              </div>

              {/* Policy list mini */}
              {info.policies.length > 0 && (
                <div className="mt-2 space-y-1">
                  {info.policies.map((p) => (
                    <div key={p.id} className="flex items-center justify-between text-xs text-gray-500 px-1">
                      <span>
                        {CLAIM_TYPE_LABELS[p.insurance_type as ClaimType] || p.insurance_type} — {p.provider}
                      </span>
                      <span className={
                        p.days_until_end <= 7 ? "text-red-600 font-semibold" :
                        p.days_until_end <= 30 ? "text-amber-600 font-semibold" :
                        "text-gray-500"
                      }>
                        {p.days_until_end >= 0 ? `${p.days_until_end} ימים` : "פג"}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Footer */}
              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  {claims.length} תביעות
                </span>
                {(info.retentionStatus === "urgent" ||
                  info.retentionStatus === "needs_call") && (
                  <button
                    onClick={() => {
                      setModalInfo(info);
                      setCopied(false);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    הכן שיחת שימור
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center text-gray-500 py-12">
          לא נמצאו לקוחות
        </div>
      )}

      {/* Retention Call Script Modal */}
      {modalInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[85vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  שיחת שימור — {modalInfo.customer.full_name}
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  תסריט שיחה מוכן לסוכן
                </p>
              </div>
              <button
                onClick={() => setModalInfo(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto flex-1">
              <pre className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800 font-sans">
                {generateRetentionCallScript(modalInfo)}
              </pre>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setModalInfo(null)}
                className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                סגור
              </button>
              <button
                onClick={() =>
                  handleCopy(generateRetentionCallScript(modalInfo))
                }
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
                    העתק תסריט
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

// --- Sub-components ---

function SummaryCard({
  icon,
  label,
  value,
  bg,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  bg: string;
}) {
  return (
    <div className={`${bg} rounded-xl p-4 border border-gray-200`}>
      <div className="flex items-center gap-2 mb-2">{icon}</div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-600 mt-0.5">{label}</p>
    </div>
  );
}

function RetentionBadge({ status }: { status: RetentionStatus }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${RETENTION_STATUS_COLORS[status]}`}
    >
      {RETENTION_STATUS_LABELS[status]}
    </span>
  );
}

function DaysLeftBadge({ days }: { days: number }) {
  if (days < 0) {
    return <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">פג תוקף</span>;
  }
  if (days <= 7) {
    return <span className="text-xs font-semibold text-red-700 bg-red-100 px-2 py-0.5 rounded-full">{days} ימים</span>;
  }
  if (days <= 30) {
    return <span className="text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">{days} ימים</span>;
  }
  return <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">{days} ימים</span>;
}
