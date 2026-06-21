"use client";

import { Plus, Search } from "@/components/icons";
import { List as ListIcon, ColumnsGap as LayoutGrid } from "react-bootstrap-icons";
import Link from "next/link";
import { OrderTable } from "@/components/erp/order-table";
import { OrderKanban } from "@/components/erp/order-kanban";
import { PageHeader } from "@/components/erp/page-header";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/ui/states";
import { Input } from "@/components/ui/field";
import { usePurchaseOrders } from "@/hooks/use-erp";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function PurchaseOrdersList() {
  const { data, isLoading } = usePurchaseOrders();
  const searchParams = useSearchParams();
  const [view, setView] = useState<"list" | "kanban">("list");
  const [searchQuery, setSearchQuery] = useState("");

  if (isLoading || !data) return <LoadingState />;

  const statusFilter = searchParams.get("status");

  let filteredData = statusFilter
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

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filteredData = filteredData.filter(order => 
      order.id?.toLowerCase().includes(q) || 
      order.party?.toLowerCase().includes(q)
    );
  }

  return (
    <>
      <PageHeader 
        eyebrow="Procurement" 
        title="Purchase Orders" 
        description={statusFilter ? `Purchase Orders filtered by status: ${statusFilter}` : "PO list, vendor status, receipts, urgency, and procurement workflows."} 
      />
      
      {/* Top Controls Bar */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[var(--surface)] p-3 rounded-lg border border-[var(--border)] shadow-sm">
        <Link href="/purchase/orders/new">
          <Button variant="primary" className="font-semibold"><Plus className="h-4 w-4 mr-2" /> New Purchase Order</Button>
        </Link>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Search Bar */}
          <div className="relative w-full sm:w-[280px]">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--muted)]">
              <Search className="h-4 w-4" />
            </div>
            <Input 
              placeholder="Search reference or vendor..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 w-full"
            />
          </div>

          {/* View Toggles */}
          <div className="flex bg-[var(--surface-muted)] rounded-md p-1 border border-[var(--border)]">
            <button 
              onClick={() => setView("list")}
              className={`p-1.5 rounded ${view === "list" ? "bg-[var(--surface)] shadow-sm text-[var(--foreground)]" : "text-[var(--muted)] hover:text-[var(--foreground)]"}`}
              title="List View"
            >
              <ListIcon className="h-5 w-5" />
            </button>
            <button 
              onClick={() => setView("kanban")}
              className={`p-1.5 rounded ${view === "kanban" ? "bg-[var(--surface)] shadow-sm text-[var(--foreground)]" : "text-[var(--muted)] hover:text-[var(--foreground)]"}`}
              title="Kanban View"
            >
              <LayoutGrid className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {statusFilter && (
        <div className="mb-4">
          <Link href="/purchase/orders">
            <Button variant="secondary" size="sm">Clear Filter ({statusFilter})</Button>
          </Link>
        </div>
      )}

      {/* Main View Area */}
      <div className="mt-4">
        {view === "list" ? (
          <OrderTable orders={filteredData} type="purchase" />
        ) : (
          <OrderKanban orders={filteredData} type="purchase" />
        )}
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

