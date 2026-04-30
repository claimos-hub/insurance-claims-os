import { processMessage, getOrCreateSession, calculateMissingDocs } from "@/lib/automation-engine";
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

    // Ensure session exists in conversation engine (in-memory)
    getOrCreateSession(phone);

    // Process through conversation engine
    const { session, botReply, claimCreated } = processMessage(phone, body);
    console.log("[webhook] Engine result:", {
      step: session.current_step,
      claimCreated,
      replyLength: botReply.length,
    });

    // ---- Persist to Supabase ----
    if (!isSupabaseConfigured()) {
      console.log("[webhook] Supabase NOT configured — skipping persistence");
      console.log("[webhook] ENV check:", {
        hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      });
    } else if (!supabaseAdmin) {
      console.log("[webhook] supabaseAdmin is null despite config check passing");
    } else {
      try {
        // Step 1: Find or create customer
        console.log("[webhook] Finding/creating customer for phone:", phone);
        const { data: existingCustomer } = await supabaseAdmin
          .from("customers")
          .select("*")
          .eq("phone", phone)
          .single();

        let customerId: string | null = null;

        if (existingCustomer) {
          customerId = existingCustomer.id;
          console.log("[webhook] Found existing customer:", customerId);
        } else {
          const { data: newCustomer, error: custErr } = await supabaseAdmin
            .from("customers")
            .insert({ phone, full_name: "" })
            .select()
            .single();

          if (custErr) {
            console.error("[webhook] Error creating customer:", custErr);
          } else {
            customerId = newCustomer.id;
            console.log("[webhook] Created new customer:", customerId);
          }
        }

        // Step 2: Find or create intake session
        console.log("[webhook] Looking for active session for phone:", phone);
        const { data: activeSession } = await supabaseAdmin
          .from("intake_sessions")
          .select("*")
          .eq("phone", phone)
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        let sessionId: string | null = null;

        if (activeSession) {
          sessionId = activeSession.id;
          console.log("[webhook] Found active session:", sessionId);
        } else {
          const { data: newSession, error: sessErr } = await supabaseAdmin
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

          if (sessErr) {
            console.error("[webhook] Error creating session:", sessErr);
          } else {
            sessionId = newSession.id;
            console.log("[webhook] Created new session:", sessionId);
          }
        }

        if (sessionId) {
          // Step 3: Save inbound message
          const { error: inboundErr } = await supabaseAdmin
            .from("intake_messages")
            .insert({
              session_id: sessionId,
              direction: "inbound",
              message: body,
            });

          if (inboundErr) {
            console.error("[webhook] Error saving inbound message:", inboundErr);
          } else {
            console.log("[webhook] Saved inbound message for session:", sessionId);
          }

          // Step 4: Save outbound message (bot reply)
          const { error: outboundErr } = await supabaseAdmin
            .from("intake_messages")
            .insert({
              session_id: sessionId,
              direction: "outbound",
              message: botReply,
            });

          if (outboundErr) {
            console.error("[webhook] Error saving outbound message:", outboundErr);
          } else {
            console.log("[webhook] Saved outbound message for session:", sessionId);
          }

          // Step 5: Update session state
          const newStatus = session.current_step === "DONE" ? "completed" : "active";
          const { error: updateErr } = await supabaseAdmin
            .from("intake_sessions")
            .update({
              current_step: session.current_step,
              collected_data: session.collected_data,
              status: newStatus,
            })
            .eq("id", sessionId);

          if (updateErr) {
            console.error("[webhook] Error updating session:", updateErr);
          } else {
            console.log("[webhook] Updated session:", {
              sessionId,
              step: session.current_step,
              status: newStatus,
            });
          }

          // Step 6: Create claim if conversation completed
          if (claimCreated) {
            console.log("[webhook] Creating claim for session:", sessionId);
            const missingDocs = calculateMissingDocs(session.collected_data);
            const claimNumber = `CLM-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 900) + 100)}`;

            const { data: claim, error: claimErr } = await supabaseAdmin
              .from("claims")
              .insert({
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
              })
              .select()
              .single();

            if (claimErr) {
              console.error("[webhook] Error creating claim:", claimErr);
            } else {
              console.log("[webhook] Created claim:", claim?.claim_number);
            }

            // Mark session as completed
            await supabaseAdmin
              .from("intake_sessions")
              .update({ status: "completed" })
              .eq("id", sessionId);
          }
        } else {
          console.error("[webhook] No session ID — skipping message persistence");
        }
      } catch (dbErr) {
        console.error("[webhook] Supabase persistence error (non-fatal):", dbErr);
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
        body: botReply,
      });
      console.log("[webhook] Twilio reply sent to:", phone);
    } else {
      console.error("[webhook] Missing TWILIO_SID or TWILIO_AUTH_TOKEN — reply not sent");
    }

    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error("[webhook] Fatal error:", err);
    return new Response("OK", { status: 200 });
  }
}

// ---- Helpers (inline to avoid db.ts guard issues) ----

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
