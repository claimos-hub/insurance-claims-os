# Insurance Claims OS (ClaimPilot) - יומן פרויקט

## סקירה כללית
מערכת SaaS חכמה לניהול תביעות ביטוח - מחברת בין לקוחות, סוכני ביטוח ומפקחי חברות ביטוח.

## סטאק טכנולוגי
- **Frontend:** Next.js 16 (App Router) + TypeScript
- **DB + Auth:** Supabase
- **WhatsApp:** WATI (טרם הוטמע)
- **AI:** Claude API (טרם הוטמע)
- **Styling:** Tailwind CSS
- **Icons:** Lucide React

## משתמשי המערכת
1. **לקוח** - מגיש תביעות, עוקב אחרי סטטוס
2. **סוכן ביטוח** - מנהל תביעות, מתווך בין לקוח לחברת ביטוח
3. **מפקח חברת ביטוח** - מאשר/דוחה תביעות, מבקש מסמכים

## זרימת תביעה
```
לקוח מגיש (WhatsApp/Web) → סוכן בודק ומעביר → מפקח מאשר/דוחה → לקוח מקבל עדכון
```

## סטטוסי תביעה
- חדשה (new)
- ממתין למסמכי לקוח (waiting_customer_docs)
- ממתין לחברת ביטוח (waiting_insurance)
- בבדיקה (in_review)
- אושרה (approved)
- נדחתה (rejected)
- סגורה (closed)

## סוגי ביטוח
רכב | בריאות | חיים | רכוש | נסיעות | אחר

---

## היסטוריית עבודה

### 2026-04-29 - אתחול פרויקט ובניית MVP

**שלב 1 - הקמת פרויקט:**
- אתחול Next.js 16 עם TypeScript, Tailwind CSS
- התקנת dependencies: @supabase/supabase-js, @supabase/ssr, lucide-react, date-fns

**שלב 2 - מבנה טיפוסים ונתונים:**
- הגדרת TypeScript types עבור: Claim, Customer, ClaimDocument, MissingDocument, ClaimNote, ActivityEvent
- הגדרת labels בעברית לסטטוסים וסוגי ביטוח
- יצירת mock data מלא עם 4 לקוחות ו-6 תביעות לדוגמה
- הגדרת Supabase client ו-SQL schema מלא (docs/supabase-schema.sql)

**שלב 3 - בניית דפי האפליקציה:**
- **דף התחברות** (`/login`) - עיצוב מודרני עם gradient, mock login
- **דשבורד** (`/dashboard`) - 6 כרטיסי סטטיסטיקה, תביעות אחרונות, תביעות דחופות
- **רשימת תביעות** (`/claims`) - טבלה עם חיפוש, פילטר סטטוס וסוג
- **תביעה חדשה** (`/claims/new`) - טופס מלא עם כל השדות הנדרשים
- **פרטי תביעה** (`/claims/[id]`) - 4 טאבים: פרטים, מסמכים, הערות, ציר זמן
  - מעקב סטטוס ויזואלי (progress bar)
  - מסמכים חסרים (checklist)
  - הערות פנימיות
  - ציר זמן פעילות
- **רשימת לקוחות** (`/customers`) - כרטיסי לקוח עם חיפוש
- **פרטי לקוח** (`/customers/[id]`) - כרטיס לקוח + רשימת תביעות

**שלב 4 - עיצוב ו-UX:**
- RTL מלא (Hebrew)
- Sidebar ניווט קבוע בצד ימין
- עיצוב נקי וימודרני B2B SaaS
- Responsive layout

**מבנה קבצים:**
```
src/
├── app/
│   ├── layout.tsx          # Root layout (RTL, Hebrew)
│   ├── page.tsx            # Redirect to /login
│   ├── globals.css         # Global styles
│   ├── login/page.tsx      # Login page
│   ├── dashboard/
│   │   ├── layout.tsx      # Dashboard layout with sidebar
│   │   └── page.tsx        # Dashboard page
│   ├── claims/
│   │   ├── layout.tsx      # Claims layout with sidebar
│   │   ├── page.tsx        # Claims list
│   │   ├── new/page.tsx    # New claim form
│   │   └── [id]/page.tsx   # Claim detail
│   └── customers/
│       ├── layout.tsx      # Customers layout with sidebar
│       ├── page.tsx        # Customers list
│       └── [id]/page.tsx   # Customer detail
├── components/
│   ├── Sidebar.tsx         # Navigation sidebar
│   └── ui/
│       ├── StatusBadge.tsx  # Claim status badge
│       └── ClaimTypeBadge.tsx # Claim type badge with icon
├── lib/
│   ├── supabase.ts         # Supabase client
│   └── mock-data.ts        # Mock data for MVP
└── types/
    └── index.ts            # All TypeScript types and constants
```

