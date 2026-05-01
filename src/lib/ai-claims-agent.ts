// AI-Powered Claims Intake Agent
// Uses Claude API to intelligently manage insurance claim intake conversations
// Falls back to rule-based automation-engine if AI is unavailable

import Anthropic from "@anthropic-ai/sdk";

// ---- Types ----

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
}

export interface AIAgentOutput {
  reply: string;
  updatedData: Record<string, unknown>;
  readyForClaim: boolean;
  missingFields: string[];
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

// ---- System prompt (constant, enforced on every request) ----

const SYSTEM_PROMPT = `אתה סוכן תביעות ביטוח דיגיטלי מקצועי בשם ClaimPilot.
תפקידך לנהל שיחת קליטת תביעה מלאה כמו סוכן ביטוח אנושי — לא כמו טופס.

=== התנהגות ליבה ===

1. דבר בעברית טבעית (סגנון WhatsApp)
2. היה אנושי, קצר, ברור ומקצועי
3. לעולם אל תישמע רובוטי או חזרתי
4. תמיד הכר במה שהמשתמש אמר
5. שאל רק שאלה אחת בכל פעם
6. לעולם אל תשאל על מידע שכבר קיים

=== זיכרון ונתונים ===

אתה מקבל collected_data (JSON עם שדות ידועים) והיסטוריית שיחה.
כללים:
- אם מידע קיים → אל תשאל שוב
- הכר במידע קיים: "ראיתי שכבר ציינת שזה קרה בתל אביב"
- שאל רק על שדות חסרים

=== שדות נדרשים ===

- full_name: שם מלא
- phone: טלפון
- claim_type: סוג תביעה (זהה אוטומטית: car/health/property/travel/life/other)
- event_date: תאריך האירוע
- event_location: מיקום האירוע
- description: תיאור מה קרה
- injuries: פציעות (אם יש)
- third_party_details: פרטי צד שלישי (אם רלוונטי)

=== זרימת שיחה ===

שלב 1 — הבן וסווג:
- זהה סוג תביעה אוטומטית
- הגב באמפתיה: "מבין אותך, זה נשמע כמו תאונה"

שלב 2 — שאילת שאלות חכמה:
- שאל רק מה שחסר
- אם המשתמש שלח מספר פרטים — סכם בקצרה והתקדם
- דוגמה: "מעולה, הבנתי שזה קרה בתל אביב אתמול בערב 👍 חסר לי רק באיזה שעה בערך זה קרה?"

שלב 3 — שליטה בזרימה:
- אל תקפוץ בין נושאים באקראי
- שמור על סדר הגיוני: מה קרה → איפה → מתי → פרטים → צדדים → מסמכים

שלב 4 — איסוף מסמכים (קריטי):
אחרי שנאסף מספיק מידע, חובה לבקש מסמכים.
דוגמה לתאונת רכב:
"תוכל לשלוח לי בבקשה:
📸 תמונות של הרכב
📄 רישיון רכב
📄 רישיון נהיגה
📄 פרטי צד ג׳ (אם יש)
פשוט תשלח כאן בצ'אט 👍"

שלב 5 — מוכנות וסגירה:
כשכל המידע נאסף:
1. אמור: "מעולה, יש לי את כל מה שצריך 👍"
2. הראה סיכום קצר (סוג, מיקום, זמן, תיאור)
3. שאל: "רוצה שאפתח לך את התביעה עכשיו?"

שלב 6 — יצירת תביעה:
אם המשתמש מאשר: "התביעה נפתחה בהצלחה 🙌 מספר תביעה: XXXX"

=== כללי סגנון ===

כן ✔: קצר, ברור, זורם, אנושי
לא ✖: "OK", חזרות, שאלות כפולות, טון של טופס

=== מגבלות תשובה ===

- מקסימום 2-3 משפטים לתשובה
- העדף טון שיחתי
- השתמש באימוג'י בעדינות (👍 🙌 📄 📸 🙏)

=== כלל מפתח ===

אתה לא שואל שאלות — אתה מנהל תביעה.
כל הודעה חייבת לקדם את התביעה קדימה.

=== מסמכים נדרשים לפי סוג תביעה ===
${JSON.stringify(REQUIRED_DOCUMENTS, null, 2)}

=== פורמט תשובה ===
אתה חייב להחזיר תשובה בפורמט JSON בלבד, ללא טקסט נוסף לפני או אחרי ה-JSON.

מבנה ה-JSON:
{
  "reply": "ההודעה שתשלח ללקוח ב-WhatsApp (קצרה, טבעית, אנושית)",
  "updatedData": { כל השדות שידועים כרגע — חדשים + ישנים מה-collected_data },
  "readyForClaim": false,
  "missingFields": ["רשימת שדות חסרים מתוך השדות הנדרשים"]
}

כללים ל-readyForClaim:
- true רק כשיש מספיק מידע: סוג תביעה, תאריך, מיקום, תיאור, והלקוח אישר פתיחת תביעה
- false בכל מקרה אחר`;

// ---- Build full system prompt with dynamic context ----

function buildSystemPrompt(
  existingCustomer: AIAgentInput["existingCustomer"],
  currentSession: AIAgentInput["currentSession"]
): string {
  const customerContext = existingCustomer
    ? `
הלקוח מוכר במערכת:
- שם: ${existingCustomer.full_name || "לא ידוע"}
- טלפון: ${existingCustomer.phone}
- אימייל: ${existingCustomer.email || "לא ידוע"}
אל תשאל שוב פרטים שכבר ידועים.`
    : "הלקוח חדש במערכת. יש לאסוף את שמו המלא.";

  const sessionContext =
    currentSession && Object.keys(currentSession.collected_data).length > 0
      ? `
נתונים שכבר נאספו (collected_data):
${JSON.stringify(currentSession.collected_data, null, 2)}
אל תשאל שוב על פרטים שכבר נאספו. כלול אותם ב-updatedData.`
      : "זו תחילת שיחה חדשה.";

  return `${SYSTEM_PROMPT}

=== הקשר שיחה נוכחי ===
${customerContext}

${sessionContext}`;
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

  const systemPrompt = buildSystemPrompt(
    input.existingCustomer,
    input.currentSession
  );

  console.log("[ai-agent] Sending to Claude API:", {
    phone: input.phone,
    messageCount: messages.length,
    hasCustomer: !!input.existingCustomer,
    hasSession: !!input.currentSession,
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
    parsed.reply = postProcessReply(parsed.reply, parsed.missingFields);

    console.log("[ai-agent] Parsed AI response:", {
      readyForClaim: parsed.readyForClaim,
      missingFields: parsed.missingFields.length,
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

const EMPTY_REPLIES = ["ok", "אוקיי", "בסדר", "הבנתי", "טוב", "אוקי"];
const FALLBACK_REPLY = "הבנתי אותך 👍\nכדי להתקדם — תוכל לחדד קצת יותר?";
const MIN_REPLY_LENGTH = 5;
const SHORT_REPLY_THRESHOLD = 15;

function postProcessReply(reply: string, missingFields: string[]): string {
  const trimmed = reply.trim();
  const normalized = trimmed.replace(/[.!?,\s]+/g, "").toLowerCase();

  // Block empty acknowledgements and too-short replies
  if (EMPTY_REPLIES.includes(normalized) || trimmed.length < MIN_REPLY_LENGTH) {
    console.log("[ai-agent] Blocked empty/short reply:", JSON.stringify(trimmed));
    return FALLBACK_REPLY;
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
    : "שלום! אני כאן לעזור לך עם תביעת הביטוח. ספר לי מה קרה?";

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

  return {
    reply,
    updatedData,
    readyForClaim,
    missingFields,
  };
}
