"use client";

import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useErpStore } from "@/stores/erp-store";
import { PageHeader } from "@/components/erp/page-header";
import { TwinFlow } from "@/components/erp/twin-flow";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2, AlertTriangle, ShieldCheck } from "@/components/icons";
import { formatCurrency } from "@/lib/utils";
import { statusTone } from "@/lib/status";

export default function SalesOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  
  const orderId = id.toUpperCase();
  const order = useErpStore((state) => state.salesOrders.find((o) => o.id === orderId));
  const approveSalesOrder = useErpStore((state) => state.approveSalesOrder);
  const releaseSalesOrderToMfg = useErpStore((state) => state.releaseSalesOrderToMfg);
  const updateSalesOrderStatus = useErpStore((state) => state.updateSalesOrderStatus);
  
  // Find matching work order if released to manufacturing
  const matchingWo = useErpStore((state) => 
    state.workOrders.find((w) => w.product === "Titanium Housing 1" || w.product === "Servo Assembly 1")
  );

  if (!order) {
    return (
      <div className="p-8 text-center max-w-md mx-auto">
        <AlertTriangle className="h-12 w-12 text-[var(--danger)] mx-auto mb-4" />
        <h3 className="text-xl font-bold">Order Not Found</h3>
        <p className="text-sm text-[var(--muted)] mt-2">The sales order with ID {orderId} could not be located in the database.</p>
        <Link href="/sales/orders">
          <Button className="mt-6"><ArrowLeft className="h-4 w-4 mr-2" /> Back to List</Button>
        </Link>
      </div>
    );
  }

  // Generate deterministic order items based on the order value
  const items = [
    { sku: "ORB-1001", name: "Titanium Housing 1", qty: 25, price: 400, tax: 1000 },
    { sku: "ORB-1002", name: "Servo Assembly 1", qty: 15, price: 500, tax: 750 }
  ];

  const handleApprove = () => {
    approveSalesOrder(order.id);
    // Reload state checks
    const updated = useErpStore.getState().salesOrders.find((o) => o.id === orderId);
    if (updated?.status === "Delayed") {
      toast.error("Approval delayed: Insufficient inventory on hand!");
    } else {
      toast.success("Sales order approved and locked.");
    }
  };

  const handleRelease = () => {
    releaseSalesOrderToMfg(order.id);
    toast.success("Sales order released to manufacturing queue successfully.");
  };

  const handleComplete = () => {
    updateSalesOrderStatus(order.id, "Completed");
    toast.success("Sales order marked as dispatched and completed.");
  };

  return (
    <>
      <div className="mb-4">
        <Link href="/sales/orders" className="inline-flex items-center gap-2 text-xs font-bold text-[var(--muted)] hover:text-[var(--foreground)] transition">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Sales Orders
        </Link>
      </div>

      <PageHeader 
        eyebrow="Sales Order Detail" 
        title={order.id} 
        description={`Fulfillment loop for ${order.party}. Delivery target: ${order.due}.`}
      />

      <div className="grid gap-6">
        {/* Live workflow tracker */}
        <TwinFlow />

        {/* Workflow actions bar */}
        <Card className="p-4 flex flex-wrap gap-3 items-center bg-[var(--surface-muted)] border-[var(--border)] rounded-[12px]">
          <span className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider mr-2">
            Fulfillment Controls:
          </span>

          {order.status === "Draft" && (
            <Button onClick={handleApprove} variant="primary">
              Approve Order
            </Button>
          )}

          {order.status === "Delayed" && (
            <>
              <Button onClick={handleApprove} variant="primary">
                Re-check Stock & Approve
              </Button>
              <Link href="/purchase/orders">
                <Button variant="secondary">Create Replenishment PO</Button>
              </Link>
              <Link href="/manufacturing/orders">
                <Button variant="secondary">Create Production Run</Button>
              </Link>
            </>
          )}

          {order.status === "Confirmed" && (
            <Button onClick={handleRelease} variant="primary">
              Release to MFG (Start Production)
            </Button>
          )}

          {order.status === "In Progress" && (
            <Button onClick={handleComplete} variant="primary">
              Mark Completed (Ship Items)
            </Button>
          )}

          {order.status === "Completed" && (
            <div className="flex items-center gap-2 text-emerald-500 font-bold text-sm">
              <CheckCircle2 className="h-5 w-5" /> Order Complete & Dispatched
            </div>
          )}

          {order.status !== "Completed" && (
            <Button 
              onClick={() => {
                updateSalesOrderStatus(order.id, "Draft");
                toast.info("Sales order reset to Draft.");
              }}
              variant="ghost" 
              className="text-xs text-[var(--muted)]"
            >
              Reset Draft
            </Button>
          )}

          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-[var(--muted)]">Status:</span>
            <Badge tone={statusTone(order.status)}>{order.status}</Badge>
            <Badge tone={order.risk === "High" ? "danger" : "success"}>Risk: {order.risk}</Badge>
          </div>
        </Card>

        {/* Detail grids */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Items */}
          <Card className="lg:col-span-2 p-5 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold mb-4">Order Line Items</h3>
              <div className="overflow-x-auto rounded-[8px] border border-[var(--border)]">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-[var(--surface-muted)] text-[var(--muted)] font-semibold text-left border-b border-[var(--border)]">
                      <th className="p-3">SKU</th>
                      <th className="p-3">Product</th>
                      <th className="p-3 text-right">Qty</th>
                      <th className="p-3 text-right">Unit Price</th>
                      <th className="p-3 text-right">Tax</th>
                      <th className="p-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.sku} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-muted)] transition">
                        <td className="p-3 font-semibold">{item.sku}</td>
                        <td className="p-3">{item.name}</td>
                        <td className="p-3 text-right">{item.qty}</td>
                        <td className="p-3 text-right">{formatCurrency(item.price)}</td>
                        <td className="p-3 text-right">{formatCurrency(item.tax)}</td>
                        <td className="p-3 text-right font-bold">{formatCurrency((item.qty * item.price) + item.tax)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="border-t border-[var(--border)] pt-4 mt-6 flex justify-between items-center">
              <span className="text-sm font-semibold text-[var(--muted)]">Total Order Value:</span>
              <span className="text-xl font-extrabold text-[var(--primary)]">{formatCurrency(order.value)}</span>
            </div>
          </Card>

          {/* Logistics & Audit */}
          <div className="space-y-6">
            <Card className="p-5">
              <h3 className="text-lg font-bold mb-4">Delivery & Fulfillment</h3>
              <div className="space-y-3.5 text-sm">
                <div>
                  <span className="text-xs text-[var(--muted)] block">Customer Name</span>
                  <span className="font-semibold">{order.party}</span>
                </div>
                <div>
                  <span className="text-xs text-[var(--muted)] block">Fulfillment Target</span>
                  <span className="font-semibold">{order.due}</span>
                </div>
                <div>
                  <span className="text-xs text-[var(--muted)] block">Clearance Level</span>
                  <span className="flex items-center gap-1.5 text-emerald-500 font-bold mt-0.5">
                    <ShieldCheck className="h-4 w-4" /> Operations Approved
                  </span>
                </div>
              </div>
            </Card>

            {order.status === "In Progress" && matchingWo && (
              <Card className="p-5 border-emerald-500/20 bg-emerald-500/5">
                <h3 className="text-lg font-bold mb-2">Linked Work Order</h3>
                <p className="text-xs text-[var(--muted)] mb-4">Production queue is currently executing active operations.</p>
                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between">
                    <span>Order Reference:</span>
                    <Link href={`/manufacturing/work-orders/${matchingWo.id}`} className="font-bold text-[var(--primary)] hover:underline">
                      {matchingWo.id}
                    </Link>
                  </div>
                  <div className="flex justify-between">
                    <span>Product:</span>
                    <span className="font-semibold">{matchingWo.product}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Stage:</span>
                    <span className="font-semibold text-emerald-500">{matchingWo.stage}</span>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
