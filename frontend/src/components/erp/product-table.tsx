"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { formatCurrency, formatNumber } from "@/lib/utils";
import type { Product } from "@/types/erp";
import Link from "next/link";

const columns: ColumnDef<Product>[] = [
  { 
    accessorKey: "sku", 
    header: "Reference",
    cell: ({ row }) => (
      <Link href={`/products/${row.original.id}`} className="font-bold text-[var(--primary)] hover:underline">
        {row.original.sku || "-"}
      </Link>
    )
  },
  { 
    accessorKey: "name", 
    header: "Product",
    cell: ({ row }) => (
      <Link href={`/products/${row.original.id}`} className="font-medium hover:underline">
        {row.original.name}
      </Link>
    )
  },
  { accessorKey: "salesPrice", header: "Sales Price", cell: ({ row }) => formatCurrency(row.original.salesPrice || 0) },
  { accessorKey: "costPrice", header: "Cost Price", cell: ({ row }) => formatCurrency(row.original.costPrice || 0) },
  { accessorKey: "onHand", header: "On Hand Qty", cell: ({ row }) => formatNumber(row.original.onHand || 0) }
];

export function ProductTable({ products }: { products: Product[] }) {
  return <DataTable data={products} columns={columns} />;
}
