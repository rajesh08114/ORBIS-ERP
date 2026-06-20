"use client";

import { PackageSearch, Plus, ShieldAlert, Warehouse } from "@/components/icons";
import { MetricCard } from "@/components/erp/metric-card";
import { PageHeader } from "@/components/erp/page-header";
import { ProductTable } from "@/components/erp/product-table";
import { LoadingState } from "@/components/ui/states";
import { useProducts } from "@/hooks/use-erp";

export default function ProductsPage() {
  const { data, isLoading } = useProducts();
  if (isLoading || !data) return <LoadingState />;

  return (
    <>
      <PageHeader eyebrow="Product Master" title="Products" description="Search, filter, create, edit, and monitor product master data with inventory visibility." action="Create Product" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Products" value={data.length.toString()} trend="500+ loaded" icon={PackageSearch} tone="info" />
        <MetricCard label="On Hand Units" value={data.reduce((sum, item) => sum + item.onHand, 0).toLocaleString()} trend="Across all warehouses" icon={Warehouse} tone="success" />
        <MetricCard label="Critical SKUs" value={data.filter((item) => item.status === "Critical").length.toString()} trend="Reorder review" icon={ShieldAlert} tone="danger" />
        <MetricCard label="New This Week" value="18" trend="Approved" icon={Plus} tone="primary" />
      </div>
      <div className="mt-4">
        <ProductTable products={data.slice(0, 80)} />
      </div>
    </>
  );
}
