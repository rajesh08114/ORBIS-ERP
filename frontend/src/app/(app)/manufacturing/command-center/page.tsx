"use client";

import { Factory, Gauge, Timer, Wrench } from "@/components/icons";
import { OperationsBarChart } from "@/components/erp/charts";
import { ManufacturingKanban } from "@/components/erp/kanban";
import { MetricCard } from "@/components/erp/metric-card";
import { PageHeader } from "@/components/erp/page-header";
import { LoadingState } from "@/components/ui/states";
import { useWorkOrders } from "@/hooks/use-erp";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function ManufacturingCommandCenterContent() {
  const { data, isLoading } = useWorkOrders();
  const searchParams = useSearchParams();

  if (isLoading || !data) return <LoadingState />;

  const statusFilter = searchParams.get("status")?.toLowerCase();

  const filteredData = statusFilter
    ? data.filter((wo: any) => {
        const stageLower = wo.stage.toLowerCase();
        if (statusFilter === "draft") return stageLower === "draft";
        if (statusFilter === "confirmed") return stageLower === "assembly";
        if (statusFilter === "in_progress") return ["painting", "quality check", "packaging"].includes(stageLower);
        if (statusFilter === "done") return stageLower === "completed";
        return true;
      })
    : data;

  return (
    <>
      <PageHeader 
        eyebrow="Manufacturing" 
        title="Manufacturing Command Center" 
        description={statusFilter ? `Manufacturing Command Center filtered by status: ${statusFilter}` : "Live station monitor, production efficiency, active orders, and work center status."} 
        action="Dispatch Work" 
      />
      
      {/* Sub-Navigation Quick Links */}
      <Card className="mb-4 p-3 flex flex-wrap gap-2 items-center bg-[var(--surface)] border border-[var(--border)] rounded-[8px] hidden md:flex">
        <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mr-2 px-1">
          Views:
        </span>
        <Link href="/manufacturing/command-center">
          <Button variant="primary" className="h-8 text-xs">Command Center</Button>
        </Link>
        <Link href="/manufacturing/work-orders">
          <Button variant="secondary" className="h-8 text-xs">Work Orders List</Button>
        </Link>
        <Link href="/manufacturing/kanban">
          <Button variant="secondary" className="h-8 text-xs">Kanban Board</Button>
        </Link>
        <Link href="/manufacturing/bom">
          <Button variant="secondary" className="h-8 text-xs">Bill of Materials</Button>
        </Link>
        <Link href="/manufacturing/work-centers">
          <Button variant="secondary" className="h-8 text-xs">Work Centers</Button>
        </Link>
        {statusFilter && (
          <Link href="/manufacturing/command-center">
            <Button variant="secondary" className="h-8 text-xs border-[var(--primary)] text-[var(--primary)] ml-auto">
              Clear Filter ({statusFilter})
            </Button>
          </Link>
        )}
      </Card>
      
      {/* Mobile view sub-nav links */}
      <div className="mb-4 flex flex-wrap gap-1.5 md:hidden">
        <Link href="/manufacturing/command-center">
          <Button variant="primary" className="h-7 px-2.5 text-[10px]">Command</Button>
        </Link>
        <Link href="/manufacturing/work-orders">
          <Button variant="secondary" className="h-7 px-2.5 text-[10px]">Work Orders</Button>
        </Link>
        <Link href="/manufacturing/kanban">
          <Button variant="secondary" className="h-7 px-2.5 text-[10px]">Kanban</Button>
        </Link>
        <Link href="/manufacturing/bom">
          <Button variant="secondary" className="h-7 px-2.5 text-[10px]">BOM</Button>
        </Link>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Active Work Orders" value={filteredData.length.toString()} trend={`${filteredData.length} active`} icon={Factory} tone="info" />
        <MetricCard label="OEE" value="96%" trend="Target met" icon={Gauge} tone="success" />
        <MetricCard label="Avg Cycle" value="42m" trend="-6m" icon={Timer} tone="success" />
        <MetricCard label="Maintenance" value="3" trend="Scheduled" icon={Wrench} tone="warning" />
      </div>
      <div className="mt-4">
        <OperationsBarChart />
      </div>
      <div className="mt-4">
        <ManufacturingKanban workOrders={filteredData.slice(0, 72)} />
      </div>
    </>
  );
}

export default function ManufacturingCommandCenterPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <ManufacturingCommandCenterContent />
    </Suspense>
  );
}

