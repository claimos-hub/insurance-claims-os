import { runPipeline } from "@/lib/webhook-pipeline";
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

    console.log("[webhook] Incoming:", { from, body: body.substring(0, 100) });

    if (!from || !body) {
      return new Response("Missing Body or From", { status: 400 });
    }

    const phone = parseTwilioPhone(from);

    // ---- Unified pipeline: customer → session → AI → persist → reply ----
    const result = await runPipeline(phone, body);

    console.log("[webhook] Pipeline done:", {
      phone,
      usedAI: result.usedAI,
      claimCreated: result.claimCreated,
      claimNumber: result.claimNumber,
      customerId: result.customerId,
      sessionId: result.sessionId,
    });

    // ---- Send reply via Twilio ----
    const sid = process.env.TWILIO_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_WHATSAPP_FROM || "whatsapp:+14155238886";

    if (sid && token) {
      const client = twilio(sid, token);
      await client.messages.create({
        from: fromNumber,
        to: formatTwilioPhone(phone),
        body: result.reply,
      });
      console.log("[webhook] Reply sent to:", phone, result.usedAI ? "(AI)" : "(rule-based)");
    } else {
      console.error("[webhook] Missing Twilio credentials — reply not sent");
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
