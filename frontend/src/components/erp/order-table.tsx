"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { formatCurrency } from "@/lib/utils";
import { statusTone } from "@/lib/status";
import type { Order } from "@/types/erp";
import Link from "next/link";
import { useMemo } from "react";

export function OrderTable({ orders, type }: { orders: Order[]; type: "sales" | "purchase" }) {
  const columns = useMemo<ColumnDef<Order>[]>(() => [
    { accessorKey: "due", header: "Date" },
    { 
      accessorKey: "id", 
      header: "Order No.",
      cell: ({ row }) => {
        const dbId = row.original.dbId || row.original.id;
        const path = type === "sales" ? `/sales/orders/${dbId}` : `/purchase/orders/${dbId}`;
        return (
          <Link href={path} className="text-[var(--primary)] hover:underline font-bold">
            {row.original.id}
          </Link>
        );
      }
    },
    { accessorKey: "party", header: "Partner" }, // Customer / Vendor
    { accessorKey: "value", header: "Total", cell: ({ row }) => formatCurrency(row.original.value) },
    { accessorKey: "status", header: "Status", cell: ({ row }) => <Badge tone={statusTone(row.original.status)}>{row.original.status}</Badge> },
    { accessorKey: "risk", header: "Risk", cell: ({ row }) => <Badge tone={row.original.risk === "High" ? "danger" : row.original.risk === "Medium" ? "warning" : "success"}>{row.original.risk}</Badge> }
  ], [type]);

  return <DataTable data={orders} columns={columns} />;
}
