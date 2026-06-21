"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Icon as LucideIcon } from "react-bootstrap-icons";

// ── Zone 1: Executive KPI Strip ─────────────────────────────────────────────
interface KpiCardProps {
  label: string;
  value: string;
  trend?: string;
  trendUp?: boolean;
  subtext?: string;
  icon: LucideIcon;
  href?: string;
  tone?: "primary" | "success" | "warning" | "danger" | "info" | "neutral";
  statusDot?: "green" | "amber" | "red";
}

export function KpiCard({ label, value, trend, trendUp, subtext, icon: Icon, href, tone = "primary", statusDot }: KpiCardProps) {
  const toneMap = {
    primary: "text-[var(--primary-strong)] bg-[var(--primary-soft)]",
    success: "text-[var(--success)] bg-[var(--success-soft)]",
    warning: "text-[var(--warning)] bg-[var(--warning-soft)]",
    danger: "text-[var(--danger)] bg-[var(--danger-soft)]",
    info: "text-[var(--info)] bg-[var(--info-soft)]",
    neutral: "text-[var(--muted)] bg-[var(--surface-muted)]",
  };
  const dotMap = { green: "bg-[var(--success)]", amber: "bg-[var(--warning)]", red: "bg-[var(--danger)]" };

  const inner = (
    <div className={`group relative flex flex-col justify-between rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm transition-all duration-200 min-h-[110px] ${href ? "cursor-pointer hover:border-[var(--primary-strong)] hover:shadow-md hover:-translate-y-0.5" : ""}`}>
      <div className="flex items-start justify-between">
        <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">{label}</div>
        <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-[8px] ${toneMap[tone]}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div>
        <div className="mt-2 text-2xl font-black text-[var(--foreground)] leading-none tracking-tight">{value}</div>
        <div className="flex items-center gap-1.5 mt-2">
          {statusDot && <span className={`inline-block h-1.5 w-1.5 rounded-full ${dotMap[statusDot]}`} />}
          {trend && (
            <span className={`text-[10px] font-bold ${trendUp ? "text-emerald-600" : "text-red-500"}`}>
              {trendUp ? "↑" : "↓"} {trend}
            </span>
          )}
          {subtext && <span className="text-[10px] font-medium text-[var(--muted)] truncate">{subtext}</span>}
        </div>
      </div>
    </div>
  );

  if (href) return <Link href={href} className="block no-underline">{inner}</Link>;
  return inner;
}

// ── Zone 2: Action Center ────────────────────────────────────────────────────
interface ActionItemProps {
  severity: "critical" | "warning" | "info";
  emoji: string;
  count: number;
  label: string;
  href: string;
  cta: string;
}

export function ActionItem({ severity, emoji, count, label, href, cta }: ActionItemProps) {
  const router = useRouter();
  const severityStyles = {
    critical: "border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/20",
    warning: "border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/20",
    info: "border-sky-200 dark:border-sky-900/60 bg-sky-50 dark:bg-sky-950/20",
  };
  const countStyles = {
    critical: "text-red-600 dark:text-red-400",
    warning: "text-amber-600 dark:text-amber-400",
    info: "text-sky-600 dark:text-sky-400",
  };

  return (
    <div className={`flex items-center justify-between rounded-lg border px-3 py-2 ${severityStyles[severity]}`}>
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-base leading-none">{emoji}</span>
        <div className="min-w-0">
          <span className={`text-sm font-extrabold ${countStyles[severity]}`}>{count}</span>
          <span className="ml-1.5 text-xs font-semibold text-[var(--foreground)] truncate">{label}</span>
        </div>
      </div>
      <button
        onClick={() => router.push(href)}
        className="ml-2 shrink-0 rounded-md bg-[var(--surface)] border border-[var(--border)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--foreground)] hover:bg-[var(--primary-soft)] hover:text-[var(--primary)] hover:border-[var(--primary)] transition cursor-pointer"
      >
        {cta}
      </button>
    </div>
  );
}

// ── Zone 3/4/5: Operations Section ──────────────────────────────────────────
interface StatusChipProps {
  label: string;
  count: number;
  total: number;
  href: string;
  tone?: "default" | "success" | "warning" | "danger" | "info";
}

