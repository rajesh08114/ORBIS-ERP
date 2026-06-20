"use client";

import { Plus, ReceiptText, TrendingUp, Users } from "@/components/icons";
import Link from "next/link";
import { MetricCard } from "@/components/erp/metric-card";
import { OrderTable } from "@/components/erp/order-table";
import { PageHeader } from "@/components/erp/page-header";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/ui/states";
import { useSalesOrders } from "@/hooks/use-erp";
import { formatCurrency } from "@/lib/utils";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function SalesOrdersList() {
  const { data, isLoading } = useSalesOrders();
  const searchParams = useSearchParams();

  if (isLoading || !data) return <LoadingState />;

  const statusFilter = searchParams.get("status");

  const filteredData = statusFilter
    ? data.filter((order) => {
        if (statusFilter.toLowerCase() === "late") {
          if (!order.scheduled_date) return false;
          const now = new Date();
          const sched = new Date(order.scheduled_date);
          return sched < now && ["Draft", "Confirmed", "Partially Delivered"].includes(order.status);
        }

        const normOrder = order.status.toLowerCase().replace(/_/g, "").replace(/\s/g, "");
        const normFilter = statusFilter.toLowerCase().replace(/_/g, "").replace(/\s/g, "");

        if (normFilter === "delivered" && normOrder === "fullydelivered") return true;
        if (normFilter === "partiallydelivered" && normOrder === "partiallydelivered") return true;

        return normOrder === normFilter;
      })
    : data;

  return (
    <>
      <PageHeader 
        eyebrow="Sales" 
        title="Sales Orders" 
        description={statusFilter ? `Sales Orders filtered by status: ${statusFilter}` : "Order list, customer commitment tracking, search, filters, pagination, and details."} 
      />
      <div className="mb-4 flex gap-2">
        <Link href="/sales/orders/new">
          <Button><Plus className="h-4 w-4 mr-2" /> New Sales Order</Button>
        </Link>
        {statusFilter && (
          <Link href="/sales/orders">
            <Button variant="secondary">Clear Filter ({statusFilter})</Button>
          </Link>
        )}
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard 
          label="Open Orders" 
          value={filteredData.length.toString()} 
          trend={`${filteredData.length} records`} 
          icon={ReceiptText} 
          tone="info" 
        />
        <MetricCard 
          label="Pipeline Value" 
          value={formatCurrency(filteredData.reduce((sum: number, order: any) => sum + order.value, 0))} 
          trend="+14%" 
          icon={TrendingUp} 
          tone="success" 
        />
        <MetricCard 
          label="Customer Risk" 
          value={filteredData.filter((order) => order.risk === "High").length.toString()} 
          trend="Needs review" 
          icon={Users} 
          tone="warning" 
        />
      </div>
      <div className="mt-4">
        <OrderTable orders={filteredData.slice(0, 120)} type="sales" />
      </div>
    </>
  );
}

export default function SalesOrdersPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <SalesOrdersList />
    </Suspense>
  );
}

