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

**הבא בתור:**
- חיבור Supabase אמיתי (auth + DB)
- אינטגרציית WhatsApp אמיתית עם WATI
- Claude API לסיכומים והודעות חכמות (במקום mock)
- העלאת מסמכים אמיתית ל-Storage
- שליחת הודעת מפקח אמיתית (email/WhatsApp)
