import type { AuditEvent, Customer, InventoryTransaction, Order, Product, Vendor, WorkOrder } from "@/types/erp";

const categories = ["Drone Components", "Industrial Frames", "Control Systems", "Raw Materials", "Packaging"];
const statuses = ["Draft", "Confirmed", "In Progress", "Delayed", "Completed", "Critical", "Healthy"] as const;
const stages = ["Draft", "Assembly", "Painting", "Quality Check", "Packaging", "Completed"];

export const products: Product[] = Array.from({ length: 520 }, (_, index) => ({
  id: `PRD-${(index + 1).toString().padStart(4, "0")}`,
  sku: `ORB-${1000 + index}`,
  name: `${["Titanium Housing", "Servo Assembly", "Optical Sensor", "Control Valve", "Aero Chassis"][index % 5]} ${index + 1}`,
  category: categories[index % categories.length],
  onHand: 80 + ((index * 17) % 900),
  reserved: 8 + ((index * 11) % 120),
  incoming: 20 + ((index * 7) % 160),
  unitCost: 24 + ((index * 19) % 820),
  status: statuses[index % statuses.length]
}));

export const customers: Customer[] = Array.from({ length: 220 }, (_, index) => ({
  id: `CUS-${(index + 1).toString().padStart(4, "0")}`,
  name: `${["Aster", "Northwind", "Helio", "Vertex", "Summit"][index % 5]} Manufacturing ${index + 1}`,
  segment: ["Aerospace", "Automotive", "Robotics", "Energy"][index % 4],
  revenue: 45000 + index * 3850,
  risk: (["Low", "Medium", "High"] as const)[index % 3]
}));

export const vendors: Vendor[] = Array.from({ length: 110 }, (_, index) => ({
  id: `VEN-${(index + 1).toString().padStart(4, "0")}`,
  name: `${["Titanium Corp", "Apex Materials", "Lumina Tech", "Global Swift", "North Star"][index % 5]} ${index + 1}`,
  category: ["Metals", "Electronics", "Logistics", "Packaging"][index % 4],
  rating: 72 + ((index * 3) % 28),
  leadTime: 4 + (index % 17),
  spend: 12000 + index * 5400,
  status: statuses[(index + 1) % statuses.length]
}));

export const salesOrders: Order[] = Array.from({ length: 320 }, (_, index) => ({
  id: `SO-2026-${(index + 1).toString().padStart(4, "0")}`,
  party: customers[index % customers.length].name,
  value: 18000 + index * 2175,
  due: `2026-07-${((index % 26) + 1).toString().padStart(2, "0")}`,
  status: statuses[(index + 2) % statuses.length],
  risk: (["Low", "Medium", "High"] as const)[index % 3]
}));

export const purchaseOrders: Order[] = Array.from({ length: 230 }, (_, index) => ({
  id: `PO-2026-${(index + 1).toString().padStart(4, "0")}`,
  party: vendors[index % vendors.length].name,
  value: 9000 + index * 1320,
  due: `2026-07-${((index % 26) + 1).toString().padStart(2, "0")}`,
  status: statuses[(index + 3) % statuses.length],
  risk: (["Medium", "Low", "High"] as const)[index % 3]
}));

export const workOrders: WorkOrder[] = Array.from({ length: 520 }, (_, index) => ({
  id: `WO-${(8800 + index).toString()}`,
  product: products[index % products.length].name,
  workCenter: ["CNC Station A", "Manual Assembly 4", "Painting Booth 2", "QC Lab", "Packaging Cell"][index % 5],
  stage: stages[index % stages.length],
  progress: 10 + ((index * 13) % 90),
  priority: (["Low", "Medium", "High"] as const)[index % 3]
}));

export const inventoryTransactions: InventoryTransaction[] = Array.from({ length: 5000 }, (_, index) => ({
  id: `ITX-${(index + 1).toString().padStart(5, "0")}`,
  product: products[index % products.length].name,
  type: (["Receipt", "Issue", "Transfer", "Adjustment"] as const)[index % 4],
  quantity: ((index * 9) % 180) - 60,
  location: ["WH-A1", "WH-B2", "LINE-3", "QC-HOLD"][index % 4],
  timestamp: `2026-06-${((index % 20) + 1).toString().padStart(2, "0")} ${((index % 12) + 8).toString().padStart(2, "0")}:00`
}));

export const auditEvents: AuditEvent[] = Array.from({ length: 80 }, (_, index) => ({
  id: `AUD-${(index + 1).toString().padStart(4, "0")}`,
  actor: ["Sarah Jenkins", "Markus Zhao", "Elena Rodriguez", "System Automation"][index % 4],
  module: ["BOM", "Inventory", "Procurement", "Manufacturing", "Security"][index % 5],
  severity: (["Info", "Warning", "Critical"] as const)[index % 3],
  action: ["updated routing step", "approved purchase order", "moved inventory", "changed role policy"][index % 4],
  timestamp: `2026-06-${((index % 20) + 1).toString().padStart(2, "0")} ${((index % 10) + 9).toString().padStart(2, "0")}:30`
}));

export const dashboardSeries = [
  { month: "Jan", revenue: 1.2, inventory: 78, production: 84 },
  { month: "Feb", revenue: 1.5, inventory: 82, production: 88 },
  { month: "Mar", revenue: 1.4, inventory: 76, production: 81 },
  { month: "Apr", revenue: 1.9, inventory: 88, production: 92 },
  { month: "May", revenue: 2.2, inventory: 91, production: 94 },
  { month: "Jun", revenue: 2.6, inventory: 86, production: 96 }
];
