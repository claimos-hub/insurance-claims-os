import {
  processMessage,
  getOrCreateSession,
  resetSession,
  getSession,
} from "@/lib/automation-engine";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone, message, action } = body;

    if (!phone) {
      return Response.json({ error: "phone is required" }, { status: 400 });
    }

    // Reset action - for simulator
    if (action === "reset") {
      resetSession(phone);
      const session = getOrCreateSession(phone);
      return Response.json({
        reply: session.messages[0]?.text || "",
        session: {
          session_id: session.session_id,
          phone: session.phone,
          current_step: session.current_step,
          collected_data: session.collected_data,
          messages: session.messages,
        },
        claim_created: false,
      });
    }

    // Init action - get or create session without sending a message
    if (action === "init") {
      const session = getOrCreateSession(phone);
      return Response.json({
        reply: session.messages[session.messages.length - 1]?.text || "",
        session: {
          session_id: session.session_id,
          phone: session.phone,
          current_step: session.current_step,
          collected_data: session.collected_data,
          messages: session.messages,
        },
        claim_created: false,
      });
    }

    if (!message) {
      return Response.json({ error: "message is required" }, { status: 400 });
    }

    const { session, botReply, claimCreated } = processMessage(phone, message);

    return Response.json({
      reply: botReply,
      session: {
        session_id: session.session_id,
        phone: session.phone,
        current_step: session.current_step,
        collected_data: session.collected_data,
        messages: session.messages,
      },
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

  return Response.json({
    session: {
      session_id: session.session_id,
      phone: session.phone,
      current_step: session.current_step,
      collected_data: session.collected_data,
      messages: session.messages,
    },
  });
}
