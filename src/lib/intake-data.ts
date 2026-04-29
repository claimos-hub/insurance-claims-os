import {
  CarAccidentIntakeData,
  IntakeMessage,
  IntakeStep,
  IntakeClaim,
} from "@/types";

// --- Bot Questions Map ---

export const BOT_QUESTIONS: Record<
  IntakeStep,
  {
    text: string;
    type: "text" | "options" | "file_upload";
    options?: string[];
    field?: keyof CarAccidentIntakeData;
  }
> = {
  greeting: {
    text: "שלום! אני הסוכן הדיגיטלי של ClaimPilot.\nקיבלתי את הפנייה שלך. אני אעזור לך לפתוח תביעת ביטוח רכב.\nבוא נתחיל לאסוף את הפרטים.",
    type: "text",
  },
  event_date: {
    text: "מתי קרה האירוע? (תאריך)",
    type: "text",
    field: "event_date",
  },
  event_time: {
    text: "באיזו שעה בערך?",
    type: "text",
    field: "event_time",
  },
  event_location: {
    text: "איפה קרה האירוע? (כתובת / צומת / כביש)",
    type: "text",
    field: "event_location",
  },
  description: {
    text: "ספר לי בקצרה מה קרה. תאר את האירוע במילים שלך.",
    type: "text",
    field: "description",
  },
  plate_number: {
    text: "מה מספר הרכב שלך?",
    type: "text",
    field: "plate_number",
  },
  policy_number: {
    text: "מה מספר הפוליסה שלך? (אם יש לך אותו בהישג יד)",
    type: "text",
    field: "policy_number",
  },
  injuries: {
    text: "האם היו פציעות באירוע?",
    type: "options",
    options: ["כן", "לא"],
    field: "has_injuries",
  },
  injury_details: {
    text: "ספר לי בבקשה על הפציעות - מי נפצע ומה חומרת הפציעה?",
    type: "text",
    field: "injury_details",
  },
  other_vehicle: {
    text: "האם היה רכב נוסף מעורב באירוע?",
    type: "options",
    options: ["כן", "לא"],
    field: "other_vehicle_involved",
  },
  third_party_name: {
    text: "מה שם הנהג של הרכב השני?",
    type: "text",
    field: "third_party_name",
  },
  third_party_phone: {
    text: "מה מספר הטלפון שלו?",
    type: "text",
    field: "third_party_phone",
  },
  third_party_plate: {
    text: "מה מספר הרכב של הצד השני?",
    type: "text",
    field: "third_party_plate",
  },
  third_party_insurance: {
    text: "באיזו חברת ביטוח הוא מבוטח? (אם ידוע)",
    type: "text",
    field: "third_party_insurance",
  },
  photos: {
    text: "עכשיו אני צריך צילומים של הנזק לרכב. שלח תמונות מכל הזוויות.",
    type: "file_upload",
  },
  driver_license: {
    text: "שלח צילום של רישיון הנהיגה שלך.",
    type: "file_upload",
  },
  vehicle_license: {
    text: "שלח צילום של רישיון הרכב.",
    type: "file_upload",
  },
  police_report_ask: {
    text: "האם הוגש דוח משטרה?",
    type: "options",
    options: ["כן", "לא"],
  },
  police_report_upload: {
    text: "שלח צילום של דוח המשטרה.",
    type: "file_upload",
  },
  summary: {
    text: "מעולה! אספתי את כל הפרטים. אני מכין את סיכום התביעה...",
    type: "text",
  },
  complete: {
    text: "התביעה שלך הועברה לסוכן הביטוח לבדיקה. תקבל עדכון ברגע שיהיה חדש. תודה!",
    type: "text",
  },
};

// --- Step Flow Logic ---

