"use client";

import { ClaimType, CLAIM_TYPE_LABELS } from "@/types";
import { Car, Heart, Shield, Home, Plane, HelpCircle } from "lucide-react";

const TYPE_ICONS: Record<ClaimType, React.ElementType> = {
  car: Car,
  health: Heart,
  life: Shield,
  property: Home,
  travel: Plane,
  other: HelpCircle,
};

export default function ClaimTypeBadge({ type }: { type: ClaimType }) {
  const Icon = TYPE_ICONS[type];
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-gray-600">
      <Icon className="w-4 h-4" />
      {CLAIM_TYPE_LABELS[type]}
    </span>
  );
}
