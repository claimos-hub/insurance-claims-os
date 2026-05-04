export type ClaimStatus =
  | "new"
  | "waiting_customer_docs"
  | "waiting_insurance"
  | "in_review"
  | "approved"
  | "rejected"
  | "closed";

export type ClaimType =
  | "car"
  | "health"
  | "life"
  | "property"
  | "travel"
  | "other";

export interface Customer {
  id: string;
  full_name: string;
  id_number: string;
  phone: string;
  email: string;
  address: string;
  created_at: string;
  agent_id: string;
}

export interface Claim {
  id: string;
  claim_number: string;
  customer_id: string;
  agent_id: string;
  type: ClaimType;
  status: ClaimStatus;
  title: string;
  description: string;
  insurance_company: string;
  policy_number: string;
  incident_date: string;
  claim_amount: number | null;
  approved_amount: number | null;
  created_at: string;
  updated_at: string;
  customer?: Customer;
}

export interface ClaimDocument {
  id: string;
  claim_id: string;
  name: string;
  file_url: string;
  file_type: string;
  uploaded_at: string;
  uploaded_by: string;
}

export interface MissingDocument {
  id: string;
  claim_id: string;
  name: string;
  description: string;
  is_received: boolean;
  created_at: string;
}

export interface ClaimNote {
  id: string;
  claim_id: string;
  author_id: string;
  content: string;
  created_at: string;
}

export interface ActivityEvent {
  id: string;
  claim_id: string;
  type: "status_change" | "note_added" | "document_uploaded" | "document_requested" | "claim_created" | "amount_updated";
  description: string;
  created_at: string;
  actor_id: string;
}

export const CLAIM_STATUS_LABELS: Record<ClaimStatus, string> = {
  new: "חדשה",
  waiting_customer_docs: "ממתין למסמכי לקוח",
  waiting_insurance: "ממתין לחברת ביטוח",
  in_review: "בבדיקה",
  approved: "אושרה",
  rejected: "נדחתה",
  closed: "סגורה",
};

export const CLAIM_STATUS_COLORS: Record<ClaimStatus, string> = {
  new: "bg-blue-100 text-blue-800",
  waiting_customer_docs: "bg-yellow-100 text-yellow-800",
  waiting_insurance: "bg-orange-100 text-orange-800",
  in_review: "bg-purple-100 text-purple-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  closed: "bg-gray-100 text-gray-800",
};

export const CLAIM_TYPE_LABELS: Record<ClaimType, string> = {
  car: "ביטוח רכב",
  health: "ביטוח בריאות",
  life: "ביטוח חיים",
  property: "ביטוח רכוש",
  travel: "ביטוח נסיעות",
  other: "אחר",
};

// --- Retention / Policy Types ---

export type RetentionStatus = "ok" | "needs_call" | "urgent" | "handled";

export const RETENTION_STATUS_LABELS: Record<RetentionStatus, string> = {
  ok: "תקין",
  needs_call: "דורש שיחה",
  urgent: "דחוף",
  handled: "טופל",
};

export const RETENTION_STATUS_COLORS: Record<RetentionStatus, string> = {
  ok: "bg-green-100 text-green-800",
  needs_call: "bg-amber-100 text-amber-800",
  urgent: "bg-red-100 text-red-800",
  handled: "bg-gray-100 text-gray-800",
};

export interface CustomerPolicy {
  id: string;
  customer_id: string;
  insurance_type: string;
  provider: string;
  policy_number: string;
  start_date: string;
  end_date: string;
  discount_end_date: string | null;
  status: "active" | "expiring" | "expired";
  created_at: string;
}

export interface EnrichedPolicy extends CustomerPolicy {
  days_until_end: number;
  days_until_discount_end: number | null;
  discount_expiring: boolean;
}

