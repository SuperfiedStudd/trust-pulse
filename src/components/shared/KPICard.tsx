import { cn } from "@/lib/utils";
import { type LucideIcon } from "lucide-react";

interface KPICardProps {
  label: string;
  value: string;
  icon?: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  className?: string;
  iconColor?: string;
}

export function KPICard({ label, value, icon: Icon, trend, trendUp, className, iconColor }: KPICardProps) {
  return (
    <div className={cn("card-surface p-4", className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="kpi-label">{label}</p>
          <p className="kpi-value mt-1">{value}</p>
          {trend && (
            <p className={cn(
              "text-xs mt-1 font-medium",
              trendUp ? "text-risk-high" : "text-risk-low"
            )}>
              {trend}
            </p>
          )}
        </div>
        {Icon && (
          <div className={cn("p-2 rounded-md", iconColor || "bg-muted")}>
            <Icon className="h-4 w-4 text-muted-foreground" />
          </div>
        )}
      </div>
    </div>
  );
}
