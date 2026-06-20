"use client";

import { CommandPalette } from "@/components/layout/command-palette";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileDrawer } from "@/components/layout/mobile-drawer";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[var(--background)]">
      <Sidebar />
      <div className="min-w-0 flex-1">
        <Header />
        <main className="mx-auto w-full max-w-[1440px] px-4 py-5 pb-28 lg:px-6 lg:pb-8">{children}</main>
      </div>
      <MobileNav />
      <MobileDrawer />
      <CommandPalette />
    </div>
  );
}
