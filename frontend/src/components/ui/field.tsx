import { cn } from "@/lib/utils";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "focus-ring h-10 w-full rounded-[8px] border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)]",
        className
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "focus-ring min-h-28 w-full rounded-[8px] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)]",
        className
      )}
      {...props}
    />
  );
}

export function Select({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "focus-ring h-10 w-full rounded-[8px] border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--foreground)]",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}
