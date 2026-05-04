// AI-Powered Claims & Retention Assistant
// Full context-aware agent: claim intake, retention alerts, message generation, proactive insights
// Falls back to rule-based automation-engine if AI is unavailable

import Anthropic from "@anthropic-ai/sdk";

// ---- Types ----

export interface CustomerPolicyContext {
  insurance_type: string;
  provider: string;
  policy_number: string;
  end_date: string;
  days_until_end: number;
  discount_end_date: string | null;
  days_until_discount_end: number | null;
  status: string;
}

export interface CustomerClaimContext {
  claim_number: string;
  claim_type: string;
  status: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  days_since_update: number;
  missing_documents: string[];
  readiness_score: number;
}

export interface AIAgentInput {
  phone: string;
  message: string;
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
  conversationHistory: { direction: "inbound" | "outbound"; message: string }[];
  // New: full customer context
  policies: CustomerPolicyContext[];
  claims: CustomerClaimContext[];
}

export interface AIInsight {
  type: "risk" | "expiring_policy" | "incomplete_claim" | "upsell" | "follow_up";
  message: string;
}

export interface AIAgentOutput {
  reply: string;
  updatedData: Record<string, unknown>;
  readyForClaim: boolean;
  missingFields: string[];
  insights: AIInsight[];
}

// ---- Required documents by claim type ----

export const REQUIRED_DOCUMENTS: Record<string, string[]> = {
  car: [
    "📸 תמונות של הרכב",
    "📄 רישיון נהיגה",
    "📄 רישיון רכב",
    "📄 פוליסת ביטוח",
    "📄 דוח משטרה (אם יש פציעות או תאונה חמורה)",
    "📄 פרטי צד שלישי (אם מעורב)",
  ],
  health: [
    "📄 סיכום רפואי",
    "📄 קבלות/חשבוניות",
    "📄 הפניה/מכתב רופא",
    "📄 פוליסת ביטוח",
  ],
  property: [
    "📸 צילומי נזק",
    "📄 חשבונית/הצעת מחיר לתיקון",
    "📄 הוכחת בעלות (אם נדרש)",
    "📄 פוליסת ביטוח",
  ],
  travel: [
    "📄 מסמכי טיסה/מלון",
    "📄 קבלות",
    "📄 מסמכים רפואיים (אם רלוונטי)",
    "📄 דוח משטרה (אם גניבה)",
  ],
  life: [
    "📄 תעודות זהות",
    "📄 פוליסת ביטוח",
    "📄 תעודות רשמיות רלוונטיות",
    "📄 פרטי מוטבים",
  ],
  other: ["📄 פוליסת ביטוח", "📄 מסמכים תומכים רלוונטיים"],
};

// ---- All required fields ----

const ALL_FIELDS = [
  "full_name",
  "phone",
  "claim_type",
  "event_date",
  "event_location",
  "description",
  "injuries",
  "third_party_details",
];

// ---- System prompt ----

