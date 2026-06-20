"use client";

import { Activity, ArrowDownUp, Boxes, ShieldAlert } from "@/components/icons";
import { ColumnDef } from "@tanstack/react-table";
import { PageHeader } from "@/components/erp/page-header";
import { MetricCard } from "@/components/erp/metric-card";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { LoadingState } from "@/components/ui/states";
import { useInventoryTransactions, useProducts } from "@/hooks/use-erp";
import type { InventoryTransaction } from "@/types/erp";

const columns: ColumnDef<InventoryTransaction>[] = [
  { accessorKey: "id", header: "Transaction" },
  { accessorKey: "product", header: "Product" },
  { accessorKey: "type", header: "Type" },
  { accessorKey: "quantity", header: "Qty" },
  { accessorKey: "location", header: "Location" },
  { accessorKey: "timestamp", header: "Timestamp" }
];

export default function InventoryPage() {
  const products = useProducts();
  const transactions = useInventoryTransactions();
  if (products.isLoading || transactions.isLoading || !products.data || !transactions.data) return <LoadingState />;

  const onHand = products.data.reduce((sum, item) => sum + item.onHand, 0);
  const reserved = products.data.reduce((sum, item) => sum + item.reserved, 0);

  return (
    <>
      <PageHeader eyebrow="Inventory Control" title="Inventory & Procurement Intelligence" description="On hand, reserved, available, incoming, outgoing, ledger, movements, health, and risk." action="Cycle Count" />
      
      {/* Sub-Navigation Quick Links */}
      <Card className="mb-4 p-3 flex flex-wrap gap-2 items-center bg-[var(--surface)] border border-[var(--border)] rounded-[8px] hidden md:flex">
        <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mr-2 px-1">
          Views:
        </span>
        <Link href="/inventory">
          <Button variant="primary" className="h-8 text-xs">Stock Status</Button>
        </Link>
        <Link href="/inventory/ledger">
          <Button variant="secondary" className="h-8 text-xs">Ledger Audit</Button>
        </Link>
        <Link href="/inventory/timeline">
          <Button variant="secondary" className="h-8 text-xs">Movements Timeline</Button>
        </Link>
        <Link href="/inventory/health">
          <Button variant="secondary" className="h-8 text-xs">Valuation & Health</Button>
        </Link>
      </Card>
      
      {/* Mobile view sub-nav links */}
      <div className="mb-4 flex flex-wrap gap-1.5 md:hidden">
        <Link href="/inventory">
          <Button variant="primary" className="h-7 px-2.5 text-[10px]">Status</Button>
        </Link>
        <Link href="/inventory/ledger">
          <Button variant="secondary" className="h-7 px-2.5 text-[10px]">Ledger</Button>
        </Link>
        <Link href="/inventory/timeline">
          <Button variant="secondary" className="h-7 px-2.5 text-[10px]">Timeline</Button>
        </Link>
        <Link href="/inventory/health">
          <Button variant="secondary" className="h-7 px-2.5 text-[10px]">Health</Button>
        </Link>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="On Hand" value={onHand.toLocaleString()} trend="All locations" icon={Boxes} tone="success" />
        <MetricCard label="Reserved" value={reserved.toLocaleString()} trend="Demand committed" icon={Activity} tone="warning" />
        <MetricCard label="Available" value={(onHand - reserved).toLocaleString()} trend="Healthy" icon={ArrowDownUp} tone="success" />
        <MetricCard label="Risk Items" value={products.data.filter((item) => item.status === "Critical").length.toString()} trend="Shortage watch" icon={ShieldAlert} tone="danger" />
      </div>
      <div className="mt-4">
        <DataTable data={transactions.data.slice(0, 120)} columns={columns} />
      </div>
    </>
  );
}
