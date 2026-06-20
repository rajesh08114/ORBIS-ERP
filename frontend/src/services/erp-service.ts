import {
  auditEvents,
  customers,
  dashboardSeries,
  inventoryTransactions,
  products,
  purchaseOrders,
  salesOrders,
  vendors,
  workOrders
} from "@/mocks/erp-data";

const wait = (ms = 10) => new Promise((resolve) => setTimeout(resolve, ms));

export const erpService = {
  async dashboard() {
    await wait();
    return {
      kpis: {
        revenue: 12800000,
        activeOrders: salesOrders.filter((order) => order.status !== "Completed").length,
        inventoryHealth: 92,
        manufacturingEfficiency: 96,
        procurementRisk: purchaseOrders.filter((order) => order.risk === "High").length
      },
      series: dashboardSeries,
      salesOrders: salesOrders.slice(0, 8),
      purchaseOrders: purchaseOrders.slice(0, 8),
      workOrders: workOrders.slice(0, 12)
    };
  },
  async products() {
    await wait();
    return products;
  },
  async customers() {
    await wait();
    return customers;
  },
  async vendors() {
    await wait();
    return vendors;
  },
  async salesOrders() {
    await wait();
    return salesOrders;
  },
  async purchaseOrders() {
    await wait();
    return purchaseOrders;
  },
  async workOrders() {
    await wait();
    return workOrders;
  },
  async inventoryTransactions() {
    await wait();
    return inventoryTransactions;
  },
  async auditEvents() {
    await wait();
    return auditEvents;
  }
};
