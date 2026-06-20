"use client";

import Link from "next/link";
import { Plus } from "@/components/icons";
import { ManufacturingKanban } from "@/components/erp/kanban";
import { PageHeader } from "@/components/erp/page-header";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/ui/states";
import { useWorkOrders } from "@/hooks/use-erp";

export default function ManufacturingOrdersPage() {
  const { data, isLoading } = useWorkOrders();
  if (isLoading || !data) return <LoadingState />;
  return (
    <>
      <PageHeader eyebrow="Manufacturing" title="Manufacturing Orders" description="Draft, assembly, painting, quality check, packaging, and completed production queues." />
      <div className="mb-4">
        <Link href="/manufacturing/orders/new">
          <Button><Plus className="h-4 w-4 mr-2" /> New Manufacturing Order</Button>
        </Link>
      </div>
      <ManufacturingKanban workOrders={data.slice(0, 120)} />
    </>
  );
}
