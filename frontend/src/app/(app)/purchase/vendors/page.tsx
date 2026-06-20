"use client";

import { Star, Truck, Users } from "@/components/icons";
import { ColumnDef } from "@tanstack/react-table";
import { MetricCard } from "@/components/erp/metric-card";
import { PageHeader } from "@/components/erp/page-header";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { LoadingState } from "@/components/ui/states";
import { useVendors } from "@/hooks/use-erp";
import { statusTone } from "@/lib/status";
import { formatCurrency } from "@/lib/utils";
import type { Vendor } from "@/types/erp";

const columns: ColumnDef<Vendor>[] = [
  { accessorKey: "name", header: "Vendor" },
  { accessorKey: "category", header: "Category" },
  { accessorKey: "rating", header: "Rating", cell: ({ row }) => `${row.original.rating}%` },
  { accessorKey: "leadTime", header: "Lead Time", cell: ({ row }) => `${row.original.leadTime} days` },
  { accessorKey: "spend", header: "Spend", cell: ({ row }) => formatCurrency(row.original.spend) },
  { accessorKey: "status", header: "Status", cell: ({ row }) => <Badge tone={statusTone(row.original.status)}>{row.original.status}</Badge> }
];

export default function VendorsPage() {
  const { data, isLoading } = useVendors();
  if (isLoading || !data) return <LoadingState />;

  return (
    <>
      <PageHeader eyebrow="Vendor Management" title="Vendor Directory" description="Vendor cards, performance ratings, renewals, spend trends, and risk assessment." action="Add Vendor" />
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Vendors" value={data.length.toString()} trend="100+ suppliers" icon={Users} tone="info" />
        <MetricCard label="Avg Rating" value={`${Math.round(data.reduce((sum, vendor) => sum + vendor.rating, 0) / data.length)}%`} trend="Reliable" icon={Star} tone="success" />
        <MetricCard label="Logistics Partners" value={data.filter((vendor) => vendor.category === "Logistics").length.toString()} trend="Active" icon={Truck} tone="primary" />
      </div>
      <div className="mt-4">
        <DataTable data={data} columns={columns} />
      </div>
    </>
  );
}
