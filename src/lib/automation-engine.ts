// Automation Engine - WhatsApp Claim Intake State Machine
// In-memory session store (will be replaced with Supabase later)

export type AutomationStep =
  | "START"
  | "ASK_EVENT_DATE"
  | "ASK_LOCATION"
  | "ASK_DESCRIPTION"
  | "ASK_VEHICLE"
  | "ASK_POLICY"
  | "ASK_INJURIES"
  | "ASK_INJURY_DETAILS"
  | "ASK_OTHER_VEHICLE"
  | "ASK_THIRD_PARTY"
  | "ASK_DOCUMENTS"
  | "DONE";

export interface AutomationSession {
  session_id: string;
  phone: string;
  current_step: AutomationStep;
  collected_data: Record<string, string>;
  messages: AutomationMessage[];
  created_at: string;
  updated_at: string;
}

export interface AutomationMessage {
  id: string;
  sender: "bot" | "user";
  text: string;
  timestamp: string;
}

// In-memory store
const sessions = new Map<string, AutomationSession>();

// Step definitions: what the bot says at each step
const STEP_PROMPTS: Record<AutomationStep, string> = {
  START:
    "שלום! 👋 אני הסוכן הדיגיטלי של ClaimPilot.\nאני אעזור לך לפתוח תביעת ביטוח רכב. בוא נתחיל.\n\nמתי קרה האירוע? (תאריך, למשל: 28/04/2026)",
  ASK_EVENT_DATE: "מתי קרה האירוע? (תאריך, למשל: 28/04/2026)",
  ASK_LOCATION: "איפה קרה האירוע? (כתובת / צומת / כביש)",
  ASK_DESCRIPTION: "ספר לי בקצרה מה קרה. תאר את האירוע במילים שלך.",
  ASK_VEHICLE: "מה מספר הרכב שלך?",
  ASK_POLICY: "מה מספר הפוליסה שלך? (אם יש לך)",
  ASK_INJURIES: "האם היו פציעות באירוע? (כן / לא)",
  ASK_INJURY_DETAILS: "ספר לי על הפציעות - מי נפצע ומה חומרת הפציעה?",
  ASK_OTHER_VEHICLE: "האם היה רכב נוסף מעורב? (כן / לא)",
  ASK_THIRD_PARTY:
    "ספר לי על הצד השני - שם, טלפון, מספר רכב (מה שיש לך)",
  ASK_DOCUMENTS:
    "עכשיו נצטרך מסמכים:\n- צילומי נזק\n- רישיון נהיגה\n- רישיון רכב\n- דוח משטרה (אם יש)\n\nשלח 'סיימתי' כשתהיה מוכן, או 'דלג' להמשיך בלי.",
  DONE: "מעולה! ✅ כל הפרטים התקבלו.\nהתביעה שלך נפתחה בהצלחה ותועבר לסוכן לבדיקה.\nמספר התביעה שלך: {claim_number}\n\nתודה רבה!",
};

// Step flow: what step comes after processing user input
function getNextStep(
  currentStep: AutomationStep,
  collectedData: Record<string, string>
): AutomationStep {
  switch (currentStep) {
    case "START":
      return "ASK_LOCATION";
    case "ASK_EVENT_DATE":
      return "ASK_LOCATION";
    case "ASK_LOCATION":
      return "ASK_DESCRIPTION";
    case "ASK_DESCRIPTION":
      return "ASK_VEHICLE";
    case "ASK_VEHICLE":
      return "ASK_POLICY";
    case "ASK_POLICY":
      return "ASK_INJURIES";
    case "ASK_INJURIES": {
      const answer = collectedData.has_injuries?.trim();
      if (answer === "כן") return "ASK_INJURY_DETAILS";
      return "ASK_OTHER_VEHICLE";
    }
    case "ASK_INJURY_DETAILS":
      return "ASK_OTHER_VEHICLE";
    case "ASK_OTHER_VEHICLE": {
      const answer = collectedData.other_vehicle?.trim();
      if (answer === "כן") return "ASK_THIRD_PARTY";
      return "ASK_DOCUMENTS";
    }
    case "ASK_THIRD_PARTY":
      return "ASK_DOCUMENTS";
    case "ASK_DOCUMENTS":
      return "DONE";
    case "DONE":
      return "DONE";
  }
}

