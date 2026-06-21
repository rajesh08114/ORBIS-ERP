export type Status = "Draft" | "Confirmed" | "In Progress" | "Delayed" | "Completed" | "Critical" | "Healthy";

export type Product = {
  id: string;
  sku: string;
  name: string;
  category: string;
  image?: string | null;
  onHand: number;
  reserved: number;
  incoming: number;
  unitCost: number;
  status: Status;
  salesPrice?: number;
  costPrice?: number;
  freeToUse?: number;
  procureOnDemand?: boolean;
  procurementType?: "purchase" | "manufacture";
  vendor_id?: string;
  bom_id?: string;
  vendor_name?: string;
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
  dbId?: number;
  party: string;
  value: number;
  due: string;
  status: Status;
  risk: "Low" | "Medium" | "High";
  scheduled_date?: string;
  finishedProduct?: string;
  quantity?: number;
  unit?: string;
  componentStatus?: string;
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

export type BomLine = {
  id?: number;
  component: number;
  quantity_required: number;
  operation?: number;
  sequence?: number;
};

export type Bom = {
  id: number;
  code: string;
  finished_product: number;
  quantity: number;
  version: number;
  is_active: boolean;
  notes: string;
  lines: BomLine[];
};
