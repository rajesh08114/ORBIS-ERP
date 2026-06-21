"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Search } from "@/components/icons";
import { List as ListIcon, ColumnsGap as LayoutGrid } from "react-bootstrap-icons";
import { OrderTable } from "@/components/erp/order-table";
import { OrderKanban } from "@/components/erp/order-kanban";
import { PageHeader } from "@/components/erp/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { LoadingState } from "@/components/ui/states";
import { useManufacturingOrders } from "@/hooks/use-erp";

export default function ManufacturingOrdersPage() {
  const { data, isLoading } = useManufacturingOrders();
  const [view, setView] = useState<"list" | "kanban">("list");
  const [search, setSearch] = useState("");

  if (isLoading || !data) return <LoadingState />;

  const filteredOrders = data.filter((o: any) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      o.id.toLowerCase().includes(term) ||
      (o.finishedProduct && o.finishedProduct.toLowerCase().includes(term)) ||
      (o.status && o.status.toLowerCase().includes(term))
    );
  });

  return (
    <>
      <PageHeader 
        eyebrow="Manufacturing" 
        title="Manufacturing Orders" 
        description="Draft, assembly, painting, quality check, packaging, and completed production queues." 
      />
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Link href="/manufacturing/orders/new">
            <Button variant="primary">
              <Plus className="h-4 w-4 mr-2" /> 
              New Manufacturing Order
            </Button>
          </Link>
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted)]" />
            <Input
              placeholder="Search manufacturing orders..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 w-full bg-[var(--surface)]"
            />
          </div>
        </div>

        <div className="flex items-center bg-[var(--surface-muted)] p-1 rounded-lg border border-[var(--border)] w-fit">
          <button 
            onClick={() => setView("list")}
            className={`p-2 rounded-md transition-colors flex items-center justify-center ${view === "list" ? "bg-[var(--surface)] text-[var(--foreground)] shadow-sm" : "text-[var(--muted)] hover:text-[var(--foreground)]"}`}
            title="List View"
          >
            <ListIcon className="h-4 w-4" />
          </button>
          <button 
            onClick={() => setView("kanban")}
            className={`p-2 rounded-md transition-colors flex items-center justify-center ${view === "kanban" ? "bg-[var(--surface)] text-[var(--foreground)] shadow-sm" : "text-[var(--muted)] hover:text-[var(--foreground)]"}`}
            title="Kanban View"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
        </div>
      </div>

      {view === "list" ? (
        <OrderTable orders={filteredOrders} type="manufacturing" />
      ) : (
        <OrderKanban orders={filteredOrders} type="manufacturing" />
      )}
    </>
  );
}
