import type { LucideIcon } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import Link from "next/link";

export function MetricCard({
  label,
  value,
  trend,
  icon: Icon,
  tone = "primary",
  href
}: {
  label: string;
  value: string;
  trend: string;
  icon: LucideIcon;
  tone?: "primary" | "success" | "warning" | "danger" | "info";
  href?: string;
}) {
  const cardContent = (
    <Card className={`p-4 transition-all duration-200 ${href ? 'cursor-pointer hover:border-[var(--primary)] hover:shadow-md hover:scale-[1.02] active:scale-[0.98]' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-medium text-[var(--muted)]">{label}</div>
          <div className="mt-3 text-3xl font-bold">{value}</div>
        </div>
        <div className="grid h-10 w-10 place-items-center rounded-[8px] bg-[var(--primary-soft)] text-[var(--primary)]">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <Badge tone={tone} className="mt-4">
        {trend}
      </Badge>
    </Card>
  );

  if (href) {
    return (
      <Link href={href} className="block no-underline select-none">
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}

