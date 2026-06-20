"use client";

import { useErpStore } from "@/stores/erp-store";

export function useDashboard() {
  const salesOrders = useErpStore((state) => state.salesOrders);
  const purchaseOrders = useErpStore((state) => state.purchaseOrders);
  const workOrders = useErpStore((state) => state.workOrders);

  return {
    isLoading: false,
    data: {
      kpis: {
        revenue: 12800000 + salesOrders.reduce((sum, o) => o.status === "Completed" ? sum + o.value : sum, 0),
        activeOrders: salesOrders.filter((order) => order.status !== "Completed").length,
        inventoryHealth: 92,
        manufacturingEfficiency: 96,
        procurementRisk: purchaseOrders.filter((order) => order.risk === "High" && order.status !== "Completed").length
      },
      salesOrders: salesOrders.slice(0, 8),
      purchaseOrders: purchaseOrders.slice(0, 8),
      workOrders: workOrders.slice(0, 12)
    }
  };
}

export function useProducts() {
  const products = useErpStore((state) => state.products);
  return { data: products, isLoading: false };
}

export function useVendors() {
  const vendors = useErpStore((state) => state.vendors);
  return { data: vendors, isLoading: false };
}

export function useSalesOrders() {
  const salesOrders = useErpStore((state) => state.salesOrders);
  return { data: salesOrders, isLoading: false };
}

export function usePurchaseOrders() {
  const purchaseOrders = useErpStore((state) => state.purchaseOrders);
  return { data: purchaseOrders, isLoading: false };
}

export function useWorkOrders() {
  const workOrders = useErpStore((state) => state.workOrders);
  return { data: workOrders, isLoading: false };
}

export function useInventoryTransactions() {
  const inventoryTransactions = useErpStore((state) => state.inventoryTransactions);
  return { data: inventoryTransactions, isLoading: false };
}

export function useAuditEvents() {
  const auditEvents = useErpStore((state) => state.auditEvents);
  return { data: auditEvents, isLoading: false };
}
