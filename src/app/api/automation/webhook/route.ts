import {
  processMessage,
  getOrCreateSession,
  resetSession,
  getSession,
  calculateMissingDocs,
} from "@/lib/automation-engine";
import {
  findOrCreateCustomer,
  findActiveSession,
  createIntakeSession,
  updateIntakeSession,
  saveIntakeMessage,
  createClaim,
} from "@/lib/db";

function sessionToJson(session: ReturnType<typeof getOrCreateSession>) {
  return {
    session_id: session.session_id,
    phone: session.phone,
    current_step: session.current_step,
    collected_data: session.collected_data,
    messages: session.messages,
  };
}

async function persistToDb(
  phone: string,
  userText: string | null,
  botReply: string,
  currentStep: string,
  collectedData: Record<string, string>,
  claimCreated: boolean
) {
  try {
    const customer = await findOrCreateCustomer(phone);
    const customerId = customer?.id || null;

    let dbSession = await findActiveSession(phone);
    if (!dbSession) {
      dbSession = await createIntakeSession(phone, customerId);
    }

    if (dbSession) {
      if (userText) {
        await saveIntakeMessage(dbSession.id, "inbound", userText);
      }
      await saveIntakeMessage(dbSession.id, "outbound", botReply);

      await updateIntakeSession(dbSession.id, {
        current_step: currentStep,
        collected_data: collectedData,
        status: currentStep === "DONE" ? "completed" : "active",
      });

      if (claimCreated) {
        const missingDocs = calculateMissingDocs(collectedData);
        await createClaim(dbSession.id, customerId, collectedData, missingDocs);
      }
    }
  } catch (err) {
    console.error("Simulator DB persistence error (non-fatal):", err);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone, message, action } = body;

    if (!phone) {
      return Response.json({ error: "phone is required" }, { status: 400 });
    }

    if (action === "reset") {
      resetSession(phone);
      const session = getOrCreateSession(phone);
      return Response.json({
        reply: session.messages[0]?.text || "",
        session: sessionToJson(session),
        claim_created: false,
      });
    }

    if (action === "init") {
      const session = getOrCreateSession(phone);
      return Response.json({
        reply: session.messages[session.messages.length - 1]?.text || "",
        session: sessionToJson(session),
        claim_created: false,
      });
    }

    if (!message) {
      return Response.json({ error: "message is required" }, { status: 400 });
    }

    const { session, botReply, claimCreated } = processMessage(phone, message);

    // Persist to Supabase (non-blocking for simulator)
    persistToDb(phone, message, botReply, session.current_step, session.collected_data, claimCreated);

    return Response.json({
      reply: botReply,
      session: sessionToJson(session),
      claim_created: claimCreated,
    });
  } catch {
    return Response.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const phone = searchParams.get("phone");

  if (!phone) {
    return Response.json({ error: "phone query param required" }, { status: 400 });
  }

  const session = getSession(phone);
  if (!session) {
    return Response.json({ error: "session not found" }, { status: 404 });
  }

  return Response.json({ session: sessionToJson(session) });
}