// Map step -> field name for storing user input
function getFieldForStep(step: AutomationStep): string | null {
  switch (step) {
    case "START":
      return "event_date";
    case "ASK_EVENT_DATE":
      return "event_date";
    case "ASK_LOCATION":
      return "event_location";
    case "ASK_DESCRIPTION":
      return "description";
    case "ASK_VEHICLE":
      return "plate_number";
    case "ASK_POLICY":
      return "policy_number";
    case "ASK_INJURIES":
      return "has_injuries";
    case "ASK_INJURY_DETAILS":
      return "injury_details";
    case "ASK_OTHER_VEHICLE":
      return "other_vehicle";
    case "ASK_THIRD_PARTY":
      return "third_party_info";
    case "ASK_DOCUMENTS":
      return "documents_status";
    default:
      return null;
  }
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function generateClaimNumber(): string {
  const num = Math.floor(Math.random() * 900) + 100;
  return `CLM-2026-${num}`;
}

function createMessage(
  sender: "bot" | "user",
  text: string
): AutomationMessage {
  return {
    id: generateId(),
    sender,
    text,
    timestamp: new Date().toISOString(),
  };
}

// Calculate missing documents based on collected data
export function calculateMissingDocs(
  data: Record<string, string>
): string[] {
  const missing: string[] = [];
  if (!data.photos_received) missing.push("צילומי נזק");
  if (!data.driver_license_received) missing.push("רישיון נהיגה");
  if (!data.vehicle_license_received) missing.push("רישיון רכב");
  if (data.has_injuries === "כן" && !data.medical_docs_received)
    missing.push("מסמכים רפואיים");
  return missing;
}

// Get or create session
export function getOrCreateSession(phone: string): AutomationSession {
  const existing = sessions.get(phone);
  if (existing) return existing;

  const session: AutomationSession = {
    session_id: generateId(),
    phone,
    current_step: "START",
    collected_data: {},
    messages: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // Send the opening message
  const botMsg = createMessage("bot", STEP_PROMPTS.START);
  session.messages.push(botMsg);

  sessions.set(phone, session);
  return session;
}

// Process incoming message and return bot reply
export function processMessage(
  phone: string,
  userText: string
): { session: AutomationSession; botReply: string; claimCreated: boolean } {
  const session = getOrCreateSession(phone);

  // If already done, tell them
  if (session.current_step === "DONE") {
    const reply = "התביעה שלך כבר נפתחה. הסוכן יחזור אליך בהקדם. 🙏";
    const botMsg = createMessage("bot", reply);
    session.messages.push(createMessage("user", userText), botMsg);
    session.updated_at = new Date().toISOString();
    return { session, botReply: reply, claimCreated: false };
  }

  // Save user message
  session.messages.push(createMessage("user", userText));

  // Store the user's answer in the appropriate field
  const field = getFieldForStep(session.current_step);
  if (field) {
    session.collected_data[field] = userText;
  }

  // Determine next step
  const nextStep = getNextStep(session.current_step, session.collected_data);
  session.current_step = nextStep;
  session.updated_at = new Date().toISOString();

  let claimCreated = false;
  let botReply: string;

  if (nextStep === "DONE") {
    // Create claim
    const claimNumber = generateClaimNumber();
    session.collected_data.claim_number = claimNumber;
    session.collected_data.status = "ready_for_review";
    session.collected_data.missing_documents =
      JSON.stringify(calculateMissingDocs(session.collected_data));
    botReply = STEP_PROMPTS.DONE.replace("{claim_number}", claimNumber);
    claimCreated = true;
  } else {
    botReply = STEP_PROMPTS[nextStep];
  }

  session.messages.push(createMessage("bot", botReply));

  return { session, botReply, claimCreated };
}

// Get session for debug/display
export function getSession(phone: string): AutomationSession | undefined {
  return sessions.get(phone);
}

// Get all sessions
export function getAllSessions(): AutomationSession[] {
  return Array.from(sessions.values());
}

// Reset session (for testing)
export function resetSession(phone: string): void {
  sessions.delete(phone);
}
