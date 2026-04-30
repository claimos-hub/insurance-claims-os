"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Users,
  DollarSign,
  MessageCircle,
} from "lucide-react";
import { mockClaims, mockCustomers, getDashboardStats } from "@/lib/mock-data";
import StatusBadge from "@/components/ui/StatusBadge";
import ClaimTypeBadge from "@/components/ui/ClaimTypeBadge";
import type { ClaimStatus, ClaimType } from "@/types";

interface DashboardClaim {
  id: string;
  claim_number: string;
  title?: string;
  claim_type?: string;
  type?: ClaimType;
  status: ClaimStatus;
  claim_amount?: number | null;
  created_at: string;
  customer_id?: string;
  customer?: { full_name: string } | null;
  description?: string | null;
}

export default function DashboardPage() {
  const [dbClaims, setDbClaims] = useState<DashboardClaim[] | null>(null);
  const [dbStats, setDbStats] = useState<{
    total: number;
    byStatus: Record<string, number>;
    totalSessions: number;
    activeSessions: number;
  } | null>(null);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((data) => {
        if (data.claims && data.claims.length > 0) {
          setDbClaims(data.claims);
        }
        if (data.stats && data.stats.total > 0) {
          setDbStats(data.stats);
        }
      })
      .catch(() => {
        // Supabase not configured — use mock data
      });
  }, []);

  // Use DB data if available, otherwise mock
  const useDb = dbClaims !== null && dbClaims.length > 0;
  const mockStats = getDashboardStats();

  const stats = dbStats || {
    total: mockStats.total,
    byStatus: mockStats.byStatus,
    totalSessions: 0,
    activeSessions: 0,
  };

  const allClaims: DashboardClaim[] = useDb
    ? dbClaims
    : mockClaims.map((c) => ({
        ...c,
        customer: c.customer ? { full_name: c.customer.full_name } : null,
      }));

  const totalAmount = useDb
    ? 0
    : mockStats.totalAmount;

  const statCards = [
    {
      label: "סה״כ תביעות",
      value: stats.total,
      icon: FileText,
      color: "bg-blue-50 text-blue-600",
      iconBg: "bg-blue-100",
    },
    {
      label: "ממתינות לטיפול",
      value:
        (stats.byStatus["new"] || 0) +
        (stats.byStatus["waiting_customer_docs"] || 0) +
        (stats.byStatus["waiting_insurance"] || 0),
      icon: Clock,
      color: "bg-amber-50 text-amber-600",
      iconBg: "bg-amber-100",
    },
    {
      label: "אושרו",
      value: stats.byStatus["approved"] || 0,
      icon: CheckCircle2,
      color: "bg-green-50 text-green-600",
      iconBg: "bg-green-100",
    },
    {
      label: "נדחו",
      value: stats.byStatus["rejected"] || 0,
      icon: XCircle,
      color: "bg-red-50 text-red-600",
      iconBg: "bg-red-100",
    },
    {
      label: useDb ? "שיחות קליטה" : "לקוחות פעילים",
      value: useDb ? stats.totalSessions : mockCustomers.length,
      icon: useDb ? MessageCircle : Users,
      color: "bg-indigo-50 text-indigo-600",
      iconBg: "bg-indigo-100",
    },
    {
      label: useDb ? "שיחות פעילות" : "סכום תביעות",
      value: useDb
        ? stats.activeSessions
        : `₪${(totalAmount / 1000).toFixed(0)}K`,
      icon: useDb ? Clock : DollarSign,
      color: "bg-emerald-50 text-emerald-600",
      iconBg: "bg-emerald-100",
    },
  ];

  const recentClaims = [...allClaims]
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    .slice(0, 5);

  const urgentClaims = allClaims.filter(
    (c) =>
      c.status === "new" ||
      c.status === "waiting_customer_docs"
  );

  function getClaimTitle(claim: DashboardClaim): string {
    return claim.title || claim.description || `תביעת ${claim.claim_type || "ביטוח"}`;
  }

  function getClaimType(claim: DashboardClaim): ClaimType {
    return (claim.type || claim.claim_type || "car") as ClaimType;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">דשבורד</h1>
        <p className="text-gray-500 mt-1">סקירה כללית של התביעות שלך</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{card.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {card.value}
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-xl ${card.iconBg} flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${card.color.split(" ")[1]}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Claims */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              תביעות אחרונות
            </h2>
            <Link
              href="/claims"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              הצג הכל
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {recentClaims.map((claim) => (
              <Link
                key={claim.id}
                href={`/claims/${claim.id}`}
                className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {getClaimTitle(claim)}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-500">
                      {claim.claim_number}
                    </span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500">
                      {claim.customer?.full_name || "לקוח"}
                    </span>
                  </div>
                </div>
                <StatusBadge status={claim.status} />
              </Link>
            ))}
          </div>
        </div>

        {/* Urgent / Needs Attention */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-5 border-b border-gray-100 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-semibold text-gray-900">
              דורשות טיפול
            </h2>
          </div>
          <div className="divide-y divide-gray-100">
            {urgentClaims.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-green-400" />
                <p>אין תביעות דחופות כרגע</p>
              </div>
            ) : (
              urgentClaims.map((claim) => (
                <Link
                  key={claim.id}
                  href={`/claims/${claim.id}`}
                  className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {getClaimTitle(claim)}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <ClaimTypeBadge type={getClaimType(claim)} />
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-500">
                        {claim.customer?.full_name || "לקוח"}
                      </span>
                    </div>
                  </div>
                  <StatusBadge status={claim.status} />
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