export function getNextStep(
  currentStep: IntakeStep,
  data: CarAccidentIntakeData
): IntakeStep {
  const flow: IntakeStep[] = [
    "greeting",
    "event_date",
    "event_time",
    "event_location",
    "description",
    "plate_number",
    "policy_number",
    "injuries",
  ];

  const idx = flow.indexOf(currentStep);

  if (currentStep === "injuries") {
    return data.has_injuries ? "injury_details" : "other_vehicle";
  }
  if (currentStep === "injury_details") return "other_vehicle";
  if (currentStep === "other_vehicle") {
    return data.other_vehicle_involved ? "third_party_name" : "photos";
  }
  if (currentStep === "third_party_name") return "third_party_phone";
  if (currentStep === "third_party_phone") return "third_party_plate";
  if (currentStep === "third_party_plate") return "third_party_insurance";
  if (currentStep === "third_party_insurance") return "photos";
  if (currentStep === "photos") return "driver_license";
  if (currentStep === "driver_license") return "vehicle_license";
  if (currentStep === "vehicle_license") return "police_report_ask";
  if (currentStep === "police_report_ask") {
    return data.police_report_needed ? "police_report_upload" : "summary";
  }
  if (currentStep === "police_report_upload") return "summary";
  if (currentStep === "summary") return "complete";

  if (idx >= 0 && idx < flow.length - 1) return flow[idx + 1];
  return "complete";
}

// --- Readiness Calculator ---

export function calculateReadiness(data: CarAccidentIntakeData): {
  score: number;
  missingFields: string[];
  missingDocuments: string[];
} {
  const missingFields: string[] = [];
  const missingDocuments: string[] = [];

  if (!data.event_date) missingFields.push("תאריך אירוע");
  if (!data.event_time) missingFields.push("שעת אירוע");
  if (!data.event_location) missingFields.push("מיקום אירוע");
  if (!data.description) missingFields.push("תיאור האירוע");
  if (!data.plate_number) missingFields.push("מספר רכב");
  if (!data.policy_number) missingFields.push("מספר פוליסה");
  if (data.has_injuries === null) missingFields.push("פרטי פציעות");
  if (data.other_vehicle_involved === null)
    missingFields.push("מעורבות רכב נוסף");
  if (data.other_vehicle_involved && !data.third_party_name)
    missingFields.push("שם צד שלישי");

  if (data.photos_uploaded.length === 0) missingDocuments.push("צילומי נזק");
  if (!data.driver_license_uploaded) missingDocuments.push("רישיון נהיגה");
  if (!data.vehicle_license_uploaded) missingDocuments.push("רישיון רכב");
  if (data.police_report_needed && !data.police_report_uploaded)
    missingDocuments.push("דוח משטרה");

  const totalItems = 9 + 3 + (data.police_report_needed ? 1 : 0);
  const completedItems =
    totalItems - missingFields.length - missingDocuments.length;
  const score = Math.round((completedItems / totalItems) * 100);

  return { score, missingFields, missingDocuments };
}

// --- AI Summary Generator (Mock) ---

export function generateAISummary(data: CarAccidentIntakeData): string {
  const parts: string[] = [];
  parts.push(`ביום ${data.event_date || "___"} בשעה ${data.event_time || "___"}, באזור ${data.event_location || "___"}, אירעה תאונת דרכים.`);
  parts.push(`תיאור האירוע: ${data.description || "לא סופק"}`);
  parts.push(`רכב מבוטח: ${data.plate_number || "___"}, פוליסה: ${data.policy_number || "___"}.`);

  if (data.has_injuries) {
    parts.push(`דווח על פציעות: ${data.injury_details || "פרטים לא סופקו"}.`);
  } else if (data.has_injuries === false) {
    parts.push("לא דווח על פציעות.");
  }

  if (data.other_vehicle_involved) {
    parts.push(
      `רכב נוסף מעורב - נהג: ${data.third_party_name || "___"}, טלפון: ${data.third_party_phone || "___"}, לוחית: ${data.third_party_plate || "___"}, ביטוח: ${data.third_party_insurance || "לא ידוע"}.`
    );
  } else if (data.other_vehicle_involved === false) {
    parts.push("לא היה רכב נוסף מעורב.");
  }

  const docs: string[] = [];
  if (data.photos_uploaded.length > 0)
    docs.push(`${data.photos_uploaded.length} צילומי נזק`);
  if (data.driver_license_uploaded) docs.push("רישיון נהיגה");
  if (data.vehicle_license_uploaded) docs.push("רישיון רכב");
  if (data.police_report_uploaded) docs.push("דוח משטרה");
  parts.push(`מסמכים שהתקבלו: ${docs.length > 0 ? docs.join(", ") : "טרם הועלו"}.`);

  return parts.join("\n");
}

