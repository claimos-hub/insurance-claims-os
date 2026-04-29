import {
  processMessage,
  getOrCreateSession,
  resetSession,
  getSession,
} from "@/lib/automation-engine";
import twilio from "twilio";

// Detect source: "twilio" or "simulator" (future: "meta")
type MessageSource = "twilio" | "simulator";

interface ParsedIncoming {
  source: MessageSource;
  phone: string;
  message?: string;
  action?: string;
}

function parseTwilioPhone(raw: string): string {
  // "whatsapp:+972501234567" → "0501234567"
  return raw
    .replace("whatsapp:", "")
    .replace(/^\+972/, "0")
    .trim();
}

function formatTwilioPhone(phone: string): string {
  // "0501234567" → "whatsapp:+972501234567"
  const international = phone.startsWith("0")
    ? "+972" + phone.slice(1)
    : phone.startsWith("+")
      ? phone
      : "+972" + phone;
  return `whatsapp:${international}`;
}

async function sendTwilioReply(to: string, body: string): Promise<void> {
  const sid = process.env.TWILIO_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_WHATSAPP_FROM || "whatsapp:+14155238886";

  if (!sid || !token) {
    console.error("Missing TWILIO_SID or TWILIO_AUTH_TOKEN");
    return;
  }

  const client = twilio(sid, token);
  await client.messages.create({
    from: fromNumber,
    to: formatTwilioPhone(to),
    body,
  });
}

function parseRequest(body: Record<string, unknown>): ParsedIncoming {
  // Twilio sends Body + From as form-encoded fields
  if (body.Body !== undefined && body.From !== undefined) {
    return {
      source: "twilio",
      phone: parseTwilioPhone(String(body.From)),
      message: String(body.Body),
    };
  }

  // Simulator / internal API sends phone + message + action
  return {
    source: "simulator",
    phone: String(body.phone || ""),
    message: body.message ? String(body.message) : undefined,
    action: body.action ? String(body.action) : undefined,
  };
}

async function parseBody(request: Request): Promise<Record<string, unknown>> {
  const contentType = request.headers.get("content-type") || "";

  // Twilio sends application/x-www-form-urlencoded
  if (contentType.includes("application/x-www-form-urlencoded")) {
    const text = await request.text();
    const params = new URLSearchParams(text);
    const obj: Record<string, unknown> = {};
    params.forEach((value, key) => {
      obj[key] = value;
    });
    return obj;
  }

  // Simulator sends JSON
  return await request.json();
}

export async function POST(request: Request) {
  try {
    const body = await parseBody(request);
    const parsed = parseRequest(body);

    if (!parsed.phone) {
      return Response.json({ error: "phone is required" }, { status: 400 });
    }

    // --- Simulator-only actions (reset / init) ---
    if (parsed.source === "simulator") {
      if (parsed.action === "reset") {
        resetSession(parsed.phone);
        const session = getOrCreateSession(parsed.phone);
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

      if (parsed.action === "init") {
        const session = getOrCreateSession(parsed.phone);
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
    }

    // --- Process message (both Twilio and Simulator) ---
    if (!parsed.message) {
      return Response.json({ error: "message is required" }, { status: 400 });
    }

    const { session, botReply, claimCreated } = processMessage(
      parsed.phone,
      parsed.message
    );

    // Send reply back via Twilio
    if (parsed.source === "twilio") {
      await sendTwilioReply(parsed.phone, botReply);
      // Twilio expects a 200 with TwiML or empty body
      return new Response("", { status: 200 });
    }

    // Simulator response (JSON)
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
