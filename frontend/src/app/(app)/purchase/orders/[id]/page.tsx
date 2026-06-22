"use client";

import { use, useState } from "react";
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
  
  const [receivedQuantities, setReceivedQuantities] = useState<Record<string, number>>({});

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
    mutationFn: (payload?: any) => erpService.receivePurchaseOrder(id, payload),
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
  
  const isDraft = order.status === "draft";
  const isConfirmed = order.status === "confirmed";
  const isPartial = order.status === "partially_received";
  const isReceived = order.status === "fully_received";
  const isCancelled = order.status === "cancelled";

  const isPostReceive = isReceived || isPartial || isCancelled;

  const totalValue = lines.reduce((sum: number, line: any) => {
    const cost = parseFloat(line.unit_cost) || 0;
    const qty = isPostReceive ? (parseFloat(line.quantity_received) || 0) : (parseFloat(line.quantity_ordered) || 0);
    return sum + (cost * qty);
  }, 0);

  const statusFormatted = formatStatus(order.status);

  const handleReceive = () => {
    const payload = {
      lines: lines.map((line: any) => ({
        line_id: line.id,
        quantity: receivedQuantities[line.id] !== undefined ? receivedQuantities[line.id] : (parseFloat(line.quantity_received) || 0)
      }))
    };
    receiveMutation.mutate(payload);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-4 font-sans pb-12">
      <div className="text-center md:text-left mb-6">
        <h1 className="text-xl text-[var(--muted)] font-medium mb-2">Purchase Order</h1>
        
        {/* Top Action Bar */}
        <div className="flex justify-between items-center">
          <div className="flex bg-[var(--surface)] border border-[var(--border)] rounded-md overflow-hidden shadow-sm">
            <Link href="/purchase/orders" className="px-5 py-2 text-sm font-medium border-r border-[var(--border)] hover:bg-[var(--surface-muted)] transition">
              Back
            </Link>
            
            <button 
              onClick={() => confirmMutation.mutate()} 
              disabled={!isDraft || confirmMutation.isPending}
              className={`px-5 py-2 text-sm border-r border-[var(--border)] transition ${isDraft ? 'hover:bg-[var(--surface-muted)] font-medium text-[var(--foreground)]' : 'text-[var(--muted)] cursor-not-allowed bg-[var(--surface-muted)]'}`}
            >
              Confirm
            </button>
            
            <button 
              onClick={handleReceive} 
              disabled={!(isConfirmed || isPartial) || receiveMutation.isPending}
              className={`px-5 py-2 text-sm border-r border-[var(--border)] transition ${(isConfirmed || isPartial) ? 'hover:bg-[var(--surface-muted)] font-medium text-[var(--foreground)]' : 'text-[var(--muted)] cursor-not-allowed bg-[var(--surface-muted)]'}`}
            >
              {receiveMutation.isPending ? "Receiving..." : "Receive"}
            </button>
            
            <button 
              onClick={() => cancelMutation.mutate()} 
              disabled={isCancelled || isReceived || cancelMutation.isPending}
              className={`px-5 py-2 text-sm transition ${(isCancelled || isReceived) ? 'text-[var(--muted)] cursor-not-allowed bg-[var(--surface-muted)]' : 'hover:bg-[var(--surface-muted)] font-medium text-[var(--foreground)]'}`}
            >
              Cancel
            </button>
          </div>

          <Link href={`/audit-logs?entity_type=PurchaseOrder&entity_id=${order.id}`} className="px-5 py-2 text-sm font-medium border border-[var(--border)] bg-[var(--surface)] rounded-md shadow-sm hover:bg-[var(--surface-muted)] transition flex items-center">
            Logs
          </Link>
        </div>
      </div>

      {/* Main Form View Card */}
      <Card className="border border-[var(--border)] bg-[var(--surface)] rounded-lg shadow-sm overflow-hidden">
        {/* Header */}
        <div className="p-6 flex justify-between items-center border-b border-[var(--border)]">
          <div className="text-xl font-bold border-2 border-dashed border-[var(--muted)] text-[var(--foreground)] px-4 py-2 rounded-md tracking-wider">
            {order.reference || `#${order.id}`}
          </div>
          <div className="text-lg font-semibold text-[var(--foreground)]">
            Status: {statusFormatted}
          </div>
        </div>

        {/* Top Details */}
        <div className="p-8 grid md:grid-cols-2 gap-x-12 gap-y-6 border-b border-[var(--border)]">
          <div className="space-y-6">
            <div className="grid grid-cols-[140px_1fr] items-end gap-4 text-sm">
              <span className="font-semibold text-[var(--foreground)]">Vendor</span>
              <span className="border-b border-[var(--muted)] pb-1 font-medium">{order.vendor_name}</span>
            </div>
            <div className="grid grid-cols-[140px_1fr] items-end gap-4 text-sm">
              <span className="font-semibold text-[var(--foreground)]">Vendor Address</span>
              <span className="border-b border-[var(--muted)] pb-1 min-h-[24px]"></span>
            </div>
            {order.created_by_system && (
              <div className="grid grid-cols-[140px_1fr] items-end gap-4 text-sm">
                <span className="font-semibold text-[var(--foreground)]">Source Document</span>
                <span className="border-b border-[var(--muted)] pb-1 font-medium">
                  {order.source_manufacturing_order ? (
                    <Link href={`/manufacturing/orders/${order.source_manufacturing_order}`} className="text-[var(--primary)] hover:underline">Auto (MO-{order.source_manufacturing_order})</Link>
                  ) : order.source_sales_order ? (
                    <Link href={`/sales/orders/${order.source_sales_order}`} className="text-[var(--primary)] hover:underline">Auto (SO-{order.source_sales_order})</Link>
                  ) : (
                    "System Generated"
                  )}
                </span>
              </div>
            )}
          </div>
          <div className="space-y-6">
            <div className="grid grid-cols-[140px_1fr] items-end gap-4 text-sm">
              <span className="font-semibold text-[var(--foreground)]">Creation Date</span>
              <span className="border-b border-[var(--muted)] pb-1 font-medium">{new Date(order.created_at).toLocaleDateString()}</span>
            </div>
            <div className="grid grid-cols-[140px_1fr] items-end gap-4 text-sm">
              <span className="font-semibold text-[var(--foreground)]">Responsible Person</span>
              <span className="border-b border-[var(--muted)] pb-1 min-h-[24px] font-medium">System</span>
            </div>
            {order.created_by_system && order.trigger_reason && (
              <div className="grid grid-cols-[140px_1fr] items-end gap-4 text-sm">
                <span className="font-semibold text-[var(--foreground)]">Procurement Reason</span>
                <span className="border-b border-[var(--muted)] pb-1 font-medium text-[var(--warning)]">{order.trigger_reason}</span>
              </div>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left bg-[var(--surface-muted)]">
                <th className="p-4 font-bold text-[var(--foreground)]">Products</th>
                <th className="p-4 font-bold text-[var(--foreground)]">Ordered Quantity</th>
                <th className="p-4 font-bold text-[var(--foreground)]">Received Quantity</th>
                <th className="p-4 font-bold text-[var(--foreground)]">Units</th>
                <th className="p-4 font-bold text-[var(--foreground)] text-right">Cost Unit Price</th>
                <th className="p-4 font-bold text-[var(--foreground)] text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line: any) => {
                const qty = parseFloat(line.quantity_ordered) || 0;
                const cost = parseFloat(line.unit_cost) || 0;
                const receivedQty = parseFloat(line.quantity_received) || 0;
                const subtotal = isPostReceive ? (receivedQty * cost) : (qty * cost);

                return (
                  <tr key={line.id} className="border-b border-[var(--border)] hover:bg-[var(--surface-muted)] transition">
                    <td className="p-4 font-medium">{line.product_name || `Product #${line.product}`}</td>
                    <td className="p-4">{qty}</td>
                    <td className="p-4">
                      {(isConfirmed || isPartial) ? (
                        <input 
                          type="number" 
                          min="0"
                          className="w-24 px-2 py-1 border border-[var(--border)] rounded bg-[var(--surface)] text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                          value={receivedQuantities[line.id] !== undefined ? receivedQuantities[line.id] : receivedQty}
                          onChange={(e) => setReceivedQuantities(prev => ({ ...prev, [line.id]: parseFloat(e.target.value) || 0 }))}
                        />
                      ) : (
                        receivedQty
                      )}
                    </td>
                    <td className="p-4">Units</td>
                    <td className="p-4 text-right">{formatCurrency(cost)}</td>
                    <td className="p-4 text-right font-bold">{formatCurrency(subtotal)}</td>
                  </tr>
                );
              })}
              {isDraft && (
                <tr className="border-b border-[var(--border)] bg-transparent">
                  <td colSpan={6} className="p-4 text-[var(--muted)] italic">Add a product</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Total */}
        <div className="p-8 flex justify-end bg-[var(--surface-muted)]/30">
          <div className="flex items-center gap-6 text-lg">
            <span className="font-bold text-[var(--foreground)]">Total:</span>
            <span className="border-b-2 border-[var(--muted)] min-w-[140px] text-right font-extrabold pb-1 text-[var(--primary)]">{formatCurrency(totalValue)}</span>
          </div>
        </div>
      </Card>
    </div>
  );
}

