"use client";

import { AlertTriangle, PackageCheck, ShoppingCart, Plus } from "@/components/icons";
import Link from "next/link";
import { MetricCard } from "@/components/erp/metric-card";
import { OrderTable } from "@/components/erp/order-table";
import { PageHeader } from "@/components/erp/page-header";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/ui/states";
import { usePurchaseOrders } from "@/hooks/use-erp";
import { formatCurrency } from "@/lib/utils";

export default function PurchaseOrdersPage() {
  const { data, isLoading } = usePurchaseOrders();
  if (isLoading || !data) return <LoadingState />;

  return (
    <>
      <PageHeader eyebrow="Procurement" title="Purchase Orders" description="PO list, vendor status, receipts, urgency, and procurement center workflows." />
      <div className="mb-4">
        <Link href="/purchase/orders/new">
          <Button><Plus className="h-4 w-4 mr-2" /> New Purchase Order</Button>
        </Link>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="PO Spend" value={formatCurrency(data.reduce((sum, order) => sum + order.value, 0))} trend="200+ POs" icon={ShoppingCart} tone="info" />
        <MetricCard label="Pending Receipt" value={data.filter((order) => order.status !== "Completed").length.toString()} trend="Inbound" icon={PackageCheck} tone="warning" />
        <MetricCard label="Urgent" value={data.filter((order) => order.risk === "High").length.toString()} trend="Supplier watch" icon={AlertTriangle} tone="danger" />
      </div>
      <div className="mt-4">
        <OrderTable orders={data.slice(0, 120)} />
      </div>
    </>
  );
}
