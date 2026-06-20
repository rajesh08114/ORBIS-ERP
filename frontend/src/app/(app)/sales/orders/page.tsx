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

export default function SalesOrdersPage() {
  const { data, isLoading } = useSalesOrders();
  if (isLoading || !data) return <LoadingState />;

  return (
    <>
      <PageHeader eyebrow="Sales" title="Sales Orders" description="Order list, customer commitment tracking, search, filters, pagination, and details." />
      <div className="mb-4">
        <Link href="/sales/orders/new">
          <Button><Plus className="h-4 w-4" /> New Sales Order</Button>
        </Link>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Open Orders" value={data.length.toString()} trend="300+ records" icon={ReceiptText} tone="info" />
        <MetricCard label="Pipeline Value" value={formatCurrency(data.reduce((sum, order) => sum + order.value, 0))} trend="+14%" icon={TrendingUp} tone="success" />
        <MetricCard label="Customer Risk" value={data.filter((order) => order.risk === "High").length.toString()} trend="Needs review" icon={Users} tone="warning" />
      </div>
      <div className="mt-4">
        <OrderTable orders={data.slice(0, 120)} />
      </div>
    </>
  );
}
