"use client";

import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/erp/page-header";
import { TwinFlow } from "@/components/erp/twin-flow";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/ui/states";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2, AlertTriangle, ShieldCheck, Clock, FileClock } from "@/components/icons";
import { formatCurrency } from "@/lib/utils";
import { statusTone } from "@/lib/status";
import { useSalesOrderDetail } from "@/hooks/use-erp";
import { erpService } from "@/services/erp-service";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const formatStatus = (status?: string) => {
  if (!status) return "";
  if (status === "partially_delivered") return "Partially Delivered";
  if (status === "fully_delivered") return "Fully Delivered";
  return status.charAt(0).toUpperCase() + status.slice(1);
};

export default function SalesOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { id } = use(params);
  
  const { data: order, isLoading, error } = useSalesOrderDetail(id);

  const confirmMutation = useMutation({
    mutationFn: () => erpService.confirmSalesOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["salesOrder", id] });
      queryClient.invalidateQueries({ queryKey: ["salesOrders"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Sales order confirmed successfully.");
    },
    onError: (err: any) => {
      toast.error(`Confirmation failed: ${err.message || "Insufficient stock or error"}`);
    }
  });

  const deliverMutation = useMutation({
    mutationFn: () => erpService.deliverSalesOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["salesOrder", id] });
      queryClient.invalidateQueries({ queryKey: ["salesOrders"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Sales order delivered successfully.");
    },
    onError: (err: any) => {
      toast.error(`Delivery failed: ${err.message}`);
    }
  });

  const cancelMutation = useMutation({
    mutationFn: () => erpService.cancelSalesOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["salesOrder", id] });
      queryClient.invalidateQueries({ queryKey: ["salesOrders"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Sales order cancelled successfully.");
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
        <h3 className="text-xl font-bold">Order Not Found</h3>
        <p className="text-sm text-[var(--muted)] mt-2">The sales order with ID {id} could not be located in the database.</p>
        <Link href="/sales/orders">
          <Button className="mt-6"><ArrowLeft className="h-4 w-4 mr-2" /> Back to List</Button>
        </Link>
      </div>
    );
  }

  const lines = order.lines || [];
  const totalValue = lines.reduce((sum: number, line: any) => {
    const price = parseFloat(line.unit_price) || 0;
    const qty = parseFloat(line.quantity_ordered) || 0;
    return sum + (price * qty);
  }, 0);

  const statusFormatted = formatStatus(order.status);
  const isDraft = order.status === "draft";
  const isConfirmed = order.status === "confirmed";
  const isPartial = order.status === "partially_delivered";
  const isDelivered = order.status === "fully_delivered";
  const isCancelled = order.status === "cancelled";

  return (
    <>
      <div className="mb-4 flex justify-between items-center">
        <Link href="/sales/orders" className="inline-flex items-center gap-2 text-xs font-bold text-[var(--muted)] hover:text-[var(--foreground)] transition">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Sales Orders
        </Link>
        <Link href={`/audit-logs?entity_type=SalesOrder&entity_id=${order.id}`}>
          <Button variant="secondary" size="sm">
            <FileClock className="h-4 w-4 mr-1.5" /> Logs
          </Button>
        </Link>
      </div>

      <PageHeader 
        eyebrow="Sales Order Detail" 
        title={order.reference || `#${order.id}`} 
        description={`Fulfillment loop for customer ${order.customer_name}. Created at: ${new Date(order.created_at).toLocaleString()}.`}
      />

      <div className="grid gap-6">
        {/* Live workflow tracker */}
        <TwinFlow />

        {/* Workflow actions bar */}
        <Card className="p-4 flex flex-wrap gap-3 items-center bg-[var(--surface-muted)] border-[var(--border)] rounded-[12px]">
          <span className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider mr-2">
            Fulfillment Controls:
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
              <Button onClick={() => deliverMutation.mutate()} variant="primary" disabled={deliverMutation.isPending}>
                {deliverMutation.isPending ? "Delivering..." : "Deliver Remaining"}
              </Button>
              <Button onClick={() => cancelMutation.mutate()} variant="ghost" className="text-xs text-[var(--danger)] hover:bg-[var(--danger-soft)]" disabled={cancelMutation.isPending}>
                Cancel Order
              </Button>
            </>
          )}

          {isDelivered && (
            <div className="flex items-center gap-2 text-emerald-500 font-bold text-sm">
              <CheckCircle2 className="h-5 w-5" /> Order Fully Delivered & Dispatched
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

        {/* Detail grids */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Items */}
          <Card className="lg:col-span-2 p-5 flex flex-col justify-between border-[var(--border)] bg-[var(--surface)]">
            <div>
              <h3 className="text-lg font-bold mb-4">Order Line Items</h3>
              <div className="overflow-x-auto rounded-[8px] border border-[var(--border)]">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-[var(--surface-muted)] text-[var(--muted)] font-semibold text-left border-b border-[var(--border)]">
                      <th className="p-3">SKU</th>
                      <th className="p-3">Product</th>
                      <th className="p-3 text-right">Ordered</th>
                      <th className="p-3 text-right">Reserved</th>
                      <th className="p-3 text-right">Delivered</th>
                      <th className="p-3 text-right">Unit Price</th>
                      <th className="p-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((line: any) => {
                      const qty = parseFloat(line.quantity_ordered) || 0;
                      const price = parseFloat(line.unit_price) || 0;
                      return (
                        <tr key={line.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-muted)] transition">
                          <td className="p-3 font-semibold">{line.product_sku || `PROD-${line.product}`}</td>
                          <td className="p-3">{line.product_name || `Product #${line.product}`}</td>
                          <td className="p-3 text-right font-medium">{qty}</td>
                          <td className="p-3 text-right text-blue-500 font-medium">{parseFloat(line.quantity_reserved) || 0}</td>
                          <td className="p-3 text-right text-emerald-500 font-medium">{parseFloat(line.quantity_delivered) || 0}</td>
                          <td className="p-3 text-right">{formatCurrency(price)}</td>
                          <td className="p-3 text-right font-bold">{formatCurrency(qty * price)}</td>
                        </tr>
                      );
                    })}
                    {lines.length === 0 && (
                      <tr>
                        <td colSpan={7} className="p-4 text-center text-[var(--muted)]">No line items in this order.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="border-t border-[var(--border)] pt-4 mt-6 flex justify-between items-center">
              <span className="text-sm font-semibold text-[var(--muted)]">Total Order Value:</span>
              <span className="text-xl font-extrabold text-[var(--primary)]">{formatCurrency(totalValue)}</span>
            </div>
          </Card>

          {/* Logistics & Context info */}
          <div className="space-y-6">
            <Card className="p-5 border-[var(--border)] bg-[var(--surface)]">
              <h3 className="text-lg font-bold mb-4">Delivery & Customer</h3>
              <div className="space-y-3.5 text-sm">
                <div>
                  <span className="text-xs text-[var(--muted)] block">Customer Name</span>
                  <span className="font-semibold">{order.customer_name}</span>
                </div>
                {order.notes && (
                  <div>
                    <span className="text-xs text-[var(--muted)] block">Order Notes</span>
                    <span className="text-xs font-semibold whitespace-pre-line block mt-1 p-2 bg-[var(--surface-muted)] rounded border border-[var(--border)]">
                      {order.notes}
                    </span>
                  </div>
                )}
                <div>
                  <span className="text-xs text-[var(--muted)] block">Verification Status</span>
                  <span className="flex items-center gap-1.5 text-emerald-500 font-bold mt-0.5">
                    <ShieldCheck className="h-4 w-4" /> Operations Verified
                  </span>
                </div>
              </div>
            </Card>

            <Card className="p-5 border-[var(--border)] bg-[var(--surface)]">
              <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4 text-[var(--primary)]" /> System Tracking
              </h3>
              <p className="text-xs text-[var(--muted)] font-medium">Automatic timestamps tracked by the database lifecycle.</p>
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
                  <span>Delivered At:</span>
                  <span className="font-semibold">{order.delivered_at ? new Date(order.delivered_at).toLocaleString() : "Not delivered"}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
