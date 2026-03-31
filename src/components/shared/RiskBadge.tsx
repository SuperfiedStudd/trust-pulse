import { type RiskLevel, getRiskColor } from "@/data/mockData";
import { cn } from "@/lib/utils";

interface RiskBadgeProps {
  level: RiskLevel;
  className?: string;
}

export function RiskBadge({ level, className }: RiskBadgeProps) {
  return (
    <span className={cn(
      "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize",
      getRiskColor(level),
      className
    )}>
      {level}
    </span>
  );
}