export function generateInspectorMessage(
  data: CarAccidentIntakeData,
  customerName: string,
  claimNumber: string
): string {
  return `לכבוד מחלקת תביעות,

הנדון: תביעת ביטוח רכב - ${claimNumber}
מבוטח: ${customerName}
מספר פוליסה: ${data.policy_number || "___"}

מוגשת בזאת תביעה בגין תאונת דרכים שאירעה ביום ${data.event_date || "___"} בשעה ${data.event_time || "___"} באזור ${data.event_location || "___"}.

תיאור האירוע:
${data.description || "___"}

פרטי הרכב המבוטח:
- מספר רכב: ${data.plate_number || "___"}
- מספר פוליסה: ${data.policy_number || "___"}

${data.has_injuries ? `פציעות: ${data.injury_details || "דווח על פציעות, פרטים נוספים יימסרו"}` : "לא דווח על פציעות."}

${
  data.other_vehicle_involved
    ? `צד שלישי מעורב:
- שם: ${data.third_party_name || "___"}
- טלפון: ${data.third_party_phone || "___"}
- מספר רכב: ${data.third_party_plate || "___"}
- חברת ביטוח: ${data.third_party_insurance || "לא ידוע"}`
    : "לא היה צד שלישי מעורב."
}

מסמכים מצורפים:
${data.photos_uploaded.length > 0 ? `- ${data.photos_uploaded.length} צילומי נזק` : "- צילומי נזק: חסרים"}
${data.driver_license_uploaded ? "- רישיון נהיגה: מצורף" : "- רישיון נהיגה: חסר"}
${data.vehicle_license_uploaded ? "- רישיון רכב: מצורף" : "- רישיון רכב: חסר"}
${data.police_report_needed ? (data.police_report_uploaded ? "- דוח משטרה: מצורף" : "- דוח משטרה: חסר") : ""}

נודה לטיפולכם המהיר.

בברכה,
סוכנות ביטוח ClaimPilot`;
}

// --- Empty Intake Data ---

export function createEmptyIntakeData(): CarAccidentIntakeData {
  return {
    event_date: "",
    event_time: "",
    event_location: "",
    description: "",
    plate_number: "",
    policy_number: "",
    has_injuries: null,
    injury_details: "",
    other_vehicle_involved: null,
    third_party_name: "",
    third_party_phone: "",
    third_party_plate: "",
    third_party_insurance: "",
    photos_uploaded: [],
    driver_license_uploaded: false,
    vehicle_license_uploaded: false,
    police_report_uploaded: false,
    police_report_needed: null,
  };
}

// --- Demo Completed Intake Claim ---

const demoIntakeData: CarAccidentIntakeData = {
  event_date: "27/04/2026",
  event_time: "17:30",
  event_location: "צומת עזריאלי, תל אביב",
  description:
    "נסעתי בנתיב הימני בדרך מנחם בגין לכיוון צפון. בצומת עזריאלי רכב חתך אותי מצד שמאל בזמן פנייה ופגע בדלת הימנית והפגוש הקדמי. הרכב השני נמלט מהמקום אבל הצלחתי לצלם את הלוחית שלו.",
  plate_number: "78-456-23",
  policy_number: "POL-CAR-12345",
  has_injuries: false,
  injury_details: "",
  other_vehicle_involved: true,
  third_party_name: "לא ידוע (פגע וברח)",
  third_party_phone: "לא ידוע",
  third_party_plate: "91-234-56",
  third_party_insurance: "לא ידוע",
  photos_uploaded: ["damage_front.jpg", "damage_side.jpg", "damage_close.jpg"],
  driver_license_uploaded: true,
  vehicle_license_uploaded: true,
  police_report_uploaded: true,
  police_report_needed: true,
};

