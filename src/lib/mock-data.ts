import { Claim, Customer, ClaimDocument, MissingDocument, ClaimNote, ActivityEvent, CLAIM_TYPE_LABELS, CLAIM_STATUS_LABELS, CustomerPolicy, EnrichedPolicy, CustomerRetentionInfo, RetentionStatus } from "@/types";

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
