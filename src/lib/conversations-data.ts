import {
  Conversation,
  ConversationStatus,
  ConversationTag,
  ConversationPriority,
  ConversationMessage,
} from "@/types";

// --- Mock Conversations ---

export const mockConversations: Conversation[] = [
  {
    id: "conv1",
    customerName: "יוסי כהן",
    customerPhone: "050-1234567",
    customerId: "c1",
    status: "open",
    tags: ["claim"],
    priority: "high",
    lastMessage: "שלחתי את הצילומים, מה עוד חסר?",
    lastMessageTime: "2026-05-04T09:15:00Z",
    unreadCount: 2,
    linkedClaimId: "cl1",
    linkedClaimNumber: "CLM-2026-001",
    linkedPolicyId: "pol1",
    linkedPolicyNumber: "POL-CAR-12345",
    createdAt: "2026-04-11T08:30:00Z",
    messages: [
      {
        id: "cm1",
        direction: "inbound",
        message: "שלום, היה לי תאונה עם הרכב",
        timestamp: "2026-04-11T08:30:00Z",
      },
      {
        id: "cm2",
        direction: "outbound",
        message: "שלום יוסי! מצטער לשמוע 😔\nאני אעזור לך לפתוח תביעה. מתי קרה האירוע?",
        timestamp: "2026-04-11T08:30:15Z",
      },
      {
        id: "cm3",
        direction: "inbound",
        message: "ב-10 לאפריל, בצומת עזריאלי",
        timestamp: "2026-04-11T08:31:00Z",
      },
      {
        id: "cm4",
        direction: "outbound",
        message: "הבנתי. תוכל לתאר בקצרה מה קרה? ואיזה נזק יש לרכב?",
        timestamp: "2026-04-11T08:31:10Z",
      },
      {
        id: "cm5",
        direction: "inbound",
        message: "נסעתי ומישהו חתך אותי, פגע בדלת שמאל ובפגוש הקדמי",
        timestamp: "2026-04-11T08:32:00Z",
      },
      {
        id: "cm6",
        direction: "outbound",
        message: "תודה על הפרטים 👍\nאני צריך ממך כמה מסמכים:\n📸 צילומי נזק לרכב\n📄 רישיון נהיגה\n📄 דוח משטרה (אם יש)\n\nתוכל לשלוח?",
        timestamp: "2026-04-11T08:32:15Z",
      },
      {
        id: "cm7",
        direction: "inbound",
        message: "שלחתי את הצילומים, מה עוד חסר?",
        timestamp: "2026-05-04T09:15:00Z",
      },
    ],
  },
  {
    id: "conv2",
    customerName: "שרה לוי",
    customerPhone: "052-9876543",
    customerId: "c2",
    status: "in_progress",
    tags: ["claim", "retention"],
    priority: "medium",
    lastMessage: "אני מטפל בזה, תקבלי עדכון בהקדם",
    lastMessageTime: "2026-05-03T14:20:00Z",
    unreadCount: 0,
    linkedClaimId: "cl2",
    linkedClaimNumber: "CLM-2026-002",
    linkedPolicyId: "pol3",
    linkedPolicyNumber: "POL-HEALTH-67890",
    createdAt: "2026-03-25T10:00:00Z",
    messages: [
      {
        id: "cm8",
        direction: "inbound",
        message: "שלום, רציתי לבדוק מה הסטטוס של התביעה על הניתוח",
        timestamp: "2026-05-03T13:00:00Z",
      },
      {
        id: "cm9",
        direction: "outbound",
        message: "שלום שרה! תביעה CLM-2026-002 עדיין בבדיקה אצל כלל ביטוח. חסר סיכום מחלה מהרופא המנתח — שלחת אותו?",
        timestamp: "2026-05-03T13:01:00Z",
      },
      {
        id: "cm10",
        direction: "inbound",
        message: "עוד לא, אני אבקש מהרופא השבוע",
        timestamp: "2026-05-03T13:05:00Z",
      },
      {
        id: "cm11",
        direction: "outbound",
        message: "מעולה! ברגע שתשלחי אני אעביר ישר לביטוח.\nאגב, שמתי לב שביטוח הבריאות שלך מסתיים בעוד 20 יום — רוצה שאבדוק הצעה לחידוש?",
        timestamp: "2026-05-03T13:06:00Z",
      },
      {
        id: "cm12",
        direction: "inbound",
        message: "כן בבקשה, תבדוק לי",
        timestamp: "2026-05-03T14:15:00Z",
      },
      {
        id: "cm13",
        direction: "outbound",
        message: "אני מטפל בזה, תקבלי עדכון בהקדם",
        timestamp: "2026-05-03T14:20:00Z",
      },
    ],
  },
  {
    id: "conv3",
    customerName: "רונית אברהם",
    customerPhone: "053-7778899",
    customerId: "c4",
    status: "open",
    tags: ["retention"],
    priority: "high",
    lastMessage: "הפוליסה שלי פגה? לא ידעתי",
    lastMessageTime: "2026-05-04T08:00:00Z",
    unreadCount: 1,
    linkedPolicyId: "pol6",
    linkedPolicyNumber: "POL-TRV-33333",
    createdAt: "2026-05-04T07:50:00Z",
    messages: [
      {
        id: "cm14",
        direction: "outbound",
        message: "שלום רונית! רציתי ליידע אותך שפוליסת ביטוח הנסיעות שלך (POL-TRV-33333) פגה בעוד 3 ימים. כדאי לחדש כדי לא לאבד את הכיסוי. רוצה שאכין הצעה?",
        timestamp: "2026-05-04T07:50:00Z",
      },
      {
        id: "cm15",
        direction: "inbound",
        message: "הפוליסה שלי פגה? לא ידעתי",
        timestamp: "2026-05-04T08:00:00Z",
      },
    ],
  },
  {
    id: "conv4",
    customerName: "דוד ישראלי",
    customerPhone: "054-5551234",
    customerId: "c3",
    status: "closed",
    tags: ["claim"],
    priority: "low",
    lastMessage: "תודה רבה על הטיפול!",
    lastMessageTime: "2026-04-02T10:00:00Z",
    unreadCount: 0,
    linkedClaimId: "cl3",
    linkedClaimNumber: "CLM-2026-003",
    linkedPolicyId: "pol5",
    linkedPolicyNumber: "POL-PROP-11111",
    createdAt: "2026-02-16T09:00:00Z",
    messages: [
      {
        id: "cm16",
        direction: "inbound",
        message: "שלום, היה לי פיצוץ צנרת בדירה",
        timestamp: "2026-02-16T09:00:00Z",
      },
      {
        id: "cm17",
        direction: "outbound",
        message: "שלום דוד! מצטער לשמוע. בוא נפתח תביעת ביטוח רכוש. מתי קרה הפיצוץ?",
        timestamp: "2026-02-16T09:01:00Z",
      },
      {
        id: "cm18",
        direction: "inbound",
        message: "ב-15 לפברואר, חזרתי הביתה ומצאתי הכל מוצף",
        timestamp: "2026-02-16T09:05:00Z",
      },
      {
        id: "cm19",
        direction: "outbound",
        message: "הבנתי. אוכל לעדכן אותך שהתביעה אושרה! 🙌\nסכום מאושר: ₪38,000.\nהכסף יועבר אליך בקרוב.",
        timestamp: "2026-04-01T11:00:00Z",
      },
      {
        id: "cm20",
        direction: "inbound",
        message: "תודה רבה על הטיפול!",
        timestamp: "2026-04-02T10:00:00Z",
      },
    ],
  },
  {
    id: "conv5",
    customerName: "שרה לוי",
    customerPhone: "052-9876543",
    customerId: "c2",
    status: "open",
    tags: ["claim"],
    priority: "high",
    lastMessage: "הרכב שלי נגנב! מה עושים?",
    lastMessageTime: "2026-05-04T10:30:00Z",
    unreadCount: 3,
    linkedClaimId: "cl6",
    linkedClaimNumber: "CLM-2026-006",
    linkedPolicyId: "pol4",
    linkedPolicyNumber: "POL-CAR-44444",
    createdAt: "2026-04-19T11:00:00Z",
    messages: [
      {
        id: "cm21",
        direction: "inbound",
        message: "הרכב שלי נגנב מהחניון!",
        timestamp: "2026-04-19T11:00:00Z",
      },
      {
        id: "cm22",
        direction: "outbound",
        message: "שלום שרה! זה ממש לא נעים 😔\nדבר ראשון — הגשת תלונה במשטרה?",
        timestamp: "2026-04-19T11:01:00Z",
      },
      {
        id: "cm23",
        direction: "inbound",
        message: "כן, הגשתי",
        timestamp: "2026-04-19T11:05:00Z",
      },
      {
        id: "cm24",
        direction: "outbound",
        message: "מעולה. אני צריך ממך:\n📄 העתק של תלונה במשטרה\n📄 רישיון רכב\n📄 מפתח רכב שני (אם יש)\n\nתוכלי לשלוח?",
        timestamp: "2026-04-19T11:06:00Z",
      },
      {
        id: "cm25",
        direction: "inbound",
        message: "הרכב שלי נגנב! מה עושים?",
        timestamp: "2026-05-04T10:30:00Z",
      },
    ],
  },
  {
    id: "conv6",
    customerName: "יוסי כהן",
    customerPhone: "050-1234567",
    customerId: "c1",
    status: "open",
    tags: ["sales"],
    priority: "medium",
    lastMessage: "מעניין אותי ביטוח דירה, יש לכם?",
    lastMessageTime: "2026-05-03T16:00:00Z",
    unreadCount: 1,
    createdAt: "2026-05-03T16:00:00Z",
    messages: [
      {
        id: "cm26",
        direction: "inbound",
        message: "מעניין אותי ביטוח דירה, יש לכם?",
        timestamp: "2026-05-03T16:00:00Z",
      },
    ],
  },
];

