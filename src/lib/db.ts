// Database persistence layer for intake sessions and claims
// Falls back gracefully when Supabase is not configured

import { supabaseAdmin, isSupabaseConfigured } from "./supabase";

// ---- Types matching our Supabase tables ----

export interface DbCustomer {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  created_at: string;
}

export interface DbIntakeSession {
  id: string;
  customer_id: string | null;
  phone: string;
  current_step: string;
  status: string;
  collected_data: Record<string, string>;
  created_at: string;
  updated_at: string;
}

export interface DbIntakeMessage {
  id: string;
  session_id: string;
  direction: "inbound" | "outbound";
  message: string;
  created_at: string;
}

export interface DbClaim {
  id: string;
  claim_number: string;
  customer_id: string | null;
  intake_session_id: string | null;
  claim_type: string;
  status: string;
  event_date: string | null;
  event_time: string | null;
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
  // Joined fields
  customer?: DbCustomer;
  intake_session?: DbIntakeSession;
}

export interface DbClaimDocument {
  id: string;
  claim_id: string;
  document_type: string;
  file_url: string | null;
  status: string;
  created_at: string;
}

export type PolicyStatus = "active" | "expiring" | "expired";

export interface DbPolicy {
  id: string;
  customer_id: string;
  insurance_type: string;
  provider: string;
  policy_number: string;
  start_date: string;
  end_date: string;
  discount_end_date: string | null;
  status: PolicyStatus;
  created_at: string;
  // Joined
  customer?: DbCustomer;
}

export interface RetentionAlert {
  customer: DbCustomer;
  policies: (DbPolicy & {
    days_until_end: number;
    days_until_discount_end: number | null;
    discount_expiring: boolean;
  })[];
  most_urgent_days: number;
  has_discount_expiring: boolean;
}

// ---- Customer operations ----

export async function findOrCreateCustomer(phone: string): Promise<DbCustomer | null> {
  if (!isSupabaseConfigured() || !supabaseAdmin) return null;

  // Try to find existing
  const { data: existing } = await supabaseAdmin
    .from("customers")
    .select("*")
    .eq("phone", phone)
    .single();

  if (existing) return existing as DbCustomer;

  // Create new
  const { data: created, error } = await supabaseAdmin
    .from("customers")
    .insert({ phone, full_name: "" })
    .select()
    .single();

  if (error) {
    console.error("Error creating customer:", error);
    return null;
  }
  return created as DbCustomer;
}

// ---- Intake Session operations ----

export async function findActiveSession(phone: string): Promise<DbIntakeSession | null> {
  if (!isSupabaseConfigured() || !supabaseAdmin) return null;

  const { data } = await supabaseAdmin
    .from("intake_sessions")
    .select("*")
    .eq("phone", phone)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  return data as DbIntakeSession | null;
}

export async function createIntakeSession(
  phone: string,
  customerId: string | null
): Promise<DbIntakeSession | null> {
  if (!isSupabaseConfigured() || !supabaseAdmin) return null;

  const { data, error } = await supabaseAdmin
    .from("intake_sessions")
    .insert({
      phone,
      customer_id: customerId,
      current_step: "START",
      status: "active",
      collected_data: {},
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating intake session:", error);
    return null;
  }
  return data as DbIntakeSession;
}

export async function updateIntakeSession(
  sessionId: string,
  updates: {
    current_step?: string;
    status?: string;
    collected_data?: Record<string, string>;
  }
): Promise<void> {
  if (!isSupabaseConfigured() || !supabaseAdmin) return;

  const { error } = await supabaseAdmin
    .from("intake_sessions")
    .update(updates)
    .eq("id", sessionId);

  if (error) {
    console.error("Error updating intake session:", error);
  }
}

// ---- Intake Messages ----

export async function saveIntakeMessage(
  sessionId: string,
  direction: "inbound" | "outbound",
  message: string
): Promise<void> {
  if (!isSupabaseConfigured() || !supabaseAdmin) return;

  const { error } = await supabaseAdmin
    .from("intake_messages")
    .insert({ session_id: sessionId, direction, message });

  if (error) {
    console.error("Error saving intake message:", error);
  }
}

export async function getSessionMessages(sessionId: string): Promise<DbIntakeMessage[]> {
  if (!isSupabaseConfigured() || !supabaseAdmin) return [];

  const { data, error } = await supabaseAdmin
    .from("intake_messages")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching messages:", error);
    return [];
  }
  return (data || []) as DbIntakeMessage[];
}

