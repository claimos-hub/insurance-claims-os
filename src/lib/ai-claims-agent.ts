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
  extractedData: Record<string, unknown>;
  claimType: string;
  currentStep: string;
  missingFields: string[];
  missingDocuments: string[];
  readinessScore: number;
  shouldCreateClaim: boolean;
  claimStatus: string;
}

// ---- Required documents by claim type ----

const REQUIRED_DOCUMENTS: Record<string, string[]> = {
  car: [
    "צילומי נזק",
    "רישיון נהיגה",
    "רישיון רכב",
    "פוליסת ביטוח",
    "דוח משטרה (אם יש פציעות או תאונה חמורה)",
    "פרטי צד שלישי (אם מעורב)",
  ],
  health: [
    "סיכום רפואי",
    "קבלות/חשבוניות",
    "הפניה/מכתב רופא",
    "פוליסת ביטוח",
  ],
  property: [
    "צילומי נזק",
    "חשבונית/הצעת מחיר לתיקון",
    "הוכחת בעלות (אם נדרש)",
    "פוליסת ביטוח",
  ],
  travel: [
    "מסמכי טיסה/מלון",
    "קבלות",
    "מסמכים רפואיים (אם רלוונטי)",
    "דוח משטרה (אם גניבה)",
  ],
  life: [
    "תעודות זהות",
    "פוליסת ביטוח",
    "תעודות רשמיות רלוונטיות",
    "פרטי מוטבים",
  ],
  other: ["פוליסת ביטוח", "מסמכים תומכים רלוונטיים"],
};

// ---- All fields the agent should try to collect ----

const ALL_FIELDS = [
  "customer_name",
  "phone",
  "policy_number",
  "claim_type",
  "event_date",
  "event_time",
  "event_location",
  "description",
  "involved_parties",
  "injuries",
  "damage_details",
];

// ---- System prompt ----

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
נתונים שכבר נאספו בשיחה הנוכחית:
${JSON.stringify(currentSession.collected_data, null, 2)}
אל תשאל שוב על פרטים שכבר נאספו.`
      : "זו תחילת שיחה חדשה.";

  return `אתה סוכן תביעות ביטוח דיגיטלי מקצועי בשם ClaimPilot.
תפקידך לנהל שיחה חכמה, טבעית ואנושית עם לקוחות לצורך פתיחת תביעות ביטוח דרך WhatsApp.
המטרה: הלקוח ירגיש שהוא מדבר עם סוכן אנושי חכם, לא עם בוט.

=== כללים קריטיים ===

1. לעולם אל תענה רק "אוקיי", "הבנתי", "טוב" או כל אישור ריק.
   כל הודעה חייבת להוסיף ערך.

2. כל תשובה חייבת לעקוב אחרי המבנה הזה:
   - הכר במה שהלקוח אמר (במילים שלך)
   - הוסף תובנה קצרה או סיכום (אם רלוונטי)
   - שאל רק על מידע חסר

3. אם הלקוח כבר נתן מידע — אל תשאל שוב. חלץ והתקדם.

4. אם הלקוח שולח מספר פרטים בהודעה אחת — חלץ הכל, סכם בקצרה, דלג על שאלות מיותרות.

=== טון ===

- עברית טבעית ושוטפת
- מקצועי אבל ידידותי
- בטוח בעצמו
- קצר (1-3 שורות מקסימום)
- טבעי, לא רובוטי
- לעולם אל תבטיח אישור תביעה ואל תיתן ייעוץ משפטי

=== התנהגות חכמה ===

5. כל 2-3 הודעות, תן מיני סיכום:
   "מעולה, אז כרגע יש לנו:
   - תאונה מאחור
   - מיקום: תל אביב
   - אין נפגעים
   נשאר לנו להשלים עוד כמה פרטים קטנים 👍"

6. הראה אמפתיה קלה כשרלוונטי:
   "מקווה שהכל בסדר איתך אחרי האירוע 🙏"

7. היה פרואקטיבי — הנחה את הלקוח, אל רק תשאל שאלות.

8. הימנע מחזרות — השתמש בגיוון בשפה, אל תחזור על אותם משפטים.

9. אם הלקוח נותן תשובה לא ברורה — טפל בטבעיות וכוון מחדש.

10. אם יש מספיק מידע — התקדם לבקשת מסמכים או יצירת תביעה.

=== דוגמה לתשובה טובה ===
"הבנתי שהייתה תאונה בתל אביב ושאין נפגעים 👍
כדי להתקדם — תוכל לחדד איפה בדיוק זה קרה? (כביש / חניה / רחוב)"

=== דוגמה לתשובה גרועה ===
"אוקיי
איפה זה קרה?"

${customerContext}

${sessionContext}

סוגי ביטוח שאתה מזהה:
- car (רכב)
- health (בריאות)
- life (חיים)
- property (רכוש)
- travel (נסיעות)
- other (אחר)

