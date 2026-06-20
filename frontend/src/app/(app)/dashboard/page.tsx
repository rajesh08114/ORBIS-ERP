"use client";

import { Activity, Boxes, Factory, ShoppingCart, TrendingUp } from "@/components/icons";
import { MetricCard } from "@/components/erp/metric-card";
import { OperationsBarChart, RevenueChart } from "@/components/erp/charts";
import { PageHeader } from "@/components/erp/page-header";
import { TwinFlow } from "@/components/erp/twin-flow";
import { OrderTable } from "@/components/erp/order-table";
import { LoadingState } from "@/components/ui/states";
import { useDashboard } from "@/hooks/use-erp";
import { formatCurrency, formatNumber } from "@/lib/utils";

export default function DashboardPage() {
  const { data, isLoading } = useDashboard();
  if (isLoading || !data) return <LoadingState />;

  return (
    <>
      <PageHeader
        eyebrow="Operational Dashboard"
        title="ORBIS Operational Overview"
        description="A production control room for revenue, inventory, procurement, manufacturing, warehouse, and delivery signals."
        action="New Work Order"
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Revenue Pipeline" value={formatCurrency(data.kpis.revenue)} trend="+12.4% MoM" icon={TrendingUp} tone="success" />
        <MetricCard label="Active Orders" value={formatNumber(data.kpis.activeOrders)} trend="32 urgent" icon={ShoppingCart} tone="warning" />
        <MetricCard label="Inventory Health" value={`${data.kpis.inventoryHealth}%`} trend="Healthy" icon={Boxes} tone="success" />
        <MetricCard label="MFG Efficiency" value={`${data.kpis.manufacturingEfficiency}%`} trend="Target met" icon={Factory} tone="success" />
        <MetricCard label="Procurement Risk" value={formatNumber(data.kpis.procurementRisk)} trend="Watchlist" icon={Activity} tone="danger" />
      </div>
      <div className="mt-4">
        <TwinFlow />
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <RevenueChart />
        <OperationsBarChart />
      </div>
      <div className="mt-4">
        <OrderTable orders={data.salesOrders} />
      </div>
    </>
  );
}
