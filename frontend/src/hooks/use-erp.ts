"use client";

import { useQuery } from "@tanstack/react-query";
import { erpService } from "@/services/erp-service";
import { useErpStore } from "@/stores/erp-store"; // fallback or for kpis if needed
import type { Order, Status } from "@/types/erp";

export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: erpService.dashboard,
  });
}

export function useProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: () => erpService.products().then((res: any) => res.results || res),
  });
}

export function useVendors() {
  return useQuery({
    queryKey: ["vendors"],
    queryFn: () => erpService.vendors().then((res: any) => res.results || res),
  });
}

export function useCustomers() {
  return useQuery({
    queryKey: ["customers"],
    queryFn: () => erpService.customers().then((res: any) => res.results || res),
  });
}

const mapOrder = (order: any, type: "sales" | "purchase"): Order => {
  const lines = order.lines || [];
  const value = lines.reduce((sum: number, line: any) => {
    const price = parseFloat(type === "sales" ? line.unit_price : line.unit_cost) || 0;
    const qty = parseFloat(line.quantity_ordered) || 0;
    return sum + (price * qty);
  }, 0);
  
  const statusRaw = order.status || "draft";
  let statusStr = statusRaw.charAt(0).toUpperCase() + statusRaw.slice(1);
  if (statusStr === "In_progress") statusStr = "In Progress";
  
  return {
    id: order.reference || order.id?.toString(),
    party: type === "sales" ? order.customer_name : order.vendor_name,
    value,
    due: order.created_at ? new Date(order.created_at).toLocaleDateString() : "",
    status: statusStr as Status,
    risk: "Low"
  };
};

export function useSalesOrders() {
  return useQuery({
    queryKey: ["salesOrders"],
    queryFn: () => erpService.salesOrders().then((res: any) => {
      const results = res.results || res;
      return Array.isArray(results) ? results.map((o) => mapOrder(o, "sales")) : [];
    }),
  });
}

export function usePurchaseOrders() {
  return useQuery({
    queryKey: ["purchaseOrders"],
    queryFn: () => erpService.purchaseOrders().then((res: any) => {
      const results = res.results || res;
      return Array.isArray(results) ? results.map((o) => mapOrder(o, "purchase")) : [];
    }),
  });
}

export function useWorkOrders() {
  return useQuery({
    queryKey: ["workOrders"],
    queryFn: () => erpService.workOrders().then((res: any) => res.results || res),
  });
}

export function useInventoryTransactions() {
  return useQuery({
    queryKey: ["inventoryTransactions"],
    queryFn: () => erpService.inventoryTransactions().then((res: any) => res.results || res),
  });
}

export function useAuditEvents() {
  return useQuery({
    queryKey: ["auditEvents"],
    queryFn: () => erpService.auditEvents().then((res: any) => res.results || res),
  });
}