**סטטוס:** MVP עם mock data עובד ומוכן. הבילד עובר בהצלחה.

---

### 2026-04-29 - Pivot לסוכן תביעות אוטונומי

**שלב 5 - מודל Intake חכם:**
- הוספת טיפוסים חדשים: `CarAccidentIntakeData`, `IntakeMessage`, `IntakeStep`, `IntakeClaim`
- מנוע שיחה step-by-step עם לוגיקת flow דינמית (דילוג על שלבים לא רלוונטיים)
- חישוב ציון מוכנות (readiness score) בזמן אמת
- גנרטור סיכום AI ו-הודעה למפקח חברת ביטוח (mock)
- נתוני דמו: שיחת intake מלאה עם 41 הודעות

**שלב 6 - דף קליטת תביעות (`/intake`):**
- רשימת שיחות קליטה עם סטטוס, ציון מוכנות, ופריטים חסרים
- דף שיחה חדשה (`/intake/new`) - סימולטור WhatsApp מלא:
  - ממשק WhatsApp-style (עיצוב ירוק, רקע pattern, בועות הודעה)
  - שיחת בוט אינטראקטיבית עם אנימציית "מקליד..."
  - כפתורי בחירה (כן/לא) לשאלות סגורות
  - העלאת קבצים מדומה (תמונות נזק, רישיונות, דוח משטרה)
  - פאנל צד עם ציון מוכנות עגול, פרטים שנאספו, ופרטים חסרים
- דף פרטי תביעת intake (`/intake/[id]`) - 4 טאבים:
  - **פרטים ומסמכים:** תשובות הלקוח + צ'קליסט מסמכים
  - **שיחת WhatsApp:** היסטוריית השיחה המלאה
  - **סיכום AI:** סיכום אוטומטי של התביעה
  - **הודעה למפקח:** הודעה מוכנה לשליחה לחברת הביטוח

**שלב 7 - זרימת אישור סוכן:**
- באנר פעולות לפי סטטוס (ready_for_review → approved → sent_to_inspector)
- כפתור "אשר ושלח למפקח" עם מודאל אישור
- כפתור "בקש מידע חסר מהלקוח"
- כפתור "שלח למפקח" עם שינוי סטטוס
- העתקת הודעת מפקח ללוח

**קבצים חדשים:**
```
src/
├── types/index.ts              # הורחב עם טיפוסי intake
├── lib/intake-data.ts          # מנוע intake: שאלות, flow, readiness, AI generators
└── app/intake/
    ├── layout.tsx              # Layout עם sidebar
    ├── page.tsx                # רשימת שיחות קליטה
    ├── new/page.tsx            # סימולטור שיחת WhatsApp
    └── [id]/page.tsx           # פרטי תביעת intake עם AI ואישור
```

**סטטוס:** Pivot לסוכן אוטונומי הושלם. Demo מלא עם סימולציית WhatsApp עובד. הבילד עובר.

---

### 2026-04-29 - שדרוג: 3 פיצ'רים עסקיים מרכזיים

**שלב 8 - סיכום תביעה אוטומטי (AI Summary Card):**
- כרטיס בולט "סיכום תביעה אוטומטי" בדפי פרטי תביעה (`/claims/[id]` ו-`/intake/[id]`)
- עיצוב gradient סגול-כחול עם אייקון Sparkles
- מציג: פרטי לקוח, סוג תביעה, תאריך אירוע, תיאור, פציעות, צד שלישי, מסמכים שהתקבלו/חסרים, סטטוס
- Mock AI — מבוסס על נתוני התביעה בפועל
- פונקציות חדשות: `generateClaimAISummary()` לתביעות רגילות