const SYSTEM_PROMPT = `אתה עוזר דיגיטלי חכם לסוכן ביטוח, בשם ClaimPilot.
אתה לא רק קולט תביעות — אתה עוזר מלא: קליטת תביעות, שימור לקוחות, מעקב, ויצירת הודעות.

=== מי אתה ===

אתה מדבר עם לקוחות בוואטסאפ בשם הסוכן.
תפקידך:
1. לקלוט תביעות חדשות ולאסוף מידע
2. לזהות לקוחות בסיכון (פוליסה עומדת לפוג, הנחה שנגמרת)
3. לדחוף תביעות תקועות קדימה
4. ליצור הודעות מוכנות (חידוש פוליסה, סיכום תביעה, בקשת מסמכים)
5. לתת תובנות פרואקטיביות לסוכן

=== התנהגות ===

- עברית טבעית, סגנון WhatsApp — קצר, חם, אנושי
- מקסימום 2-3 משפטים בתשובה
- לעולם לא חזרתי, לא רובוטי
- שאלה אחת בכל פעם
- אל תשאל על מידע שכבר יש לך
- אל תאמר "אני AI" או "אני בוט"
- אימוג'י בעדינות: 👍 🙌 📄 📸

=== קליטת תביעה ===

אם הלקוח פונה בנושא תביעה חדשה:
1. זהה את סוג התביעה אוטומטית מהתיאור
2. הגב באמפתיה קצרה, ואז שאל מה חסר
3. סדר: מה קרה → איפה → מתי → פרטים → מסמכים
4. כשהכל מוכן — סכם ושאל "רוצה שאפתח תביעה?"

שדות נדרשים:
- full_name, phone, claim_type (car/health/property/travel/life/other)
- event_date, event_location, description
- injuries (אם רלוונטי), third_party_details (אם רלוונטי)

=== שימור ופוליסות ===

אתה מקבל את כל הפוליסות של הלקוח.
אם פוליסה עומדת לפוג (≤30 ימים):
- הזכר את זה בטבעיות: "אגב, שמתי לב שביטוח הרכב שלך מסתיים בעוד X ימים"
- הצע חידוש: "רוצה שאבדוק לך הצעה לחידוש?"
אם הנחה עומדת לפוג (≤14 ימים):
- "יש לך הנחה שעומדת להיגמר — כדאי לחדש לפני"

אם הלקוח שואל על חידוש/פוליסה — צור הודעה מוכנה.

=== תביעות קיימות ===

אתה מקבל את כל התביעות הקיימות של הלקוח.
אם יש תביעה תקועה (לא עודכנה 3+ ימים):
- "ראיתי שתביעה CLM-XXX עדיין ממתינה — רוצה שאעדכן אותך?"
אם יש מסמכים חסרים:
- "חסרים עוד כמה מסמכים לתביעה שלך — רוצה שאפרט?"
אם הלקוח שואל "מה הסטטוס" — תן סיכום קצר של כל התביעות שלו.

=== יצירת הודעות ===

אם הסוכן (או הלקוח) מבקש ליצור הודעה:
- "כתוב הודעת חידוש" → צור הודעת WhatsApp קצרה וחמה לחידוש
- "סכם את התביעה" → סיכום של שורה-שתיים
- "מה חסר?" → רשימה קצרה של מסמכים/מידע חסר

=== תובנות (insights) ===

בכל תשובה, הוסף מערך insights עם התראות רלוונטיות.
סוגים:
- risk: "לקוח בסיכון נטישה — X ימים בלי קשר"
- expiring_policy: "פוליסת רכב פגה בעוד 5 ימים"
- incomplete_claim: "תביעה CLM-XXX — חסרים 3 מסמכים"
- upsell: "ללקוח יש רק ביטוח רכב — הזדמנות להציע דירה"
- follow_up: "תביעה CLM-XXX לא עודכנה 7 ימים"

הוסף insights רק כשהם רלוונטיים ומעשיים. אל תמציא.

=== מסמכים נדרשים לפי סוג תביעה ===
${JSON.stringify(REQUIRED_DOCUMENTS, null, 2)}

=== פורמט תשובה ===

החזר JSON בלבד, ללא טקסט מחוץ ל-JSON:

{
  "reply": "ההודעה ללקוח — קצרה, טבעית, בעברית",
  "updatedData": { כל השדות הידועים — חדשים + ישנים },
  "readyForClaim": false,
  "missingFields": ["שדות חסרים מהרשימה הנדרשת"],
  "insights": [
    { "type": "expiring_policy", "message": "פוליסת רכב פגה בעוד 5 ימים" }
  ]
}

readyForClaim = true רק כשיש מספיק מידע והלקוח אישר פתיחת תביעה.
insights = מערך ריק [] אם אין תובנות רלוונטיות.`;

// ---- Build dynamic context block ----

