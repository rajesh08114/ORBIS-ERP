"use client";

import { use } from "react";
import Link from "next/link";
import { useErpStore } from "@/stores/erp-store";
import { PageHeader } from "@/components/erp/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { statusTone } from "@/lib/status";
import { 
  ArrowLeft, 
  AlertTriangle, 
  TrendingUp, 
  ShoppingCart, 
  Plus, 
  Users, 
  CheckCircle2 
} from "@/components/icons";

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const customers = useErpStore((state) => state.customers);
  const salesOrders = useErpStore((state) => state.salesOrders);

  // Find customer by ID or matching Name
  const targetId = id.toUpperCase();
  const customer = customers.find((c) => c.id === targetId || c.name.toLowerCase().includes(id.toLowerCase()));

  if (!customer) {
    return (
      <div className="p-8 text-center max-w-md mx-auto">
        <AlertTriangle className="h-12 w-12 text-[var(--danger)] mx-auto mb-4" />
        <h3 className="text-xl font-bold">Customer Not Found</h3>
        <p className="text-sm text-[var(--muted)] mt-2">The customer with ID {id} could not be located in our records.</p>
        <Link href="/customers">
          <Button className="mt-6"><ArrowLeft className="h-4 w-4 mr-2" /> Back to Customers</Button>
        </Link>
      </div>
    );
  }

  // Filter sales orders for this customer
  const customerOrders = salesOrders.filter(
    (o) => o.party.toLowerCase() === customer.name.toLowerCase()
  );

  const activeOrdersCount = customerOrders.filter((o) => o.status !== "Completed").length;

  return (
    <>
      <div className="mb-4">
        <Link href="/customers" className="inline-flex items-center gap-2 text-xs font-bold text-[var(--muted)] hover:text-[var(--foreground)] transition">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Customers
        </Link>
      </div>

      <PageHeader 
        eyebrow={`Customer Details — ${customer.id}`} 
        title={customer.name} 
        description={`Profile and transactional audit logs for ${customer.name}.`}
      />

      <div className="grid gap-6 md:grid-cols-3">
        {/* Customer Metrics */}
        <Card className="p-5 flex flex-col justify-between border-[var(--border)] bg-[var(--surface)]">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider">Segment</span>
              <Badge tone="neutral">{customer.segment}</Badge>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-[var(--muted)]">Lifetime Revenue</span>
              <div className="text-2xl font-extrabold text-[var(--foreground)] flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
                {formatCurrency(customer.revenue)}
              </div>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
              <span className="text-xs text-[var(--muted)]">Risk Level</span>
              <Badge tone={customer.risk === "High" ? "danger" : customer.risk === "Medium" ? "warning" : "success"}>
                {customer.risk}
              </Badge>
            </div>
          </div>
          <div className="pt-6">
            <Link href={`/sales/orders/new?customer=${encodeURIComponent(customer.name)}`}>
              <Button className="w-full" variant="primary">
                <Plus className="h-4 w-4 mr-2" /> New Sales Order
              </Button>
            </Link>
          </div>
        </Card>

        {/* Transactional Summary */}
        <Card className="p-5 md:col-span-2 border-[var(--border)] bg-[var(--surface)]">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-[var(--primary)]" /> Order Fulfillment Status
          </h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-[8px] bg-[var(--surface-muted)] p-4 text-center border border-[var(--border)]">
              <span className="text-xs text-[var(--muted)] block">Total Orders</span>
              <span className="text-2xl font-black mt-1 block">{customerOrders.length}</span>
            </div>
            <div className="rounded-[8px] bg-[var(--surface-muted)] p-4 text-center border border-[var(--border)]">
              <span className="text-xs text-[var(--muted)] block">Active Orders</span>
              <span className="text-2xl font-black mt-1 text-[var(--primary)] block">{activeOrdersCount}</span>
            </div>
            <div className="rounded-[8px] bg-[var(--surface-muted)] p-4 text-center border border-[var(--border)]">
              <span className="text-xs text-[var(--muted)] block">Completed Orders</span>
              <span className="text-2xl font-black mt-1 text-emerald-500 block">
                {customerOrders.length - activeOrdersCount}
              </span>
            </div>
          </div>
        </Card>

        {/* Sales Order Ledger */}
        <Card className="md:col-span-3 border-[var(--border)] bg-[var(--surface)]">
          <CardHeader>
            <CardTitle>Sales Order History</CardTitle>
          </CardHeader>
          <CardContent>
            {customerOrders.length === 0 ? (
              <div className="py-8 text-center text-[var(--muted)] text-sm">
                No sales orders found for this customer.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-[8px] border border-[var(--border)]">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-[var(--surface-muted)] text-[var(--muted)] font-semibold text-left border-b border-[var(--border)]">
                      <th className="p-3">Order ID</th>
                      <th className="p-3">Due Date</th>
                      <th className="p-3 text-right">Value</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Risk</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customerOrders.map((order) => (
                      <tr key={order.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-muted)] transition">
                        <td className="p-3 font-semibold text-[var(--primary)]">{order.id}</td>
                        <td className="p-3">{order.due}</td>
                        <td className="p-3 text-right font-semibold">{formatCurrency(order.value)}</td>
                        <td className="p-3">
                          <Badge tone={statusTone(order.status)}>{order.status}</Badge>
                        </td>
                        <td className="p-3">
                          <Badge tone={order.risk === "High" ? "danger" : "success"}>{order.risk}</Badge>
                        </td>
                        <td className="p-3 text-right">
                          <Link href={`/sales/orders/${order.id}`}>
                            <Button variant="secondary" className="h-8 px-3 text-xs">View Loop</Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
