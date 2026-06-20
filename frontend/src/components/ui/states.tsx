import { AlertTriangle, Inbox, Loader2 } from "@/components/icons";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-[8px] bg-[var(--surface-raised)] ${className}`} />;
}

export function EmptyState({ title = "No records found", description = "Try changing filters or creating a new record." }) {
  return (
    <Card className="flex min-h-64 flex-col items-center justify-center gap-3 p-8 text-center">
      <Inbox className="h-10 w-10 text-[var(--muted)]" />
      <div>
        <h3 className="font-semibold">{title}</h3>
        <p className="mt-1 text-sm text-[var(--muted)]">{description}</p>
      </div>
    </Card>
  );
}

export function ErrorState({ onRetry }: { onRetry?: () => void }) {
  return (
    <Card className="flex min-h-64 flex-col items-center justify-center gap-3 p-8 text-center">
      <AlertTriangle className="h-10 w-10 text-[var(--danger)]" />
      <div>
        <h3 className="font-semibold">Something needs attention</h3>
        <p className="mt-1 text-sm text-[var(--muted)]">The request failed. Retry or check service health.</p>
      </div>
      {onRetry ? <Button onClick={onRetry}>Retry</Button> : null}
    </Card>
  );
}

export function LoadingState() {
  return (
    <div className="flex min-h-72 items-center justify-center gap-2 text-sm text-[var(--muted)]">
      <Loader2 className="h-4 w-4 animate-spin" />
      Loading ORBIS workspace
    </div>
  );
}
