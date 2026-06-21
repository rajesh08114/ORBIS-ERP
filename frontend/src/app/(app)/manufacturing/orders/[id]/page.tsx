"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/erp/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArrowLeft, Clock, CheckCircle, Play, XCircle } from "@/components/icons";
import { LoadingState } from "@/components/ui/states";
import { useManufacturingOrderDetail } from "@/hooks/use-erp";
import { erpService } from "@/services/erp-service";
import { useQueryClient } from "@tanstack/react-query";
import { statusTone } from "@/lib/status";

export default function ManufacturingOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"components" | "work_orders">("components");

  const { data: order, isLoading } = useManufacturingOrderDetail(id);

  if (isLoading) return <LoadingState />;

  if (!order) {
    return (
      <div className="p-8 text-center max-w-md mx-auto">
        <h3 className="text-xl font-bold text-[var(--danger)]">Manufacturing Order Not Found</h3>
        <p className="text-sm text-[var(--muted)] mt-2">The manufacturing order could not be located.</p>
        <Link href="/manufacturing/orders">
          <Button className="mt-6"><ArrowLeft className="h-4 w-4 mr-2" /> Back</Button>
        </Link>
      </div>
    );
  }

  const handleConfirm = async () => {
    try {
      await erpService.confirmManufacturingOrder(order.id);
      toast.success("Manufacturing Order confirmed.");
      queryClient.invalidateQueries({ queryKey: ["manufacturingOrder", id] });
    } catch (e: any) {
      toast.error(e.message || "Failed to confirm.");
    }
  };

  const handleStart = async () => {
    try {
      await erpService.startManufacturingOrder(order.id);
      toast.success("Manufacturing Order started.");
      queryClient.invalidateQueries({ queryKey: ["manufacturingOrder", id] });
    } catch (e: any) {
      toast.error(e.message || "Failed to start.");
    }
  };

  const handleProduce = async () => {
    try {
      await erpService.completeManufacturingOrder(order.id);
      toast.success("Manufacturing Order completed successfully.");
      queryClient.invalidateQueries({ queryKey: ["manufacturingOrder", id] });
    } catch (e: any) {
      toast.error(e.message || "Failed to produce.");
    }
  };

  const handleCancel = () => {
    toast.error("Cancellation is not currently supported by the backend system.");
  };

  return (
    <div className="max-w-6xl mx-auto py-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Link href="/manufacturing/orders">
            <Button variant="secondary" className="px-3">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back
            </Button>
          </Link>
          <Button 
            variant="primary" 
            disabled={order.status !== "draft"} 
            onClick={handleConfirm}
          >
            Confirm
          </Button>
          <Button 
            variant="secondary" 
            disabled={order.status !== "confirmed"} 
            onClick={handleStart}
          >
            <Play className="h-4 w-4 mr-2" /> Start
          </Button>
          <Button 
            variant="secondary" 
            disabled={order.status !== "in_progress" && order.status !== "confirmed"} 
            onClick={handleProduce}
            className="bg-emerald-600 hover:bg-emerald-700 text-white border-transparent"
          >
            <CheckCircle className="h-4 w-4 mr-2" /> Produce
          </Button>
          <Button 
            variant="secondary" 
            onClick={handleCancel}
            className="text-[var(--danger)] hover:bg-rose-50"
          >
            <XCircle className="h-4 w-4 mr-2" /> Cancel
          </Button>
        </div>
        <Link href={`/audit-logs?module=Manufacturing&entity=${order.id}`}>
          <Button variant="secondary">
            <Clock className="h-4 w-4 mr-2" /> Logs
          </Button>
        </Link>
      </div>

      <div className="flex items-center gap-4 mb-4 mt-2">
        <PageHeader 
          eyebrow="Manufacturing Order" 
          title={order.reference || order.id} 
          description="View and manage this production order."
        />
        <Badge tone={statusTone(order.status)} className="mt-2 text-sm uppercase px-3 py-1">
          {order.status}
        </Badge>
      </div>

      <Card className="p-6 mb-6 mt-4">
        <div className="grid grid-cols-2 gap-x-12 gap-y-6">
          <div className="space-y-4">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider mb-1">Finished Product</span>
              <span className="font-semibold">{order.finished_product?.name || "Unknown"}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider mb-1">Quantity</span>
              <span className="font-mono">{parseFloat(order.quantity).toFixed(2)} Units</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider mb-1">Bill of Material</span>
              <span className="font-semibold">{order.bom?.code || "Standard BOM"}</span>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider mb-1">Schedule Date</span>
              <span className="font-semibold">{order.scheduled_date || new Date(order.created_at).toLocaleDateString()}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider mb-1">Assignee</span>
              <span className="font-semibold">{order.assignee?.username || "Unassigned"}</span>
            </div>
          </div>
        </div>
      </Card>

      <div className="flex border-b border-[var(--border)] mb-4">
        <button
          className={`px-4 py-2 font-semibold text-sm transition-colors border-b-2 ${
            activeTab === "components" 
              ? "border-[var(--primary)] text-[var(--primary)]" 
              : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"
          }`}
          onClick={() => setActiveTab("components")}
        >
          Components
        </button>
        <button
          className={`px-4 py-2 font-semibold text-sm transition-colors border-b-2 ${
            activeTab === "work_orders" 
              ? "border-[var(--primary)] text-[var(--primary)]" 
              : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"
          }`}
          onClick={() => setActiveTab("work_orders")}
        >
          Work Orders
        </button>
      </div>

      <Card className="overflow-hidden border border-[var(--border)]">
        {activeTab === "components" && (
          <table className="w-full text-sm text-left">
            <thead className="bg-[var(--surface-muted)] text-[var(--muted)] border-b border-[var(--border)]">
              <tr>
                <th className="px-4 py-3 font-semibold">Component</th>
                <th className="px-4 py-3 font-semibold">Availability</th>
                <th className="px-4 py-3 font-semibold text-right">To Consume</th>
                <th className="px-4 py-3 font-semibold text-right">Consumed</th>
                <th className="px-4 py-3 font-semibold">Units</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {order.lines && order.lines.length > 0 ? (
                order.lines.map((line: any) => {
                  const req = parseFloat(line.quantity_required) || 0;
                  const res = parseFloat(line.quantity_reserved) || 0;
                  const availability = order.status === "draft" ? "Pending" : (res >= req ? "Available" : "Waiting");
                  
                  return (
                    <tr key={line.id} className="hover:bg-[var(--surface-muted)] transition">
                      <td className="px-4 py-3 font-semibold">{line.component?.name || `Component ${line.component}`}</td>
                      <td className="px-4 py-3">
                        <Badge tone={availability === "Available" ? "success" : "warning"}>
                          {availability}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right font-mono">{req.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right font-mono">{parseFloat(line.quantity_consumed).toFixed(2)}</td>
                      <td className="px-4 py-3">Units</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-[var(--muted)] italic">
                    No components required.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        {activeTab === "work_orders" && (
          <table className="w-full text-sm text-left">
            <thead className="bg-[var(--surface-muted)] text-[var(--muted)] border-b border-[var(--border)]">
              <tr>
                <th className="px-4 py-3 font-semibold">Operations</th>
                <th className="px-4 py-3 font-semibold">Work Center</th>
                <th className="px-4 py-3 font-semibold text-right">Duration</th>
                <th className="px-4 py-3 font-semibold text-right">Real Duration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {order.work_orders && order.work_orders.length > 0 ? (
                order.work_orders.map((wo: any) => (
                  <tr key={wo.id} className="hover:bg-[var(--surface-muted)] transition">
                    <td className="px-4 py-3 font-semibold">{wo.operation_name}</td>
                    <td className="px-4 py-3">{wo.work_center_name}</td>
                    <td className="px-4 py-3 text-right font-mono text-[var(--muted)]">--:--</td>
                    <td className="px-4 py-3 text-right font-mono text-[var(--muted)]">--:--</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-[var(--muted)] italic">
                    No work orders generated yet. (Confirm the order to generate routing)
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