const demoMessages: IntakeMessage[] = [
  {
    id: "m1",
    sender: "customer",
    text: "שלום, היה לי תאונה עם הרכב היום",
    timestamp: "2026-04-27T18:00:00Z",
    type: "text",
  },
  {
    id: "m2",
    sender: "bot",
    text: BOT_QUESTIONS.greeting.text,
    timestamp: "2026-04-27T18:00:05Z",
    type: "text",
  },
  {
    id: "m3",
    sender: "bot",
    text: BOT_QUESTIONS.event_date.text,
    timestamp: "2026-04-27T18:00:07Z",
    type: "text",
  },
  {
    id: "m4",
    sender: "customer",
    text: "27/04/2026",
    timestamp: "2026-04-27T18:00:30Z",
    type: "text",
  },
  {
    id: "m5",
    sender: "bot",
    text: BOT_QUESTIONS.event_time.text,
    timestamp: "2026-04-27T18:00:32Z",
    type: "text",
  },
  {
    id: "m6",
    sender: "customer",
    text: "17:30",
    timestamp: "2026-04-27T18:00:50Z",
    type: "text",
  },
  {
    id: "m7",
    sender: "bot",
    text: BOT_QUESTIONS.event_location.text,
    timestamp: "2026-04-27T18:00:52Z",
    type: "text",
  },
  {
    id: "m8",
    sender: "customer",
    text: "צומת עזריאלי, תל אביב",
    timestamp: "2026-04-27T18:01:10Z",
    type: "text",
  },
  {
    id: "m9",
    sender: "bot",
    text: BOT_QUESTIONS.description.text,
    timestamp: "2026-04-27T18:01:12Z",
    type: "text",
  },
  {
    id: "m10",
    sender: "customer",
    text: demoIntakeData.description,
    timestamp: "2026-04-27T18:02:00Z",
    type: "text",
  },
  {
    id: "m11",
    sender: "bot",
    text: BOT_QUESTIONS.plate_number.text,
    timestamp: "2026-04-27T18:02:02Z",
    type: "text",
  },
  {
    id: "m12",
    sender: "customer",
    text: "78-456-23",
    timestamp: "2026-04-27T18:02:20Z",
    type: "text",
  },
  {
    id: "m13",
    sender: "bot",
    text: BOT_QUESTIONS.policy_number.text,
    timestamp: "2026-04-27T18:02:22Z",
    type: "text",
  },
  {
    id: "m14",
    sender: "customer",
    text: "POL-CAR-12345",
    timestamp: "2026-04-27T18:02:45Z",
    type: "text",
  },
  {
    id: "m15",
    sender: "bot",
    text: BOT_QUESTIONS.injuries.text,
    timestamp: "2026-04-27T18:02:47Z",
    type: "options",
    options: ["כן", "לא"],
  },
  {
    id: "m16",
    sender: "customer",
    text: "לא",
    timestamp: "2026-04-27T18:03:00Z",
    type: "text",
  },
  {
    id: "m17",
    sender: "bot",
    text: BOT_QUESTIONS.other_vehicle.text,
    timestamp: "2026-04-27T18:03:02Z",
    type: "options",
    options: ["כן", "לא"],
  },
  {
    id: "m18",
    sender: "customer",
    text: "כן",
    timestamp: "2026-04-27T18:03:15Z",
    type: "text",
  },
  {
    id: "m19",
    sender: "bot",
    text: BOT_QUESTIONS.third_party_name.text,
    timestamp: "2026-04-27T18:03:17Z",
    type: "text",
  },
  {
    id: "m20",
    sender: "customer",
    text: "לא ידוע (פגע וברח)",
    timestamp: "2026-04-27T18:03:40Z",
    type: "text",
  },
  {
    id: "m21",
    sender: "bot",
    text: BOT_QUESTIONS.third_party_phone.text,
    timestamp: "2026-04-27T18:03:42Z",
    type: "text",
  },
  {
    id: "m22",
    sender: "customer",
    text: "לא ידוע",
    timestamp: "2026-04-27T18:03:55Z",
    type: "text",
  },
  {
    id: "m23",
    sender: "bot",
    text: BOT_QUESTIONS.third_party_plate.text,
    timestamp: "2026-04-27T18:03:57Z",
    type: "text",
  },
  {
    id: "m24",
    sender: "customer",
    text: "91-234-56",
    timestamp: "2026-04-27T18:04:20Z",
    type: "text",
  },
  {
    id: "m25",
    sender: "bot",
    text: BOT_QUESTIONS.third_party_insurance.text,
    timestamp: "2026-04-27T18:04:22Z",
    type: "text",
  },
  {
    id: "m26",
    sender: "customer",
    text: "לא ידוע",
    timestamp: "2026-04-27T18:04:40Z",
    type: "text",
  },
  {
    id: "m27",
    sender: "bot",
    text: BOT_QUESTIONS.photos.text,
    timestamp: "2026-04-27T18:04:42Z",
    type: "text",
  },
  {
    id: "m28",
    sender: "customer",
    text: "",
    timestamp: "2026-04-27T18:05:30Z",
    type: "file_upload",
    file_name: "damage_front.jpg",
  },
  {
    id: "m29",
    sender: "customer",
    text: "",
    timestamp: "2026-04-27T18:05:35Z",
    type: "file_upload",
    file_name: "damage_side.jpg",
  },
  {
    id: "m30",
    sender: "customer",
    text: "",
    timestamp: "2026-04-27T18:05:40Z",
    type: "file_upload",
    file_name: "damage_close.jpg",
  },
  {
    id: "m31",
    sender: "bot",
    text: "קיבלתי 3 תמונות. תודה!",
    timestamp: "2026-04-27T18:05:42Z",
    type: "text",
  },
  {
    id: "m32",
    sender: "bot",
    text: BOT_QUESTIONS.driver_license.text,
    timestamp: "2026-04-27T18:05:44Z",
    type: "text",
  },
  {
    id: "m33",
    sender: "customer",
    text: "",
    timestamp: "2026-04-27T18:06:10Z",
    type: "file_upload",
    file_name: "driver_license.jpg",
  },
  {
    id: "m34",
    sender: "bot",
    text: BOT_QUESTIONS.vehicle_license.text,
    timestamp: "2026-04-27T18:06:12Z",
    type: "text",
  },
  {
    id: "m35",
    sender: "customer",
    text: "",
    timestamp: "2026-04-27T18:06:40Z",
    type: "file_upload",
    file_name: "vehicle_license.jpg",
  },
  {
    id: "m36",
    sender: "bot",
    text: BOT_QUESTIONS.police_report_ask.text,
    timestamp: "2026-04-27T18:06:42Z",
    type: "options",
    options: ["כן", "לא"],
  },
  {
    id: "m37",
    sender: "customer",
    text: "כן",
    timestamp: "2026-04-27T18:06:55Z",
    type: "text",
  },
  {
    id: "m38",
    sender: "bot",
    text: BOT_QUESTIONS.police_report_upload.text,
    timestamp: "2026-04-27T18:06:57Z",
    type: "text",
  },
  {
    id: "m39",
    sender: "customer",
    text: "",
    timestamp: "2026-04-27T18:07:30Z",
    type: "file_upload",
    file_name: "police_report.pdf",
  },
  {
    id: "m40",
    sender: "bot",
    text: BOT_QUESTIONS.summary.text,
    timestamp: "2026-04-27T18:07:32Z",
    type: "text",
  },
  {
    id: "m41",
    sender: "bot",
    text: BOT_QUESTIONS.complete.text,
    timestamp: "2026-04-27T18:07:35Z",
    type: "text",
  },
];

const demoSummary = generateAISummary(demoIntakeData);
const demoInspectorMessage = generateInspectorMessage(
  demoIntakeData,
  "יוסי כהן",
  "CLM-2026-007"
);

export const mockIntakeClaims: IntakeClaim[] = [
  {
    id: "ic1",
    claim_number: "CLM-2026-007",
    customer_name: "יוסי כהן",
    customer_phone: "050-1234567",
    intake_data: demoIntakeData,
    messages: demoMessages,
    readiness_score: 100,
    missing_fields: [],
    missing_documents: [],
    ai_summary: demoSummary,
    ai_inspector_message: demoInspectorMessage,
    status: "ready_for_review",
    created_at: "2026-04-27T18:00:00Z",
  },
];

export function getIntakeClaimById(id: string): IntakeClaim | undefined {
  return mockIntakeClaims.find((c) => c.id === id);
}
