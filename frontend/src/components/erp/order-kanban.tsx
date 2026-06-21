"use client";

import { Order } from "@/types/erp";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

export function OrderKanban({ orders, type }: { orders: Order[]; type: "sales" | "purchase" | "manufacturing" }) {
  // Define the columns based on typical statuses
  const statuses = type === "sales" 
    ? ["Draft", "Confirmed", "Partially Delivered", "Fully Delivered", "Cancelled"]
    : type === "purchase"
    ? ["Draft", "Confirmed", "Partially Received", "Fully Received", "Cancelled"]
    : ["Draft", "Confirmed", "In Progress", "Done", "Cancelled"];

  // Group orders by status
  const groupedOrders = statuses.reduce((acc, status) => {
    acc[status] = orders.filter(o => o.status === status);
    return acc;
  }, {} as Record<string, Order[]>);

  // Fallback for orders with unmapped statuses
  const otherOrders = orders.filter(o => !statuses.includes(o.status));
  if (otherOrders.length > 0) {
    statuses.push("Other");
    groupedOrders["Other"] = otherOrders;
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 min-h-[500px]">
      {statuses.map(status => (
        <div key={status} className="flex-shrink-0 w-[300px] flex flex-col gap-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-semibold text-[var(--foreground)] text-sm">{status}</h3>
            <span className="text-xs text-[var(--muted)] bg-[var(--surface-muted)] px-2 py-0.5 rounded-full">
              {groupedOrders[status].length}
            </span>
          </div>
          
          <div className="flex flex-col gap-3 bg-[var(--surface-muted)]/30 p-2 rounded-lg min-h-[200px] border border-[var(--border)]/50">
            {groupedOrders[status].map(order => {
              const dbId = order.dbId || order.id;
              const path = type === "sales" ? `/sales/orders/${dbId}` : 
                           type === "purchase" ? `/purchase/orders/${dbId}` : 
                           `/manufacturing/orders/${dbId}`;
              
              return (
                <Link key={order.id} href={path}>
                  <Card className="p-3 border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--primary)] hover:shadow-md transition cursor-pointer flex flex-col gap-2">
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-sm text-[var(--primary)]">{order.id}</span>
                      {type !== "manufacturing" ? (
                        <span className="text-xs font-semibold text-[var(--muted)]">{formatCurrency(order.value)}</span>
                      ) : (
                        <span className="text-xs font-semibold text-[var(--muted)]">{order.quantity} {order.unit}</span>
                      )}
                    </div>
                    <div className="text-sm font-medium text-[var(--foreground)] truncate">
                      {type === "manufacturing" ? order.finishedProduct : order.party}
                    </div>
                    <div className="flex justify-between items-end mt-1">
                      <span className="text-xs text-[var(--muted)]">{order.due || "No date"}</span>
                    </div>
                  </Card>
                </Link>
              );
            })}
            {groupedOrders[status].length === 0 && (
              <div className="text-center text-xs text-[var(--muted)] py-4 italic">
                No orders
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
