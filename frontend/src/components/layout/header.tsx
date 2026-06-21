"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { Bell, BoxArrowRight, Command, Menu, Moon, Search, Sun } from "@/components/icons";
import { useTheme } from "next-themes";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { appRoutes } from "@/constants/routes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { useUiStore } from "@/stores/ui-store";
import { useAuthStore } from "@/stores/auth-store";
import { ProfileDropdown } from "@/components/layout/profile-dropdown";

import { MasterMenu } from "@/components/layout/master-menu";

export function Header() {
  const { resolvedTheme, setTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const setCommandOpen = useUiStore((state) => state.setCommandOpen);
  const setSidebarOpen = useUiStore((state) => state.setSidebarOpen);

  const switcherRef = useRef<HTMLDivElement>(null);

  // (Workspace switcher removed)

  const current = [...appRoutes]
    .reverse()
    .find((route) => pathname === route.href || pathname.startsWith(`${route.href}/`));

  // Compute breadcrumbs
  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbs = [{ label: "ORBIS", href: "/" }];

  let tempPath = "";
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    tempPath += `/${segment}`;

    // Check if path exists in route map
    const route = appRoutes.find((r) => r.href === tempPath);
    if (route) {
      breadcrumbs.push({ label: route.label, href: route.href });
    } else {
      // Format parameter segment
      const cleanLabel = segment
        .replace(/-/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
      breadcrumbs.push({ label: cleanLabel, href: tempPath });
    }
  }

  return (
    <header className="glass sticky top-0 z-30 border-b border-[var(--border)]">
      <div className="flex h-16 items-center gap-3 px-4 lg:px-6">
        <MasterMenu />

        {/* Vertical divider */}
        <span className="hidden h-5 w-px bg-[var(--border)] sm:block" />

        {/* Dynamic Breadcrumbs */}
        <div className="min-w-0 flex-1">
          <nav className="flex items-center gap-1 text-[11px] font-semibold text-[var(--muted)]">
            {breadcrumbs.map((crumb, idx) => (
              <span key={`${crumb.href}-${idx}`} className="flex items-center gap-1">
                {idx > 0 && <span className="text-[var(--border)] text-xs font-normal">/</span>}
                {idx === breadcrumbs.length - 1 ? (
                  <span className="text-[var(--foreground)] font-bold truncate max-w-[120px] sm:max-w-none">
                    {crumb.label}
                  </span>
                ) : (
                  <Link
                    href={crumb.href}
                    className="hover:text-[var(--primary)] transition truncate max-w-[85px] sm:max-w-none"
                  >
                    {crumb.label}
                  </Link>
                )}
              </span>
            ))}
          </nav>
        </div>

        {/* Command palette search bar */}
        <button
          className="focus-ring hidden h-10 w-full max-w-xs items-center gap-2 rounded-[8px] border border-[var(--border)] bg-[var(--surface)] px-3 text-left text-sm text-[var(--muted)] md:flex"
          onClick={() => setCommandOpen(true)}
        >
          <Search className="h-4 w-4" />
          <span className="truncate">Search records...</span>
          <span className="ml-auto inline-flex items-center gap-1 rounded bg-[var(--surface-muted)] px-1.5 py-0.5 text-[10px]">
            <Command className="h-2.5 w-2.5" /> K
          </span>
        </button>

        <Button
          variant="secondary"
          size="icon"
          aria-label="Notifications"
          onClick={() => router.push("/notifications")}
        >
          <Bell className="h-4 w-4" />
        </Button>

        <Button
          variant="secondary"
          size="icon"
          aria-label="Toggle theme"
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
        >
          {resolvedTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        {/* User Card Dropdown */}
        <ProfileDropdown />
      </div>
    </header>
  );
}
