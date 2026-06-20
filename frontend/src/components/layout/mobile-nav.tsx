"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { appRoutes, canAccessRoute } from "@/constants/routes";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";

export function MobileNav() {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const mobileRoutes = user ? appRoutes.filter((route) => canAccessRoute(route, user.role)).slice(0, 5) : [];

  return (
    <nav
      className="glass fixed inset-x-0 bottom-0 z-40 grid border-t border-[var(--border)] px-2 py-2 lg:hidden"
      style={{ gridTemplateColumns: `repeat(${Math.max(mobileRoutes.length, 1)}, minmax(0, 1fr))` }}
    >
      {mobileRoutes.map((route) => {
        const active = pathname === route.href || pathname.startsWith(`${route.href}/`);
        const Icon = route.icon;
        return (
          <Link
            key={route.href}
            href={route.href}
            className={cn("flex flex-col items-center gap-1 rounded-[8px] px-1 py-1.5 text-[11px] font-semibold text-[var(--muted)]", active && "text-[var(--primary)]")}
          >
            <Icon className="h-5 w-5" />
            <span className="max-w-full truncate">{route.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
