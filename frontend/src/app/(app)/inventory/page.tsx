"use client";

import { Activity, ArrowDownUp, Boxes, ShieldAlert } from "@/components/icons";
import { ColumnDef } from "@tanstack/react-table";
import { PageHeader } from "@/components/erp/page-header";
import { MetricCard } from "@/components/erp/metric-card";
import { InventoryTabs } from "@/components/erp/inventory-tabs";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { LoadingState } from "@/components/ui/states";
import { useInventoryTransactions, useProducts } from "@/hooks/use-erp";
import type { InventoryTransaction } from "@/types/erp";

const stockColumns: ColumnDef<any>[] = [
  { accessorKey: "sku", header: "SKU" },
  { accessorKey: "name", header: "Product" },
  { accessorKey: "category", header: "Category" },
  { accessorKey: "onHand", header: "On Hand" },
  { accessorKey: "reserved", header: "Reserved" },
  { accessorKey: "freeToUse", header: "Available" },
  { 
    accessorKey: "status", 
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status;
      let badgeClass = "bg-green-100 text-green-800 border-green-200";
      if (status === "Critical") badgeClass = "bg-red-100 text-red-800 border-red-200";
      if (status === "Delayed") badgeClass = "bg-amber-100 text-amber-800 border-amber-200";
      
      return (
        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${badgeClass}`}>
          {status}
        </span>
      );
    }
  }
];

import { toast } from "sonner";

export default function InventoryPage() {
  const products = useProducts();
  
  if (products.isLoading || !products.data) return <LoadingState />;

  const onHand = products.data.reduce((sum: number, item: any) => sum + item.onHand, 0);
  const reserved = products.data.reduce((sum: number, item: any) => sum + item.reserved, 0);

  return (
    <>
      <PageHeader 
        eyebrow="Inventory Control" 
        title="Inventory & Procurement Intelligence" 
        description="On hand, reserved, available, incoming, outgoing, ledger, movements, health, and risk." 
        action="Cycle Count" 
        onAction={() => toast.info("Cycle count interface loading...")}
      />
      
      <InventoryTabs />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="On Hand" value={onHand.toLocaleString()} trend="All locations" icon={Boxes} tone="success" />
        <MetricCard label="Reserved" value={reserved.toLocaleString()} trend="Demand committed" icon={Activity} tone="warning" />
        <MetricCard label="Available" value={(onHand - reserved).toLocaleString()} trend="Healthy" icon={ArrowDownUp} tone="success" />
        <MetricCard label="Risk Items" value={products.data.filter((item: any) => item.status === "Critical").length.toString()} trend="Shortage watch" icon={ShieldAlert} tone="danger" />
      </div>
      <div className="mt-4">
        <DataTable data={products.data} columns={stockColumns} />
      </div>
    </>
  );
}
