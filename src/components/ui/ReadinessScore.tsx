"use client";

function getScoreColor(score: number): { ring: string; text: string; bg: string } {
  if (score >= 80) return { ring: "text-green-500", text: "text-green-700", bg: "bg-green-50" };
  if (score >= 50) return { ring: "text-amber-500", text: "text-amber-700", bg: "bg-amber-50" };
  return { ring: "text-red-500", text: "text-red-700", bg: "bg-red-50" };
}

function getScoreLabel(score: number): string {
  if (score >= 80) return "מוכן לטיפול";
  if (score >= 50) return "חסרים פרטים";
  return "בתחילת תהליך";
}

export function ReadinessRing({ score, size = 48 }: { score: number; size?: number }) {
  const { ring, text } = getScoreColor(score);
  const radius = (size - 6) / 2;
  const circumference = 2 * Math.PI * radius;
  const filled = (score / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={3}
          className="text-gray-200"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={3}
          strokeDasharray={circumference}
          strokeDashoffset={circumference - filled}
          strokeLinecap="round"
          className={ring}
        />
      </svg>
      <span className={`absolute text-xs font-bold ${text}`}>{score}%</span>
    </div>
  );
}

export function ReadinessBadge({ score }: { score: number }) {
  const { text, bg } = getScoreColor(score);
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${bg} ${text}`}>
      <span className="font-bold">{score}%</span>
      {getScoreLabel(score)}
    </span>
  );
}

export default function ReadinessScore({ score, showLabel = true }: { score: number; showLabel?: boolean }) {
  const { text } = getScoreColor(score);

  return (
    <div className="flex items-center gap-3">
      <ReadinessRing score={score} />
      {showLabel && (
        <div>
          <p className={`text-sm font-semibold ${text}`}>{getScoreLabel(score)}</p>
          <p className="text-xs text-gray-400">ציון מוכנות</p>
        </div>
      )}
    </div>
  );
}
