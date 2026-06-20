"use client";

import { ManufacturingKanban } from "@/components/erp/kanban";
import { PageHeader } from "@/components/erp/page-header";
import { LoadingState } from "@/components/ui/states";
import { useWorkOrders } from "@/hooks/use-erp";

export default function KanbanPage() {
  const { data, isLoading } = useWorkOrders();
  if (isLoading || !data) return <LoadingState />;
  return (
    <>
      <PageHeader eyebrow="Kanban" title="Manufacturing Kanban" description="Dense production kanban with stage columns and progress signals." action="Add Card" />
      <ManufacturingKanban workOrders={data.slice(0, 96)} />
    </>
  );
}
