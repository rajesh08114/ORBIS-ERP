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
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["salesOrder", id] });
      queryClient.invalidateQueries({ queryKey: ["salesOrders"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      
      if (data?.procurements && data.procurements.length > 0) {
        data.procurements.forEach((proc: any) => {
          const typeName = proc.type === "PurchaseOrder" ? "Purchase Order" : "Manufacturing Order";
          toast.success(`Sales order confirmed! Auto-created ${typeName}: ${proc.reference} for ${proc.quantity} units of ${proc.product}.`, { duration: 6000 });
        });
      } else {
        toast.success("Sales order confirmed successfully.");
      }
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
    <div className="max-w-5xl mx-auto space-y-4 font-sans pb-12">
      <div className="text-center md:text-left mb-6">
        <h1 className="text-xl text-[var(--muted)] font-medium mb-2">Sales Order</h1>
        
        {/* Top Action Bar */}
        <div className="flex justify-between items-center">
          <div className="flex bg-[var(--surface)] border border-[var(--border)] rounded-md overflow-hidden shadow-sm">
            <Link href="/sales/orders" className="px-5 py-2 text-sm font-medium border-r border-[var(--border)] hover:bg-[var(--surface-muted)] transition">
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
              onClick={() => deliverMutation.mutate()} 
              disabled={!(isConfirmed || isPartial) || deliverMutation.isPending}
              className={`px-5 py-2 text-sm border-r border-[var(--border)] transition ${(isConfirmed || isPartial) ? 'hover:bg-[var(--surface-muted)] font-medium text-[var(--foreground)]' : 'text-[var(--muted)] cursor-not-allowed bg-[var(--surface-muted)]'}`}
            >
              Deliver
            </button>
            
            <button 
              onClick={() => cancelMutation.mutate()} 
              disabled={isCancelled || isDelivered || cancelMutation.isPending}
              className={`px-5 py-2 text-sm transition ${(isCancelled || isDelivered) ? 'text-[var(--muted)] cursor-not-allowed bg-[var(--surface-muted)]' : 'hover:bg-[var(--surface-muted)] font-medium text-[var(--foreground)]'}`}
            >
              Cancel
            </button>
          </div>

          <Link href={`/audit-logs?entity_type=SalesOrder&entity_id=${order.id}`} className="px-5 py-2 text-sm font-medium border border-[var(--border)] bg-[var(--surface)] rounded-md shadow-sm hover:bg-[var(--surface-muted)] transition flex items-center">
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
              <span className="font-semibold text-[var(--foreground)]">Customer</span>
              <span className="border-b border-[var(--muted)] pb-1 font-medium">{order.customer_name}</span>
            </div>
            <div className="grid grid-cols-[140px_1fr] items-end gap-4 text-sm">
              <span className="font-semibold text-[var(--foreground)]">Customer Address</span>
              <span className="border-b border-[var(--muted)] pb-1 min-h-[24px]"></span>
            </div>
          </div>
          <div className="space-y-6">
            <div className="grid grid-cols-[140px_1fr] items-end gap-4 text-sm">
              <span className="font-semibold text-[var(--foreground)]">Creation Date</span>
              <span className="border-b border-[var(--muted)] pb-1 font-medium">{new Date(order.created_at).toLocaleDateString()}</span>
            </div>
            <div className="grid grid-cols-[140px_1fr] items-end gap-4 text-sm">
              <span className="font-semibold text-[var(--foreground)]">Sales Person</span>
              <span className="border-b border-[var(--muted)] pb-1 min-h-[24px] font-medium">System</span>
            </div>
          </div>
        </div>

        {/* Linked Procurements */}
        {order.linked_procurements && order.linked_procurements.length > 0 && (
          <div className="px-8 py-4 bg-blue-50/50 border-b border-[var(--border)]">
            <h4 className="text-sm font-bold text-blue-900 mb-3 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-blue-500"></span>
              Auto-Triggered Procurements
            </h4>
            <div className="flex flex-col gap-2">
              {order.linked_procurements.map((proc: any, i: number) => (
                <div key={i} className="flex items-center gap-4 text-sm bg-white border border-blue-100 rounded p-2">
                  <span className="font-medium text-blue-800">
                    {proc.type === "PurchaseOrder" ? "Purchase Order" : "Manufacturing Order"}
                  </span>
                  <Link 
                    href={proc.type === "PurchaseOrder" ? `/purchase/orders/${proc.id}` : `/manufacturing/orders/${proc.id}`}
                    className="font-bold text-[var(--primary)] hover:underline"
                  >
                    {proc.reference}
                  </Link>
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200 uppercase tracking-wider">
                    {proc.status.replace("_", " ")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left bg-[var(--surface-muted)]">
                <th className="p-4 font-bold text-[var(--foreground)]">Products</th>
                <th className="p-4 font-bold text-[var(--foreground)]">Availability</th>
                <th className="p-4 font-bold text-[var(--foreground)]">Ordered Quantity</th>
                <th className="p-4 font-bold text-[var(--foreground)]">Delivered Quantity</th>
                <th className="p-4 font-bold text-[var(--foreground)]">Units</th>
                <th className="p-4 font-bold text-[var(--foreground)] text-right">Sales Unit Price</th>
                <th className="p-4 font-bold text-[var(--foreground)] text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line: any) => {
                const qty = parseFloat(line.quantity_ordered) || 0;
                const price = parseFloat(line.unit_price) || 0;
                return (
                  <tr key={line.id} className="border-b border-[var(--border)] hover:bg-[var(--surface-muted)] transition">
                    <td className="p-4 font-medium">{line.product_name || `Product #${line.product}`}</td>
                    <td className="p-4">{parseFloat(line.quantity_reserved) || 0}</td>
                    <td className="p-4">{qty}</td>
                    <td className="p-4">{parseFloat(line.quantity_delivered) || 0}</td>
                    <td className="p-4">Units</td>
                    <td className="p-4 text-right">{formatCurrency(price)}</td>
                    <td className="p-4 text-right font-bold">{formatCurrency(qty * price)}</td>
                  </tr>
                );
              })}
              <tr className="border-b border-[var(--border)] bg-transparent">
                <td colSpan={7} className="p-4 text-[var(--muted)] italic">Add a product</td>
              </tr>
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
