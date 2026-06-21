import { apiClient } from "@/lib/api-client";

export const erpService = {
  async dashboard() {
    return apiClient<any>("dashboard/");
  },
  async products() {
    return apiClient<any>("products/");
  },
  async customers() {
    return apiClient<any>("customers/");
  },
  async vendors() {
    return apiClient<any>("vendors/");
  },
  async salesOrders() {
    return apiClient<any>("sales-orders/");
  },
  async salesOrderDetail(id: string | number) {
    return apiClient<any>(`sales-orders/${id}/`);
  },
  async confirmSalesOrder(id: string | number) {
    return apiClient<any>(`sales-orders/${id}/confirm/`, { method: "POST" });
  },
  async deliverSalesOrder(id: string | number, payload?: any) {
    return apiClient<any>(`sales-orders/${id}/deliver/`, { method: "POST", body: JSON.stringify(payload) });
  },
  async cancelSalesOrder(id: string | number) {
    return apiClient<any>(`sales-orders/${id}/cancel/`, { method: "POST" });
  },
  async purchaseOrders() {
    return apiClient<any>("purchase-orders/");
  },
  async purchaseOrderDetail(id: string | number) {
    return apiClient<any>(`purchase-orders/${id}/`);
  },
  async confirmPurchaseOrder(id: string | number) {
    return apiClient<any>(`purchase-orders/${id}/confirm/`, { method: "POST" });
  },
  async receivePurchaseOrder(id: string | number, payload?: any) {
    return apiClient<any>(`purchase-orders/${id}/receive/`, { method: "POST", body: JSON.stringify(payload) });
  },
  async cancelPurchaseOrder(id: string | number) {
    return apiClient<any>(`purchase-orders/${id}/cancel/`, { method: "POST" });
  },
  async workOrders() {
    return apiClient<any>("work-orders/");
  },
  async inventoryTransactions() {
    return apiClient<any>("stock-movements/");
  },
  async auditEvents() {
    return apiClient<any>("audit-logs/");
  },
  async auditEntries(params?: Record<string, string | number>) {
    const cleanedParams = Object.fromEntries(
      Object.entries(params || {}).filter(([_, v]) => v !== undefined && v !== "")
    );
    const query = Object.keys(cleanedParams).length
      ? `?${new URLSearchParams(cleanedParams as any).toString()}`
      : "";
    return apiClient<any>(`audit-entries/${query}`);
  },
  async auditSummary() {
    return apiClient<any>("audit/summary/");
  },
  async manufacturingOrders() {
    return apiClient<any>("manufacturing-orders/");
  },
  async manufacturingOrderDetail(id: string | number) {
    return apiClient<any>(`manufacturing-orders/${id}/`);
  },
  async confirmManufacturingOrder(id: string | number) {
    return apiClient<any>(`manufacturing-orders/${id}/confirm/`, { method: "POST" });
  },
  async startManufacturingOrder(id: string | number) {
    return apiClient<any>(`manufacturing-orders/${id}/start/`, { method: "POST" });
  },
  async completeManufacturingOrder(id: string | number) {
    return apiClient<any>(`manufacturing-orders/${id}/complete/`, { method: "POST" });
  }
};

