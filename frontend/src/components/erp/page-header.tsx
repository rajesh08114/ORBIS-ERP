import { Button } from "@/components/ui/button";

export function PageHeader({
  eyebrow,
  title,
  description,
  action
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: string;
}) {
  return (
    <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-3xl">
        <div className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--primary)]">{eyebrow}</div>
        <h2 className="mt-1 text-3xl font-bold tracking-normal text-[var(--foreground)] lg:text-4xl">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{description}</p>
      </div>
      {action ? <Button>{action}</Button> : null}
    </div>
  );
}
