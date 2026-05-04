import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase";
import { getRetentionAlerts } from "@/lib/db";
import {
  getAllRetentionInfo,
  mockCustomers,
} from "@/lib/mock-data";

export async function GET() {
  // If Supabase is configured, use real data
  if (isSupabaseConfigured()) {
    try {
      const alerts = await getRetentionAlerts();

      // Build summary
      const expiringIn7 = alerts.filter((a) => a.most_urgent_days <= 7).length;
      const expiringIn30 = alerts.length; // all alerts are <=30 days by definition
      const discountExpiring = alerts.filter((a) => a.has_discount_expiring).length;

      return NextResponse.json({
        source: "supabase",
        summary: {
          total_customers_with_alerts: alerts.length,
          expiring_in_7_days: expiringIn7,
          expiring_in_30_days: expiringIn30,
          discount_expiring: discountExpiring,
        },
        alerts: alerts.map((a) => ({
          customer: {
            id: a.customer.id,
            full_name: a.customer.full_name,
            phone: a.customer.phone,
            email: a.customer.email,
          },
          most_urgent_days: a.most_urgent_days,
          has_discount_expiring: a.has_discount_expiring,
          policies: a.policies.map((p) => ({
            id: p.id,
            insurance_type: p.insurance_type,
            provider: p.provider,
            policy_number: p.policy_number,
            end_date: p.end_date,
            discount_end_date: p.discount_end_date,
            status: p.status,
            days_until_end: p.days_until_end,
            days_until_discount_end: p.days_until_discount_end,
            discount_expiring: p.discount_expiring,
          })),
        })),
      });
    } catch (err) {
      console.error("[retention-alerts] Supabase error, falling back to mock:", err);
    }
  }

  // Fallback: mock data
  const mockRetention = getAllRetentionInfo();

  const expiringIn7 = mockRetention.filter(
    (r) => r.daysUntilExpiry !== null && r.daysUntilExpiry >= 0 && r.daysUntilExpiry <= 7
  ).length;
  const expiringIn30 = mockRetention.filter(
    (r) => r.daysUntilExpiry !== null && r.daysUntilExpiry >= 0 && r.daysUntilExpiry <= 30
  ).length;
  const openCalls = mockRetention.filter(
    (r) => r.retentionStatus === "needs_call" || r.retentionStatus === "urgent"
  ).length;

  return NextResponse.json({
    source: "mock",
    summary: {
      total_customers: mockCustomers.length,
      expiring_in_7_days: expiringIn7,
      expiring_in_30_days: expiringIn30,
      open_retention_calls: openCalls,
    },
    customers: mockRetention.map((r) => ({
      customer: {
        id: r.customer.id,
        full_name: r.customer.full_name,
        phone: r.customer.phone,
        email: r.customer.email,
        id_number: r.customer.id_number,
      },
      activePoliciesCount: r.activePoliciesCount,
      nearestDiscountExpiry: r.nearestDiscountExpiry,
      daysUntilExpiry: r.daysUntilExpiry,
      retentionStatus: r.retentionStatus,
      hasDiscountExpiring: r.hasDiscountExpiring,
      policies: r.policies.map((p) => ({
        id: p.id,
        insurance_type: p.insurance_type,
        provider: p.provider,
        policy_number: p.policy_number,
        end_date: p.end_date,
        discount_end_date: p.discount_end_date,
        status: p.status,
        days_until_end: p.days_until_end,
        days_until_discount_end: p.days_until_discount_end,
        discount_expiring: p.discount_expiring,
      })),
    })),
  });
}
