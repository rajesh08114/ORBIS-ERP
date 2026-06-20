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
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function PurchaseOrdersList() {
  const { data, isLoading } = usePurchaseOrders();
  const searchParams = useSearchParams();

  if (isLoading || !data) return <LoadingState />;

  const statusFilter = searchParams.get("status");

  const filteredData = statusFilter
    ? data.filter((order) => {
        if (statusFilter.toLowerCase() === "late") {
          if (!order.scheduled_date) return false;
          const now = new Date();
          const sched = new Date(order.scheduled_date);
          return sched < now && ["Draft", "Confirmed", "Partially Received"].includes(order.status);
        }

        const normOrder = order.status.toLowerCase().replace(/_/g, "").replace(/\s/g, "");
        const normFilter = statusFilter.toLowerCase().replace(/_/g, "").replace(/\s/g, "");

        if (normFilter === "received" && normOrder === "fullyreceived") return true;
        if (normFilter === "partiallyreceived" && normOrder === "partiallyreceived") return true;

        return normOrder === normFilter;
      })
    : data;

  return (
    <>
      <PageHeader 
        eyebrow="Procurement" 
        title="Purchase Orders" 
        description={statusFilter ? `Purchase Orders filtered by status: ${statusFilter}` : "PO list, vendor status, receipts, urgency, and procurement center workflows."} 
      />
      <div className="mb-4 flex gap-2">
        <Link href="/purchase/orders/new">
          <Button><Plus className="h-4 w-4 mr-2" /> New Purchase Order</Button>
        </Link>
        {statusFilter && (
          <Link href="/purchase/orders">
            <Button variant="secondary">Clear Filter ({statusFilter})</Button>
          </Link>
        )}
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard 
          label="PO Spend" 
          value={formatCurrency(filteredData.reduce((sum: number, order: any) => sum + order.value, 0))} 
          trend={`${filteredData.length} POs`} 
          icon={ShoppingCart} 
          tone="info" 
        />
        <MetricCard 
          label="Pending Receipt" 
          value={filteredData.filter((order) => order.status !== "Completed").length.toString()} 
          trend="Inbound" 
          icon={PackageCheck} 
          tone="warning" 
        />
        <MetricCard 
          label="Urgent" 
          value={filteredData.filter((order) => order.risk === "High").length.toString()} 
          trend="Supplier watch" 
          icon={AlertTriangle} 
          tone="danger" 
        />
      </div>
      <div className="mt-4">
        <OrderTable orders={filteredData.slice(0, 120)} type="purchase" />
      </div>
    </>
  );
}

export default function PurchaseOrdersPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <PurchaseOrdersList />
    </Suspense>
  );
}

