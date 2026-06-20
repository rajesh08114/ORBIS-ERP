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

const workspaces = [
  { id: "primary", name: "ORBIS Operations", facility: "Plant A: Berlin" },
  { id: "secondary", name: "ORBIS Logistics Hub", facility: "WH B2: Munich" },
  { id: "tertiary", name: "ORBIS HQ Executive", facility: "Corporate HQ" },
];

export function Header() {
  const { resolvedTheme, setTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const setCommandOpen = useUiStore((state) => state.setCommandOpen);
  const setSidebarOpen = useUiStore((state) => state.setSidebarOpen);
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [selectedWorkspace, setSelectedWorkspace] = useState(workspaces[0]);
  const switcherRef = useRef<HTMLDivElement>(null);

  // Close workspace switcher when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (switcherRef.current && !switcherRef.current.contains(event.target as Node)) {
        setWorkspaceOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
        <Button 
          variant="ghost" 
          size="icon" 
          className="lg:hidden" 
          aria-label="Open menu"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Workspace Switcher */}
        <div ref={switcherRef} className="relative z-40 hidden sm:block">
          <button
            onClick={() => setWorkspaceOpen(!workspaceOpen)}
            className="flex items-center gap-2 rounded-[8px] border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-left text-xs transition hover:bg-[var(--surface-muted)] focus:outline-none"
          >
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <div className="min-w-0">
              <div className="font-bold leading-none text-[var(--foreground)]">{selectedWorkspace.name}</div>
              <div className="text-[10px] text-[var(--muted)] leading-none mt-0.5">{selectedWorkspace.facility}</div>
            </div>
            <svg className="ml-1 h-3.5 w-3.5 text-[var(--muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {workspaceOpen && (
            <div className="absolute left-0 mt-1 w-56 rounded-[12px] border border-[var(--border)] bg-[var(--surface)] p-1.5 shadow-[var(--shadow)]">
              <div className="px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
                Switch Facility
              </div>
              {workspaces.map((ws) => (
                <button
                  key={ws.id}
                  onClick={() => {
                    setSelectedWorkspace(ws);
                    setWorkspaceOpen(false);
                    toast.success(`Connected to workspace: ${ws.name}`);
                  }}
                  className={`w-full flex flex-col items-start rounded-[8px] px-2.5 py-1.5 text-left text-xs transition hover:bg-[var(--surface-muted)] ${
                    ws.id === selectedWorkspace.id ? "bg-[var(--primary-soft)] text-[var(--primary)] font-semibold" : "text-[var(--foreground)]"
                  }`}
                >
                  <span>{ws.name}</span>
                  <span className="text-[10px] text-[var(--muted)]">{ws.facility}</span>
                </button>
              ))}
            </div>
          )}
        </div>

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

        {/* User Card */}
        <div className="flex items-center gap-3 rounded-[8px] border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5">
          <div 
            onClick={() => router.push("/profile")}
            className="h-8 w-8 rounded-full bg-[var(--primary-soft)] border border-[var(--border)] flex items-center justify-center font-bold text-xs text-[var(--primary)] cursor-pointer hover:opacity-85 transition"
          >
            {user?.username?.substring(0, 2).toUpperCase()}
          </div>
          <div className="hidden min-w-0 flex-col lg:flex">
            <div className="truncate text-xs font-bold leading-none text-[var(--foreground)]">{user?.username}</div>
            <div className="truncate text-[10px] text-[var(--muted)] leading-none mt-1">{user?.role}</div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-[var(--muted)] hover:text-[var(--danger)]"
            aria-label="Sign out"
            title="Sign out"
            onClick={() => {
              logout();
              router.replace("/login");
              toast.success("Successfully logged out.");
            }}
          >
            <BoxArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
