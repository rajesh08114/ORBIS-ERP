"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { formatCurrency } from "@/lib/utils";
import { statusTone } from "@/lib/status";
import type { Order } from "@/types/erp";

const columns: ColumnDef<Order>[] = [
  { accessorKey: "due", header: "Date" },
  { accessorKey: "id", header: "Order No." },
  { accessorKey: "party", header: "Partner" }, // Customer / Vendor
  { accessorKey: "value", header: "Total", cell: ({ row }) => formatCurrency(row.original.value) },
  { accessorKey: "status", header: "Status", cell: ({ row }) => <Badge tone={statusTone(row.original.status)}>{row.original.status}</Badge> },
  { accessorKey: "risk", header: "Risk", cell: ({ row }) => <Badge tone={row.original.risk === "High" ? "danger" : row.original.risk === "Medium" ? "warning" : "success"}>{row.original.risk}</Badge> }
];

export function OrderTable({ orders }: { orders: Order[] }) {
  return <DataTable data={orders} columns={columns} />;
}
