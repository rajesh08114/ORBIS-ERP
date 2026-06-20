import Link from "next/link";

export function OrbisLogo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-3 cursor-pointer group">
      <div className="grid h-9 w-9 place-items-center rounded-full border-[6px] border-[var(--primary-strong)] bg-[var(--surface)] transition group-hover:scale-105">
        <div className="h-3.5 w-3.5 rotate-45 rounded-[3px] bg-[var(--primary-strong)]" />
      </div>
      {!compact ? (
        <div>
          <div className="text-base font-bold leading-tight text-[var(--foreground)] group-hover:text-[var(--primary)] transition">ORBIS ERP</div>
          <div className="text-xs text-[var(--muted)]">FlowForge source edition</div>
        </div>
      ) : null}
    </Link>
  );
}
