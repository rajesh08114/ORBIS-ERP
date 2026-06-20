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
  async purchaseOrders() {
    return apiClient<any>("purchase-orders/");
  },
  async workOrders() {
    return apiClient<any>("work-orders/");
  },
  async inventoryTransactions() {
    return apiClient<any>("stock-movements/");
  },
  async auditEvents() {
    return apiClient<any>("audit-logs/");
  }
};
