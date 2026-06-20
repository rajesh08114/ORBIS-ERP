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
    <Card className={`p-3 transition-all duration-200 ${href ? 'cursor-pointer hover:border-[var(--primary)] hover:shadow-md hover:scale-[1.02] active:scale-[0.98]' : ''}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-xs font-semibold text-[var(--muted)] tracking-wide uppercase">{label}</div>
          <div className="mt-2 text-2xl font-extrabold tracking-tight">{value}</div>
        </div>
        <div className="grid h-8 w-8 place-items-center rounded-md bg-[var(--primary-soft)] text-[var(--primary)] shrink-0 shadow-inner">
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <Badge tone={tone} className="mt-3 text-[9px] font-bold px-1.5 py-0.5">
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

