import { cn } from "@/lib/utils";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "focus-ring h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-muted)]/50 px-4 text-sm font-medium text-[var(--foreground)] placeholder:text-[var(--muted)]/70 shadow-inner transition-all duration-300 hover:border-[var(--primary-strong)]/50 focus:border-[var(--primary)] focus:bg-[var(--surface)] focus:shadow-[0_0_0_4px_rgba(87,52,79,0.1)]",
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
        "focus-ring min-h-28 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-muted)]/50 px-4 py-3 text-sm font-medium text-[var(--foreground)] placeholder:text-[var(--muted)]/70 shadow-inner transition-all duration-300 hover:border-[var(--primary-strong)]/50 focus:border-[var(--primary)] focus:bg-[var(--surface)] focus:shadow-[0_0_0_4px_rgba(87,52,79,0.1)]",
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
        "focus-ring h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-muted)]/50 px-4 text-sm font-medium text-[var(--foreground)] shadow-inner transition-all duration-300 hover:border-[var(--primary-strong)]/50 focus:border-[var(--primary)] focus:bg-[var(--surface)] focus:shadow-[0_0_0_4px_rgba(87,52,79,0.1)]",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}