// ---- Claims ----

function generateAISummary(data: Record<string, string>): string {
  const parts: string[] = [];
  parts.push("סוג תביעה: ביטוח רכב");
  if (data.event_date) parts.push(`תאריך אירוע: ${data.event_date}`);
  if (data.event_location) parts.push(`מיקום: ${data.event_location}`);
  if (data.description) parts.push(`תיאור: ${data.description}`);
  if (data.plate_number) parts.push(`מספר רכב: ${data.plate_number}`);
  if (data.policy_number) parts.push(`פוליסה: ${data.policy_number}`);
  if (data.has_injuries === "כן") {
    parts.push(`פציעות: כן`);
    if (data.injury_details) parts.push(`פרטי פציעה: ${data.injury_details}`);
  }
  if (data.other_vehicle === "כן") {
    parts.push("צד שלישי מעורב: כן");
    if (data.third_party_info) parts.push(`פרטי צד שלישי: ${data.third_party_info}`);
  }
  return parts.join("\n");
}

function generateInspectorMsg(data: Record<string, string>, claimNumber: string): string {
  return `לכבוד מחלקת תביעות,

הנדון: תביעת ביטוח רכב - ${claimNumber}
${data.policy_number ? `מספר פוליסה: ${data.policy_number}` : ""}

מוגשת בזאת תביעה בגין אירוע שהתרחש ביום ${data.event_date || "לא צוין"}.
מיקום: ${data.event_location || "לא צוין"}

תיאור האירוע:
${data.description || "לא צוין"}

מספר רכב: ${data.plate_number || "לא צוין"}
${data.has_injuries === "כן" ? `פציעות: ${data.injury_details || "כן"}` : "ללא פציעות"}
${data.other_vehicle === "כן" ? `צד שלישי: ${data.third_party_info || "כן"}` : "ללא צד שלישי"}

נודה לטיפולכם המהיר.

בברכה,
סוכנות ביטוח ClaimPilot`;
}

function calculateReadiness(data: Record<string, string>, missingDocs: string[]): number {
  let score = 0;
  const fields = ["event_date", "event_location", "description", "plate_number", "policy_number"];
  const filled = fields.filter((f) => data[f] && data[f].trim()).length;
  score = Math.round((filled / fields.length) * 70); // 70% from fields
  const docScore = missingDocs.length === 0 ? 30 : Math.max(0, 30 - missingDocs.length * 10);
  score += docScore;
  return Math.min(100, score);
}

