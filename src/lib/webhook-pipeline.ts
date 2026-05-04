/**
 * Unified WhatsApp Webhook Pipeline
 *
 * Single flow for every incoming message:
 * 1. Identify or create customer
 * 2. Find or create active session (linked to customer)
 * 3. Load full context (policies, claims, conversation history)
 * 4. AI processes message (fallback to rule-based)
 * 5. Persist everything in one pass:
 *    - Save messages (inbound + outbound)
 *    - Update session
 *    - Update customer (name, email if learned)
 *    - Create/update claim if ready
 *    - Link to matching policy
 * 6. Return reply for Twilio
 *
 * No orphan data — everything is connected.
 */

import { supabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";
import {
  processClaimMessage,
  isAIAvailable,
  REQUIRED_DOCUMENTS,
  type CustomerPolicyContext,
  type CustomerClaimContext,
  type AIAgentOutput,
} from "@/lib/ai-claims-agent";
import {
  processMessage as processRuleBased,
  getOrCreateSession as getRuleSession,
  calculateMissingDocs,
} from "@/lib/automation-engine";

// ---- Types ----

interface PipelineContext {
  phone: string;
  message: string;
  // Resolved entities (null = not yet resolved)
  customerId: string | null;
  customerName: string | null;
  customerEmail: string | null;
  sessionId: string | null;
  // Loaded context
  policies: CustomerPolicyContext[];
  claims: CustomerClaimContext[];
  conversationHistory: { direction: "inbound" | "outbound"; message: string }[];
  // Existing records for AI
  existingCustomer: {
    id: string;
    full_name: string;
    phone: string;
    email: string | null;
  } | null;
  currentSession: {
    id: string;
    current_step: string;
    collected_data: Record<string, unknown>;
  } | null;
}

interface PipelineResult {
  reply: string;
  usedAI: boolean;
  claimCreated: boolean;
  claimNumber: string | null;
  customerId: string | null;
  sessionId: string | null;
}

const TYPE_LABELS: Record<string, string> = {
  car: "ביטוח רכב",
  health: "ביטוח בריאות",
  life: "ביטוח חיים",
  property: "ביטוח רכוש",
  travel: "ביטוח נסיעות",
  other: "ביטוח אחר",
};

// ---- Main Pipeline ----

export async function runPipeline(phone: string, message: string): Promise<PipelineResult> {
  const ctx: PipelineContext = {
    phone,
    message,
    customerId: null,
    customerName: null,
    customerEmail: null,
    sessionId: null,
    policies: [],
    claims: [],
    conversationHistory: [],
    existingCustomer: null,
    currentSession: null,
  };

  const dbReady = isSupabaseConfigured() && !!supabaseAdmin;

  // ========================================
  // STEP 1: Identify or create customer
  // ========================================
  if (dbReady) {
    await resolveCustomer(ctx);
    console.log("[pipeline] Customer:", ctx.customerId || "new (will create after AI)");
  }

  // ========================================
  // STEP 2: Find or create active session
  // ========================================
  if (dbReady) {
    await resolveSession(ctx);
    console.log("[pipeline] Session:", ctx.sessionId || "new (will create)");
  }

  // ========================================
  // STEP 3: Load full context
  // ========================================
  if (dbReady && ctx.customerId) {
    await loadContext(ctx);
    console.log("[pipeline] Context loaded:", {
      policies: ctx.policies.length,
      claims: ctx.claims.length,
      history: ctx.conversationHistory.length,
    });
  }

  // ========================================
  // STEP 4: Process message (AI or rule-based)
  // ========================================
  let reply = "שלום! אני כאן לעזור. ספר לי במה אוכל לסייע?";
  let aiResult: AIAgentOutput | null = null;
  let usedAI = false;
  let claimCreated = false;
  let ruleBasedSession: { current_step: string; collected_data: Record<string, string> } | null = null;

  if (isAIAvailable()) {
    try {
      console.log("[pipeline] Using AI agent");
      aiResult = await processClaimMessage({
        phone,
        message,
        existingCustomer: ctx.existingCustomer,
        currentSession: ctx.currentSession,
        conversationHistory: ctx.conversationHistory,
        policies: ctx.policies,
        claims: ctx.claims,
      });
      reply = aiResult.reply;
      claimCreated = aiResult.readyForClaim;
      usedAI = true;
      console.log("[pipeline] AI result:", {
        ready: aiResult.readyForClaim,
        missing: aiResult.missingFields.length,
        insights: aiResult.insights.length,
      });
    } catch (aiErr) {
      console.error("[pipeline] AI failed, falling back:", aiErr);
      aiResult = null;
    }
  }

  if (!usedAI) {
    console.log("[pipeline] Using rule-based engine");
    getRuleSession(phone);
    const engineResult = processRuleBased(phone, message);
    reply = engineResult.botReply;
    claimCreated = engineResult.claimCreated;
    ruleBasedSession = engineResult.session;
  }

  // ========================================
  // STEP 5: Persist everything (single path)
  // ========================================
  let claimNumber: string | null = null;

  if (dbReady) {
    try {
      // 5a. Ensure customer exists
      if (!ctx.customerId) {
        const name = usedAI && aiResult
          ? (typeof aiResult.updatedData.full_name === "string" ? aiResult.updatedData.full_name : "")
          : "";
        ctx.customerId = await createCustomer(phone, name);
        console.log("[pipeline] Created customer:", ctx.customerId);
      }

      // 5b. Update customer details if AI learned new info
      if (usedAI && aiResult && ctx.customerId) {
        await updateCustomerFromAI(ctx.customerId, ctx.existingCustomer, aiResult.updatedData);
      }

      // 5c. Ensure session exists (linked to customer)
      if (!ctx.sessionId && ctx.customerId) {
        const step = usedAI
          ? (aiResult?.readyForClaim ? "done" : aiResult?.missingFields.length === 0 ? "ready_for_review" : "collecting_info")
          : "START";
        const data = usedAI && aiResult ? aiResult.updatedData : {};
        ctx.sessionId = await createSession(phone, ctx.customerId, step, data);
        console.log("[pipeline] Created session:", ctx.sessionId);
      }

      // 5d. Save both messages (inbound + outbound)
      if (ctx.sessionId) {
        await saveMessages(ctx.sessionId, message, reply);
      }

      // 5e. Update session state
      if (ctx.sessionId) {
        if (usedAI && aiResult) {
          const step = aiResult.readyForClaim
            ? "done"
            : aiResult.missingFields.length === 0
              ? "ready_for_review"
              : "collecting_info";
          const status = aiResult.readyForClaim ? "completed" : "active";
          await updateSession(ctx.sessionId, step, aiResult.updatedData, status);
        } else if (ruleBasedSession) {
          const status = ruleBasedSession.current_step === "DONE" ? "completed" : "active";
          await updateSession(ctx.sessionId, ruleBasedSession.current_step, ruleBasedSession.collected_data, status);
        }
      }

      // 5f. Create claim if ready
      if (claimCreated && ctx.customerId && ctx.sessionId) {
        if (usedAI && aiResult) {
          const result = await createClaimFromAI(ctx, aiResult);
          claimNumber = result.claimNumber;
          if (claimNumber && !reply.includes(claimNumber)) {
            reply += `\nמספר התביעה שלך: ${claimNumber}`;
          }
        } else if (ruleBasedSession) {
          const result = await createClaimFromRuleBased(ctx, ruleBasedSession.collected_data);
          claimNumber = result.claimNumber;
        }

        // Mark session completed after claim creation
        if (ctx.sessionId) {
          await updateSessionStatus(ctx.sessionId, "completed");
        }
      }

      console.log("[pipeline] Persistence complete:", {
        customerId: ctx.customerId,
        sessionId: ctx.sessionId,
        claimNumber,
        usedAI,
      });
    } catch (dbErr) {
      console.error("[pipeline] Persistence error (non-fatal):", dbErr);
    }
  }

  return {
    reply,
    usedAI,
    claimCreated,
    claimNumber,
    customerId: ctx.customerId,
    sessionId: ctx.sessionId,
  };
}

// ========================================
// Step 1: Customer resolution
// ========================================

async function resolveCustomer(ctx: PipelineContext): Promise<void> {
  const { data } = await supabaseAdmin!
    .from("customers")
    .select("*")
    .eq("phone", ctx.phone)
    .single();

  if (data) {
    ctx.customerId = data.id;
    ctx.customerName = data.full_name || null;
    ctx.customerEmail = data.email || null;
    ctx.existingCustomer = {
      id: data.id,
      full_name: data.full_name || "",
      phone: data.phone,
      email: data.email || null,
    };
  }
}

async function createCustomer(phone: string, name: string): Promise<string | null> {
  const { data, error } = await supabaseAdmin!
    .from("customers")
    .insert({ phone, full_name: name || "" })
    .select("id")
    .single();

  if (error) {
    console.error("[pipeline] Error creating customer:", error);
    return null;
  }
  return data?.id || null;
}

async function updateCustomerFromAI(
  customerId: string,
  existing: PipelineContext["existingCustomer"],
  aiData: Record<string, unknown>
): Promise<void> {
  const updates: Record<string, string> = {};

  // Update name if AI learned it and current is empty
  if (typeof aiData.full_name === "string" && aiData.full_name && (!existing || !existing.full_name)) {
    updates.full_name = aiData.full_name;
  }

  // Update email if AI learned it and current is empty
  if (typeof aiData.email === "string" && aiData.email && (!existing || !existing.email)) {
    updates.email = aiData.email;
  }

  if (Object.keys(updates).length > 0) {
    await supabaseAdmin!.from("customers").update(updates).eq("id", customerId);
    console.log("[pipeline] Updated customer:", updates);
  }
}

// ========================================
// Step 2: Session resolution
// ========================================

async function resolveSession(ctx: PipelineContext): Promise<void> {
  const { data } = await supabaseAdmin!
    .from("intake_sessions")
    .select("*")
    .eq("phone", ctx.phone)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (data) {
    ctx.sessionId = data.id;
    ctx.currentSession = {
      id: data.id,
      current_step: data.current_step,
      collected_data: data.collected_data as Record<string, unknown>,
    };
  }
}

async function createSession(
  phone: string,
  customerId: string,
  step: string,
  data: Record<string, unknown>
): Promise<string | null> {
  const { data: sess, error } = await supabaseAdmin!
    .from("intake_sessions")
    .insert({
      phone,
      customer_id: customerId,
      current_step: step,
      status: "active",
      collected_data: data,
    })
    .select("id")
    .single();

  if (error) {
    console.error("[pipeline] Error creating session:", error);
    return null;
  }
  return sess?.id || null;
}

async function updateSession(
  sessionId: string,
  step: string,
  data: Record<string, unknown>,
  status: string
): Promise<void> {
  await supabaseAdmin!
    .from("intake_sessions")
    .update({ current_step: step, collected_data: data, status })
    .eq("id", sessionId);
}

async function updateSessionStatus(sessionId: string, status: string): Promise<void> {
  await supabaseAdmin!
    .from("intake_sessions")
    .update({ status })
    .eq("id", sessionId);
}

// ========================================
// Step 3: Load context
// ========================================

async function loadContext(ctx: PipelineContext): Promise<void> {
  const customerId = ctx.customerId!;
  const now = new Date();
  now.setUTCHours(0, 0, 0, 0);

  // Load policies, claims, and conversation history in parallel
  const [policiesResult, claimsResult, historyResult] = await Promise.all([
    supabaseAdmin!
      .from("policies")
      .select("*")
      .eq("customer_id", customerId)
      .in("status", ["active", "expiring"]),

    supabaseAdmin!
      .from("claims")
      .select("id, claim_number, claim_type, status, description, created_at, updated_at, missing_documents, readiness_score, policy_number")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false })
      .limit(10),

    ctx.sessionId
      ? supabaseAdmin!
          .from("intake_messages")
          .select("direction, message")
          .eq("session_id", ctx.sessionId)
          .order("created_at", { ascending: true })
      : Promise.resolve({ data: null }),
  ]);

  // Map policies
  if (policiesResult.data && policiesResult.data.length > 0) {
    ctx.policies = policiesResult.data.map((p: Record<string, unknown>) => {
      const dEnd = Math.ceil(
        (new Date((p.end_date as string) + "T00:00:00Z").getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      const dDiscount = p.discount_end_date
        ? Math.ceil(
            (new Date((p.discount_end_date as string) + "T00:00:00Z").getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          )
        : null;
      return {
        insurance_type: p.insurance_type as string,
        provider: p.provider as string,
        policy_number: p.policy_number as string,
        end_date: p.end_date as string,
        days_until_end: dEnd,
        discount_end_date: (p.discount_end_date as string) || null,
        days_until_discount_end: dDiscount,
        status: p.status as string,
      };
    });
  }

  // Map claims
  if (claimsResult.data && claimsResult.data.length > 0) {
    const nowMs = new Date().getTime();
    ctx.claims = claimsResult.data.map((c: Record<string, unknown>) => ({
      claim_number: c.claim_number as string,
      claim_type: c.claim_type as string,
      status: c.status as string,
      description: (c.description as string) || null,
      created_at: c.created_at as string,
      updated_at: c.updated_at as string,
      days_since_update: Math.floor((nowMs - new Date(c.updated_at as string).getTime()) / (1000 * 60 * 60 * 24)),
      missing_documents: (c.missing_documents as string[]) || [],
      readiness_score: (c.readiness_score as number) || 0,
    }));
  }

  // Map conversation history
  if (historyResult.data) {
    ctx.conversationHistory = historyResult.data as { direction: "inbound" | "outbound"; message: string }[];
  }
}

// ========================================
// Step 5d: Messages
// ========================================

async function saveMessages(sessionId: string, inbound: string, outbound: string): Promise<void> {
  await supabaseAdmin!.from("intake_messages").insert([
    { session_id: sessionId, direction: "inbound", message: inbound },
    { session_id: sessionId, direction: "outbound", message: outbound },
  ]);
}

// ========================================
// Step 5f: Claim creation
// ========================================

async function createClaimFromAI(
  ctx: PipelineContext,
  aiResult: AIAgentOutput
): Promise<{ claimNumber: string | null; claimId: string | null }> {
  const data = aiResult.updatedData;

  const claimType = typeof data.claim_type === "string" && data.claim_type !== "unknown"
    ? data.claim_type
    : (ctx.currentSession?.collected_data?.claim_type as string) || "other";

  const claimNumber = `CLM-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 900) + 100)}`;

  const policyNumber = (data.policy_number as string) || null;

  // ---- Link to matching policy ----
  const policyId = await findMatchingPolicy(ctx.customerId!, policyNumber, claimType);

  const requiredDocs = REQUIRED_DOCUMENTS[claimType] || REQUIRED_DOCUMENTS.other;
  const readinessScore = aiResult.missingFields.length === 0
    ? 80
    : Math.max(10, 80 - aiResult.missingFields.length * 10);

  const { data: claim, error } = await supabaseAdmin!
    .from("claims")
    .insert({
      claim_number: claimNumber,
      customer_id: ctx.customerId,
      intake_session_id: ctx.sessionId,
      policy_id: policyId,
      claim_type: claimType,
      status: "new",
      event_date: (data.event_date as string) || null,
      event_location: (data.event_location as string) || null,
      description: (data.description as string) || null,
      vehicle_number: (data.vehicle_number as string) || (data.plate_number as string) || null,
      policy_number: policyNumber,
      injuries: !!(data.injuries && data.injuries !== "לא" && data.injuries !== "false"),
      third_party_involved: !!(data.third_party_details),
      third_party_details: data.third_party_details
        ? { info: (data.third_party_details as string) || "" }
        : null,
      missing_documents: requiredDocs,
      readiness_score: readinessScore,
      ai_summary: buildSummary(data, claimType),
      inspector_message: buildInspectorMessage(data, claimNumber, claimType),
    })
    .select("id, claim_number")
    .single();

  if (error) {
    console.error("[pipeline] Error creating claim:", error);
    return { claimNumber: null, claimId: null };
  }

  console.log("[pipeline] Created claim:", claim?.claim_number, "linked to policy:", policyId || "none");
  return { claimNumber: claim?.claim_number || claimNumber, claimId: claim?.id || null };
}

async function createClaimFromRuleBased(
  ctx: PipelineContext,
  collectedData: Record<string, string>
): Promise<{ claimNumber: string | null; claimId: string | null }> {
  const claimNumber = `CLM-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 900) + 100)}`;
  const missingDocs = calculateMissingDocs(collectedData);
  const policyNumber = collectedData.policy_number || null;

  // Link to matching policy
  const policyId = await findMatchingPolicy(ctx.customerId!, policyNumber, "car");

  const fields = ["event_date", "event_location", "description", "plate_number", "policy_number"];
  const filled = fields.filter((f) => collectedData[f] && collectedData[f].trim()).length;
  let score = Math.round((filled / fields.length) * 70);
  score += missingDocs.length === 0 ? 30 : Math.max(0, 30 - missingDocs.length * 10);
  score = Math.min(100, score);

  const { data: claim, error } = await supabaseAdmin!
    .from("claims")
    .insert({
      claim_number: claimNumber,
      customer_id: ctx.customerId,
      intake_session_id: ctx.sessionId,
      policy_id: policyId,
      claim_type: "car",
      status: "new",
      event_date: collectedData.event_date || null,
      event_location: collectedData.event_location || null,
      description: collectedData.description || null,
      vehicle_number: collectedData.plate_number || null,
      policy_number: policyNumber,
      injuries: collectedData.has_injuries === "כן",
      third_party_involved: collectedData.other_vehicle === "כן",
      third_party_details: collectedData.other_vehicle === "כן"
        ? { info: collectedData.third_party_info || "" }
        : null,
      missing_documents: missingDocs,
      readiness_score: score,
      ai_summary: buildRuleBasedSummary(collectedData),
    })
    .select("id, claim_number")
    .single();

  if (error) {
    console.error("[pipeline] Error creating rule-based claim:", error);
    return { claimNumber: null, claimId: null };
  }

  console.log("[pipeline] Created rule-based claim:", claim?.claim_number, "linked to policy:", policyId || "none");
  return { claimNumber: claim?.claim_number || claimNumber, claimId: claim?.id || null };
}

// ========================================
// Policy linking
// ========================================

async function findMatchingPolicy(
  customerId: string,
  policyNumber: string | null,
  claimType: string
): Promise<string | null> {
  // Strategy 1: Match by policy number
  if (policyNumber) {
    const { data } = await supabaseAdmin!
      .from("policies")
      .select("id")
      .eq("customer_id", customerId)
      .eq("policy_number", policyNumber)
      .limit(1)
      .single();

    if (data) return data.id;
  }

  // Strategy 2: Match by insurance type (customer's active policy of same type)
  if (claimType && claimType !== "other" && claimType !== "unknown") {
    const { data } = await supabaseAdmin!
      .from("policies")
      .select("id")
      .eq("customer_id", customerId)
      .eq("insurance_type", claimType)
      .in("status", ["active", "expiring"])
      .order("end_date", { ascending: false })
      .limit(1)
      .single();

    if (data) return data.id;
  }

  return null;
}

// ========================================
// Summary builders
// ========================================

function buildSummary(data: Record<string, unknown>, claimType: string): string {
  const parts: string[] = [];
  parts.push(`סוג תביעה: ${TYPE_LABELS[claimType] || claimType}`);
  if (data.customer_name) parts.push(`לקוח: ${data.customer_name}`);
  if (data.full_name) parts.push(`לקוח: ${data.full_name}`);
  if (data.event_date) parts.push(`תאריך אירוע: ${data.event_date}`);
  if (data.event_time) parts.push(`שעה: ${data.event_time}`);
  if (data.event_location) parts.push(`מיקום: ${data.event_location}`);
  if (data.description) parts.push(`תיאור: ${data.description}`);
  if (data.policy_number) parts.push(`פוליסה: ${data.policy_number}`);
  if (data.damage_details) parts.push(`נזק: ${data.damage_details}`);
  if (data.injuries && data.injuries !== "לא") parts.push(`פציעות: ${data.injuries}`);
  if (data.involved_parties) parts.push(`צדדים מעורבים: ${data.involved_parties}`);
  return parts.join("\n");
}

function buildInspectorMessage(
  data: Record<string, unknown>,
  claimNumber: string,
  claimType: string
): string {
  return `לכבוד מחלקת תביעות,

הנדון: תביעת ${TYPE_LABELS[claimType] || claimType} - ${claimNumber}
${data.policy_number ? `מספר פוליסה: ${data.policy_number}` : ""}

מוגשת בזאת תביעה בגין אירוע שהתרחש ביום ${data.event_date || "לא צוין"}.
מיקום: ${data.event_location || "לא צוין"}

תיאור האירוע:
${data.description || "לא צוין"}

${data.damage_details ? `פרטי נזק: ${data.damage_details}` : ""}
${data.injuries && data.injuries !== "לא" ? `פציעות: ${data.injuries}` : "ללא פצ��עות"}
${data.involved_parties ? `צדדים מעורבים: ${data.involved_parties}` : "ללא צד שלישי"}

נודה לטיפולכם המהיר.

בברכה,
סוכנות ביטוח ClaimPilot`;
}

function buildRuleBasedSummary(data: Record<string, string>): string {
  const parts: string[] = [];
  parts.push("סוג תביעה: ביטוח רכב");
  if (data.event_date) parts.push(`תאריך אירוע: ${data.event_date}`);
  if (data.event_location) parts.push(`מיקום: ${data.event_location}`);
  if (data.description) parts.push(`תיאור: ${data.description}`);
  if (data.plate_number) parts.push(`מספר רכב: ${data.plate_number}`);
  if (data.policy_number) parts.push(`פוליסה: ${data.policy_number}`);
  if (data.has_injuries === "כן") {
    parts.push("פציעות: כן");
    if (data.injury_details) parts.push(`פרטי פציעה: ${data.injury_details}`);
  }
  if (data.other_vehicle === "כן") {
    parts.push("צד שלישי מעורב: כן");
    if (data.third_party_info) parts.push(`פרטי צד שלישי: ${data.third_party_info}`);
  }
  return parts.join("\n");
}
