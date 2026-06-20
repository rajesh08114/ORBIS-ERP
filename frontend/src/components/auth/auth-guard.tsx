"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { canAccessPath } from "@/constants/routes";
import { useAuthStore } from "@/stores/auth-store";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, hydrated } = useAuthStore();

  useEffect(() => {
    if (!hydrated) return;
    if (!user) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }

    if (!canAccessPath(pathname, user.role)) {
      router.replace("/access-denied");
    }
  }, [hydrated, pathname, router, user]);

  if (!hydrated || !user) {
    return (
      <div className="grid min-h-screen place-items-center bg-[var(--background)] text-sm text-[var(--muted)]">
        Loading ORBIS workspace...
      </div>
    );
  }

  if (!canAccessPath(pathname, user.role)) {
    return null;
  }

  return <>{children}</>;
}