export async function createClaim(
  sessionId: string,
  customerId: string | null,
  collectedData: Record<string, string>,
  missingDocs: string[]
): Promise<DbClaim | null> {
  if (!isSupabaseConfigured() || !supabaseAdmin) return null;

  const claimNumber = `CLM-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 900) + 100)}`;

  const thirdPartyDetails = collectedData.other_vehicle === "כן"
    ? { info: collectedData.third_party_info || "" }
    : null;

  const aiSummary = generateAISummary(collectedData);
  const inspectorMessage = generateInspectorMsg(collectedData, claimNumber);
  const readinessScore = calculateReadiness(collectedData, missingDocs);

  const { data, error } = await supabaseAdmin
    .from("claims")
    .insert({
      claim_number: claimNumber,
      customer_id: customerId,
      intake_session_id: sessionId,
      claim_type: "car",
      status: "new",
      event_date: collectedData.event_date || null,
      event_location: collectedData.event_location || null,
      description: collectedData.description || null,
      vehicle_number: collectedData.plate_number || null,
      policy_number: collectedData.policy_number || null,
      injuries: collectedData.has_injuries === "כן",
      third_party_involved: collectedData.other_vehicle === "כן",
      third_party_details: thirdPartyDetails,
      missing_documents: missingDocs,
      readiness_score: readinessScore,
      ai_summary: aiSummary,
      inspector_message: inspectorMessage,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating claim:", error);
    return null;
  }

  // Also update session status
  await updateIntakeSession(sessionId, { status: "completed" });

  return data as DbClaim;
}

// ---- Read operations for UI ----

export async function getAllClaims(): Promise<DbClaim[]> {
  if (!isSupabaseConfigured() || !supabaseAdmin) return [];

  const { data, error } = await supabaseAdmin
    .from("claims")
    .select("*, customer:customers(*)")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching claims:", error);
    return [];
  }
  return (data || []) as DbClaim[];
}

export async function getClaimByIdFromDb(id: string): Promise<DbClaim | null> {
  if (!isSupabaseConfigured() || !supabaseAdmin) return null;

  const { data, error } = await supabaseAdmin
    .from("claims")
    .select("*, customer:customers(*), intake_session:intake_sessions(*)")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching claim:", error);
    return null;
  }
  return data as DbClaim;
}

export async function getClaimDocumentsFromDb(claimId: string): Promise<DbClaimDocument[]> {
  if (!isSupabaseConfigured() || !supabaseAdmin) return [];

  const { data, error } = await supabaseAdmin
    .from("claim_documents")
    .select("*")
    .eq("claim_id", claimId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching claim documents:", error);
    return [];
  }
  return (data || []) as DbClaimDocument[];
}

export async function getAllIntakeSessions(): Promise<(DbIntakeSession & { message_count: number; claim?: DbClaim | null })[]> {
  if (!isSupabaseConfigured() || !supabaseAdmin) return [];

  const { data: sessions, error } = await supabaseAdmin
    .from("intake_sessions")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching intake sessions:", error);
    return [];
  }

  // Get message counts and linked claims
  const results = await Promise.all(
    (sessions || []).map(async (session: DbIntakeSession) => {
      const { count } = await supabaseAdmin!
        .from("intake_messages")
        .select("*", { count: "exact", head: true })
        .eq("session_id", session.id);

      const { data: claim } = await supabaseAdmin!
        .from("claims")
        .select("id, claim_number, status")
        .eq("intake_session_id", session.id)
        .single();

      return {
        ...session,
        message_count: count || 0,
        claim: claim as DbClaim | null,
      };
    })
  );

  return results;
}

export async function getDashboardStatsFromDb(): Promise<{
  total: number;
  byStatus: Record<string, number>;
  totalSessions: number;
  activeSessions: number;
} | null> {
  if (!isSupabaseConfigured() || !supabaseAdmin) return null;

  const { data: claims } = await supabaseAdmin
    .from("claims")
    .select("status");

  const { count: totalSessions } = await supabaseAdmin
    .from("intake_sessions")
    .select("*", { count: "exact", head: true });

  const { count: activeSessions } = await supabaseAdmin
    .from("intake_sessions")
    .select("*", { count: "exact", head: true })
    .eq("status", "active");

  if (!claims) return null;

  const byStatus: Record<string, number> = {};
  for (const c of claims) {
    byStatus[c.status] = (byStatus[c.status] || 0) + 1;
  }

  return {
    total: claims.length,
    byStatus,
    totalSessions: totalSessions || 0,
    activeSessions: activeSessions || 0,
  };
}

// ---- Policy & Retention operations ----

