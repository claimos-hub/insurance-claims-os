import { processMessage, getOrCreateSession } from "@/lib/automation-engine";
import twilio from "twilio";

function parseTwilioPhone(raw: string): string {
  // "whatsapp:+972501234567" → "0501234567"
  return raw.replace("whatsapp:", "").replace(/^\+972/, "0").trim();
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

export async function GET() {
  return new Response("ClaimOS webhook is live", { status: 200 });
}

export async function POST(req: Request) {
  try {
    // Twilio sends application/x-www-form-urlencoded
    const text = await req.text();
    const params = new URLSearchParams(text);

    const body = params.get("Body") || "";
    const from = params.get("From") || "";

    if (!from || !body) {
      return new Response("Missing Body or From", { status: 400 });
    }

    const phone = parseTwilioPhone(from);

    // Ensure session exists
    getOrCreateSession(phone);

    // Process through conversation engine
    const { botReply } = processMessage(phone, body);

    // Send reply via Twilio
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
    } else {
      console.error("Missing TWILIO_SID or TWILIO_AUTH_TOKEN — reply not sent");
    }

    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response("OK", { status: 200 });
  }
}
