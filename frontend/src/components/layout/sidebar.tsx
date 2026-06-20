"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { appRoutes, canAccessRoute } from "@/constants/routes";
import { cn } from "@/lib/utils";
import { OrbisLogo } from "@/components/layout/orbis-logo";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/stores/auth-store";
import { ChevronLeft, ChevronRight, BoxArrowRight } from "@/components/icons";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("sidebar_collapsed");
    if (saved) {
      setIsCollapsed(saved === "true");
    }
  }, []);

  const toggleCollapse = () => {
    const nextVal = !isCollapsed;
    setIsCollapsed(nextVal);
    localStorage.setItem("sidebar_collapsed", String(nextVal));
  };

  const routes = user ? appRoutes.filter((route) => canAccessRoute(route, user.role)) : [];
  const groups = [...new Set(routes.map((route) => route.group))];

  return (
    <aside 
      className={cn(
        "hidden h-screen shrink-0 border-r border-[var(--border)] bg-[var(--surface)] lg:sticky lg:top-0 lg:flex lg:flex-col transition-all duration-300 ease-in-out",
        isCollapsed ? "w-[72px]" : "w-[264px]"
      )}
    >
      {/* Sidebar Header (Branding) */}
      <div className="border-b border-[var(--border)] p-4 flex items-center justify-center h-16 overflow-hidden">
        <OrbisLogo compact={isCollapsed} />
      </div>

      {/* Navigation Links */}
      <nav className="app-scrollbar flex-1 overflow-y-auto p-3 space-y-4">
        {groups.map((group) => (
          <div key={group} className="space-y-1">
            {!isCollapsed && (
              <div className="mb-2 px-3 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] opacity-70">
                {group}
              </div>
            )}
            <div className="space-y-0.5">
              {routes
                .filter((route) => route.group === group)
                .map((route) => {
                  const active = pathname === route.href || pathname.startsWith(`${route.href}/`);
                  const Icon = route.icon;
                  return (
                    <Link
                      key={route.href}
                      href={route.href}
                      title={isCollapsed ? route.label : undefined}
                      className={cn(
                        "flex h-10 items-center rounded-[8px] transition duration-150",
                        isCollapsed 
                          ? "justify-center w-10 h-10 mx-auto px-0 text-[var(--muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)]" 
                          : "gap-3 px-3 text-xs font-bold text-[var(--muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)]",
                        active && "bg-[var(--primary-soft)] text-[var(--primary)] font-extrabold"
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {!isCollapsed && <span>{route.label}</span>}
                    </Link>
                  );
                })}
            </div>
          </div>
        ))}
      </nav>

      {/* Live Status and Collapse Toggle Block */}
      <div className="border-t border-[var(--border)] p-3 space-y-2">
        {/* Status Card (Hidden when collapsed) */}
        {!isCollapsed && (
          <div className="rounded-[8px] bg-[var(--surface-muted)] p-3 border border-[var(--border)]">
            <Badge tone="success">Live</Badge>
            <div className="mt-2 text-xs font-bold text-[var(--foreground)]">Plant A: Online</div>
            <p className="mt-0.5 text-[10px] text-[var(--muted)]">98.2% throughput, 3 risks under watch.</p>
          </div>
        )}

        {/* Collapsible Action Button */}
        <button
          onClick={toggleCollapse}
          className={cn(
            "w-full flex h-10 items-center rounded-[8px] text-[var(--muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)] transition duration-150 focus:outline-none border border-transparent",
            isCollapsed ? "justify-center px-0 border-[var(--border)] bg-[var(--surface-muted)]" : "gap-3 px-3 text-xs font-bold"
          )}
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4 text-[var(--muted)]" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4 text-[var(--muted)]" />
              <span>Collapse Sidebar</span>
            </>
          )}
        </button>

        {/* Quick Logout shortcut in sidebar bottom when collapsed */}
        {isCollapsed && (
          <button
            onClick={() => {
              logout();
              router.replace("/login");
              toast.success("Successfully logged out.");
            }}
            className="w-full flex h-10 items-center justify-center rounded-[8px] text-[var(--muted)] hover:bg-[var(--danger-soft)] hover:text-[var(--danger)] transition duration-150 border border-[var(--border)] bg-[var(--surface)]"
            title="Sign out"
          >
            <BoxArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </aside>
  );
}
