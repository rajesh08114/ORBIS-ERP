"use client";

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { PageHeader } from "@/components/erp/page-header";
import { DataTable } from "@/components/ui/data-table";
import { LoadingState } from "@/components/ui/states";
import { useInventoryTransactions } from "@/hooks/use-erp";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { InventoryTransaction } from "@/types/erp";

const columns: ColumnDef<InventoryTransaction>[] = [
  { accessorKey: "id", header: "Transaction ID" },
  { accessorKey: "product", header: "Product" },
  { 
    accessorKey: "type", 
    header: "Type",
    cell: ({ getValue }) => {
      const type = getValue() as string;
      let tone: "primary" | "success" | "warning" | "info" = "info";
      if (type === "Receipt") tone = "success";
      if (type === "Issue") tone = "primary";
      if (type === "Adjustment") tone = "warning";
      return <Badge tone={tone}>{type}</Badge>;
    }
  },
  { 
    accessorKey: "quantity", 
    header: "Quantity",
    cell: ({ getValue }) => {
      const qty = getValue() as number;
      const isPositive = qty > 0;
      return (
        <span className={`font-bold ${isPositive ? "text-emerald-500" : "text-rose-500"}`}>
          {isPositive ? `+${qty}` : qty}
        </span>
      );
    }
  },
  { accessorKey: "location", header: "Location" },
  { accessorKey: "timestamp", header: "Timestamp" }
];

export default function InventoryLedgerPage() {
  const { data, isLoading } = useInventoryTransactions();
  const [filterType, setFilterType] = useState<string>("All");

  if (isLoading || !data) return <LoadingState />;

  const filteredData = filterType === "All" 
    ? data 
    : data.filter((t) => t.type === filterType);

  const types = ["All", "Receipt", "Issue", "Transfer", "Adjustment"];

  return (
    <>
      <PageHeader 
        eyebrow="Inventory Control" 
        title="Stock Ledger Audit" 
        description="Every inventory receipt, adjustment, issue, and internal transfer logged under chronological sequence." 
        action="Export CSV"
      />

      {/* Filter Tabs */}
      <Card className="mb-4 p-3 flex flex-wrap gap-2 items-center bg-[var(--surface)]">
        <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mr-2 px-1">
          Filter Type:
        </span>
        {types.map((type) => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`px-3 py-1.5 rounded-[8px] text-xs font-semibold border transition ${
              filterType === type 
                ? "bg-[var(--primary)] text-white border-[var(--primary)]" 
                : "bg-[var(--surface-muted)] text-[var(--muted)] border-[var(--border)] hover:bg-[var(--surface-raised)]"
            }`}
          >
            {type}
          </button>
        ))}
      </Card>

      <div className="mt-4">
        <DataTable data={filteredData.slice(0, 150)} columns={columns} />
      </div>
    </>
  );
}
