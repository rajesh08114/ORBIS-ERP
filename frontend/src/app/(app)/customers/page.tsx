"use client";

import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import { PageHeader } from "@/components/erp/page-header";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { useErpStore } from "@/stores/erp-store";
import { formatCurrency } from "@/lib/utils";
import type { Customer } from "@/types/erp";

const columns: ColumnDef<Customer>[] = [
  { 
    accessorKey: "id", 
    header: "ID",
    cell: ({ row }) => (
      <Link href={`/customers/${row.original.id}`} className="font-bold text-[var(--primary)] hover:underline">
        {row.original.id}
      </Link>
    )
  },
  { 
    accessorKey: "name", 
    header: "Name",
    cell: ({ row }) => (
      <Link href={`/customers/${row.original.id}`} className="font-semibold text-[var(--foreground)] hover:text-[var(--primary)] hover:underline">
        {row.original.name}
      </Link>
    )
  },
  { accessorKey: "segment", header: "Segment" },
  { accessorKey: "revenue", header: "Revenue", cell: ({ row }) => formatCurrency(row.original.revenue) },
  { accessorKey: "risk", header: "Risk", cell: ({ row }) => <Badge tone={row.original.risk === "High" ? "danger" : row.original.risk === "Medium" ? "warning" : "success"}>{row.original.risk}</Badge> }
];

export default function CustomersPage() {
  const customers = useErpStore((state) => state.customers);

  return (
    <>
      <PageHeader 
        eyebrow="Customers" 
        title="Customer Management" 
        description="Customer directory, segments, revenue metrics, and risk status." 
      />
      <DataTable data={customers} columns={columns} />
    </>
  );
}

