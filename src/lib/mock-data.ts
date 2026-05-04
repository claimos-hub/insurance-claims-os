import { Claim, Customer, ClaimDocument, MissingDocument, ClaimNote, ActivityEvent, ClaimType, CLAIM_TYPE_LABELS, CLAIM_STATUS_LABELS, CustomerPolicy, EnrichedPolicy, CustomerRetentionInfo, RetentionStatus } from "@/types";

export const mockCustomers: Customer[] = [
  {
    id: "c1",
    full_name: "יוסי כהן",
    id_number: "012345678",
    phone: "050-1234567",
    email: "yossi@example.com",
    address: "רחוב הרצל 15, תל אביב",
    created_at: "2026-01-15T10:00:00Z",
    agent_id: "agent1",
  },
  {
    id: "c2",
    full_name: "שרה לוי",
    id_number: "023456789",
    phone: "052-9876543",
    email: "sara@example.com",
    address: "רחוב ויצמן 8, חיפה",
    created_at: "2026-02-20T10:00:00Z",
    agent_id: "agent1",
  },
  {
    id: "c3",
    full_name: "דוד ישראלי",
    id_number: "034567890",
    phone: "054-5551234",
    email: "david@example.com",
    address: "רחוב בן גוריון 22, ירושלים",
    created_at: "2026-03-05T10:00:00Z",
    agent_id: "agent1",
  },
  {
    id: "c4",
    full_name: "רונית אברהם",
    id_number: "045678901",
    phone: "053-7778899",
    email: "ronit@example.com",
    address: "שדרות רוטשילד 30, תל אביב",
    created_at: "2026-03-10T10:00:00Z",
    agent_id: "agent1",
  },
];

export const mockClaims: Claim[] = [
  {
    id: "cl1",
    claim_number: "CLM-2026-001",
    customer_id: "c1",
    agent_id: "agent1",
    type: "car",
    status: "waiting_customer_docs",
    title: "תאונת דרכים - נזק לרכב",
    description: "תאונת דרכים בצומת עזריאלי. נזק לפגוש הקדמי ולדלת שמאל.",
    insurance_company: "הראל ביטוח",
    policy_number: "POL-CAR-12345",
    incident_date: "2026-04-10",
    claim_amount: 25000,
    approved_amount: null,
    created_at: "2026-04-11T08:30:00Z",
    updated_at: "2026-04-15T14:00:00Z",
    customer: undefined,
  },
  {
    id: "cl2",
    claim_number: "CLM-2026-002",
    customer_id: "c2",
    agent_id: "agent1",
    type: "health",
    status: "in_review",
    title: "ניתוח ברך - החזר הוצאות",
    description: "ניתוח להחלפת ברך שמאל. בקשה להחזר הוצאות ניתוח ואשפוז.",
    insurance_company: "כלל ביטוח",
    policy_number: "POL-HEALTH-67890",
    incident_date: "2026-03-20",
    claim_amount: 85000,
    approved_amount: null,
    created_at: "2026-03-25T10:00:00Z",
    updated_at: "2026-04-20T16:30:00Z",
    customer: undefined,
  },
  {
    id: "cl3",
    claim_number: "CLM-2026-003",
    customer_id: "c3",
    agent_id: "agent1",
    type: "property",
    status: "approved",
    title: "נזקי מים בדירה",
    description: "פיצוץ צנרת בדירה שגרם לנזק רחב בסלון ובמטבח.",
    insurance_company: "מגדל ביטוח",
    policy_number: "POL-PROP-11111",
    incident_date: "2026-02-15",
    claim_amount: 45000,
    approved_amount: 38000,
    created_at: "2026-02-16T09:00:00Z",
    updated_at: "2026-04-01T11:00:00Z",
    customer: undefined,
  },
  {
    id: "cl4",
    claim_number: "CLM-2026-004",
    customer_id: "c1",
    agent_id: "agent1",
    type: "life",
    status: "new",
    title: "תביעת ביטוח חיים",
    description: "תביעה לפיצוי בגין אובדן כושר עבודה זמני.",
    insurance_company: "הפניקס ביטוח",
    policy_number: "POL-LIFE-22222",
    incident_date: "2026-04-25",
    claim_amount: 120000,
    approved_amount: null,
    created_at: "2026-04-26T07:00:00Z",
    updated_at: "2026-04-26T07:00:00Z",
    customer: undefined,
  },
  {
    id: "cl5",
    claim_number: "CLM-2026-005",
    customer_id: "c4",
    agent_id: "agent1",
    type: "travel",
    status: "rejected",
    title: "ביטול טיסה - נסיעה לאירופה",
    description: "ביטול טיסה ומלון עקב מחלה פתאומית.",
    insurance_company: "ביטוח ישיר",
    policy_number: "POL-TRV-33333",
    incident_date: "2026-04-01",
    claim_amount: 12000,
    approved_amount: 0,
    created_at: "2026-04-02T15:00:00Z",
    updated_at: "2026-04-22T09:00:00Z",
    customer: undefined,
  },
  {
    id: "cl6",
    claim_number: "CLM-2026-006",
    customer_id: "c2",
    agent_id: "agent1",
    type: "car",
    status: "waiting_insurance",
    title: "גניבת רכב",
    description: "רכב נגנב מחניון ציבורי. הוגשה תלונה במשטרה.",
    insurance_company: "הראל ביטוח",
    policy_number: "POL-CAR-44444",
    incident_date: "2026-04-18",
    claim_amount: 95000,
    approved_amount: null,
    created_at: "2026-04-19T11:00:00Z",
    updated_at: "2026-04-25T13:00:00Z",
    customer: undefined,
  },
];

// Link customers to claims
mockClaims.forEach((claim) => {
  claim.customer = mockCustomers.find((c) => c.id === claim.customer_id);
});

export const mockDocuments: ClaimDocument[] = [
  {
    id: "d1",
    claim_id: "cl1",
    name: "צילום רישיון רכב",
    file_url: "#",
    file_type: "image/jpeg",
    uploaded_at: "2026-04-11T09:00:00Z",
    uploaded_by: "agent1",
  },
  {
    id: "d2",
    claim_id: "cl1",
    name: "דוח שמאי",
    file_url: "#",
    file_type: "application/pdf",
    uploaded_at: "2026-04-13T14:00:00Z",
    uploaded_by: "agent1",
  },
  {
    id: "d3",
    claim_id: "cl2",
    name: "אישור אשפוז",
    file_url: "#",
    file_type: "application/pdf",
    uploaded_at: "2026-03-26T10:00:00Z",
    uploaded_by: "agent1",
  },
];

