"use client";

import { useQuery } from "@tanstack/react-query";
import { erpService } from "@/services/erp-service";
import { useAuthStore } from "@/stores/auth-store";
import { apiClient } from "@/lib/api-client";
import type { Order, Status, WorkOrder } from "@/types/erp";

export function useDashboard() {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: erpService.dashboard,
    enabled: !!user,
  });
}

export function useProducts() {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: ["products"],
    queryFn: () => erpService.products().then((res: any) => {
      const results = res.results || res;
      return Array.isArray(results) ? results.map((p: any) => ({
        ...p,
        id: p.id?.toString(),
        onHand: parseFloat(p.on_hand_quantity) || 0,
        reserved: parseFloat(p.reserved_quantity) || 0,
        incoming: 0,
        unitCost: parseFloat(p.cost_price) || 0,
        salesPrice: parseFloat(p.sales_price) || 0,
        costPrice: parseFloat(p.cost_price) || 0,
        freeToUse: parseFloat(p.free_to_use_quantity) || 0,
        procureOnDemand: p.procure_on_demand,
        procurementType: p.procurement_type,
        vendor_id: p.vendor?.toString(),
        bom_id: p.default_bom?.toString(),
        vendor_name: p.vendor_name,
        status: (parseFloat(p.on_hand_quantity) - parseFloat(p.reserved_quantity || 0)) <= 5
          ? "Critical"
          : (parseFloat(p.on_hand_quantity) - parseFloat(p.reserved_quantity || 0)) <= 20
          ? "Delayed"
          : "Healthy",
      })) : [];
    }),
    enabled: !!user,
  });
}

export function useProductDetail(id: string) {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: ["product", id],
    queryFn: () => apiClient<any>(`products/${id}/`),
    enabled: !!user && id !== "new",
  });
}

export function useVendors() {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: ["vendors"],
    queryFn: () => erpService.vendors().then((res: any) => res.results || res),
    enabled: !!user,
  });
}

export function useCustomers() {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: ["customers"],
    queryFn: () => erpService.customers().then((res: any) => res.results || res),
    enabled: !!user,
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
    dbId: order.id,
    party: type === "sales" ? order.customer_name : order.vendor_name,
    value,
    due: order.created_at ? new Date(order.created_at).toLocaleDateString() : "",
    status: statusStr as Status,
    risk: "Low",
    scheduled_date: order.scheduled_date,
    source_sales_order: order.source_sales_order,
    source_manufacturing_order: order.source_manufacturing_order,
    trigger_reason: order.trigger_reason,
    created_by_system: order.created_by_system
  };
};

export function useSalesOrders() {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: ["salesOrders"],
    queryFn: () => erpService.salesOrders().then((res: any) => {
      const results = res.results || res;
      return Array.isArray(results) ? results.map((o) => mapOrder(o, "sales")) : [];
    }),
    enabled: !!user,
  });
}

export function usePurchaseOrders() {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: ["purchaseOrders"],
    queryFn: () => erpService.purchaseOrders().then((res: any) => {
      const results = res.results || res;
      return Array.isArray(results) ? results.map((o) => mapOrder(o, "purchase")) : [];
    }),
    enabled: !!user,
  });
}

const mapManufacturingOrder = (order: any): Order => {
  const statusRaw = order.status || "draft";
  let statusStr = statusRaw.charAt(0).toUpperCase() + statusRaw.slice(1);
  if (statusStr === "In_progress") statusStr = "In Progress";
  
  return {
    id: order.reference || order.id?.toString(),
    dbId: order.id,
    party: order.assignee?.username || "Unassigned", // Assignee maps to party for generic views
    value: parseFloat(order.quantity) || 0, // In manufacturing, we often care about quantity
    due: order.created_at ? new Date(order.created_at).toLocaleDateString() : "",
    status: statusStr as Status,
    risk: "Low",
    scheduled_date: order.scheduled_date,
    finishedProduct: order.finished_product?.name || "Unknown Product",
    quantity: parseFloat(order.quantity) || 0,
    unit: "Units", // Default unit
    componentStatus: order.status === "draft" ? "Draft" : "Available", // Simplified for now
    source_sales_order: order.source_sales_order,
    trigger_reason: order.trigger_reason,
    created_by_system: order.created_by_system
  };
};