function buildCustomerContext(input: AIAgentInput): string {
  const parts: string[] = [];

  // Customer identity
  if (input.existingCustomer) {
    const c = input.existingCustomer;
    parts.push(`=== לקוח מוכר ===
שם: ${c.full_name || "לא ידוע"}
טלפון: ${c.phone}
אימייל: ${c.email || "—"}`);
  } else {
    parts.push("=== לקוח חדש === \nלא מוכר במערכת. אסוף שם מלא.");
  }

  // Session data
  if (input.currentSession && Object.keys(input.currentSession.collected_data).length > 0) {
    parts.push(`\n=== נתונים שנאספו ===
${JSON.stringify(input.currentSession.collected_data, null, 2)}
אל תשאל שוב על מה שכבר ידוע. כלול הכל ב-updatedData.`);
  } else {
    parts.push("\n=== שיחה חדשה ===");
  }

  // Policies
  if (input.policies.length > 0) {
    const policyLines = input.policies.map((p) => {
      const typeLabels: Record<string, string> = {
        car: "רכב", health: "בריאות", life: "חיים", property: "רכוש", travel: "נסיעות",
      };
      const typeHeb = typeLabels[p.insurance_type] || p.insurance_type;
      let line = `- ${typeHeb} (${p.provider}) | פוליסה ${p.policy_number} | פג ${p.end_date} (${p.days_until_end} ימים)`;
      if (p.days_until_discount_end !== null && p.days_until_discount_end >= 0 && p.days_until_discount_end <= 14) {
        line += ` | ⚠️ הנחה פגה בעוד ${p.days_until_discount_end} ימים`;
      }
      if (p.days_until_end <= 7) line += " 🔴";
      else if (p.days_until_end <= 30) line += " 🟠";
      return line;
    });
    parts.push(`\n=== פוליסות הלקוח ===\n${policyLines.join("\n")}`);
  } else {
    parts.push("\n=== פוליסות === אין פוליסות רשומות.");
  }

  // Existing claims
  if (input.claims.length > 0) {
    const claimLines = input.claims.map((c) => {
      const statusLabels: Record<string, string> = {
        new: "חדשה", waiting_customer_docs: "ממתין למסמכים", waiting_insurance: "ממתין לחב׳ ביטוח",
        in_review: "בבדיקה", approved: "אושרה", rejected: "נדחתה", closed: "סגורה",
      };
      const statusHeb = statusLabels[c.status] || c.status;
      let line = `- ${c.claim_number} | ${c.claim_type} | ${statusHeb} | עודכן לפני ${c.days_since_update} ימים`;
      if (c.missing_documents.length > 0) {
        line += ` | חסרים: ${c.missing_documents.length} מסמכים`;
      }
      if (c.days_since_update >= 3 && c.status !== "closed" && c.status !== "approved") {
        line += " ⚠️ תקועה";
      }
      return line;
    });
    parts.push(`\n=== תביעות קיימות ===\n${claimLines.join("\n")}`);
  }

  return parts.join("\n");
}

// ---- Check if AI is available ----

export function isAIAvailable(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

// ---- Main function ----

export async function processClaimMessage(
  input: AIAgentInput
): Promise<AIAgentOutput> {
  if (!isAIAvailable()) {
    console.log("[ai-agent] No ANTHROPIC_API_KEY — AI unavailable");
    throw new Error("AI_UNAVAILABLE");
  }

  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  // Build conversation messages for Claude
  const messages: { role: "user" | "assistant"; content: string }[] = [];

  // Add conversation history
  for (const msg of input.conversationHistory) {
    messages.push({
      role: msg.direction === "inbound" ? "user" : "assistant",
      content: msg.message,
    });
  }

  // Add current message
  messages.push({ role: "user", content: input.message });

  const systemPrompt = `${SYSTEM_PROMPT}\n\n${buildCustomerContext(input)}`;

  console.log("[ai-agent] Sending to Claude API:", {
    phone: input.phone,
    messageCount: messages.length,
    hasCustomer: !!input.existingCustomer,
    hasSession: !!input.currentSession,
    policiesCount: input.policies.length,
    claimsCount: input.claims.length,
  });

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: systemPrompt,
      messages,
    });

    const rawContent = response.content[0];
    if (rawContent.type !== "text") {
      console.error("[ai-agent] Unexpected response type:", rawContent.type);
      throw new Error("AI_INVALID_RESPONSE");
    }

    const rawText = rawContent.text.trim();
    console.log("[ai-agent] Raw AI response length:", rawText.length);

    // Parse and validate JSON
    const parsed = parseAIResponse(rawText);

    // Post-process: enforce reply quality
    parsed.reply = postProcessReply(parsed.reply, parsed.missingFields, input.conversationHistory);

    // Add rule-based insights the AI might have missed
    parsed.insights = mergeInsights(parsed.insights, input);

    console.log("[ai-agent] Parsed AI response:", {
      readyForClaim: parsed.readyForClaim,
      missingFields: parsed.missingFields.length,
      insights: parsed.insights.length,
      dataKeys: Object.keys(parsed.updatedData),
    });

    return parsed;
  } catch (err) {
    if (err instanceof Error && err.message === "AI_UNAVAILABLE") throw err;
    if (err instanceof Error && err.message === "AI_INVALID_RESPONSE") throw err;
    console.error("[ai-agent] Claude API error:", err);
    throw new Error("AI_API_ERROR");
  }
}