מסמכים נדרשים לפי סוג תביעה:
${JSON.stringify(REQUIRED_DOCUMENTS, null, 2)}

שדות שיש לאסוף:
- customer_name: שם מלא של הלקוח
- phone: מספר טלפון
- policy_number: מספר פוליסה
- claim_type: סוג תביעה (car/health/life/property/travel/other)
- event_date: תאריך האירוע
- event_time: שעת האירוע
- event_location: מיקום האירוע
- description: תיאור האירוע
- involved_parties: צדדים מעורבים (שם, טלפון, רכב וכו')
- injuries: פרטי פציעות
- damage_details: פרטי נזק

אתה חייב להחזיר תשובה בפורמט JSON בלבד, ללא טקסט נוסף לפני או אחרי ה-JSON.
שים לב: שדה "reply" הוא ההודעה שתישלח ללקוח ב-WhatsApp — היא חייבת להיות קצרה, טבעית ואנושית לפי הכללים למעלה.

מבנה ה-JSON:
{
  "reply": "ההודעה שתשלח ללקוח ב-WhatsApp (קצרה, טבעית, אנושית)",
  "extractedData": { שדות שחולצו מההודעה הנוכחית בלבד },
  "claimType": "סוג התביעה שזוהה (car/health/life/property/travel/other) או unknown",
  "currentStep": "השלב הנוכחי: greeting/collecting_info/requesting_documents/ready_for_review/done",
  "missingFields": ["רשימת שדות חסרים מתוך רשימת השדות"],
  "missingDocuments": ["רשימת מסמכים חסרים לפי סוג התביעה"],
  "readinessScore": "מספר 0-100 המייצג כמה מוכנה התביעה",
  "shouldCreateClaim": false,
  "claimStatus": "collecting_info"
}

כללים ל-readinessScore:
- 0-20: רק ידוע סוג התביעה
- 20-40: יש תיאור בסיסי
- 40-60: יש רוב הפרטים
- 60-80: כל הפרטים נאספו, חסרים מסמכים
- 80-100: הכל מוכן כולל מסמכים

כללים ל-shouldCreateClaim:
- הפוך ל-true רק כשיש מספיק מידע ליצירת תביעה (readinessScore >= 60)
- כלומר: סוג תביעה, תאריך, מיקום, תיאור - לפחות

כללים ל-claimStatus:
- collecting_info: עדיין אוספים מידע
- requesting_documents: ביקשנו מסמכים
- ready_for_review: מוכן לבדיקת סוכן
- done: התביעה נוצרה והלקוח עודכן`;
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
    console.log("[ai-agent] Parsed AI response:", {
      claimType: parsed.claimType,
      currentStep: parsed.currentStep,
      readinessScore: parsed.readinessScore,
      shouldCreateClaim: parsed.shouldCreateClaim,
      missingFields: parsed.missingFields.length,
      missingDocuments: parsed.missingDocuments.length,
    });

    return parsed;
  } catch (err) {
    if (err instanceof Error && err.message === "AI_UNAVAILABLE") throw err;
    if (err instanceof Error && err.message === "AI_INVALID_RESPONSE") throw err;
    console.error("[ai-agent] Claude API error:", err);
    throw new Error("AI_API_ERROR");
  }
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

  const extractedData =
    typeof parsed.extractedData === "object" && parsed.extractedData !== null
      ? (parsed.extractedData as Record<string, unknown>)
      : {};

  const validClaimTypes = ["car", "health", "life", "property", "travel", "other", "unknown"];
  const claimType = validClaimTypes.includes(parsed.claimType as string)
    ? (parsed.claimType as string)
    : "unknown";

  const validSteps = ["greeting", "collecting_info", "requesting_documents", "ready_for_review", "done"];
  const currentStep = validSteps.includes(parsed.currentStep as string)
    ? (parsed.currentStep as string)
    : "collecting_info";

  const missingFields = Array.isArray(parsed.missingFields)
    ? (parsed.missingFields as string[]).filter((f) => ALL_FIELDS.includes(f))
    : ALL_FIELDS;

  const missingDocuments = Array.isArray(parsed.missingDocuments)
    ? (parsed.missingDocuments as string[])
    : [];

  const readinessScore =
    typeof parsed.readinessScore === "number" &&
    parsed.readinessScore >= 0 &&
    parsed.readinessScore <= 100
      ? parsed.readinessScore
      : 0;

  const shouldCreateClaim =
    typeof parsed.shouldCreateClaim === "boolean"
      ? parsed.shouldCreateClaim
      : false;

  const validStatuses = ["collecting_info", "requesting_documents", "ready_for_review", "done"];
  const claimStatus = validStatuses.includes(parsed.claimStatus as string)
    ? (parsed.claimStatus as string)
    : "collecting_info";

  return {
    reply,
    extractedData,
    claimType,
    currentStep,
    missingFields,
    missingDocuments,
    readinessScore,
    shouldCreateClaim,
    claimStatus,
  };
}
