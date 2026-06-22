"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function InventoryTabs() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop Tabs */}
      <Card className="mb-4 p-3 hidden md:flex flex-wrap gap-2 items-center bg-[var(--surface)] border border-[var(--border)] rounded-[8px]">
        <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mr-2 px-1">
          Views:
        </span>
        <Link href="/inventory">
          <Button variant={pathname === "/inventory" ? "primary" : "secondary"} className="h-8 text-xs">
            Stock Status
          </Button>
        </Link>
        <Link href="/inventory/ledger">
          <Button variant={pathname === "/inventory/ledger" ? "primary" : "secondary"} className="h-8 text-xs">
            Ledger Audit
          </Button>
        </Link>
        <Link href="/inventory/timeline">
          <Button variant={pathname === "/inventory/timeline" ? "primary" : "secondary"} className="h-8 text-xs">
            Movements Timeline
          </Button>
        </Link>
        <Link href="/inventory/health">
          <Button variant={pathname === "/inventory/health" ? "primary" : "secondary"} className="h-8 text-xs">
            Valuation & Health
          </Button>
        </Link>
      </Card>
      
      {/* Mobile Tabs */}
      <div className="mb-4 flex flex-wrap gap-1.5 md:hidden">
        <Link href="/inventory">
          <Button variant={pathname === "/inventory" ? "primary" : "secondary"} className="h-7 px-2.5 text-[10px]">
            Status
          </Button>
        </Link>
        <Link href="/inventory/ledger">
          <Button variant={pathname === "/inventory/ledger" ? "primary" : "secondary"} className="h-7 px-2.5 text-[10px]">
            Ledger
          </Button>
        </Link>
        <Link href="/inventory/timeline">
          <Button variant={pathname === "/inventory/timeline" ? "primary" : "secondary"} className="h-7 px-2.5 text-[10px]">
            Timeline
          </Button>
        </Link>
        <Link href="/inventory/health">
          <Button variant={pathname === "/inventory/health" ? "primary" : "secondary"} className="h-7 px-2.5 text-[10px]">
            Health
          </Button>
        </Link>
      </div>
    </>
  );
}
