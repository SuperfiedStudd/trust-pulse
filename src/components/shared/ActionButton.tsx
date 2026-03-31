import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { type LucideIcon } from "lucide-react";

interface ActionButtonProps {
  label: string;
  icon?: LucideIcon;
  variant?: 'allow' | 'review' | 'block' | 'verify' | 'restrict';
  onClick?: () => void;
  className?: string;
  size?: 'sm' | 'default';
  disabled?: boolean;
}

const variantStyles: Record<string, string> = {
  allow: 'bg-[hsl(var(--risk-low))] text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--risk-low)/0.9)]',
  review: 'bg-[hsl(var(--chart-1))] text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--chart-1)/0.9)]',
  block: 'bg-[hsl(var(--risk-high))] text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--risk-high)/0.9)]',
  verify: 'bg-[hsl(var(--risk-medium))] text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--risk-medium)/0.9)]',
  restrict: 'bg-[hsl(var(--chart-2))] text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--chart-2)/0.9)]',
};

export function ActionButton({ label, icon: Icon, variant = 'review', onClick, className, size = 'sm', disabled }: ActionButtonProps) {
  return (
    <Button
      size={size}
      onClick={onClick}
      disabled={disabled}
      className={cn("gap-1.5 text-xs font-medium", variantStyles[variant], className)}
    >
      {Icon && <Icon className="h-3.5 w-3.5" />}
      {label}
    </Button>
  );
}
