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
