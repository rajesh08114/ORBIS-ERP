"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { appRoutes, canAccessRoute } from "@/constants/routes";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/stores/ui-store";
import { useAuthStore } from "@/stores/auth-store";
import { OrbisLogo } from "@/components/layout/orbis-logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";

export function MobileDrawer() {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const { sidebarOpen, setSidebarOpen } = useUiStore();
  const routes = user ? appRoutes.filter((route) => canAccessRoute(route, user.role)) : [];
  const groups = [...new Set(routes.map((route) => route.group))];

  // Close drawer on path change
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname, setSidebarOpen]);

  return (
    <AnimatePresence>
      {sidebarOpen && (
        <>
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden"
          />

          {/* Drawer menu panel */}
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 220 }}
            className="fixed bottom-0 left-0 top-0 z-50 flex h-full w-[280px] flex-col border-r border-[var(--border)] bg-[var(--surface)] p-5 shadow-2xl lg:hidden"
          >
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
              <OrbisLogo />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(false)}
                className="h-8 w-8 text-[var(--muted)]"
                aria-label="Close menu"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            </div>

            <nav className="app-scrollbar flex-1 overflow-y-auto py-4">
              {groups.map((group) => (
                <div key={group} className="mb-4">
                  <div className="mb-2 px-3 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
                    {group}
                  </div>
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

            <div className="border-t border-[var(--border)] pt-4">
              <div className="rounded-[8px] bg-[var(--surface-muted)] p-3">
                <div className="flex items-center justify-between">
                  <Badge tone="success">Active Session</Badge>
                  <span className="text-[10px] text-[var(--muted)]">Plant A</span>
                </div>
                <div className="mt-2 text-xs font-bold text-[var(--foreground)] truncate">
                  {user?.username}
                </div>
                <div className="text-[10px] text-[var(--muted)] truncate">
                  {user?.role}
                </div>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