export function useManufacturingOrders() {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: ["manufacturingOrders"],
    queryFn: () => erpService.manufacturingOrders().then((res: any) => {
      const results = res.results || res;
      return Array.isArray(results) ? results.map(mapManufacturingOrder) : [];
    }),
    enabled: !!user,
  });
}

export function useManufacturingOrderDetail(id: string | number) {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: ["manufacturingOrder", id],
    queryFn: () => erpService.manufacturingOrderDetail(id),
    enabled: !!user && !!id,
  });
}

const mapWorkOrder = (wo: any): WorkOrder => {
  let stage = "Draft";
  let progress = 0;
  if (wo.status === "ready") {
    stage = "Assembly";
    progress = 25;
  } else if (wo.status === "in_progress") {
    stage = "Painting";
    progress = 50;
  } else if (wo.status === "done") {
    stage = "Completed";
    progress = 100;
  }
  
  return {
    id: wo.id?.toString() || "",
    product: wo.product_name || "Titanium Housing 1",
    workCenter: wo.work_center_name || "CNC Station A",
    stage,
    progress,
    priority: "Medium",
  };
};

export function useWorkOrders() {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: ["workOrders"],
    queryFn: () => erpService.workOrders().then((res: any) => {
      const results = res.results || res;
      return Array.isArray(results) ? results.map(mapWorkOrder) : [];
    }),
    enabled: !!user,
  });
}

export function useInventoryTransactions() {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: ["inventoryTransactions"],
    queryFn: () => erpService.inventoryTransactions().then((res: any) => res.results || res),
    enabled: !!user,
  });
}

export function useAuditEvents() {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: ["auditEvents"],
    queryFn: () => erpService.auditEvents().then((res: any) => res.results || res),
    enabled: !!user,
  });
}

export function useAuditEntries(params?: Record<string, string | number>) {
  const user = useAuthStore((s) => s.user);
  return useQuery<any>({
    queryKey: ["auditEntries", params],
    queryFn: () => erpService.auditEntries(params),
    enabled: !!user,
  });
}

export function useAuditSummary() {
  const user = useAuthStore((s) => s.user);
  return useQuery<any>({
    queryKey: ["auditSummary"],
    queryFn: () => erpService.auditSummary(),
    enabled: !!user,
  });
}

export function useSalesOrderDetail(id: string | number) {
  const user = useAuthStore((s) => s.user);
  return useQuery<any>({
    queryKey: ["salesOrder", id],
    queryFn: () => erpService.salesOrderDetail(id),
    enabled: !!user && !!id,
  });
}

export function usePurchaseOrderDetail(id: string | number) {
  const user = useAuthStore((s) => s.user);
  return useQuery<any>({
    queryKey: ["purchaseOrder", id],
    queryFn: () => erpService.purchaseOrderDetail(id),
    enabled: !!user && !!id,
  });
}

export function useBoms() {
  const user = useAuthStore((s) => s.user);
  return useQuery<any>({
    queryKey: ["boms"],
    queryFn: () => apiClient<any>("boms/").then((res: any) => res.results || res),
    enabled: !!user,
  });
}

export function useBomDetail(id: string | number) {
  const user = useAuthStore((s) => s.user);
  return useQuery<any>({
    queryKey: ["bom", id],
    queryFn: () => apiClient<any>(`boms/${id}/`),
    enabled: !!user && !!id && id !== "new",
  });
}

export function useOperations() {
  const user = useAuthStore((s) => s.user);
  return useQuery<any>({
    queryKey: ["operations"],
    queryFn: () => apiClient<any>("operations/").then((res: any) => res.results || res),
    enabled: !!user,
  });
}