export function StatusChip({ label, count, total, href, tone = "default" }: StatusChipProps) {
  const router = useRouter();
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  const toneStyles = {
    default: "border-[var(--border)] bg-[var(--surface-muted)] hover:border-[var(--primary)] hover:bg-[var(--primary-soft)]",
    success: "border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-950/50",
    warning: "border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100",
    danger: "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 hover:bg-red-100",
    info: "border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/30 hover:bg-sky-100",
  };
  const pctStyles = {
    default: "text-[var(--primary)]",
    success: "text-emerald-600 dark:text-emerald-400",
    warning: "text-amber-600 dark:text-amber-400",
    danger: "text-red-600 dark:text-red-400",
    info: "text-sky-600 dark:text-sky-400",
  };

  return (
    <button
      onClick={() => router.push(href)}
      className={`group flex flex-col items-start gap-0.5 rounded-lg border px-3 py-2 text-left transition-all duration-150 cursor-pointer ${toneStyles[tone]}`}
    >
      <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">{label}</div>
      <div className="text-lg font-extrabold text-[var(--foreground)] leading-none">{count}</div>
      <div className={`text-[10px] font-bold ${pctStyles[tone]}`}>{pct}% of total</div>
    </button>
  );
}

interface OperationsSectionProps {
  title: string;
  icon: LucideIcon;
  allData: Record<string, number> | undefined;
  myData: Record<string, number> | undefined;
  allLabels: Array<{ key: string; label: string; tone?: StatusChipProps["tone"] }>;
  myLabels: Array<{ key: string; label: string; tone?: StatusChipProps["tone"] }>;
  redirectPrefix: string;
  href: string;
}