export const mockMissingDocuments: MissingDocument[] = [
  {
    id: "md1",
    claim_id: "cl1",
    name: "דוח משטרה",
    description: "יש להגיש דוח משטרה מקורי על התאונה",
    is_received: false,
    created_at: "2026-04-12T10:00:00Z",
  },
  {
    id: "md2",
    claim_id: "cl1",
    name: "צילומי נזק",
    description: "צילומים של הנזק לרכב מכל הזוויות",
    is_received: true,
    created_at: "2026-04-12T10:00:00Z",
  },
  {
    id: "md3",
    claim_id: "cl2",
    name: "סיכום מחלה",
    description: "סיכום מחלה מהרופא המנתח",
    is_received: false,
    created_at: "2026-03-27T10:00:00Z",
  },
];

export const mockNotes: ClaimNote[] = [
  {
    id: "n1",
    claim_id: "cl1",
    author_id: "agent1",
    content: "הלקוח ציין שהתאונה התרחשה בשעות הערב. יש לוודא שהדוח כולל תיאור מלא.",
    created_at: "2026-04-11T09:30:00Z",
  },
  {
    id: "n2",
    claim_id: "cl1",
    author_id: "agent1",
    content: "שוחחתי עם שמאי - צפוי דוח תוך 3 ימי עסקים.",
    created_at: "2026-04-14T11:00:00Z",
  },
  {
    id: "n3",
    claim_id: "cl2",
    author_id: "agent1",
    content: "הלקוחה שלחה את כל המסמכים הרפואיים. ממתין לתשובה מכלל ביטוח.",
    created_at: "2026-04-20T16:30:00Z",
  },
];

export const mockActivities: ActivityEvent[] = [
  {
    id: "a1",
    claim_id: "cl1",
    type: "claim_created",
    description: "התביעה נוצרה",
    created_at: "2026-04-11T08:30:00Z",
    actor_id: "agent1",
  },
  {
    id: "a2",
    claim_id: "cl1",
    type: "document_uploaded",
    description: "הועלה מסמך: צילום רישיון רכב",
    created_at: "2026-04-11T09:00:00Z",
    actor_id: "agent1",
  },
  {
    id: "a3",
    claim_id: "cl1",
    type: "document_requested",
    description: "נדרש מסמך: דוח משטרה",
    created_at: "2026-04-12T10:00:00Z",
    actor_id: "agent1",
  },
  {
    id: "a4",
    claim_id: "cl1",
    type: "status_change",
    description: "סטטוס שונה ל: ממתין למסמכי לקוח",
    created_at: "2026-04-12T10:05:00Z",
    actor_id: "agent1",
  },
  {
    id: "a5",
    claim_id: "cl1",
    type: "note_added",
    description: "הערה חדשה נוספה",
    created_at: "2026-04-14T11:00:00Z",
    actor_id: "agent1",
  },
  {
    id: "a6",
    claim_id: "cl1",
    type: "document_uploaded",
    description: "הועלה מסמך: דוח שמאי",
    created_at: "2026-04-13T14:00:00Z",
    actor_id: "agent1",
  },
];

export function getClaimById(id: string): Claim | undefined {
  const claim = mockClaims.find((c) => c.id === id);
  if (claim) {
    claim.customer = mockCustomers.find((c) => c.id === claim.customer_id);
  }
  return claim;
}

export function getCustomerById(id: string): Customer | undefined {
  return mockCustomers.find((c) => c.id === id);
}

export function getClaimDocuments(claimId: string): ClaimDocument[] {
  return mockDocuments.filter((d) => d.claim_id === claimId);
}

export function getClaimMissingDocs(claimId: string): MissingDocument[] {
  return mockMissingDocuments.filter((d) => d.claim_id === claimId);
}

export function getClaimNotes(claimId: string): ClaimNote[] {
  return mockNotes.filter((n) => n.claim_id === claimId);
}

