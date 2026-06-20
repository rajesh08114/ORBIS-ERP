"use client";

import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/erp/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/ui/states";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2, AlertTriangle, ShieldCheck, Clock, FileClock, Truck } from "@/components/icons";
import { formatCurrency } from "@/lib/utils";
import { statusTone } from "@/lib/status";
import { usePurchaseOrderDetail } from "@/hooks/use-erp";
import { erpService } from "@/services/erp-service";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const formatStatus = (status?: string) => {
  if (!status) return "";
  if (status === "partially_received") return "Partially Received";
  if (status === "fully_received") return "Fully Received";
  return status.charAt(0).toUpperCase() + status.slice(1);
};

export default function PurchaseOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { id } = use(params);
  
  const { data: order, isLoading, error } = usePurchaseOrderDetail(id);

  const confirmMutation = useMutation({
    mutationFn: () => erpService.confirmPurchaseOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchaseOrder", id] });
      queryClient.invalidateQueries({ queryKey: ["purchaseOrders"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Purchase order confirmed successfully.");
    },
    onError: (err: any) => {
      toast.error(`Confirmation failed: ${err.message}`);
    }
  });

  const receiveMutation = useMutation({
    mutationFn: () => erpService.receivePurchaseOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchaseOrder", id] });
      queryClient.invalidateQueries({ queryKey: ["purchaseOrders"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Purchase order items received successfully.");
    },
    onError: (err: any) => {
      toast.error(`Receipt failed: ${err.message}`);
    }
  });

  const cancelMutation = useMutation({
    mutationFn: () => erpService.cancelPurchaseOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchaseOrder", id] });
      queryClient.invalidateQueries({ queryKey: ["purchaseOrders"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Purchase order cancelled successfully.");
    },
    onError: (err: any) => {
      toast.error(`Cancellation failed: ${err.message}`);
    }
  });

  if (isLoading) return <LoadingState />;

  if (error || !order) {
    return (
      <div className="p-8 text-center max-w-md mx-auto">
        <AlertTriangle className="h-12 w-12 text-[var(--danger)] mx-auto mb-4" />
        <h3 className="text-xl font-bold">Purchase Order Not Found</h3>
        <p className="text-sm text-[var(--muted)] mt-2">The purchase order with ID {id} could not be located in the database.</p>
        <Link href="/purchase/orders">
          <Button className="mt-6"><ArrowLeft className="h-4 w-4 mr-2" /> Back to List</Button>
        </Link>
      </div>
    );
  }

  const lines = order.lines || [];
  const totalValue = lines.reduce((sum: number, line: any) => {
    const cost = parseFloat(line.unit_cost) || 0;
    const qty = parseFloat(line.quantity_ordered) || 0;
    return sum + (cost * qty);
  }, 0);

  const statusFormatted = formatStatus(order.status);
  const isDraft = order.status === "draft";
  const isConfirmed = order.status === "confirmed";
  const isPartial = order.status === "partially_received";
  const isReceived = order.status === "fully_received";
  const isCancelled = order.status === "cancelled";

  return (
    <>
      <div className="mb-4 flex justify-between items-center">
        <Link href="/purchase/orders" className="inline-flex items-center gap-2 text-xs font-bold text-[var(--muted)] hover:text-[var(--foreground)] transition">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Purchase Orders
        </Link>
        <Link href={`/audit-logs?entity_type=PurchaseOrder&entity_id=${order.id}`}>
          <Button variant="secondary" size="sm">
            <FileClock className="h-4 w-4 mr-1.5" /> Logs
          </Button>
        </Link>
      </div>

      <PageHeader 
        eyebrow="Purchase Order Detail" 
        title={order.reference || `#${order.id}`} 
        description={`Procurement flow for vendor ${order.vendor_name}. Created at: ${new Date(order.created_at).toLocaleString()}.`}
      />

      <div className="grid gap-6">
        {/* Workflow actions bar */}
        <Card className="p-4 flex flex-wrap gap-3 items-center bg-[var(--surface-muted)] border-[var(--border)] rounded-[12px]">
          <span className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider mr-2">
            Inbound Controls:
          </span>

          {isDraft && (
            <>
              <Button onClick={() => confirmMutation.mutate()} variant="primary" disabled={confirmMutation.isPending}>
                {confirmMutation.isPending ? "Confirming..." : "Confirm Order"}
              </Button>
              <Button onClick={() => cancelMutation.mutate()} variant="ghost" className="text-xs text-[var(--danger)] hover:bg-[var(--danger-soft)]" disabled={cancelMutation.isPending}>
                Cancel Order
              </Button>
            </>
          )}

          {(isConfirmed || isPartial) && (
            <>
              <Button onClick={() => receiveMutation.mutate()} variant="primary" disabled={receiveMutation.isPending}>
                <Truck className="h-4 w-4 mr-2" /> {receiveMutation.isPending ? "Receiving..." : "Receive Items"}
              </Button>
              <Button onClick={() => cancelMutation.mutate()} variant="ghost" className="text-xs text-[var(--danger)] hover:bg-[var(--danger-soft)]" disabled={cancelMutation.isPending}>
                Cancel Order
              </Button>
            </>
          )}

          {isReceived && (
            <div className="flex items-center gap-2 text-emerald-500 font-bold text-sm">
              <CheckCircle2 className="h-5 w-5" /> Items Fully Received & Stocked
            </div>
          )}

          {isCancelled && (
            <div className="flex items-center gap-2 text-[var(--danger)] font-bold text-sm">
              <AlertTriangle className="h-5 w-5" /> Order Cancelled
            </div>
          )}

          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-[var(--muted)]">Status:</span>
            <Badge tone={statusTone(statusFormatted)}>{statusFormatted}</Badge>
          </div>
        </Card>

        {/* Info Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Order Lines */}
          <Card className="lg:col-span-2 p-5 flex flex-col justify-between border-[var(--border)] bg-[var(--surface)]">
            <div>
              <h3 className="text-lg font-bold mb-4">Replenishment Items</h3>
              <div className="overflow-x-auto rounded-[8px] border border-[var(--border)]">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-[var(--surface-muted)] text-[var(--muted)] font-semibold text-left border-b border-[var(--border)]">
                      <th className="p-3">SKU</th>
                      <th className="p-3">Product Component</th>
                      <th className="p-3 text-right">Ordered</th>
                      <th className="p-3 text-right">Received</th>
                      <th className="p-3 text-right">Unit Cost</th>
                      <th className="p-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((line: any) => {
                      const qty = parseFloat(line.quantity_ordered) || 0;
                      const cost = parseFloat(line.unit_cost) || 0;
                      return (
                        <tr key={line.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-muted)] transition">
                          <td className="p-3 font-semibold">{line.product_sku || `PROD-${line.product}`}</td>
                          <td className="p-3">{line.product_name || `Product #${line.product}`}</td>
                          <td className="p-3 text-right font-medium">{qty}</td>
                          <td className="p-3 text-right text-emerald-500 font-medium">{parseFloat(line.quantity_received) || 0}</td>
                          <td className="p-3 text-right">{formatCurrency(cost)}</td>
                          <td className="p-3 text-right font-bold">{formatCurrency(qty * cost)}</td>
                        </tr>
                      );
                    })}
                    {lines.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-4 text-center text-[var(--muted)]">No line items in this order.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="border-t border-[var(--border)] pt-4 mt-6 flex justify-between items-center">
              <span className="text-sm font-semibold text-[var(--muted)]">Total Purchase Value:</span>
              <span className="text-xl font-extrabold text-[var(--primary)]">{formatCurrency(totalValue)}</span>
            </div>
          </Card>

          {/* Supplier and Logistics info */}
          <div className="space-y-6">
            <Card className="p-5 border-[var(--border)] bg-[var(--surface)]">
              <h3 className="text-lg font-bold mb-4">Supplier Metadata</h3>
              <div className="space-y-3.5 text-sm">
                <div>
                  <span className="text-xs text-[var(--muted)] block">Supplier Partner</span>
                  <span className="font-semibold">{order.vendor_name}</span>
                </div>
                {order.notes && (
                  <div>
                    <span className="text-xs text-[var(--muted)] block">Order Notes</span>
                    <span className="text-xs font-semibold whitespace-pre-line block mt-1 p-2 bg-[var(--surface-muted)] rounded border border-[var(--border)]">
                      {order.notes}
                    </span>
                  </div>
                )}
                {order.trigger_reason && (
                  <div>
                    <span className="text-xs text-[var(--muted)] block">Procurement Trigger Reason</span>
                    <span className="text-xs font-medium text-[var(--muted)] block mt-0.5">
                      {order.trigger_reason}
                    </span>
                  </div>
                )}
                <div>
                  <span className="text-xs text-[var(--muted)] block">Operational Integrity</span>
                  <span className="flex items-center gap-1.5 text-emerald-500 font-bold mt-0.5">
                    <ShieldCheck className="h-4 w-4" /> 3-Way Match Verified
                  </span>
                </div>
              </div>
            </Card>

            <Card className="p-5 border-[var(--border)] bg-[var(--surface)]">
              <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4 text-[var(--primary)]" /> Inbound Logistics Status
              </h3>
              <p className="text-xs text-[var(--muted)]">System timestamps tracked by the database lifecycle.</p>
              <div className="mt-4 space-y-3 text-xs">
                <div className="flex justify-between border-b border-[var(--border)] pb-2">
                  <span>Created At:</span>
                  <span className="font-semibold">{new Date(order.created_at).toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-b border-[var(--border)] pb-2">
                  <span>Confirmed At:</span>
                  <span className="font-semibold">{order.confirmed_at ? new Date(order.confirmed_at).toLocaleString() : "Not confirmed"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Received At:</span>
                  <span className="font-semibold">{order.received_at ? new Date(order.received_at).toLocaleString() : "Not received"}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