function diffDays(dateStr: string): number {
  const target = new Date(dateStr + "T00:00:00Z");
  const now = new Date();
  now.setUTCHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function computePolicyStatus(endDate: string): PolicyStatus {
  const days = diffDays(endDate);
  if (days < 0) return "expired";
  if (days <= 30) return "expiring";
  return "active";
}

export async function getAllPolicies(): Promise<DbPolicy[]> {
  if (!isSupabaseConfigured() || !supabaseAdmin) return [];

  const { data, error } = await supabaseAdmin
    .from("policies")
    .select("*, customer:customers(*)")
    .order("end_date", { ascending: true });

  if (error) {
    console.error("Error fetching policies:", error);
    return [];
  }
  return (data || []) as DbPolicy[];
}

export async function getCustomerPoliciesFromDb(customerId: string): Promise<DbPolicy[]> {
  if (!isSupabaseConfigured() || !supabaseAdmin) return [];

  const { data, error } = await supabaseAdmin
    .from("policies")
    .select("*")
    .eq("customer_id", customerId)
    .order("end_date", { ascending: true });

  if (error) {
    console.error("Error fetching customer policies:", error);
    return [];
  }
  return (data || []) as DbPolicy[];
}

export async function syncPolicyStatuses(): Promise<void> {
  if (!isSupabaseConfigured() || !supabaseAdmin) return;

  const { data: policies } = await supabaseAdmin
    .from("policies")
    .select("id, end_date, status");

  if (!policies) return;

  for (const p of policies) {
    const correctStatus = computePolicyStatus(p.end_date);
    if (p.status !== correctStatus) {
      await supabaseAdmin
        .from("policies")
        .update({ status: correctStatus })
        .eq("id", p.id);
    }
  }
}

export async function getRetentionAlerts(): Promise<RetentionAlert[]> {
  if (!isSupabaseConfigured() || !supabaseAdmin) return [];

  // Sync statuses first
  await syncPolicyStatuses();

  // Get all non-expired policies with their customers
  const { data, error } = await supabaseAdmin
    .from("policies")
    .select("*, customer:customers(*)")
    .in("status", ["active", "expiring"])
    .order("end_date", { ascending: true });

  if (error) {
    console.error("Error fetching retention alerts:", error);
    return [];
  }

  const policies = (data || []) as (DbPolicy & { customer: DbCustomer })[];

  // Group by customer
  const byCustomer = new Map<string, { customer: DbCustomer; policies: typeof policies }>();

  for (const p of policies) {
    if (!p.customer) continue;
    const existing = byCustomer.get(p.customer_id);
    if (existing) {
      existing.policies.push(p);
    } else {
      byCustomer.set(p.customer_id, { customer: p.customer, policies: [p] });
    }
  }

  // Build alerts — only include customers with at least one expiring policy or expiring discount
  const alerts: RetentionAlert[] = [];

  for (const [, group] of byCustomer) {
    const enriched = group.policies.map((p) => {
      const daysEnd = diffDays(p.end_date);
      const daysDiscount = p.discount_end_date ? diffDays(p.discount_end_date) : null;
      return {
        ...p,
        days_until_end: daysEnd,
        days_until_discount_end: daysDiscount,
        discount_expiring: daysDiscount !== null && daysDiscount >= 0 && daysDiscount <= 14,
      };
    });

    const hasExpiring = enriched.some((p) => p.days_until_end >= 0 && p.days_until_end <= 30);
    const hasDiscountExpiring = enriched.some((p) => p.discount_expiring);

    if (hasExpiring || hasDiscountExpiring) {
      const urgentDays = Math.min(...enriched.map((p) => p.days_until_end).filter((d) => d >= 0));

      alerts.push({
        customer: group.customer,
        policies: enriched,
        most_urgent_days: urgentDays === Infinity ? 999 : urgentDays,
        has_discount_expiring: hasDiscountExpiring,
      });
    }
  }

  // Sort by urgency
  alerts.sort((a, b) => a.most_urgent_days - b.most_urgent_days);

  return alerts;
}
