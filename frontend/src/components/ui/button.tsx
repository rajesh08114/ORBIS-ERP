import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "focus-ring inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold transition-all duration-300 ease-out active:scale-[0.96] disabled:pointer-events-none disabled:opacity-50 select-none",
  {
    variants: {
      variant: {
        primary: "bg-[var(--primary-strong)] text-white shadow-[0_8px_20px_rgba(87,52,79,0.25)] hover:shadow-[0_12px_25px_rgba(87,52,79,0.4)] hover:-translate-y-0.5 dark:bg-[var(--primary)] dark:text-[var(--primary-fg)]",
        secondary: "border-2 border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] hover:bg-[var(--surface-muted)] hover:-translate-y-0.5 shadow-sm hover:shadow-md",
        ghost: "text-[var(--muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)]",
        danger: "bg-[var(--danger)] text-white shadow-lg hover:shadow-xl hover:brightness-110 hover:-translate-y-0.5 dark:text-slate-950"
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
