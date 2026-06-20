export type Status = "Draft" | "Confirmed" | "In Progress" | "Delayed" | "Completed" | "Critical" | "Healthy";

export type Product = {
  id: string;
  sku: string;
  name: string;
  category: string;
  onHand: number;
  reserved: number;
  incoming: number;
  unitCost: number;
  status: Status;
};

export type Customer = {
  id: string;
  name: string;
  segment: string;
  revenue: number;
  risk: "Low" | "Medium" | "High";
};

export type Vendor = {
  id: string;
  name: string;
  category: string;
  rating: number;
  leadTime: number;
  spend: number;
  status: Status;
};

export type Order = {
  id: string;
  party: string;
  value: number;
  due: string;
  status: Status;
  risk: "Low" | "Medium" | "High";
};

export type WorkOrder = {
  id: string;
  product: string;
  workCenter: string;
  stage: string;
  progress: number;
  priority: "Low" | "Medium" | "High";
};

export type InventoryTransaction = {
  id: string;
  product: string;
  type: "Receipt" | "Issue" | "Transfer" | "Adjustment";
  quantity: number;
  location: string;
  timestamp: string;
};

export type AuditEvent = {
  id: string;
  actor: string;
  module: string;
  severity: "Info" | "Warning" | "Critical";
  action: string;
  timestamp: string;
};