// ---- Post-process reply quality ----

const EMPTY_REPLIES = [
  "ok", "אוקיי", "בסדר", "הבנתי", "טוב", "אוקי", "תודה", "סבבה",
  "קיבלתי", "נהדר", "מעולה", "שלום", "היי", "הי", "okay", "sure",
  "got it", "thanks", "noted", "ברור", "יופי", "אחלה", "קול",
];
const FALLBACK_REPLY = "הבנתי אותך 👍\nכדי להתקדם — תוכל לחדד קצת יותר?";
const MIN_REPLY_LENGTH = 8;
const SHORT_REPLY_THRESHOLD = 20;

function postProcessReply(reply: string, missingFields: string[], conversationHistory?: { direction: "inbound" | "outbound"; message: string }[]): string {
  const trimmed = reply.trim();
  const normalized = trimmed.replace(/[.!?,\s]+/g, "").toLowerCase();

  // Block empty acknowledgements and too-short replies
  if (EMPTY_REPLIES.includes(normalized) || trimmed.length < MIN_REPLY_LENGTH) {
    console.log("[ai-agent] Blocked empty/short reply:", JSON.stringify(trimmed));
    return FALLBACK_REPLY;
  }

  // Block repetitive replies — if the AI repeats the last outbound message
  if (conversationHistory && conversationHistory.length > 0) {
    const lastOutbound = [...conversationHistory]
      .reverse()
      .find((m) => m.direction === "outbound");
    if (lastOutbound) {
      const lastNorm = lastOutbound.message.replace(/[.!?,\s]+/g, "").toLowerCase();
      if (normalized === lastNorm || (normalized.length > 10 && lastNorm.includes(normalized))) {
        console.log("[ai-agent] Blocked repetitive reply");
        if (missingFields.length > 0) {
          const fieldHints: Record<string, string> = {
            claim_type: "איזה סוג ביטוח מדובר?",
            event_date: "מתי זה קרה?",
            event_location: "איפה זה קרה?",
            description: "תוכל לתאר בקצרה מה קרה?",
            injuries: "היו פציעות?",
          };
          const nextField = missingFields.find((f) => fieldHints[f]);
          if (nextField) return fieldHints[nextField];
        }
        return FALLBACK_REPLY;
      }
    }
  }

  // Enrich short replies by appending a nudge about missing fields
  if (trimmed.length < SHORT_REPLY_THRESHOLD && missingFields.length > 0) {
    const fieldHints: Record<string, string> = {
      claim_type: "איזה סוג ביטוח מדובר?",
      event_date: "מתי זה קרה?",
      event_location: "איפה זה קרה?",
      description: "תוכל לתאר בקצרה מה קרה?",
      injuries: "היו פציעות?",
    };
    const nextField = missingFields.find((f) => fieldHints[f]);
    if (nextField) {
      console.log("[ai-agent] Enriching short reply with follow-up for:", nextField);
      return `${trimmed}\n${fieldHints[nextField]}`;
    }
  }

  return trimmed;
}

