"use client";

import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useErpStore } from "@/stores/erp-store";
import { PageHeader } from "@/components/erp/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2, AlertTriangle, ShieldCheck, Truck, Clock } from "@/components/icons";
import { formatCurrency } from "@/lib/utils";
import { statusTone } from "@/lib/status";

export default function PurchaseOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  
  const orderId = id.toUpperCase();
  const order = useErpStore((state) => state.purchaseOrders.find((o) => o.id === orderId));
  const approvePurchaseOrder = useErpStore((state) => state.approvePurchaseOrder);
  const receivePurchaseOrder = useErpStore((state) => state.receivePurchaseOrder);

  if (!order) {
    return (
      <div className="p-8 text-center max-w-md mx-auto">
        <AlertTriangle className="h-12 w-12 text-[var(--danger)] mx-auto mb-4" />
        <h3 className="text-xl font-bold">Purchase Order Not Found</h3>
        <p className="text-sm text-[var(--muted)] mt-2">The purchase order with ID {orderId} could not be located.</p>
        <Link href="/purchase/orders">
          <Button className="mt-6"><ArrowLeft className="h-4 w-4 mr-2" /> Back to List</Button>
        </Link>
      </div>
    );
  }

  // Determine components based on the vendor or order value
  const isTitanium = order.party.includes("Titanium") || order.party.includes("Apex");
  const itemName = isTitanium ? "Titanium Housing 1" : "Servo Assembly 1";
  const itemSku = isTitanium ? "ORB-1001" : "ORB-1002";
  const unitCost = isTitanium ? 400 : 500;
  const qty = Math.max(1, Math.round(order.value / unitCost));
  
  const items = [
    { sku: itemSku, name: itemName, qty, price: unitCost, tax: Math.round(order.value * 0.05) }
  ];

  const handleApprove = () => {
    approvePurchaseOrder(order.id);
    toast.success("Purchase order approved. Awaiting delivery.");
  };

  const handleReceive = () => {
    receivePurchaseOrder(order.id);
    toast.success(`Received ${qty} units of ${itemName}. Stock levels and inventory ledger updated.`);
  };

  return (
    <>
      <div className="mb-4">
        <Link href="/purchase/orders" className="inline-flex items-center gap-2 text-xs font-bold text-[var(--muted)] hover:text-[var(--foreground)] transition">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Purchase Orders
        </Link>
      </div>

      <PageHeader 
        eyebrow="Purchase Order Detail" 
        title={order.id} 
        description={`Procurement flow for supplier ${order.party}. Delivery due: ${order.due}.`}
      />

      <div className="grid gap-6">
        {/* Fulfillment action bar */}
        <Card className="p-4 flex flex-wrap gap-3 items-center bg-[var(--surface-muted)] border-[var(--border)] rounded-[12px]">
          <span className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider mr-2">
            Inbound Controls:
          </span>

          {order.status === "Draft" && (
            <Button onClick={handleApprove} variant="primary">
              Approve Order
            </Button>
          )}

          {order.status === "Confirmed" && (
            <Button onClick={handleReceive} variant="primary">
              <Truck className="h-4 w-4 mr-2" /> Receive Items
            </Button>
          )}

          {order.status === "Completed" && (
            <div className="flex items-center gap-2 text-emerald-500 font-bold text-sm">
              <CheckCircle2 className="h-5 w-5" /> Items Received & Stocked
            </div>
          )}

          {order.status !== "Completed" && order.status !== "Draft" && order.status !== "Confirmed" && (
            <span className="text-sm font-semibold text-[var(--muted)]">Status: {order.status}</span>
          )}

          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-[var(--muted)]">Status:</span>
            <Badge tone={statusTone(order.status)}>{order.status}</Badge>
            <Badge tone={order.risk === "High" ? "danger" : "success"}>Supplier Risk: {order.risk}</Badge>
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
                      <th className="p-3 text-right">Qty</th>
                      <th className="p-3 text-right">Unit Price</th>
                      <th className="p-3 text-right">Est. Tax</th>
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
                        <td className="p-3 text-right font-bold">{formatCurrency(order.value)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="border-t border-[var(--border)] pt-4 mt-6 flex justify-between items-center">
              <span className="text-sm font-semibold text-[var(--muted)]">Total Purchase Value:</span>
              <span className="text-xl font-extrabold text-[var(--primary)]">{formatCurrency(order.value)}</span>
            </div>
          </Card>

          {/* Supplier and Logistics info */}
          <div className="space-y-6">
            <Card className="p-5 border-[var(--border)] bg-[var(--surface)]">
              <h3 className="text-lg font-bold mb-4">Supplier Metadata</h3>
              <div className="space-y-3.5 text-sm">
                <div>
                  <span className="text-xs text-[var(--muted)] block">Supplier Partner</span>
                  <span className="font-semibold">{order.party}</span>
                </div>
                <div>
                  <span className="text-xs text-[var(--muted)] block">Expected Delivery Target</span>
                  <span className="font-semibold">{order.due}</span>
                </div>
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
              <p className="text-xs text-[var(--muted)]">Automated tracking status derived from carrier updates.</p>
              <div className="mt-4 space-y-3 text-xs">
                <div className="flex justify-between border-b border-[var(--border)] pb-2">
                  <span>Routing Step:</span>
                  <span className="font-semibold">Customs Clearance</span>
                </div>
                <div className="flex justify-between">
                  <span>Warehouse Hub Location:</span>
                  <span className="font-semibold">WH-A1 Bay 4</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