**שלב 9 - הודעה למפקח (Inspector Message Generator):**
- כפתור "צור הודעה למפקח" בבאנר הפעולה הבאה
- מודאל עם textarea ניתן לעריכה — מכתב רשמי בעברית למפקח חברת הביטוח
- כולל: שם לקוח, מספר תביעה, פוליסה, תאריך אירוע, תיאור, מסמכים מצורפים/חסרים
- כפתור "העתק הודעה" (clipboard) + "סמן כנשלח למפקח" (שינוי סטטוס)
- פונקציה חדשה: `generateClaimInspectorMessage()`

**שלב 10 - מערכת פעולה הבאה (Next Action System):**
- באנר צבעוני בראש דפי פרטי תביעה (claims + intake)
- לוגיקת המלצה לפי סטטוס:
  - **אדום** (דורש טיפול): מסמכים חסרים, תביעה חדשה, תביעה נדחתה
  - **צהוב** (ממתין): ממתין לתגובת חברת ביטוח
  - **ירוק** (מוכן/הושלם): תביעה אושרה, נשלחה למפקח
- תיאור מפורט + badge צבעוני
- פונקציות חדשות: `getClaimNextAction()`, `getIntakeNextAction()`
- טיפוס חדש: `NextAction` עם severity ו-description

**קבצים שהשתנו:**
```
src/lib/mock-data.ts          # נוספו: generateClaimAISummary, generateClaimInspectorMessage,
                               # getClaimNextAction, getIntakeNextAction, NextAction type
src/app/claims/[id]/page.tsx   # נוסף: AI Summary Card, Inspector Message Modal, Next Action Banner
src/app/intake/[id]/page.tsx   # נוסף: AI Summary Card, Next Action Banner על טאב פרטים
```

**GitHub:** https://github.com/claimos-hub/insurance-claims-os

**סטטוס:** 3 פיצ'רים עסקיים מרכזיים הושלמו. הבילד עובר. הפרויקט עלה ל-GitHub.

**הבא בתור:**
- חיבור Supabase אמיתי (auth + DB)
- אינטגרציית WhatsApp אמיתית עם WATI
- Claude API לסיכומים והודעות חכמות (במקום mock)
- העלאת מסמכים אמיתית ל-Storage
- שליחת הודעת מפקח אמיתית (email/WhatsApp)

---

### 2026-04-29 - שכבת אוטומציה: מנוע קליטת תביעות

**שלב 11 - Conversation Engine (State Machine):**
- מנוע שיחה step-by-step עם session management
- שלבים: START → ASK_EVENT_DATE → ASK_LOCATION → ASK_DESCRIPTION → ASK_VEHICLE → ASK_POLICY → ASK_INJURIES → ASK_DOCUMENTS → DONE
- לוגיקת flow דינמית (דילוג על שלבי פציעות / צד שלישי לפי תשובות)
- In-memory session store (מוכן להחלפה ל-Supabase)
- חישוב מסמכים חסרים אוטומטי
- יצירת תביעה בסטטוס "מוכן לבדיקה" בסיום

**שלב 12 - API Route `/api/automation/webhook`:**
- POST endpoint: מקבל `{ phone, message }` ומחזיר תשובת בוט
- תמיכה ב-actions: `init` (יצירת/טעינת session), `reset` (שיחה חדשה)
- GET endpoint: קבלת session לפי phone
- מחזיר: `{ reply, session, claim_created }`

**שלב 13 - סימולטור WhatsApp (`/automation`):**
- מסך כניסה עם הזנת מספר טלפון
- ממשק WhatsApp-style מלא (RTL, רקע pattern, בועות הודעה)
- אנימציית "מקליד..." עם דיליי ריאליסטי
- באנר ירוק כשתביעה נוצרת
- כפתור reset לשיחה חדשה
- Debug Panel בצד:
  - פרטי session (ID, phone, step)
  - מד שלבים עם אייקונים (הושלם/פעיל/ממתין)
  - נתונים שנאספו בזמן אמת
  - מסמכים חסרים