export function OperationsSection({ title, icon: Icon, allData, myData, allLabels, myLabels, redirectPrefix, href }: OperationsSectionProps) {
  const allTotal = allLabels.reduce((sum, l) => sum + (allData?.[l.key] || 0), 0);
  const myTotal = myLabels.reduce((sum, l) => sum + (myData?.[l.key] || 0), 0);

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-2.5 bg-[var(--surface-muted)]">
        <div className="flex items-center gap-2">
          <div className="grid h-6 w-6 place-items-center rounded-md bg-[var(--primary-soft)] text-[var(--primary)]">
            <Icon className="h-3.5 w-3.5" />
          </div>
          <h3 className="text-sm font-bold text-[var(--foreground)]">{title}</h3>
        </div>
        <Link href={href} className="text-[10px] font-bold uppercase tracking-wider text-[var(--primary)] hover:underline">
          View All →
        </Link>
      </div>
      <div className="p-4 space-y-4">
        <div>
          <div className="mb-2 flex items-center gap-1.5">
            <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--muted)]">All Orders</span>
            <span className="rounded-full bg-[var(--surface-muted)] px-1.5 py-px text-[9px] font-bold text-[var(--muted)]">{allTotal}</span>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap">
            {allLabels.map((l) => (
              <StatusChip key={l.key} label={l.label} count={allData?.[l.key] || 0} total={allTotal} href={`${redirectPrefix}?status=${l.key}`} tone={l.tone} />
            ))}
          </div>
        </div>
        <div className="border-t border-[var(--border)] pt-3">
          <div className="mb-2 flex items-center gap-1.5">
            <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--muted)]">My Orders</span>
            <span className="rounded-full bg-[var(--surface-muted)] px-1.5 py-px text-[9px] font-bold text-[var(--muted)]">{myTotal}</span>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap">
            {myLabels.map((l) => (
              <StatusChip key={l.key} label={l.label} count={myData?.[l.key] || 0} total={myTotal} href={`${redirectPrefix}?status=${l.key}&mine=1`} tone={l.tone} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Zone 6: Inventory Intelligence ──────────────────────────────────────────
interface InventoryHealthBarProps {
  score: number; // 0–100
}

export function InventoryHealthBar({ score }: InventoryHealthBarProps) {
  const color = score >= 80 ? "bg-emerald-500" : score >= 60 ? "bg-amber-400" : "bg-red-500";
  const label = score >= 80 ? "Healthy" : score >= 60 ? "At Risk" : "Critical";
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 rounded-full bg-[var(--surface-muted)] overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs font-bold text-[var(--foreground)] w-16 text-right">{score}% {label}</span>
    </div>
  );
}

// ── Zone 7: Activity Feed ────────────────────────────────────────────────────
interface ActivityEvent {
  id: string;
  user: string;
  action: string;
  entity: string;
  entityId: string;
  timestamp: string;
  status: "success" | "warning" | "error" | "info";
}

export function ActivityFeed({ events }: { events: ActivityEvent[] }) {
  const statusStyles = {
    success: "bg-emerald-500",
    warning: "bg-amber-400",
    error: "bg-red-500",
    info: "bg-sky-500",
  };

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <div className="h-10 w-10 rounded-full bg-[var(--surface-muted)] grid place-items-center mb-2">
          <span className="text-lg">📋</span>
        </div>
        <p className="text-xs font-semibold text-[var(--muted)]">No recent activity</p>
      </div>
    );
  }

  return (
    <div className="space-y-0 divide-y divide-[var(--border)]">
      {events.map((ev) => (
        <div key={ev.id} className="flex items-start gap-3 py-2.5 hover:bg-[var(--surface-muted)] px-1 rounded-lg transition-colors">
          <div className="relative mt-1 shrink-0">
            <div className="h-7 w-7 rounded-full bg-[var(--surface-muted)] grid place-items-center text-[11px] font-bold text-[var(--foreground)] uppercase">
              {ev.user.charAt(0)}
            </div>
            <span className={`absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border-2 border-[var(--surface)] ${statusStyles[ev.status]}`} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-1">
              <span className="text-xs font-bold text-[var(--foreground)]">{ev.user}</span>
              <span className="text-[10px] text-[var(--muted)]">{ev.action}</span>
              <span className="text-[10px] font-semibold text-[var(--primary)] truncate max-w-[120px]">{ev.entity} #{ev.entityId}</span>
            </div>
            <div className="text-[10px] text-[var(--muted)] mt-0.5">{ev.timestamp}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Zone 8: My Work Widget ───────────────────────────────────────────────────
interface MyWorkItemProps {
  label: string;
  count: number;
  href: string;
  icon: LucideIcon;
  urgency?: "normal" | "urgent";
}

export function MyWorkItem({ label, count, href, icon: Icon, urgency = "normal" }: MyWorkItemProps) {
  return (
    <Link href={href} className={`group flex items-center justify-between rounded-lg border px-3 py-2 transition-all ${urgency === "urgent" ? "border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 hover:bg-amber-100" : "border-[var(--border)] bg-[var(--surface-muted)] hover:bg-[var(--surface-raised)] hover:border-[var(--primary)]"}`}>
      <div className="flex items-center gap-2">
        <Icon className={`h-3.5 w-3.5 ${urgency === "urgent" ? "text-amber-600 dark:text-amber-400" : "text-[var(--primary)]"}`} />
        <span className="text-xs font-semibold text-[var(--foreground)]">{label}</span>
      </div>
      <span className={`rounded-full px-2 py-px text-[10px] font-bold ${count > 0 ? (urgency === "urgent" ? "bg-amber-500 text-white" : "bg-[var(--primary-soft)] text-[var(--primary)]") : "bg-[var(--surface-muted)] text-[var(--muted)]"}`}>
        {count}
      </span>
    </Link>
  );
}

// ── Zone 10: Notification Panel ──────────────────────────────────────────────
interface NotificationItemProps {
  severity: "critical" | "warning" | "info" | "success";
  title: string;
  body: string;
  time: string;
}

export function NotificationItem({ severity, title, body, time }: NotificationItemProps) {
  const styles = {
    critical: { dot: "bg-red-500", bg: "hover:bg-red-50 dark:hover:bg-red-950/20", text: "text-red-600 dark:text-red-400" },
    warning: { dot: "bg-amber-400", bg: "hover:bg-amber-50 dark:hover:bg-amber-950/20", text: "text-amber-600 dark:text-amber-400" },
    info: { dot: "bg-sky-500", bg: "hover:bg-sky-50 dark:hover:bg-sky-950/20", text: "text-sky-600 dark:text-sky-400" },
    success: { dot: "bg-emerald-500", bg: "hover:bg-emerald-50 dark:hover:bg-emerald-950/20", text: "text-emerald-600 dark:text-emerald-400" },
  };
  const s = styles[severity];

  return (
    <div className={`flex items-start gap-3 rounded-lg px-2 py-2.5 transition-colors cursor-default ${s.bg}`}>
      <div className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${s.dot}`} />
      <div className="min-w-0 flex-1">
        <div className={`text-xs font-bold ${s.text}`}>{title}</div>
        <div className="text-[10px] text-[var(--muted)] leading-snug">{body}</div>
        <div className="mt-0.5 text-[9px] text-[var(--muted)]">{time}</div>
      </div>
    </div>
  );
}

// ── Panel Wrapper ────────────────────────────────────────────────────────────
interface DashboardPanelProps {
  title: string;
  icon?: LucideIcon;
  href?: string;
  hrefLabel?: string;
  children: React.ReactNode;
  accentColor?: string;
  className?: string;
}

export function DashboardPanel({ title, icon: Icon, href, hrefLabel = "View All", children, accentColor = "var(--primary)", className = "" }: DashboardPanelProps) {
  return (
    <div className={`rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-sm overflow-hidden ${className}`}>
      <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-2.5 bg-[var(--surface-muted)]">
        <div className="flex items-center gap-2">
          {Icon && (
            <div className="grid h-6 w-6 place-items-center rounded-md bg-[var(--primary-soft)] text-[var(--primary)]">
              <Icon className="h-3.5 w-3.5" />
            </div>
          )}
          <h3 className="text-sm font-bold text-[var(--foreground)]">{title}</h3>
        </div>
        {href && (
          <Link href={href} className="text-[10px] font-bold uppercase tracking-wider text-[var(--primary)] hover:underline">
            {hrefLabel} →
          </Link>
        )}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}
