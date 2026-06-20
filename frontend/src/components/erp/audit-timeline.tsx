import { AlertCircle, CheckCircle2, Info } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import type { AuditEvent } from "@/types/erp";

export function AuditTimeline({ events }: { events: AuditEvent[] }) {
  return (
    <div className="rounded-[8px] border border-[var(--border)] bg-[var(--surface)] p-4">
      <div className="space-y-4">
        {events.slice(0, 18).map((event) => {
          const Icon = event.severity === "Critical" ? AlertCircle : event.severity === "Warning" ? Info : CheckCircle2;
          return (
            <div key={event.id} className="grid grid-cols-[32px_1fr] gap-3">
              <div className="grid h-8 w-8 place-items-center rounded-full bg-[var(--surface-muted)] text-[var(--primary)]">
                <Icon className="h-4 w-4" />
              </div>
              <div className="rounded-[8px] border border-[var(--border)] p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">{event.actor}</span>
                  <Badge tone={event.severity === "Critical" ? "danger" : event.severity === "Warning" ? "warning" : "info"}>{event.severity}</Badge>
                  <span className="text-xs text-[var(--muted)]">{event.timestamp}</span>
                </div>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  {event.action} in <span className="font-semibold text-[var(--foreground)]">{event.module}</span>
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
