"use client";

import { StatusBadge, type BadgeStatus } from "@/components/ui/StatusBadge";

type Props = {
  status: "Valid" | "ExpiringSoon" | "Expired";
  daysRemaining?: number;
};

export function ComplianceStatusBadge({ status, daysRemaining }: Props) {
  if (status === "Valid") {
    return <StatusBadge status={"Valid" as BadgeStatus} label="VALID" />;
  }
  if (status === "Expired") {
    return <StatusBadge status={"Expired" as BadgeStatus} label="EXPIRED" />;
  }
  const label =
    daysRemaining !== undefined ? `EXPIRES IN ${daysRemaining} DAYS` : "EXPIRING SOON";
  return <StatusBadge status={"ExpiringSoon" as BadgeStatus} label={label} />;
}
