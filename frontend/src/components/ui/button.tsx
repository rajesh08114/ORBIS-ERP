import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "focus-ring inline-flex h-10 items-center justify-center gap-2 rounded-[8px] px-4 text-sm font-semibold transition active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-[var(--primary-strong)] text-white shadow-[var(--shadow)] hover:brightness-105 dark:bg-[var(--primary)] dark:text-[var(--primary-fg)]",
        secondary: "border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] hover:bg-[var(--surface-muted)]",
        ghost: "text-[var(--muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)]",
        danger: "bg-[var(--danger)] text-white hover:brightness-105 dark:text-slate-950"
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4",
        lg: "h-11 px-5",
        icon: "h-10 w-10 px-0"
      }
    },
    defaultVariants: {
      variant: "primary",
      size: "md"
    }
  }
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}
