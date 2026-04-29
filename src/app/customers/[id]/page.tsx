"use client";

import { use } from "react";
import Link from "next/link";
import {
  ArrowRight,
  User,
  Phone,
  Mail,
  MapPin,
  Hash,
  Calendar,
  AlertTriangle,
} from "lucide-react";
import { getCustomerById, getCustomerClaims } from "@/lib/mock-data";
import StatusBadge from "@/components/ui/StatusBadge";
import ClaimTypeBadge from "@/components/ui/ClaimTypeBadge";

export default function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const customer = getCustomerById(id);
  const claims = getCustomerClaims(id);

  if (!customer) {
    return (
      <div className="text-center py-20">
        <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900">לקוח לא נמצא</h2>
        <Link href="/customers" className="text-blue-600 hover:text-blue-700 mt-2 inline-block">
          חזור לרשימת הלקוחות
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <Link
          href="/customers"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowRight className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {customer.full_name}
          </h1>
          <p className="text-gray-500 mt-1">כרטיס לקוח</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-7 h-7 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {customer.full_name}
              </h2>
              <p className="text-sm text-gray-500">לקוח</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Hash className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">תעודת זהות</p>
                <p className="text-sm text-gray-900">{customer.id_number}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">טלפון</p>
                <p className="text-sm text-gray-900">{customer.phone}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">אימייל</p>
                <p className="text-sm text-gray-900">{customer.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">כתובת</p>
                <p className="text-sm text-gray-900">{customer.address}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">לקוח מאז</p>
                <p className="text-sm text-gray-900">
                  {new Date(customer.created_at).toLocaleDateString("he-IL")}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Claims */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="p-5 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">
                תביעות ({claims.length})
              </h2>
            </div>
            {claims.length === 0 ? (
              <div className="p-10 text-center text-gray-400">
                אין תביעות עבור לקוח זה
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {claims.map((claim) => (
                  <Link
                    key={claim.id}
                    href={`/claims/${claim.id}`}
                    className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900">
                          {claim.title}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs font-mono text-gray-500">
                          {claim.claim_number}
                        </span>
                        <ClaimTypeBadge type={claim.type} />
                        <span className="text-xs text-gray-500">
                          {new Date(claim.created_at).toLocaleDateString(
                            "he-IL"
                          )}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {claim.claim_amount && (
                        <span className="text-sm font-medium text-gray-900">
                          ₪{claim.claim_amount.toLocaleString()}
                        </span>
                      )}
                      <StatusBadge status={claim.status} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