// --- Getters ---

export function getConversations(filters?: {
  status?: ConversationStatus;
  tag?: ConversationTag;
}): Conversation[] {
  let result = [...mockConversations];

  if (filters?.status) {
    result = result.filter((c) => c.status === filters.status);
  }
  if (filters?.tag) {
    result = result.filter((c) => c.tags.includes(filters.tag!));
  }

  // Sort: open first, then by last message time (newest first)
  const statusOrder: Record<ConversationStatus, number> = {
    open: 0,
    in_progress: 1,
    closed: 2,
  };
  result.sort((a, b) => {
    const statusDiff = statusOrder[a.status] - statusOrder[b.status];
    if (statusDiff !== 0) return statusDiff;
    return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
  });

  return result;
}

export function getConversationById(id: string): Conversation | undefined {
  return mockConversations.find((c) => c.id === id);
}

export function getConversationStats(): {
  total: number;
  open: number;
  inProgress: number;
  closed: number;
  unread: number;
} {
  return {
    total: mockConversations.length,
    open: mockConversations.filter((c) => c.status === "open").length,
    inProgress: mockConversations.filter((c) => c.status === "in_progress").length,
    closed: mockConversations.filter((c) => c.status === "closed").length,
    unread: mockConversations.reduce((sum, c) => sum + c.unreadCount, 0),
  };
}
