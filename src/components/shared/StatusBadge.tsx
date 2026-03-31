import { type ReviewStatus } from "@/data/mockData";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: ReviewStatus;
  className?: string;
}

const statusStyles: Record<ReviewStatus, string> = {
  pending: 'status-badge-pending',
  reviewing: 'status-badge-reviewing',
  blocked: 'status-badge-blocked',
  approved: 'status-badge-approved',
  escalated: 'status-badge-pending',
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span className={cn(
      "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize",
      statusStyles[status],
      className
    )}>
      {status}
    </span>
  );
}
