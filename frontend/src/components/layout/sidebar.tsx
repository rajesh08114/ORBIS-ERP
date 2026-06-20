"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { appRoutes, canAccessRoute } from "@/constants/routes";
import { cn } from "@/lib/utils";
import { OrbisLogo } from "@/components/layout/orbis-logo";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/stores/auth-store";

export function Sidebar() {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const routes = user ? appRoutes.filter((route) => canAccessRoute(route, user.role)) : [];
  const groups = [...new Set(routes.map((route) => route.group))];

  return (
    <aside className="hidden h-screen w-[264px] shrink-0 border-r border-[var(--border)] bg-[var(--surface)] lg:sticky lg:top-0 lg:flex lg:flex-col">
      <div className="border-b border-[var(--border)] p-5">
        <OrbisLogo />
      </div>
      <nav className="app-scrollbar flex-1 overflow-y-auto p-3">
        {groups.map((group) => (
          <div key={group} className="mb-4">
            <div className="mb-2 px-3 text-xs font-semibold uppercase text-[var(--muted)]">{group}</div>
            <div className="space-y-1">
              {routes
                .filter((route) => route.group === group)
                .map((route) => {
                  const active = pathname === route.href || pathname.startsWith(`${route.href}/`);
                  const Icon = route.icon;
                  return (
                    <Link
                      key={route.href}
                      href={route.href}
                      className={cn(
                        "flex h-10 items-center gap-3 rounded-[8px] px-3 text-sm font-semibold text-[var(--muted)] transition hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)]",
                        active && "bg-[var(--primary-soft)] text-[var(--primary)]"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {route.label}
                    </Link>
                  );
                })}
            </div>
          </div>
        ))}
      </nav>
      <div className="border-t border-[var(--border)] p-4">
        <div className="rounded-[8px] bg-[var(--surface-muted)] p-3">
          <Badge tone="success">Live</Badge>
          <div className="mt-2 text-sm font-semibold">Plant A: Online</div>
          <p className="mt-1 text-xs text-[var(--muted)]">98.2% throughput, 3 risks under watch.</p>
        </div>
      </div>
    </aside>
  );
}