**קבצים חדשים:**
```
src/
├── lib/automation-engine.ts              # State machine + session store
├── app/api/automation/webhook/route.ts   # Webhook API
└── app/automation/
    ├── layout.tsx                        # Layout with sidebar
    └── page.tsx                          # WhatsApp simulator + debug panel
```

**קבצים שהשתנו:**
```
src/components/Sidebar.tsx   # נוסף: קישור "סוכן אוטומטי" עם אייקון Zap
```

**סטטוס:** מנוע אוטומציה מלא עם סימולטור עובד. הבילד עובר.

---

### 2026-04-29 - עיצוב מחדש: One-Click Claim Handling System

**שלב 14 - Control Card (Hero):**
- כרטיס בולט בראש הדף עם gradient לפי severity (אדום/צהוב/ירוק)
- סיכום AI בשורה אחת (למשל: "ביטוח רכב · 10.4.2026 · תאונת דרכים בצומת עזריאלי · ₪25,000 · 1 מסמכים חסרים")
- Next Action בולט עם אייקון ותיאור
- כפתור "המשך טיפול" ראשי — פעולה אחת, קליק אחד
- Chips מידע: לקוח, חברת ביטוח, תאריך, סכום, מסמכים חסרים

**שלב 15 - One-Click Actions:**
- הכפתור מפעיל פעולה נכונה אוטומטית לפי סטטוס:
  - מסמכים חסרים → מייצר הודעת בקשה ללקוח
  - מוכן → מייצר הודעה למפקח חברת ביטוח
  - ממתין → מייצר הודעת מעקב
  - אושר/נדחה → מייצר עדכון ללקוח
- מודאל עם textarea ניתן לעריכה + העתקה + "סמן כבוצע"

**שלב 16 - De-emphasis:**
- הוסר progress bar מלמעלה (לא רלוונטי לזרימה חדשה)
- הוסר סיכום AI ארוך — הוחלף בשורה אחת
- סיכום מלא נשאר כ-collapsible
- Header מינימלי: מספר תביעה + badges בלבד
- select סטטוס הוסר מ-header

**פונקציות חדשות ב-mock-data.ts:**
- `generateOneLineSummary()` — סיכום שורה אחת
- `generateMissingDocsRequest()` — הודעת בקשת מסמכים ללקוח
- `generateFollowUpMessage()` — הודעת מעקב לחברת ביטוח

**סטטוס:** Claim Detail Page redesigned. הבילד עובר.

---

### 2026-04-29 - אינטגרציית Twilio WhatsApp

**שלב 17 - Webhook לטוויליו (`/api/webhook`):**
- Endpoint חדש לקבלת הודעות WhatsApp מ-Twilio (POST form-encoded)
- המרת פורמט טלפון: `whatsapp:+972...` → `05...` ובחזרה
- עיבוד הודעה דרך מנוע השיחה (automation-engine)
- שליחת תשובת בוט דרך Twilio SDK
- הפרדה: `/api/webhook` (Twilio) vs `/api/automation/webhook` (סימולטור)

**קבצים:**
```
src/app/api/webhook/route.ts    # Twilio WhatsApp webhook
package.json                    # נוסף: twilio dependency
```

**סטטוס:** Twilio webhook עובד, בוט מגיב ב-WhatsApp. הבילד עובר.

---

### 2026-04-30 - Supabase Persistence Layer

**שלב 18 - סכמת DB:**
- 5 טבלאות: `customers`, `intake_sessions`, `intake_messages`, `claims`, `claim_documents`
- Triggers ל-updated_at, RLS עם service role full access
- JSONB לנתונים דינמיים (collected_data, third_party_details, missing_documents)
- Migration SQL ב-`docs/supabase-v2-schema.sql`

**שלב 19 - שכבת Persistence (`db.ts`):**
- `supabaseAdmin` — server client עם service role key
- Customer: `findOrCreateCustomer(phone)` — upsert by phone
- Sessions: `findActiveSession()`, `createIntakeSession()`, `updateIntakeSession()`
- Messages: `saveIntakeMessage()` — direction: `inbound`/`outbound`
- Claims: `createClaim()` — כולל readiness score, AI summary, inspector message
- Read: `getAllClaims()`, `getClaimByIdFromDb()`, `getAllIntakeSessions()`, `getDashboardStatsFromDb()`

