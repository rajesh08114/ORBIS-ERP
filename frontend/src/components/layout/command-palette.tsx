"use client";

import { Command } from "cmdk";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { appRoutes } from "@/constants/routes";
import { useUiStore } from "@/stores/ui-store";
import { useAuthStore } from "@/stores/auth-store";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { Moon, Sun, BoxArrowRight, Search } from "@/components/icons";

export function CommandPalette() {
  const router = useRouter();
  const open = useUiStore((state) => state.commandOpen);
  const setOpen = useUiStore((state) => state.setCommandOpen);
  const { logout } = useAuthStore();
  const { resolvedTheme, setTheme } = useTheme();

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(!open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, setOpen]);

  if (!open) return null;

  const quickActions = [
    {
      id: "theme",
      label: "Toggle Theme",
      icon: resolvedTheme === "dark" ? Sun : Moon,
      action: () => {
        setTheme(resolvedTheme === "dark" ? "light" : "dark");
        toast.success(`Switched to ${resolvedTheme === "dark" ? "light" : "dark"} mode`);
      },
    },
    {
      id: "logout",
      label: "Sign Out of Workspace",
      icon: BoxArrowRight,
      action: () => {
        logout();
        router.replace("/login");
        toast.success("Successfully logged out");
      },
    },
  ];

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/50 p-4 backdrop-blur-[4px] flex items-start justify-center pt-[10vh]"
      onClick={() => setOpen(false)}
    >
      <Command
        className="w-full max-w-2xl overflow-hidden rounded-[16px] border border-[var(--border)] bg-[var(--surface)] shadow-2xl transition-all"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-[var(--border)] px-4">
          <Search className="h-4 w-4 text-[var(--muted)] shrink-0" />
          <Command.Input 
            className="h-14 w-full bg-transparent text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--muted)]" 
            placeholder="Search screens, settings, actions..." 
          />
        </div>
        
        <Command.List className="max-h-[360px] overflow-y-auto p-2 app-scrollbar">
          <Command.Empty className="p-4 text-center text-sm text-[var(--muted)]">
            No matching results found.
          </Command.Empty>
          
          <Command.Group heading="Navigation" className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
            {appRoutes.map((route) => {
              const Icon = route.icon;
              return (
                <Command.Item
                  key={route.href}
                  value={`${route.label} ${route.href}`}
                  className="flex cursor-pointer items-center gap-3 rounded-[8px] px-3 py-2.5 text-xs text-[var(--foreground)] transition data-[selected=true]:bg-[var(--primary-soft)] data-[selected=true]:text-[var(--primary)]"
                  onSelect={() => {
                    router.push(route.href);
                    setOpen(false);
                  }}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{route.label}</span>
                  <span className="ml-auto text-[10px] opacity-60">{route.href}</span>
                </Command.Item>
              );
            })}
          </Command.Group>

          <Command.Separator className="my-1 h-px bg-[var(--border)]" />

          <Command.Group heading="Quick Actions" className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
            {quickActions.map((qa) => {
              const Icon = qa.icon;
              return (
                <Command.Item
                  key={qa.id}
                  value={qa.label}
                  className="flex cursor-pointer items-center gap-3 rounded-[8px] px-3 py-2.5 text-xs text-[var(--foreground)] transition data-[selected=true]:bg-[var(--primary-soft)] data-[selected=true]:text-[var(--primary)]"
                  onSelect={() => {
                    qa.action();
                    setOpen(false);
                  }}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{qa.label}</span>
                  <span className="ml-auto text-[10px] uppercase font-bold opacity-60">Action</span>
                </Command.Item>
              );
            })}
          </Command.Group>
        </Command.List>
        <div className="flex h-9 items-center justify-end border-t border-[var(--border)] bg-[var(--surface-muted)] px-4 text-[10px] text-[var(--muted)]">
          <span className="mr-3">Use <kbd className="font-sans font-bold">↑↓</kbd> to navigate</span>
          <span>Press <kbd className="font-sans font-bold">Enter</kbd> to select</span>
        </div>
      </Command>
    </div>
  );
}
