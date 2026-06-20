"use client";

import Link from "next/link";
import { ShieldCheck } from "@/components/icons";
import { useAuthStore } from "@/stores/auth-store";

export default function AccessDeniedPage() {
  const user = useAuthStore((state) => state.user);

  return (
    <div className="grid min-h-[60vh] place-items-center">
      <div className="text-center">
        <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-full bg-[var(--danger-soft)]">
          <ShieldCheck className="h-8 w-8 text-[var(--danger)]" />
        </div>
        <h1 className="text-3xl font-bold">Access Denied</h1>
        <p className="mt-3 max-w-md text-sm leading-6 text-[var(--muted)]">
          Your role ({user?.role ?? "Unknown"}) does not have permission to view this page.
          Contact your administrator to request access.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link
            href={user?.home ?? "/dashboard"}
            className="rounded-[8px] bg-[var(--primary)] px-5 py-2.5 text-sm font-semibold text-white"
          >
            Go to Home
          </Link>
          <Link
            href="/login"
            className="rounded-[8px] border border-[var(--border)] bg-[var(--surface)] px-5 py-2.5 text-sm font-semibold"
          >
            Sign Out
          </Link>
        </div>
      </div>
    </div>
  );
}
