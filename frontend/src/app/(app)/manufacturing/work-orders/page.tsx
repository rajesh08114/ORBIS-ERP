"use client";

import { useState } from "react";
import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import { PageHeader } from "@/components/erp/page-header";
import { DataTable } from "@/components/ui/data-table";
import { LoadingState } from "@/components/ui/states";
import { useWorkOrders } from "@/hooks/use-erp";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { WorkOrder } from "@/types/erp";

export default function WorkOrdersListPage() {
  const { data, isLoading } = useWorkOrders();
  const [filterPriority, setFilterPriority] = useState<string>("All");

  if (isLoading || !data) return <LoadingState />;

  const filteredData = filterPriority === "All" 
    ? data 
    : data.filter((wo) => wo.priority === filterPriority);

  const columns: ColumnDef<WorkOrder>[] = [
    { 
      accessorKey: "id", 
      header: "Work Order ID",
      cell: ({ getValue }) => {
        const id = getValue() as string;
        return (
          <Link href={`/manufacturing/work-orders/${id}`} className="font-bold text-[var(--primary)] hover:underline">
            {id}
          </Link>
        );
      }
    },
    { accessorKey: "product", header: "Product" },
    { accessorKey: "workCenter", header: "Work Center" },
    { accessorKey: "stage", header: "Stage" },
    { 
      accessorKey: "progress", 
      header: "Progress",
      cell: ({ getValue }) => {
        const progress = getValue() as number;
        return (
          <div className="w-32 flex items-center gap-2">
            <div className="w-full bg-[var(--surface-raised)] rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-[var(--primary)] h-1.5 rounded-full transition-all duration-500" 
                style={{ width: `${progress}%` }} 
              />
            </div>
            <span className="text-[10px] font-bold text-[var(--muted)]">{progress}%</span>
          </div>
        );
      }
    },
    { 
      accessorKey: "priority", 
      header: "Priority",
      cell: ({ getValue }) => {
        const priority = getValue() as string;
        let tone: "primary" | "success" | "warning" | "danger" = "primary";
        if (priority === "High") tone = "danger";
        if (priority === "Medium") tone = "warning";
        return <Badge tone={tone}>{priority}</Badge>;
      }
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <Link href={`/manufacturing/work-orders/${row.original.id}`}>
          <Button variant="secondary" className="h-8 text-xs">View Details</Button>
        </Link>
      )
    }
  ];

  const priorities = ["All", "Low", "Medium", "High"];

  return (
    <>
      <PageHeader 
        eyebrow="Shop Floor Command" 
        title="Manufacturing Work Orders" 
        description="Launch components, check progress metrics, assign machinery locations, and manage priorities across assembly queues."
        action="New Work Order"
      />

      {/* Filter Tabs */}
      <Card className="mb-4 p-3 flex flex-wrap gap-2 items-center bg-[var(--surface)]">
        <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mr-2 px-1">
          Filter Priority:
        </span>
        {priorities.map((prio) => (
          <button
            key={prio}
            onClick={() => setFilterPriority(prio)}
            className={`px-3 py-1.5 rounded-[8px] text-xs font-semibold border transition ${
              filterPriority === prio 
                ? "bg-[var(--primary)] text-white border-[var(--primary)]" 
                : "bg-[var(--surface-muted)] text-[var(--muted)] border-[var(--border)] hover:bg-[var(--surface-raised)]"
            }`}
          >
            {prio}
          </button>
        ))}
      </Card>

      <div className="mt-4">
        <DataTable data={filteredData.slice(0, 150)} columns={columns} />
      </div>
    </>
  );
}