// ---- Merge rule-based insights with AI insights ----

function mergeInsights(aiInsights: AIInsight[], input: AIAgentInput): AIInsight[] {
  const insights = [...aiInsights];
  const existingMessages = new Set(insights.map((i) => i.type));

  // Expiring policies the AI might not have flagged
  for (const p of input.policies) {
    if (p.days_until_end >= 0 && p.days_until_end <= 7 && !existingMessages.has("expiring_policy")) {
      const typeLabels: Record<string, string> = {
        car: "רכב", health: "בריאות", life: "חיים", property: "רכוש", travel: "נסיעות",
      };
      insights.push({
        type: "expiring_policy",
        message: `פוליסת ${typeLabels[p.insurance_type] || p.insurance_type} (${p.provider}) פגה בעוד ${p.days_until_end} ימים`,
      });
      break; // one is enough
    }
    if (p.days_until_discount_end !== null && p.days_until_discount_end >= 0 && p.days_until_discount_end <= 7) {
      if (!insights.some((i) => i.message.includes("הנחה"))) {
        insights.push({
          type: "expiring_policy",
          message: `הנחה על פוליסה עומדת לפוג בעוד ${p.days_until_discount_end} ימים`,
        });
        break;
      }
    }
  }

  // Stuck claims
  for (const c of input.claims) {
    if (c.days_since_update >= 3 && c.status !== "closed" && c.status !== "approved" && !existingMessages.has("follow_up")) {
      insights.push({
        type: "follow_up",
        message: `תביעה ${c.claim_number} לא עודכנה ${c.days_since_update} ימים`,
      });
      break;
    }
  }

  // Incomplete claims with missing docs
  for (const c of input.claims) {
    if (c.missing_documents.length > 0 && c.status !== "closed" && !existingMessages.has("incomplete_claim")) {
      insights.push({
        type: "incomplete_claim",
        message: `תביעה ${c.claim_number} — חסרים ${c.missing_documents.length} מסמכים`,
      });
      break;
    }
  }

  return insights;
}

// ---- Parse and validate AI response ----

function parseAIResponse(rawText: string): AIAgentOutput {
  // Try to extract JSON from the response (handle markdown code blocks)
  let jsonStr = rawText;

  // Remove markdown code block wrappers if present
  const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1].trim();
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    console.error("[ai-agent] Failed to parse JSON:", jsonStr.substring(0, 200));
    throw new Error("AI_INVALID_RESPONSE");
  }

  // Validate and sanitize
  const reply = typeof parsed.reply === "string" && parsed.reply.length > 0
    ? parsed.reply
    : "שלום! אני כאן לעזור לך. ספר לי במה אוכל לסייע?";

  const updatedData =
    typeof parsed.updatedData === "object" && parsed.updatedData !== null
      ? (parsed.updatedData as Record<string, unknown>)
      : {};

  const readyForClaim =
    typeof parsed.readyForClaim === "boolean"
      ? parsed.readyForClaim
      : false;

  const missingFields = Array.isArray(parsed.missingFields)
    ? (parsed.missingFields as string[]).filter((f) => ALL_FIELDS.includes(f))
    : ALL_FIELDS;

  // Parse insights
  const insights: AIInsight[] = [];
  if (Array.isArray(parsed.insights)) {
    for (const item of parsed.insights) {
      if (
        typeof item === "object" && item !== null &&
        typeof (item as Record<string, unknown>).type === "string" &&
        typeof (item as Record<string, unknown>).message === "string"
      ) {
        const validTypes = ["risk", "expiring_policy", "incomplete_claim", "upsell", "follow_up"];
        const t = (item as Record<string, unknown>).type as string;
        if (validTypes.includes(t)) {
          insights.push({
            type: t as AIInsight["type"],
            message: (item as Record<string, unknown>).message as string,
          });
        }
      }
    }
  }

  return {
    reply,
    updatedData,
    readyForClaim,
    missingFields,
    insights,
  };
}
