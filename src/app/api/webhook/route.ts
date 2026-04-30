import { processMessage, getOrCreateSession, calculateMissingDocs } from "@/lib/automation-engine";
import { processClaimMessage, isAIAvailable } from "@/lib/ai-claims-agent";
import { supabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";
import twilio from "twilio";

function parseTwilioPhone(raw: string): string {
  return raw.replace("whatsapp:", "").replace(/^\+972/, "0").trim();
}

function formatTwilioPhone(phone: string): string {
  const international = phone.startsWith("0")
    ? "+972" + phone.slice(1)
    : phone.startsWith("+")
      ? phone
      : "+972" + phone;
  return `whatsapp:${international}`;
}

export async function GET() {
  return new Response("ClaimOS webhook is live", { status: 200 });
}

export async function POST(req: Request) {
  try {
    const text = await req.text();
    const params = new URLSearchParams(text);

    const body = params.get("Body") || "";
    const from = params.get("From") || "";

    console.log("[webhook] Incoming message:", { from, body: body.substring(0, 100) });

    if (!from || !body) {
      console.log("[webhook] Missing Body or From, returning 400");
      return new Response("Missing Body or From", { status: 400 });
    }

    const phone = parseTwilioPhone(from);
    console.log("[webhook] Parsed phone:", phone);

    // ---- Try AI Agent first, fallback to rule-based engine ----
    let botReply: string;
    let claimCreated = false;
    let aiResult: Awaited<ReturnType<typeof processClaimMessage>> | null = null;
    let usedAI = false;

    // Load existing customer & session from Supabase for AI context
    let existingCustomer: { id: string; full_name: string; phone: string; email: string | null } | null = null;
    let currentSession: { id: string; current_step: string; collected_data: Record<string, unknown> } | null = null;
    let conversationHistory: { direction: "inbound" | "outbound"; message: string }[] = [];
    let customerId: string | null = null;
    let sessionId: string | null = null;

    if (isSupabaseConfigured() && supabaseAdmin) {
      // Load customer
      const { data: custData } = await supabaseAdmin
        .from("customers")
        .select("*")
        .eq("phone", phone)
        .single();

      if (custData) {
        existingCustomer = custData;
        customerId = custData.id;
        console.log("[webhook] Found existing customer:", customerId);
      }

      // Load active session
      const { data: sessData } = await supabaseAdmin
        .from("intake_sessions")
        .select("*")
        .eq("phone", phone)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (sessData) {
        currentSession = sessData;
        sessionId = sessData.id;
        console.log("[webhook] Found active session:", sessionId);

        // Load conversation history
        const { data: msgData } = await supabaseAdmin
          .from("intake_messages")
          .select("direction, message")
          .eq("session_id", sessionId)
          .order("created_at", { ascending: true });

        if (msgData) {
          conversationHistory = msgData as { direction: "inbound" | "outbound"; message: string }[];
          console.log("[webhook] Loaded conversation history:", conversationHistory.length, "messages");
        }
      }
    }

    // Try AI agent
    if (isAIAvailable()) {
      try {
        console.log("[webhook] Using AI agent");
        aiResult = await processClaimMessage({
          phone,
          message: body,
          existingCustomer,
          currentSession,
          conversationHistory,
        });

        botReply = aiResult.reply;
        claimCreated = aiResult.shouldCreateClaim;
        usedAI = true;
        console.log("[webhook] AI agent success:", {
          claimType: aiResult.claimType,
          step: aiResult.currentStep,
          readiness: aiResult.readinessScore,
          shouldCreate: aiResult.shouldCreateClaim,
        });
      } catch (aiErr) {
        console.error("[webhook] AI agent failed, falling back to rule-based engine:", aiErr);
        // Fallback below
        usedAI = false;
        aiResult = null;
      }
    }

    // Fallback to rule-based engine
    if (!usedAI) {
      console.log("[webhook] Using rule-based automation engine");
      getOrCreateSession(phone);
      const engineResult = processMessage(phone, body);
      botReply = engineResult.botReply;
      claimCreated = engineResult.claimCreated;

      // Map engine result to persist below
      const session = engineResult.session;

      // Persist using the old flow for rule-based engine
      if (isSupabaseConfigured() && supabaseAdmin) {
        try {
          // Create customer if needed
          if (!customerId) {
            const { data: newCust } = await supabaseAdmin
              .from("customers")
              .insert({ phone, full_name: "" })
              .select()
              .single();
            if (newCust) customerId = newCust.id;
          }

          // Create session if needed
          if (!sessionId) {
            const { data: newSess } = await supabaseAdmin
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
            if (newSess) sessionId = newSess.id;
          }

          if (sessionId) {
            // Save messages
            await supabaseAdmin.from("intake_messages").insert({
              session_id: sessionId,
              direction: "inbound",
              message: body,
            });
            await supabaseAdmin.from("intake_messages").insert({
              session_id: sessionId,
              direction: "outbound",
              message: botReply!,
            });

            // Update session
            const newStatus = session.current_step === "DONE" ? "completed" : "active";
            await supabaseAdmin
              .from("intake_sessions")
              .update({
                current_step: session.current_step,
                collected_data: session.collected_data,
                status: newStatus,
              })
              .eq("id", sessionId);

            // Create claim if done
            if (claimCreated) {
              const missingDocs = calculateMissingDocs(session.collected_data);
              const claimNumber = `CLM-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 900) + 100)}`;

              await supabaseAdmin.from("claims").insert({
                claim_number: claimNumber,
                customer_id: customerId,
                intake_session_id: sessionId,
                claim_type: "car",
                status: "new",
                event_date: session.collected_data.event_date || null,
                event_location: session.collected_data.event_location || null,
                description: session.collected_data.description || null,
                vehicle_number: session.collected_data.plate_number || null,
                policy_number: session.collected_data.policy_number || null,
                injuries: session.collected_data.has_injuries === "כן",
                third_party_involved: session.collected_data.other_vehicle === "כן",
                third_party_details:
                  session.collected_data.other_vehicle === "כן"
                    ? { info: session.collected_data.third_party_info || "" }
                    : null,
                missing_documents: missingDocs,
                readiness_score: calculateReadinessScore(session.collected_data, missingDocs),
                ai_summary: generateSummary(session.collected_data),
              });

              await supabaseAdmin
                .from("intake_sessions")
                .update({ status: "completed" })
                .eq("id", sessionId);
            }
          }
        } catch (dbErr) {
          console.error("[webhook] Rule-based persistence error (non-fatal):", dbErr);
        }
      }
    }

    // ---- AI Agent persistence ----
    if (usedAI && aiResult && isSupabaseConfigured() && supabaseAdmin) {
      try {
        // Create customer if needed
        if (!customerId) {
          const customerName =
            typeof aiResult.extractedData.customer_name === "string"
              ? aiResult.extractedData.customer_name
              : "";
          const { data: newCust } = await supabaseAdmin
            .from("customers")
            .insert({ phone, full_name: customerName })
            .select()
            .single();
          if (newCust) {
            customerId = newCust.id;
            console.log("[webhook] Created new customer:", customerId);
          }
        } else if (
          typeof aiResult.extractedData.customer_name === "string" &&
          aiResult.extractedData.customer_name &&
          existingCustomer &&
          !existingCustomer.full_name
        ) {
          // Update customer name if we learned it
          await supabaseAdmin
            .from("customers")
            .update({ full_name: aiResult.extractedData.customer_name })
            .eq("id", customerId);
          console.log("[webhook] Updated customer name:", aiResult.extractedData.customer_name);
        }

        // Create session if needed
        if (!sessionId) {
          const { data: newSess } = await supabaseAdmin
            .from("intake_sessions")
            .insert({
              phone,
              customer_id: customerId,
              current_step: aiResult.currentStep,
              status: "active",
              collected_data: aiResult.extractedData,
            })
            .select()
            .single();
          if (newSess) {
            sessionId = newSess.id;
            console.log("[webhook] Created new session:", sessionId);
          }
        }

        if (sessionId) {
          // Save inbound message
          await supabaseAdmin.from("intake_messages").insert({
            session_id: sessionId,
            direction: "inbound",
            message: body,
          });

          // Save outbound message
          await supabaseAdmin.from("intake_messages").insert({
            session_id: sessionId,
            direction: "outbound",
            message: botReply!,
          });

          // Merge extracted data with existing session data
          const mergedData: Record<string, unknown> = {
            ...(currentSession?.collected_data || {}),
            ...aiResult.extractedData,
            claim_type: aiResult.claimType !== "unknown" ? aiResult.claimType : (currentSession?.collected_data?.claim_type || undefined),
            readiness_score: aiResult.readinessScore,
            missing_fields: aiResult.missingFields,
            missing_documents: aiResult.missingDocuments,
          };

          // Update session
          const sessionStatus = aiResult.claimStatus === "done" ? "completed" : "active";
          await supabaseAdmin
            .from("intake_sessions")
            .update({
              current_step: aiResult.currentStep,
              collected_data: mergedData,
              status: sessionStatus,
            })
            .eq("id", sessionId);

          console.log("[webhook] Updated session:", {
            sessionId,
            step: aiResult.currentStep,
            status: sessionStatus,
            readiness: aiResult.readinessScore,
          });

          // Create claim if AI says so
          if (aiResult.shouldCreateClaim) {
            console.log("[webhook] AI triggered claim creation");
            const claimNumber = `CLM-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 900) + 100)}`;

            const claimType = aiResult.claimType !== "unknown" ? aiResult.claimType : "other";
            const eventDate = (mergedData.event_date as string) || null;
            const eventLocation = (mergedData.event_location as string) || null;
            const description = (mergedData.description as string) || null;
            const policyNumber = (mergedData.policy_number as string) || null;
            const vehicleNumber = (mergedData.vehicle_number as string) || (mergedData.plate_number as string) || null;
            const hasInjuries = !!(mergedData.injuries && mergedData.injuries !== "לא" && mergedData.injuries !== "false");
            const hasThirdParty = !!(mergedData.involved_parties);

            const aiSummary = buildAISummary(mergedData, claimType);
            const inspectorMessage = buildInspectorMessage(mergedData, claimNumber, claimType);

            const { data: claim, error: claimErr } = await supabaseAdmin
              .from("claims")
              .insert({
                claim_number: claimNumber,
                customer_id: customerId,
                intake_session_id: sessionId,
                claim_type: claimType,
                status: "new",
                event_date: eventDate,
                event_location: eventLocation,
                description,
                vehicle_number: vehicleNumber,
                policy_number: policyNumber,
                injuries: hasInjuries,
                third_party_involved: hasThirdParty,
                third_party_details: hasThirdParty
                  ? { info: (mergedData.involved_parties as string) || "" }
                  : null,
                missing_documents: aiResult.missingDocuments,
                readiness_score: aiResult.readinessScore,
                ai_summary: aiSummary,
                inspector_message: inspectorMessage,
              })
              .select()
              .single();

            if (claimErr) {
              console.error("[webhook] Error creating AI claim:", claimErr);
            } else {
              console.log("[webhook] Created AI claim:", claim?.claim_number);

              // Update the bot reply with the claim number
              const claimNum = claim?.claim_number || claimNumber;
              if (!botReply!.includes(claimNum)) {
                botReply = botReply! + `\nמספר התביעה שלך: ${claimNum}`;
              }
            }

            // Mark session as completed
            await supabaseAdmin
              .from("intake_sessions")
              .update({ status: "completed" })
              .eq("id", sessionId);
          }
        }
      } catch (dbErr) {
        console.error("[webhook] AI persistence error (non-fatal):", dbErr);
      }
    }

    // ---- Send reply via Twilio ----
    const sid = process.env.TWILIO_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_WHATSAPP_FROM || "whatsapp:+14155238886";

    if (sid && token) {
      const client = twilio(sid, token);
      await client.messages.create({
        from: fromNumber,
        to: formatTwilioPhone(phone),
        body: botReply!,
      });
      console.log("[webhook] Twilio reply sent to:", phone, usedAI ? "(AI)" : "(rule-based)");
    } else {
      console.error("[webhook] Missing TWILIO_SID or TWILIO_AUTH_TOKEN — reply not sent");
    }

    return new Response("<Response></Response>", {
      status: 200,
      headers: { "Content-Type": "text/xml" },
    });
  } catch (err) {
    console.error("[webhook] Fatal error:", err);
    return new Response("<Response></Response>", {
      status: 200,
      headers: { "Content-Type": "text/xml" },
    });
  }
}

// ---- Helpers ----

function calculateReadinessScore(data: Record<string, string>, missingDocs: string[]): number {
  const fields = ["event_date", "event_location", "description", "plate_number", "policy_number"];
  const filled = fields.filter((f) => data[f] && data[f].trim()).length;
  let score = Math.round((filled / fields.length) * 70);
  const docScore = missingDocs.length === 0 ? 30 : Math.max(0, 30 - missingDocs.length * 10);
  score += docScore;
  return Math.min(100, score);
}

function generateSummary(data: Record<string, string>): string {
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

function buildAISummary(data: Record<string, unknown>, claimType: string): string {
  const typeLabels: Record<string, string> = {
    car: "ביטוח רכב",
    health: "ביטוח בריאות",
    life: "ביטוח חיים",
    property: "ביטוח רכוש",
    travel: "ביטוח נסיעות",
    other: "ביטוח אחר",
  };

  const parts: string[] = [];
  parts.push(`סוג תביעה: ${typeLabels[claimType] || claimType}`);
  if (data.customer_name) parts.push(`לקוח: ${data.customer_name}`);
  if (data.event_date) parts.push(`תאריך אירוע: ${data.event_date}`);
  if (data.event_time) parts.push(`שעה: ${data.event_time}`);
  if (data.event_location) parts.push(`מיקום: ${data.event_location}`);
  if (data.description) parts.push(`תיאור: ${data.description}`);
  if (data.policy_number) parts.push(`פוליסה: ${data.policy_number}`);
  if (data.damage_details) parts.push(`נזק: ${data.damage_details}`);
  if (data.injuries && data.injuries !== "לא") parts.push(`פציעות: ${data.injuries}`);
  if (data.involved_parties) parts.push(`צדדים מעורבים: ${data.involved_parties}`);
  if (data.missing_documents && Array.isArray(data.missing_documents) && (data.missing_documents as string[]).length > 0) {
    parts.push(`מסמכים חסרים: ${(data.missing_documents as string[]).join(", ")}`);
  }
  return parts.join("\n");
}

function buildInspectorMessage(
  data: Record<string, unknown>,
  claimNumber: string,
  claimType: string
): string {
  const typeLabels: Record<string, string> = {
    car: "ביטוח רכב",
    health: "ביטוח בריאות",
    life: "ביטוח חיים",
    property: "ביטוח רכוש",
    travel: "ביטוח נסיעות",
    other: "ביטוח אחר",
  };

  return `לכבוד מחלקת תביעות,

הנדון: תביעת ${typeLabels[claimType] || claimType} - ${claimNumber}
${data.policy_number ? `מספר פוליסה: ${data.policy_number}` : ""}

מוגשת בזאת תביעה בגין אירוע שהתרחש ביום ${data.event_date || "לא צוין"}.
מיקום: ${data.event_location || "לא צוין"}

תיאור האירוע:
${data.description || "לא צוין"}

${data.damage_details ? `פרטי נזק: ${data.damage_details}` : ""}
${data.injuries && data.injuries !== "לא" ? `פציעות: ${data.injuries}` : "ללא פציעות"}
${data.involved_parties ? `צדדים מעורבים: ${data.involved_parties}` : "ללא צד שלישי"}

נודה לטיפולכם המהיר.

בברכה,
סוכנות ביטוח ClaimPilot`;
}