**שלב 20 - API Routes:**
- `GET /api/claims` — כל התביעות עם customer join
- `GET /api/claims/[id]` — תביעה + customer + session + messages
- `GET /api/dashboard` — סטטיסטיקות + claims
- `GET /api/intake-sessions` — כל שיחות הקליטה עם ספירת הודעות

**שלב 21 - עדכון UI לנתוני DB:**
- Dashboard: טוען מ-API, fallback ל-mock
- Claims list: טוען מ-API, fallback ל-mock
- Claim detail: dual-mode (DB / mock) — tabs שונים לפי מקור
- דף שיחות קליטה חדש (`/intake-sessions`)

**שלב 22 - תיקון Webhook Persistence:**
- תיקון direction: `inbound`/`outbound` (היה `user`/`bot` — כשל בלי שגיאה)
- Inline של כל קריאות Supabase ב-webhook עם 15 console.log statements
- תיקון שגיאת הקלדה ב-URL של Supabase ב-Vercel (`mum` → `mmu`)
- כל שלב מתועד עם prefix `[webhook]`

**Environment Variables (Vercel):**
| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (server-side) |
| `TWILIO_SID` | Twilio Account SID |
| `TWILIO_AUTH_TOKEN` | Twilio Auth Token |
| `TWILIO_WHATSAPP_FROM` | Twilio WhatsApp sender |

**סטטוס:** Persistence מלא עובד. הודעות WhatsApp נשמרות ב-Supabase. הבילד עובר.

---

### 2026-04-30 - Production UX Upgrade

**שלב 23 - ReadinessScore Component:**
- קומפוננטת SVG progress ring עם קידוד צבעים:
  - ירוק (≥80%) — "מוכן לטיפול"
  - כתום (≥50%) — "חסרים פרטים"
  - אדום (<50%) — "בתחילת תהליך"
- 3 וריאנטים: `ReadinessRing` (טבעת), `ReadinessBadge` (badge), `ReadinessScore` (טבעת + label)

**שלב 24 - דף שיחה מלא (`/claims/[id]/conversation`):**
- עמוד ייעודי לצפייה בשיחת WhatsApp של תביעה
- Header עם WhatsApp-style bar ירוק, פרטי לקוח, readiness badge
- בועות הודעה: לבן = inbound (לקוח), ירוק = outbound (ClaimPilot)
- רקע WhatsApp (#e5ddd5)
- סיכום נתונים שנאספו — grid עם תרגום שדות לעברית

**שלב 25 - שדרוג Messages Tab:**
- רקע WhatsApp-style בטאב הודעות בפרטי תביעה
- בועות הודעה מעוצבות עם labels (לקוח/ClaimPilot)
- כפתור "צפה בשיחה המלאה" מקשר לדף השיחה

**שלב 26 - Claims List + Intake Sessions:**
- עמודת readiness ring חזותית ברשימת תביעות
- עמודת קישור לשיחה (אייקון ירוק) ברשימת תביעות
- עמודת "צפייה" בשיחה בדף שיחות קליטה

**קבצים חדשים:**
```
src/components/ui/ReadinessScore.tsx              # קומפוננטת ציון מוכנות
src/app/claims/[id]/conversation/page.tsx         # דף שיחה מלא
```

**קבצים שהשתנו:**
```
src/app/claims/[id]/page.tsx       # ReadinessScore בפרטים, WhatsApp-style messages, קישור לשיחה
src/app/claims/page.tsx            # עמודות readiness ring + conversation link
src/app/intake-sessions/page.tsx   # עמודת "צפייה" בשיחה
```

**סטטוס:** UX production-ready. הבילד עובר.

---

## Next Steps

- [ ] Claude API לסיכומים חכמים (במקום template)
- [ ] העלאת קבצים ל-Supabase Storage (תמונות, מסמכים)
- [ ] שליחת הודעה אמיתית למפקח (email/WhatsApp)
- [ ] חילוץ שם לקוח מפרופיל WhatsApp
- [ ] תמיכה במספר תביעות ללקוח
- [ ] אימות סוכן (דף login אמיתי)
