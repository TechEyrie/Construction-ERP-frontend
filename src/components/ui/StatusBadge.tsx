export type BadgeStatus =
  | "Draft"
  | "Submitted"
  | "UnderReview"
  | "Approved"
  | "Certified"
  | "FinanceProcessing"
  | "PartiallyPaid"
  | "Paid"
  | "Returned"
  | "Rejected"
  | "Valid"
  | "ExpiringSoon"
  | "Expired"
  | "Issued"
  | "Closed"
  | "Evaluated"
  | "Awarded"
  | "Cancelled";

export interface StatusBadgeProps {
  status: BadgeStatus;
  label?: string;
  size?: "sm" | "md";
}

type Tone = "draft" | "pending" | "approved" | "success" | "warning" | "danger";

const TONE: Record<BadgeStatus, Tone> = {
  Draft: "draft",
  Submitted: "pending",
  UnderReview: "pending",
  Approved: "approved",
  Certified: "success",
  FinanceProcessing: "pending",
  PartiallyPaid: "warning",
  Paid: "success",
  Returned: "warning",
  Rejected: "danger",
  Valid: "success",
  ExpiringSoon: "warning",
  Expired: "danger",
  Issued: "pending",
  Closed: "draft",
  Evaluated: "approved",
  Awarded: "success",
  Cancelled: "danger"
};

const DEFAULT_LABEL: Record<BadgeStatus, string> = {
  Draft: "Draft",
  Submitted: "Submitted",
  UnderReview: "Under Review",
  Approved: "Approved",
  Certified: "Certified",
  FinanceProcessing: "Finance Processing",
  PartiallyPaid: "Partially Paid",
  Paid: "Paid",
  Returned: "Returned",
  Rejected: "Rejected",
  Valid: "Valid",
  ExpiringSoon: "Expiring Soon",
  Expired: "Expired",
  Issued: "Issued",
  Closed: "Closed",
  Evaluated: "Evaluated",
  Awarded: "Awarded",
  Cancelled: "Cancelled"
};

export function StatusBadge({ status, label, size = "sm" }: StatusBadgeProps) {
  const tone = TONE[status];
  const sizeClass = size === "md" ? "opc-badge--md" : "";
  return (
    <span className={`opc-badge opc-badge--${tone} ${sizeClass}`.trim()}>{label ?? DEFAULT_LABEL[status]}</span>
  );
}