export interface CustomerRetentionInfo {
  customer: Customer;
  policies: EnrichedPolicy[];
  activePoliciesCount: number;
  nearestDiscountExpiry: string | null;
  daysUntilExpiry: number | null;
  retentionStatus: RetentionStatus;
  hasDiscountExpiring: boolean;
}

// --- Intake Conversation Types ---

export interface CarAccidentIntakeData {
  event_date: string;
  event_time: string;
  event_location: string;
  description: string;
  plate_number: string;
  policy_number: string;
  has_injuries: boolean | null;
  injury_details: string;
  other_vehicle_involved: boolean | null;
  third_party_name: string;
  third_party_phone: string;
  third_party_plate: string;
  third_party_insurance: string;
  photos_uploaded: string[];
  driver_license_uploaded: boolean;
  vehicle_license_uploaded: boolean;
  police_report_uploaded: boolean;
  police_report_needed: boolean | null;
}

export interface IntakeMessage {
  id: string;
  sender: "bot" | "customer";
  text: string;
  timestamp: string;
  type: "text" | "file_upload" | "options";
  options?: string[];
  file_name?: string;
}

export type IntakeStep =
  | "greeting"
  | "event_date"
  | "event_time"
  | "event_location"
  | "description"
  | "plate_number"
  | "policy_number"
  | "injuries"
  | "injury_details"
  | "other_vehicle"
  | "third_party_name"
  | "third_party_phone"
  | "third_party_plate"
  | "third_party_insurance"
  | "photos"
  | "driver_license"
  | "vehicle_license"
  | "police_report_ask"
  | "police_report_upload"
  | "summary"
  | "complete";

export interface IntakeClaim {
  id: string;
  claim_number: string;
  customer_name: string;
  customer_phone: string;
  intake_data: CarAccidentIntakeData;
  messages: IntakeMessage[];
  readiness_score: number;
  missing_fields: string[];
  missing_documents: string[];
  ai_summary: string;
  ai_inspector_message: string;
  status: "intake" | "ready_for_review" | "approved_by_agent" | "sent_to_inspector";
  created_at: string;
}

// --- WhatsApp Inbox Types ---

export type ConversationStatus = "open" | "in_progress" | "closed";
export type ConversationTag = "claim" | "retention" | "sales" | "general";
export type ConversationPriority = "high" | "medium" | "low";

export const CONVERSATION_STATUS_LABELS: Record<ConversationStatus, string> = {
  open: "פתוחה",
  in_progress: "בטיפול",
  closed: "סגורה",
};

export const CONVERSATION_STATUS_COLORS: Record<ConversationStatus, string> = {
  open: "bg-red-100 text-red-800",
  in_progress: "bg-blue-100 text-blue-800",
  closed: "bg-gray-100 text-gray-800",
};

export const CONVERSATION_TAG_LABELS: Record<ConversationTag, string> = {
  claim: "תביעה",
  retention: "שימור",
  sales: "מכירה",
  general: "כללי",
};

export const CONVERSATION_TAG_COLORS: Record<ConversationTag, string> = {
  claim: "bg-purple-100 text-purple-800",
  retention: "bg-amber-100 text-amber-800",
  sales: "bg-green-100 text-green-800",
  general: "bg-slate-100 text-slate-800",
};

export const CONVERSATION_PRIORITY_LABELS: Record<ConversationPriority, string> = {
  high: "דחוף",
  medium: "רגיל",
  low: "נמוך",
};

export interface ConversationMessage {
  id: string;
  direction: "inbound" | "outbound";
  message: string;
  timestamp: string;
}

export interface Conversation {
  id: string;
  customerName: string;
  customerPhone: string;
  customerId: string;
  status: ConversationStatus;
  tags: ConversationTag[];
  priority: ConversationPriority;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  messages: ConversationMessage[];
  linkedClaimId?: string;
  linkedClaimNumber?: string;
  linkedPolicyId?: string;
  linkedPolicyNumber?: string;
  createdAt: string;
}
