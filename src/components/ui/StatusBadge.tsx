"use client";

import { ClaimStatus, CLAIM_STATUS_LABELS, CLAIM_STATUS_COLORS } from "@/types";

export default function StatusBadge({ status }: { status: ClaimStatus }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${CLAIM_STATUS_COLORS[status]}`}
    >
      {CLAIM_STATUS_LABELS[status]}
    </span>
  );
}
