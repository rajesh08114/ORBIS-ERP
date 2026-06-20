"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { statusTone } from "@/lib/status";
import type { Product } from "@/types/erp";

const columns: ColumnDef<Product>[] = [
  { accessorKey: "sku", header: "SKU" },
  { accessorKey: "name", header: "Product" },
  { accessorKey: "category", header: "Category" },
  { accessorKey: "onHand", header: "On Hand", cell: ({ row }) => formatNumber(row.original.onHand) },
  { accessorKey: "reserved", header: "Reserved", cell: ({ row }) => formatNumber(row.original.reserved) },
  { accessorKey: "incoming", header: "Incoming", cell: ({ row }) => formatNumber(row.original.incoming) },
  { accessorKey: "unitCost", header: "Unit Cost", cell: ({ row }) => formatCurrency(row.original.unitCost) },
  { accessorKey: "status", header: "Status", cell: ({ row }) => <Badge tone={statusTone(row.original.status)}>{row.original.status}</Badge> }
];

export function ProductTable({ products }: { products: Product[] }) {
  return <DataTable data={products} columns={columns} />;
}