export function getClaimActivities(claimId: string): ActivityEvent[] {
  return mockActivities
    .filter((a) => a.claim_id === claimId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export function getCustomerClaims(customerId: string): Claim[] {
  return mockClaims.filter((c) => c.customer_id === customerId);
}

// --- AI Summary Generator for Regular Claims (Mock) ---

export function generateClaimAISummary(claim: Claim): string {
  const customer = claim.customer;
  const docs = getClaimDocuments(claim.id);
  const missing = getClaimMissingDocs(claim.id);
  const missingNotReceived = missing.filter((d) => !d.is_received);

  const parts: string[] = [];
  parts.push(`לקוח: ${customer?.full_name || "לא ידוע"} (ת.ז: ${customer?.id_number || "—"}, טלפון: ${customer?.phone || "—"})`);
  parts.push(`סוג תביעה: ${CLAIM_TYPE_LABELS[claim.type]}`);
  parts.push(`תאריך אירוע: ${new Date(claim.incident_date).toLocaleDateString("he-IL")}`);
  parts.push(`חברת ביטוח: ${claim.insurance_company}, פוליסה: ${claim.policy_number}`);
  parts.push(`\nתיאור האירוע:\n${claim.description}`);
  parts.push(`\nסכום תביעה: ${claim.claim_amount ? `₪${claim.claim_amount.toLocaleString()}` : "לא צוין"}`);
  if (claim.approved_amount !== null) {
    parts.push(`סכום מאושר: ₪${claim.approved_amount.toLocaleString()}`);
  }
  parts.push(`\nמסמכים שהתקבלו: ${docs.length > 0 ? docs.map((d) => d.name).join(", ") : "אין"}`);
  if (missingNotReceived.length > 0) {
    parts.push(`מסמכים חסרים: ${missingNotReceived.map((d) => d.name).join(", ")}`);
  }
  parts.push(`\nסטטוס נוכחי: ${CLAIM_STATUS_LABELS[claim.status]}`);

  return parts.join("\n");
}

// --- Inspector Message Generator for Regular Claims (Mock) ---

export function generateClaimInspectorMessage(claim: Claim): string {
  const customer = claim.customer;
  const docs = getClaimDocuments(claim.id);
  const missing = getClaimMissingDocs(claim.id);

  return `לכבוד מחלקת תביעות,
${claim.insurance_company}

הנדון: תביעת ${CLAIM_TYPE_LABELS[claim.type]} - ${claim.claim_number}
מבוטח: ${customer?.full_name || "—"}
ת.ז: ${customer?.id_number || "—"}
מספר פוליסה: ${claim.policy_number}

מוגשת בזאת תביעה בגין אירוע שהתרחש ביום ${new Date(claim.incident_date).toLocaleDateString("he-IL")}.

תיאור האירוע:
${claim.description}

סכום התביעה: ${claim.claim_amount ? `₪${claim.claim_amount.toLocaleString()}` : "טרם הוערך"}

מסמכים מצורפים:
${docs.length > 0 ? docs.map((d) => `- ${d.name}`).join("\n") : "- טרם הועלו מסמכים"}

${missing.filter((d) => !d.is_received).length > 0 ? `מסמכים חסרים (יועברו בהקדם):\n${missing.filter((d) => !d.is_received).map((d) => `- ${d.name}`).join("\n")}` : "כל המסמכים הנדרשים מצורפים."}

נודה לטיפולכם המהיר ולעדכון בנוגע לסטטוס התביעה.

בברכה,
סוכנות ביטוח ClaimPilot`;
}

// --- Next Action Logic ---

export type NextActionSeverity = "red" | "yellow" | "green";

export interface NextAction {
  text: string;
  severity: NextActionSeverity;
  description: string;
}

export function getClaimNextAction(claim: Claim): NextAction {
  const missing = getClaimMissingDocs(claim.id);
  const missingNotReceived = missing.filter((d) => !d.is_received);

  switch (claim.status) {
    case "new":
      if (missingNotReceived.length > 0) {
        return {
          text: "לבקש מסמכים חסרים מהלקוח",
          severity: "red",
          description: `חסרים ${missingNotReceived.length} מסמכים: ${missingNotReceived.map((d) => d.name).join(", ")}`,
        };
      }
      return {
        text: "לבדוק פרטי תביעה ולהעביר לטיפול",
        severity: "red",
        description: "תביעה חדשה שטרם טופלה",
      };
    case "waiting_customer_docs":
      return {
        text: "לבקש מסמכים חסרים מהלקוח",
        severity: "red",
        description: `ממתין ל: ${missingNotReceived.map((d) => d.name).join(", ") || "מסמכים מהלקוח"}`,
      };
    case "waiting_insurance":
      return {
        text: "לעקוב אחר תשובת חברת הביטוח",
        severity: "yellow",
        description: "התביעה הועברה לחברת הביטוח, ממתין לתגובה",
      };
    case "in_review":
      return {
        text: "לעקוב אחר תשובת חברת הביטוח",
        severity: "yellow",
        description: "התביעה בבדיקה אצל חברת הביטוח",
      };
    case "approved":
      return {
        text: "לעדכן לקוח ולסגור טיפול",
        severity: "green",
        description: "התביעה אושרה — יש לעדכן את הלקוח ולסגור את התיק",
      };
    case "rejected":
      return {
        text: "לעדכן לקוח על דחיית התביעה",
        severity: "red",
        description: "התביעה נדחתה — יש ליידע את הלקוח ולבדוק אפשרות ערעור",
      };
    case "closed":
      return {
        text: "הטיפול הושלם",
        severity: "green",
        description: "התביעה סגורה, אין פעולות נוספות",
      };
  }
}

export function getIntakeNextAction(status: string, missingFields: string[], missingDocs: string[]): NextAction {
  const hasMissing = missingFields.length > 0 || missingDocs.length > 0;

  switch (status) {
    case "intake":
      return {
        text: "להשלים קליטת פרטים מהלקוח",
        severity: "red",
        description: hasMissing
          ? `חסרים: ${[...missingFields, ...missingDocs].join(", ")}`
          : "תהליך הקליטה עדיין בתהליך",
      };
    case "ready_for_review":
      if (hasMissing) {
        return {
          text: "לבקש מסמכים חסרים מהלקוח",
          severity: "red",
          description: `חסרים: ${[...missingFields, ...missingDocs].join(", ")}`,
        };
      }
      return {
        text: "לשלוח למפקח חברת הביטוח",
        severity: "red",
        description: "כל הפרטים התקבלו — מוכן לאישור ושליחה",
      };
    case "approved_by_agent":
      return {
        text: "לשלוח למפקח חברת הביטוח",
        severity: "yellow",
        description: "התביעה אושרה, ממתין לשליחה למפקח",
      };
    case "sent_to_inspector":
      return {
        text: "לעקוב אחר תשובת חברת הביטוח",
        severity: "green",
        description: "התביעה נשלחה למפקח בהצלחה",
      };
    default:
      return {
        text: "לבדוק סטטוס",
        severity: "yellow",
        description: "",
      };
  }
}

// --- One-line AI Summary ---

export function generateOneLineSummary(claim: Claim): string {
  const missing = getClaimMissingDocs(claim.id);
  const missingCount = missing.filter((d) => !d.is_received).length;
  const docs = getClaimDocuments(claim.id);

  const parts: string[] = [];
  parts.push(CLAIM_TYPE_LABELS[claim.type]);

  if (claim.incident_date) {
    parts.push(`ב${new Date(claim.incident_date).toLocaleDateString("he-IL")}`);
  }

  if (claim.description) {
    // Take first meaningful chunk
    const short = claim.description.split(".")[0].trim();
    if (short.length <= 40) {
      parts.push(short);
    } else {
      parts.push(short.slice(0, 40) + "...");
    }
  }

  if (claim.claim_amount) {
    parts.push(`סכום: ₪${claim.claim_amount.toLocaleString()}`);
  }

  if (missingCount > 0) {
    parts.push(`${missingCount} מסמכים חסרים`);
  } else if (docs.length > 0) {
    parts.push("כל המסמכים קיימים");
  }

  return parts.join(" · ");
}

// --- Action Message Generators ---

export function generateMissingDocsRequest(claim: Claim): string {
  const customer = claim.customer;
  const missing = getClaimMissingDocs(claim.id).filter((d) => !d.is_received);

  if (missing.length === 0) return "אין מסמכים חסרים.";

  return `שלום ${customer?.full_name || ""},

בהמשך לתביעה שלך (${claim.claim_number}), אנא שלח/י את המסמכים הבאים בהקדם:

${missing.map((d) => `• ${d.name} — ${d.description}`).join("\n")}

ניתן לשלוח בוואטסאפ או במייל.
תודה,
סוכנות ClaimPilot`;
}

export function generateFollowUpMessage(claim: Claim): string {
  return `לכבוד מחלקת תביעות,
${claim.insurance_company}

הנדון: מעקב — תביעה ${claim.claim_number}
מבוטח: ${claim.customer?.full_name || "—"}
פוליסה: ${claim.policy_number}

אבקש עדכון בנוגע לסטטוס התביעה שהוגשה ביום ${new Date(claim.created_at).toLocaleDateString("he-IL")}.

בברכה,
סוכנות ביטוח ClaimPilot`;
}

// --- Mock Policies & Retention Data ---

// Helper: get a date N days from now as ISO string
function daysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function diffDays(dateStr: string): number {
  const target = new Date(dateStr + "T00:00:00Z");
  const now = new Date();
  now.setUTCHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export const mockPolicies: CustomerPolicy[] = [
  // יוסי כהן — 2 policies: car end in 5 days (urgent), life end in 90 days, discount in 12 days
  {
    id: "pol1",
    customer_id: "c1",
    insurance_type: "car",
    provider: "הראל ביטוח",
    policy_number: "POL-CAR-12345",
    start_date: "2025-05-10",
    end_date: daysFromNow(5),
    discount_end_date: daysFromNow(5),
    status: "expiring",
    created_at: "2025-05-10T00:00:00Z",
  },
  {
    id: "pol2",
    customer_id: "c1",
    insurance_type: "life",
    provider: "הפניקס ביטוח",
    policy_number: "POL-LIFE-22222",
    start_date: "2025-08-01",
    end_date: daysFromNow(90),
    discount_end_date: daysFromNow(12),
    status: "active",
    created_at: "2025-08-01T00:00:00Z",
  },
  // שרה לוי — 2 policies: health end in 20 days (needs_call), car end in 45 days
  {
    id: "pol3",
    customer_id: "c2",
    insurance_type: "health",
    provider: "כלל ביטוח",
    policy_number: "POL-HEALTH-67890",
    start_date: "2025-06-01",
    end_date: daysFromNow(20),
    discount_end_date: daysFromNow(10),
    status: "expiring",
    created_at: "2025-06-01T00:00:00Z",
  },
  {
    id: "pol4",
    customer_id: "c2",
    insurance_type: "car",
    provider: "הראל ביטוח",
    policy_number: "POL-CAR-44444",
    start_date: "2025-07-15",
    end_date: daysFromNow(45),
    discount_end_date: null,
    status: "active",
    created_at: "2025-07-15T00:00:00Z",
  },
  // דוד ישראלי — 1 policy, end in 60 days (ok)
  {
    id: "pol5",
    customer_id: "c3",
    insurance_type: "property",
    provider: "מגדל ביטוח",
    policy_number: "POL-PROP-11111",
    start_date: "2025-09-01",
    end_date: daysFromNow(60),
    discount_end_date: daysFromNow(55),
    status: "active",
    created_at: "2025-09-01T00:00:00Z",
  },
  // רונית אברהם — travel end in 3 days (urgent), car already expired
  {
    id: "pol6",
    customer_id: "c4",
    insurance_type: "travel",
    provider: "ביטוח ישיר",
    policy_number: "POL-TRV-33333",
    start_date: "2025-04-01",
    end_date: daysFromNow(3),
    discount_end_date: daysFromNow(3),
    status: "expiring",
    created_at: "2025-04-01T00:00:00Z",
  },
  {
    id: "pol7",
    customer_id: "c4",
    insurance_type: "car",
    provider: "מגדל ביטוח",
    policy_number: "POL-CAR-55555",
    start_date: "2024-05-01",
    end_date: daysFromNow(-10),
    discount_end_date: null,
    status: "expired",
    created_at: "2024-05-01T00:00:00Z",
  },
];

export function getCustomerPolicies(customerId: string): CustomerPolicy[] {
  return mockPolicies.filter((p) => p.customer_id === customerId);
}

function enrichPolicy(p: CustomerPolicy): EnrichedPolicy {
  const daysEnd = diffDays(p.end_date);
  const daysDiscount = p.discount_end_date ? diffDays(p.discount_end_date) : null;
  return {
    ...p,
    days_until_end: daysEnd,
    days_until_discount_end: daysDiscount,
    discount_expiring: daysDiscount !== null && daysDiscount >= 0 && daysDiscount <= 14,
  };
}

function computeRetentionStatus(daysUntilExpiry: number | null, hasDiscountExpiring: boolean): RetentionStatus {
  if (daysUntilExpiry !== null && daysUntilExpiry <= 7) return "urgent";
  if (hasDiscountExpiring) return "urgent";
  if (daysUntilExpiry !== null && daysUntilExpiry <= 30) return "needs_call";
  return "ok";
}

export function getCustomerRetentionInfo(customer: Customer): CustomerRetentionInfo {
  const policies = getCustomerPolicies(customer.id);
  const activePolicies = policies.filter((p) => p.status !== "expired");
  const enriched = activePolicies.map(enrichPolicy);

  let nearestExpiry: string | null = null;
  let daysUntil: number | null = null;

  for (const p of enriched) {
    if (p.days_until_end >= 0 && (daysUntil === null || p.days_until_end < daysUntil)) {
      daysUntil = p.days_until_end;
      nearestExpiry = p.end_date;
    }
  }

  const hasDiscountExpiring = enriched.some((p) => p.discount_expiring);

  return {
    customer,
    policies: enriched,
    activePoliciesCount: activePolicies.length,
    nearestDiscountExpiry: nearestExpiry,
    daysUntilExpiry: daysUntil,
    retentionStatus: computeRetentionStatus(daysUntil, hasDiscountExpiring),
    hasDiscountExpiring,
  };
}

export function getAllRetentionInfo(): CustomerRetentionInfo[] {
  return mockCustomers.map(getCustomerRetentionInfo);
}

export function generateRetentionCallScript(info: CustomerRetentionInfo): string {
  const expiringPolicies = info.policies.filter(
    (p) => p.days_until_end <= 30 || p.discount_expiring
  );

  const policyLines = expiringPolicies.map((p) => {
    const typeLabel = CLAIM_TYPE_LABELS[p.insurance_type as keyof typeof CLAIM_TYPE_LABELS] || p.insurance_type;
    const endDate = new Date(p.end_date).toLocaleDateString("he-IL");
    let line = `  - ${typeLabel} (${p.provider}) — פג תוקף ב-${endDate}`;
    if (p.discount_expiring && p.discount_end_date) {
      const discountDate = new Date(p.discount_end_date).toLocaleDateString("he-IL");
      line += ` | הנחה פגה ב-${discountDate}`;
    }
    return line;
  }).join("\n");

  return `שלום ${info.customer.full_name},

שמי [שם הסוכן] מסוכנות ClaimPilot.

אני פונה אליך כי שמתי לב שיש ${expiringPolicies.length === 1 ? "פוליסה אחת" : `${expiringPolicies.length} פוליסות`} שעומד${expiringPolicies.length === 1 ? "ת" : "ות"} לפוג בקרוב:

${policyLines}

רציתי לוודא שאת/ה מודע/ת לזה ולהציע שנבדוק יחד את אפשרויות החידוש — כדי שלא תפסיד/י את הכיסוי או ההנחה.

יש לי כמה מסלולים שיכולים להתאים. מתי נוח לך לשיחה קצרה של כמה דקות?

תודה רבה ויום נעים,
סוכנות ClaimPilot`;
}

export function getDashboardStats() {
  const total = mockClaims.length;
  const byStatus = mockClaims.reduce(
    (acc, claim) => {
      acc[claim.status] = (acc[claim.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );
  const totalAmount = mockClaims.reduce((sum, c) => sum + (c.claim_amount || 0), 0);
  const approvedAmount = mockClaims.reduce((sum, c) => sum + (c.approved_amount || 0), 0);

  return { total, byStatus, totalAmount, approvedAmount };
}

// --- Actions Page Data ---

export type ActionPriority = "red" | "orange" | "green";
export type ActionCTA = "open_claim" | "open_whatsapp" | "call" | "open_customer";

export interface ActionItem {
  id: string;
  customerName: string;
  customerPhone: string;
  customerId: string;
  issue: string;
  priority: ActionPriority;
  cta: ActionCTA;
  ctaLabel: string;
  linkHref: string;
  claimId?: string;
  policyId?: string;
}

export function getUrgentActions(): ActionItem[] {
  const items: ActionItem[] = [];
  const now = new Date();

  // 1. Claims stuck — no update in 3+ days
  for (const claim of mockClaims) {
    if (claim.status === "closed" || claim.status === "approved") continue;
    const updated = new Date(claim.updated_at);
    const daysSince = Math.floor((now.getTime() - updated.getTime()) / (1000 * 60 * 60 * 24));
    if (daysSince >= 3) {
      const customer = mockCustomers.find((c) => c.id === claim.customer_id);
      items.push({
        id: `stuck-${claim.id}`,
        customerName: customer?.full_name || "לקוח",
        customerPhone: customer?.phone || "",
        customerId: claim.customer_id,
        issue: `תביעה ${claim.claim_number} תקועה ${daysSince} ימים ללא עדכון`,
        priority: daysSince >= 7 ? "red" : "orange",
        cta: "open_claim",
        ctaLabel: "פתח תביעה",
        linkHref: `/claims/${claim.id}`,
        claimId: claim.id,
      });
    }
  }

  // 2. Expiring policies (≤7 days)
  for (const policy of mockPolicies) {
    if (policy.status === "expired") continue;
    const dEnd = diffDays(policy.end_date);
    if (dEnd >= 0 && dEnd <= 7) {
      const customer = mockCustomers.find((c) => c.id === policy.customer_id);
      const typeLabel = CLAIM_TYPE_LABELS[policy.insurance_type as ClaimType] || policy.insurance_type;
      items.push({
        id: `expiring-${policy.id}`,
        customerName: customer?.full_name || "לקוח",
        customerPhone: customer?.phone || "",
        customerId: policy.customer_id,
        issue: `פוליסת ${typeLabel} (${policy.provider}) פגה בעוד ${dEnd} ימים`,
        priority: dEnd <= 3 ? "red" : "orange",
        cta: "call",
        ctaLabel: "התקשר",
        linkHref: `/customers/${policy.customer_id}`,
        policyId: policy.id,
      });
    }
  }

  // 3. Expiring discounts (≤14 days)
  for (const policy of mockPolicies) {
    if (policy.status === "expired" || !policy.discount_end_date) continue;
    const dDiscount = diffDays(policy.discount_end_date);
    if (dDiscount >= 0 && dDiscount <= 14) {
      // Skip if already in expiring policies list (same policy)
      if (items.some((i) => i.policyId === policy.id)) continue;
      const customer = mockCustomers.find((c) => c.id === policy.customer_id);
      const typeLabel = CLAIM_TYPE_LABELS[policy.insurance_type as ClaimType] || policy.insurance_type;
      items.push({
        id: `discount-${policy.id}`,
        customerName: customer?.full_name || "לקוח",
        customerPhone: customer?.phone || "",
        customerId: policy.customer_id,
        issue: `הנחה על ${typeLabel} פגה בעוד ${dDiscount} ימים`,
        priority: dDiscount <= 5 ? "orange" : "green",
        cta: "call",
        ctaLabel: "התקשר",
        linkHref: `/customers/${policy.customer_id}`,
        policyId: policy.id,
      });
    }
  }

  return items.sort((a, b) => {
    const order: Record<ActionPriority, number> = { red: 0, orange: 1, green: 2 };
    return order[a.priority] - order[b.priority];
  });
}

export function getFollowUpActions(): ActionItem[] {
  const items: ActionItem[] = [];

  // Open claims not completed (new, waiting_customer_docs)
  for (const claim of mockClaims) {
    if (claim.status !== "new" && claim.status !== "waiting_customer_docs") continue;
    const customer = mockCustomers.find((c) => c.id === claim.customer_id);
    const statusLabel = CLAIM_STATUS_LABELS[claim.status];
    items.push({
      id: `followup-${claim.id}`,
      customerName: customer?.full_name || "לקוח",
      customerPhone: customer?.phone || "",
      customerId: claim.customer_id,
      issue: `תביעה ${claim.claim_number} — ${statusLabel}`,
      priority: claim.status === "new" ? "orange" : "red",
      cta: "open_claim",
      ctaLabel: "פתח תביעה",
      linkHref: `/claims/${claim.id}`,
      claimId: claim.id,
    });
  }

  // Claims waiting for insurance response
  for (const claim of mockClaims) {
    if (claim.status !== "waiting_insurance" && claim.status !== "in_review") continue;
    const customer = mockCustomers.find((c) => c.id === claim.customer_id);
    items.push({
      id: `waiting-${claim.id}`,
      customerName: customer?.full_name || "לקוח",
      customerPhone: customer?.phone || "",
      customerId: claim.customer_id,
      issue: `תביעה ${claim.claim_number} — ממתין לתגובת חברת ביטוח`,
      priority: "orange",
      cta: "open_claim",
      ctaLabel: "פתח תביעה",
      linkHref: `/claims/${claim.id}`,
      claimId: claim.id,
    });
  }

  return items.sort((a, b) => {
    const order: Record<ActionPriority, number> = { red: 0, orange: 1, green: 2 };
    return order[a.priority] - order[b.priority];
  });
}

export function getOpportunityActions(): ActionItem[] {
  const items: ActionItem[] = [];
  const now = new Date();

  // Customers without recent interaction (no claim updated in 30+ days)
  for (const customer of mockCustomers) {
    const customerClaims = mockClaims.filter((c) => c.customer_id === customer.id);
    const lastUpdate = customerClaims.length > 0
      ? Math.max(...customerClaims.map((c) => new Date(c.updated_at).getTime()))
      : new Date(customer.created_at).getTime();
    const daysSince = Math.floor((now.getTime() - lastUpdate) / (1000 * 60 * 60 * 24));

    if (daysSince >= 30) {
      items.push({
        id: `inactive-${customer.id}`,
        customerName: customer.full_name,
        customerPhone: customer.phone,
        customerId: customer.id,
        issue: `לא היה קשר ${daysSince} ימים — כדאי ליצור קשר`,
        priority: "green",
        cta: "call",
        ctaLabel: "התקשר",
        linkHref: `/customers/${customer.id}`,
      });
    }
  }

  // Upsell: customers with only 1 policy type
  for (const customer of mockCustomers) {
    const policies = mockPolicies.filter((p) => p.customer_id === customer.id && p.status !== "expired");
    const types = new Set(policies.map((p) => p.insurance_type));
    if (policies.length > 0 && types.size === 1) {
      const currentType = CLAIM_TYPE_LABELS[policies[0].insurance_type as ClaimType] || policies[0].insurance_type;
      items.push({
        id: `upsell-${customer.id}`,
        customerName: customer.full_name,
        customerPhone: customer.phone,
        customerId: customer.id,
        issue: `יש רק ${currentType} — הזדמנות להרחבת כיסוי`,
        priority: "green",
        cta: "call",
        ctaLabel: "התקשר",
        linkHref: `/customers/${customer.id}`,
      });
    }
  }

  return items;
}

// === AI Recommendations & Insights ===

export interface AIRecommendation {
  text: string;
  reason: string;
}

export interface CustomerInsight {
  type: "risk" | "opportunity" | "expiring" | "info";
  icon: string;
  text: string;
  color: string;
}

export interface DailyBriefData {
  greeting: string;
  riskCustomers: number;
  stuckClaims: number;
  expiringToday: number;
  expiringWeek: number;
  openConversations: number;
  topActions: { text: string; href: string }[];
}

// Generate AI recommendation per action item
export function getActionRecommendation(item: ActionItem): AIRecommendation {
  if (item.id.startsWith("stuck-")) {
    const days = item.issue.match(/(\d+) ימים/)?.[1] || "3";
    return {
      text: `שלח תזכורת — תביעה תקועה ${days} ימים`,
      reason: `תביעה לא עודכנה ${days} ימים. מומלץ ליצור קשר עם הלקוח או חברת הביטוח.`,
    };
  }
  if (item.id.startsWith("expiring-")) {
    const days = item.issue.match(/(\d+) ימים/)?.[1] || "7";
    return {
      text: `התקשר ללקוח — פוליסה פגה בעוד ${days} ימים`,
      reason: `פוליסה עומדת לפוג. שיחה מהירה יכולה לשמר את הלקוח ולמנוע אובדן כיסוי.`,
    };
  }
  if (item.id.startsWith("discount-")) {
    return {
      text: `הצע חידוש לפני שההנחה נגמרת`,
      reason: `הנחה עומדת לפוג. חידוש עכשיו חוסך ללקוח כסף ומשמר אותו.`,
    };
  }
  if (item.id.startsWith("followup-")) {
    return {
      text: `בקש מסמכים חסרים מהלקוח`,
      reason: `תביעה פתוחה דורשת מסמכים להמשך טיפול.`,
    };
  }
  if (item.id.startsWith("waiting-")) {
    return {
      text: `שלח מעקב לחברת הביטוח`,
      reason: `ממתין לתגובה מחברת הביטוח. מומלץ לשלוח תזכורת.`,
    };
  }
  if (item.id.startsWith("inactive-")) {
    return {
      text: `צור קשר — לקוח לא פעיל`,
      reason: `לא היה קשר עם הלקוח זמן רב. שיחה קצרה משמרת את הקשר.`,
    };
  }
  if (item.id.startsWith("upsell-")) {
    return {
      text: `הצע ביטוח נוסף ללקוח`,
      reason: `ללקוח יש רק סוג אחד של ביטוח — הזדמנות מצוינת להרחבת כיסוי.`,
    };
  }
  return { text: `טפל בפריט`, reason: `פריט דורש טיפול.` };
}

// Generate WhatsApp message for action item
export function generateActionMessage(item: ActionItem): string {
  const customer = mockCustomers.find((c) => c.id === item.customerId);
  const name = customer?.full_name || "לקוח/ה יקר/ה";

  if (item.id.startsWith("stuck-")) {
    const claim = item.claimId ? mockClaims.find((c) => c.id === item.claimId) : null;
    return `שלום ${name}! 👋\nרציתי לעדכן אותך שאני ממשיך לטפל בתביעה${claim ? ` ${claim.claim_number}` : ""} שלך.\nיש משהו שאתה צריך ממני כדי לקדם את העניין?`;
  }
  if (item.id.startsWith("expiring-") || item.id.startsWith("discount-")) {
    return `שלום ${name}! 👋\nשמתי לב שפוליסת הביטוח שלך עומדת להסתיים בקרוב.\nכדאי שנבדוק יחד אפשרויות חידוש — כדי שלא תיהיה בלי כיסוי.\nמתי נוח לך לשיחה קצרה?`;
  }
  if (item.id.startsWith("followup-")) {
    const claim = item.claimId ? mockClaims.find((c) => c.id === item.claimId) : null;
    const missing = claim ? getClaimMissingDocs(claim.id).filter((d) => !d.is_received) : [];
    if (missing.length > 0) {
      return `שלום ${name}! 👋\nכדי להתקדם עם התביעה שלך, אני צריך ממך:\n${missing.map((d) => `📄 ${d.name}`).join("\n")}\n\nאפשר לשלוח בוואטסאפ או במייל. תודה! 🙏`;
    }
    return `שלום ${name}! 👋\nרציתי לבדוק אם יש התקדמות בנושא התביעה שלך.\nאני כאן לכל שאלה!`;
  }
  if (item.id.startsWith("waiting-")) {
    const claim = item.claimId ? mockClaims.find((c) => c.id === item.claimId) : null;
    return `שלום ${name}! 👋\nרציתי לעדכן שאני עוקב אחרי התביעה${claim ? ` ${claim.claim_number}` : ""} שלך מול חברת הביטוח.\nברגע שיהיה עדכון — אעביר אליך מיד!`;
  }
  if (item.id.startsWith("inactive-")) {
    return `שלום ${name}! 👋\nלא שמענו ממך זמן מה ורציתי לבדוק שהכל בסדר.\nאם יש משהו שאני יכול לעזור בו — אני כאן!`;
  }
  if (item.id.startsWith("upsell-")) {
    return `שלום ${name}! 👋\nראיתי שיש לך כרגע סוג אחד של ביטוח.\nרצית שאבדוק לך הצעות לכיסוי נוסף (דירה, בריאות, חיים)? יכול לחסוך לך כסף בחבילה משולבת!`;
  }
  return `שלום ${name}! 👋\nרציתי ליצור קשר בנוגע לביטוח שלך. מתי נוח לך לשיחה?`;
}

// AI insights per customer
export function getCustomerInsights(customerId: string): CustomerInsight[] {
  const customer = mockCustomers.find((c) => c.id === customerId);
  if (!customer) return [];

  const insights: CustomerInsight[] = [];
  const policies = mockPolicies.filter((p) => p.customer_id === customerId);
  const claims = mockClaims.filter((c) => c.customer_id === customerId);
  const activePolicies = policies.filter((p) => p.status !== "expired");
  const now = new Date();

  // Risk: no activity 30+ days
  const lastActivity = claims.length > 0
    ? Math.max(...claims.map((c) => new Date(c.updated_at).getTime()))
    : new Date(customer.created_at).getTime();
  const daysSinceActivity = Math.floor((now.getTime() - lastActivity) / (1000 * 60 * 60 * 24));
  if (daysSinceActivity >= 30) {
    insights.push({
      type: "risk",
      icon: "⚠️",
      text: `לקוח בסיכון — אין פעילות ${daysSinceActivity} יום`,
      color: "bg-red-50 text-red-700 border-red-200",
    });
  }

  // Expiring policy
  for (const p of activePolicies) {
    const dEnd = diffDays(p.end_date);
    if (dEnd >= 0 && dEnd <= 7) {
      const typeLabel = CLAIM_TYPE_LABELS[p.insurance_type as ClaimType] || p.insurance_type;
      insights.push({
        type: "expiring",
        icon: "📅",
        text: `פוליסת ${typeLabel} פגה בעוד ${dEnd} ימים`,
        color: "bg-amber-50 text-amber-700 border-amber-200",
      });
    } else if (dEnd > 7 && dEnd <= 30) {
      const typeLabel = CLAIM_TYPE_LABELS[p.insurance_type as ClaimType] || p.insurance_type;
      insights.push({
        type: "expiring",
        icon: "📅",
        text: `פוליסת ${typeLabel} נגמרת בקרוב (${dEnd} ימים)`,
        color: "bg-yellow-50 text-yellow-700 border-yellow-200",
      });
    }
  }

  // Upsell: only one type of insurance
  const types = new Set(activePolicies.map((p) => p.insurance_type));
  if (activePolicies.length > 0 && types.size === 1) {
    const currentType = CLAIM_TYPE_LABELS[activePolicies[0].insurance_type as ClaimType] || activePolicies[0].insurance_type;
    insights.push({
      type: "opportunity",
      icon: "💰",
      text: `הזדמנות — ללקוח יש רק ${currentType}`,
      color: "bg-green-50 text-green-700 border-green-200",
    });
  }

  // Stuck claims
  for (const claim of claims) {
    if (claim.status === "closed" || claim.status === "approved") continue;
    const updated = new Date(claim.updated_at);
    const daysSince = Math.floor((now.getTime() - updated.getTime()) / (1000 * 60 * 60 * 24));
    if (daysSince >= 3) {
      insights.push({
        type: "risk",
        icon: "⏳",
        text: `תביעה ${claim.claim_number} תקועה ${daysSince} ימים`,
        color: "bg-orange-50 text-orange-700 border-orange-200",
      });
    }
  }

  // Missing docs
  for (const claim of claims) {
    if (claim.status === "closed") continue;
    const missing = getClaimMissingDocs(claim.id).filter((d) => !d.is_received);
    if (missing.length > 0) {
      insights.push({
        type: "info",
        icon: "📄",
        text: `חסרים ${missing.length} מסמכים לתביעה ${claim.claim_number}`,
        color: "bg-blue-50 text-blue-700 border-blue-200",
      });
    }
  }

  return insights;
}

// Generate recommended action message for a customer
export function generateCustomerActionMessage(customerId: string): { suggestion: string; message: string } {
  const insights = getCustomerInsights(customerId);
  const customer = mockCustomers.find((c) => c.id === customerId);
  const name = customer?.full_name || "לקוח";

  if (insights.length === 0) {
    return {
      suggestion: "הכל תקין — אפשר ליצור קשר לבדיקת שביעות רצון",
      message: `שלום ${name}! 👋\nרציתי לבדוק שהכל בסדר מבחינת הביטוח שלך.\nיש משהו שאני יכול לעזור בו?`,
    };
  }

  const top = insights[0];
  if (top.type === "risk" && top.text.includes("אין פעילות")) {
    return {
      suggestion: `${top.icon} ${top.text} — מומלץ ליצור קשר`,
      message: `שלום ${name}! 👋\nלא שמענו ממך זמן מה.\nרציתי לבדוק שהכל בסדר ושהביטוח שלך מכסה את מה שצריך.\nמתי נוח לך לשיחה קצרה?`,
    };
  }
  if (top.type === "expiring") {
    return {
      suggestion: `${top.icon} ${top.text} — הצע חידוש`,
      message: `שלום ${name}! 👋\n${top.text}.\nכדאי שנבדוק יחד חידוש כדי שלא תהיה בלי כיסוי.\nמתי נוח לך?`,
    };
  }
  if (top.type === "opportunity") {
    return {
      suggestion: `${top.icon} ${top.text} — הצע הרחבת כיסוי`,
      message: `שלום ${name}! 👋\nראיתי שיש לך כרגע סוג אחד של ביטוח.\nאשמח לבדוק לך הצעות לכיסוי נוסף שיכולות לחסוך בחבילה משולבת.\nמעניין אותך?`,
    };
  }
  if (top.text.includes("תקועה")) {
    return {
      suggestion: `${top.icon} ${top.text} — דחוף לטפל`,
      message: `שלום ${name}! 👋\nרציתי לעדכן שאני ממשיך לטפל בתביעה שלך.\nיש עדכון חדש?`,
    };
  }
  if (top.text.includes("מסמכים")) {
    return {
      suggestion: `${top.icon} ${top.text} — בקש מהלקוח`,
      message: `שלום ${name}! 👋\nכדי שנוכל להתקדם עם התביעה, אני צריך ממך כמה מסמכים.\nתוכל/י לשלוח בוואטסאפ?`,
    };
  }
  return {
    suggestion: `${top.icon} ${top.text}`,
    message: `שלום ${name}! 👋\nרציתי ליצור קשר. מתי נוח לך?`,
  };
}

// Conversation AI summary
export function getConversationSummary(conv: {
  customerName: string;
  messages: { direction: string; message: string }[];
  tags: string[];
  linkedClaimNumber?: string;
  status: string;
}): string {
  const msgCount = conv.messages.length;
  const inbound = conv.messages.filter((m) => m.direction === "inbound").length;
  const lastInbound = [...conv.messages].reverse().find((m) => m.direction === "inbound");

  const parts: string[] = [];

  if (conv.tags.includes("claim") && conv.linkedClaimNumber) {
    parts.push(`שיחת תביעה (${conv.linkedClaimNumber})`);
  } else if (conv.tags.includes("retention")) {
    parts.push("שיחת שימור");
  } else if (conv.tags.includes("sales")) {
    parts.push("פניית מכירה");
  } else {
    parts.push("שיחה כללית");
  }

  parts.push(`${msgCount} הודעות (${inbound} מהלקוח)`);

  if (lastInbound) {
    const short = lastInbound.message.length > 50
      ? lastInbound.message.slice(0, 50) + "..."
      : lastInbound.message;
    parts.push(`אחרון: "${short}"`);
  }

  return parts.join(" · ");
}

// Conversation insights
export function getConversationInsights(conv: {
  customerId: string;
  linkedClaimId?: string;
  linkedPolicyId?: string;
  tags: string[];
}): { icon: string; text: string; type: string }[] {
  const insights: { icon: string; text: string; type: string }[] = [];

  // Missing docs for linked claim
  if (conv.linkedClaimId) {
    const missing = getClaimMissingDocs(conv.linkedClaimId).filter((d) => !d.is_received);
    if (missing.length > 0) {
      insights.push({
        icon: "📄",
        text: `חסרים ${missing.length} מסמכים: ${missing.map((d) => d.name).join(", ")}`,
        type: "missing_docs",
      });
    }
  }

  // Expiring policy
  const policies = mockPolicies.filter((p) => p.customer_id === conv.customerId);
  for (const p of policies) {
    if (p.status === "expired") continue;
    const dEnd = diffDays(p.end_date);
    if (dEnd >= 0 && dEnd <= 14) {
      const typeLabel = CLAIM_TYPE_LABELS[p.insurance_type as ClaimType] || p.insurance_type;
      insights.push({
        icon: "📅",
        text: `פוליסת ${typeLabel} פגה בעוד ${dEnd} ימים`,
        type: "expiring",
      });
      break;
    }
  }

  // Upsell opportunity
  const activePolicies = policies.filter((p) => p.status !== "expired");
  const types = new Set(activePolicies.map((p) => p.insurance_type));
  if (activePolicies.length > 0 && types.size === 1) {
    insights.push({
      icon: "💰",
      text: "ללקוח סוג אחד של ביטוח — הזדמנות להרחבה",
      type: "upsell",
    });
  }

  // Stuck claim
  if (conv.linkedClaimId) {
    const claim = mockClaims.find((c) => c.id === conv.linkedClaimId);
    if (claim && claim.status !== "closed" && claim.status !== "approved") {
      const daysSince = Math.floor(
        (new Date().getTime() - new Date(claim.updated_at).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSince >= 3) {
        insights.push({
          icon: "⏳",
          text: `תביעה לא עודכנה ${daysSince} ימים`,
          type: "stuck",
        });
      }
    }
  }

  return insights;
}

// Daily brief data
export function getDailyBrief(): DailyBriefData {
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "בוקר טוב" : hour < 18 ? "צהריים טובים" : "ערב טוב";

  // Risk customers (no activity 30+ days)
  let riskCustomers = 0;
  for (const c of mockCustomers) {
    const claims = mockClaims.filter((cl) => cl.customer_id === c.id);
    const lastActivity = claims.length > 0
      ? Math.max(...claims.map((cl) => new Date(cl.updated_at).getTime()))
      : new Date(c.created_at).getTime();
    if (Math.floor((now.getTime() - lastActivity) / (1000 * 60 * 60 * 24)) >= 30) {
      riskCustomers++;
    }
  }

  // Stuck claims (3+ days no update)
  let stuckClaims = 0;
  for (const claim of mockClaims) {
    if (claim.status === "closed" || claim.status === "approved") continue;
    const daysSince = Math.floor(
      (now.getTime() - new Date(claim.updated_at).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSince >= 3) stuckClaims++;
  }

  // Expiring policies
  let expiringToday = 0;
  let expiringWeek = 0;
  for (const p of mockPolicies) {
    if (p.status === "expired") continue;
    const dEnd = diffDays(p.end_date);
    if (dEnd === 0) expiringToday++;
    if (dEnd >= 0 && dEnd <= 7) expiringWeek++;
  }

  // Open conversations — import inline to avoid circular dependency
  let openConvs = 0;
  try {
    const convData = require("./conversations-data");
    const stats = convData.getConversationStats();
    openConvs = stats.open;
  } catch {
    openConvs = 0;
  }

  // Top actions
  const urgent = getUrgentActions();
  const topActions = urgent.slice(0, 3).map((item) => ({
    text: item.issue,
    href: item.linkHref,
  }));

  return {
    greeting,
    riskCustomers,
    stuckClaims,
    expiringToday,
    expiringWeek,
    openConversations: openConvs,
    topActions,
  };
}
