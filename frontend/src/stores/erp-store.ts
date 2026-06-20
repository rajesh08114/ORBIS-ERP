"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { 
  products as initialProducts,
  customers as initialCustomers,
  vendors as initialVendors,
  salesOrders as initialSalesOrders,
  purchaseOrders as initialPurchaseOrders,
  workOrders as initialWorkOrders,
  inventoryTransactions as initialInventoryTransactions,
  auditEvents as initialAuditEvents
} from "@/mocks/erp-data";
import type { 
  Product, Customer, Vendor, Order, WorkOrder, InventoryTransaction, AuditEvent, Status 
} from "@/types/erp";
import type { UserRole } from "./auth-store";

export type BOMComponent = {
  name: string;
  qty: number;
  cost: number;
};

export type BillOfMaterial = {
  id: string;
  product: string;
  costRollup: number;
  components: BOMComponent[];
  routing: string[];
};

export type ErpUser = {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  status: "Active" | "Review";
};

export type PermissionAccess = "read" | "write" | "none";

export type RolePermission = {
  role: UserRole;
  permissions: {
    Sales: PermissionAccess;
    Procurement: PermissionAccess;
    Manufacturing: PermissionAccess;
    Governance: PermissionAccess;
    Admin: PermissionAccess;
  };
};

type ErpState = {
  products: Product[];
  customers: Customer[];
  vendors: Vendor[];
  salesOrders: Order[];
  purchaseOrders: Order[];
  workOrders: WorkOrder[];
  inventoryTransactions: InventoryTransaction[];
  auditEvents: AuditEvent[];
  users: ErpUser[];
  boms: BillOfMaterial[];
  rolePermissions: RolePermission[];

  // Actions
  addSalesOrder: (order: Omit<Order, "id" | "status" | "risk">) => void;
  updateSalesOrderStatus: (id: string, status: Status) => void;
  approveSalesOrder: (id: string) => void;
  releaseSalesOrderToMfg: (id: string) => void;
  
  addPurchaseOrder: (order: Omit<Order, "id" | "status" | "risk">) => void;
  approvePurchaseOrder: (id: string) => void;
  receivePurchaseOrder: (id: string) => void;
  
  addWorkOrder: (wo: Omit<WorkOrder, "id" | "progress">) => void;
  updateWorkOrderStage: (id: string, stage: string, progress: number) => void;
  
  addBOM: (bom: Omit<BillOfMaterial, "id">) => void;
  
  addUser: (user: Omit<ErpUser, "id">) => void;
  updateUserStatus: (id: string, status: "Active" | "Review") => void;
  
  updateRolePermissions: (role: UserRole, module: keyof RolePermission["permissions"], access: PermissionAccess) => void;
  addAuditEvent: (actor: string, module: string, severity: AuditEvent["severity"], action: string) => void;
};

// Default BOM mock
const defaultBOMs: BillOfMaterial[] = [
  {
    id: "BOM-0001",
    product: "Titanium Housing 1",
    costRollup: 842,
    components: [
      { name: "Titanium Raw Plates", qty: 2, cost: 240 },
      { name: "Fastener Set A", qty: 12, cost: 36 },
      { name: "Sealant Compound", qty: 1, cost: 45 },
      { name: "Balancing Weights", qty: 4, cost: 120 }
    ],
    routing: ["Machining", "Balancing Test", "Inspection"]
  },
  {
    id: "BOM-0002",
    product: "Servo Assembly 1",
    costRollup: 1250,
    components: [
      { name: "Micro Controller", qty: 1, cost: 450 },
      { name: "Copper Wire Spool", qty: 2, cost: 150 },
      { name: "Gear Set X", qty: 3, cost: 300 },
      { name: "Solder Paste", qty: 1, cost: 25 }
    ],
    routing: ["Winding", "Assembly", "Calibration"]
  }
];

// Initial Users
const defaultUsers: ErpUser[] = [
  { id: "USR-0001", username: "sarah.jenkins", email: "sarah.j@orbis.example", role: "Administrator", status: "Active" },
  { id: "USR-0002", username: "markus.zhao", email: "markus.z@orbis.example", role: "Inventory Manager", status: "Active" },
  { id: "USR-0003", username: "elena.rodriguez", email: "elena.r@orbis.example", role: "Procurement Manager", status: "Active" },
  { id: "USR-0004", username: "alex.kline", email: "alex.k@orbis.example", role: "Manufacturing Manager", status: "Active" },
  { id: "USR-0005", username: "julia.vance", email: "julia.v@orbis.example", role: "Sales Manager", status: "Active" }
];

// Initial Role Permissions Matrix
const defaultPermissions: RolePermission[] = [
  {
    role: "Administrator",
    permissions: { Sales: "write", Procurement: "write", Manufacturing: "write", Governance: "write", Admin: "write" }
  },
  {
    role: "Inventory Manager",
    permissions: { Sales: "read", Procurement: "read", Manufacturing: "read", Governance: "read", Admin: "none" }
  },
  {
    role: "Procurement Manager",
    permissions: { Sales: "none", Procurement: "write", Manufacturing: "read", Governance: "read", Admin: "none" }
  },
  {
    role: "Manufacturing Manager",
    permissions: { Sales: "none", Procurement: "read", Manufacturing: "write", Governance: "read", Admin: "none" }
  },
  {
    role: "Sales Manager",
    permissions: { Sales: "write", Procurement: "none", Manufacturing: "none", Governance: "read", Admin: "none" }
  }
];

export const useErpStore = create<ErpState>()(
  persist(
    (set, get) => ({
      products: initialProducts,
      customers: initialCustomers,
      vendors: initialVendors,
      salesOrders: initialSalesOrders,
      purchaseOrders: initialPurchaseOrders,
      workOrders: initialWorkOrders,
      inventoryTransactions: initialInventoryTransactions,
      auditEvents: initialAuditEvents,
      users: defaultUsers,
      boms: defaultBOMs,
      rolePermissions: defaultPermissions,

      addAuditEvent: (actor, module, severity, action) => {
        const newEvent: AuditEvent = {
          id: `AUD-${(get().auditEvents.length + 1).toString().padStart(4, "0")}`,
          actor,
          module,
          severity,
          action,
          timestamp: new Date().toISOString().replace("T", " ").substring(0, 19)
        };
        set((state) => ({ auditEvents: [newEvent, ...state.auditEvents] }));
      },

      addSalesOrder: (order) => {
        const id = `SO-2026-${(get().salesOrders.length + 1).toString().padStart(4, "0")}`;
        const newOrder: Order = {
          ...order,
          id,
          status: "Draft",
          risk: "Low"
        };
        set((state) => ({ salesOrders: [newOrder, ...state.salesOrders] }));
        get().addAuditEvent("System Operator", "Sales", "Info", `created sales order ${id} for ${order.party}`);
      },

      updateSalesOrderStatus: (id, status) => {
        set((state) => ({
          salesOrders: state.salesOrders.map((o) => o.id === id ? { ...o, status } : o)
        }));
        get().addAuditEvent("System Operator", "Sales", "Info", `updated sales order ${id} status to ${status}`);
      },

      approveSalesOrder: (id) => {
        const order = get().salesOrders.find((o) => o.id === id);
        if (!order) return;

        // Check Inventory Mock Validation
        // If we want a realistic business rule: check if any product has enough on hand
        // For simulation, let's say 20% of orders trigger a critical stock check failure
        const isStockOk = order.value % 5 !== 0;

        if (isStockOk) {
          set((state) => ({
            salesOrders: state.salesOrders.map((o) => o.id === id ? { ...o, status: "Confirmed", risk: "Low" } : o)
          }));
          get().addAuditEvent("System Operator", "Sales", "Info", `approved sales order ${id} (Inventory Available)`);
        } else {
          set((state) => ({
            salesOrders: state.salesOrders.map((o) => o.id === id ? { ...o, status: "Delayed", risk: "High" } : o)
          }));
          get().addAuditEvent("System Operator", "Sales", "Warning", `flagged sales order ${id} due to stock shortage`);
        }
      },

      releaseSalesOrderToMfg: (id) => {
        const order = get().salesOrders.find((o) => o.id === id);
        if (!order) return;

        // Change SO Status
        set((state) => ({
          salesOrders: state.salesOrders.map((o) => o.id === id ? { ...o, status: "In Progress" } : o)
        }));

        // Generate Manufacturing Order (WorkOrder)
        const mfgId = `WO-${(8800 + get().workOrders.length).toString()}`;
        const newMfg: WorkOrder = {
          id: mfgId,
          product: order.value % 2 === 0 ? "Titanium Housing 1" : "Servo Assembly 1",
          workCenter: "CNC Station A",
          stage: "Draft",
          progress: 0,
          priority: order.risk
        };

        set((state) => ({
          workOrders: [newMfg, ...state.workOrders]
        }));

        get().addAuditEvent("System Operator", "Manufacturing", "Info", `released sales order ${id} to production (${mfgId})`);
      },

      addPurchaseOrder: (order) => {
        const id = `PO-2026-${(get().purchaseOrders.length + 1).toString().padStart(4, "0")}`;
        const newOrder: Order = {
          ...order,
          id,
          status: "Draft",
          risk: "Low"
        };
        
        // Find product to increment its 'incoming' count
        const prodName = order.party.includes("Titanium") ? "Titanium Housing 1" : "Servo Assembly 1";
        set((state) => ({
          purchaseOrders: [newOrder, ...state.purchaseOrders],
          products: state.products.map((p) => p.name === prodName ? { ...p, incoming: p.incoming + 100 } : p)
        }));

        get().addAuditEvent("System Operator", "Procurement", "Info", `created purchase order ${id} for vendor ${order.party}`);
      },

      approvePurchaseOrder: (id) => {
        set((state) => ({
          purchaseOrders: state.purchaseOrders.map((o) => o.id === id ? { ...o, status: "Confirmed" } : o)
        }));
        get().addAuditEvent("System Operator", "Procurement", "Info", `approved purchase order ${id}`);
      },

      receivePurchaseOrder: (id) => {
        const po = get().purchaseOrders.find((o) => o.id === id);
        if (!po) return;

        const prodName = po.party.includes("Titanium") ? "Titanium Housing 1" : "Servo Assembly 1";
        const quantityReceived = 100; // Simulated bulk receipt

        set((state) => ({
          purchaseOrders: state.purchaseOrders.map((o) => o.id === id ? { ...o, status: "Completed" } : o),
          products: state.products.map((p) => p.name === prodName ? { 
            ...p, 
            onHand: p.onHand + quantityReceived, 
            incoming: Math.max(0, p.incoming - quantityReceived) 
          } : p)
        }));

        // Add to Inventory Ledger Transactions
        const txId = `ITX-${(get().inventoryTransactions.length + 1).toString().padStart(5, "0")}`;
        const newTx: InventoryTransaction = {
          id: txId,
          product: prodName,
          type: "Receipt",
          quantity: quantityReceived,
          location: "WH-A1",
          timestamp: new Date().toISOString().replace("T", " ").substring(0, 19)
        };

        set((state) => ({
          inventoryTransactions: [newTx, ...state.inventoryTransactions]
        }));

        get().addAuditEvent("System Operator", "Inventory", "Info", `received ${quantityReceived} units for ${prodName} from ${po.party} (TX: ${txId})`);
      },

      addWorkOrder: (wo) => {
        const id = `WO-${(8800 + get().workOrders.length).toString()}`;
        const newWo: WorkOrder = {
          ...wo,
          id,
          progress: 0
        };
        set((state) => ({ workOrders: [newWo, ...state.workOrders] }));
        get().addAuditEvent("System Operator", "Manufacturing", "Info", `created manufacturing order ${id} for product ${wo.product}`);
      },

      updateWorkOrderStage: (id, stage, progress) => {
        const wo = get().workOrders.find((w) => w.id === id);
        if (!wo) return;

        set((state) => ({
          workOrders: state.workOrders.map((w) => w.id === id ? { ...w, stage, progress } : w)
        }));

        if (stage === "Completed") {
          const qty = 50; // default batch quantity
          
          // Complete and add to stock
          set((state) => ({
            products: state.products.map((p) => p.name === wo.product ? { ...p, onHand: p.onHand + qty } : p)
          }));

          // Ledger Transaction
          const txId = `ITX-${(get().inventoryTransactions.length + 1).toString().padStart(5, "0")}`;
          const newTx: InventoryTransaction = {
            id: txId,
            product: wo.product,
            type: "Receipt",
            quantity: qty,
            location: "WH-A1",
            timestamp: new Date().toISOString().replace("T", " ").substring(0, 19)
          };

          set((state) => ({
            inventoryTransactions: [newTx, ...state.inventoryTransactions]
          }));

          get().addAuditEvent("System Operator", "Manufacturing", "Info", `completed production run for ${wo.product}. Staged ${qty} units to WH-A1 (TX: ${txId})`);
        } else {
          get().addAuditEvent("System Operator", "Manufacturing", "Info", `updated work order ${id} to stage ${stage} (${progress}%)`);
        }
      },

      addBOM: (bom) => {
        const id = `BOM-${(get().boms.length + 1).toString().padStart(4, "0")}`;
        const newBom: BillOfMaterial = {
          ...bom,
          id
        };
        set((state) => ({ boms: [newBom, ...state.boms] }));
        get().addAuditEvent("System Operator", "Manufacturing", "Info", `defined new BOM ${id} for parent product ${bom.product}`);
      },

      addUser: (user) => {
        const id = `USR-${(get().users.length + 1).toString().padStart(4, "0")}`;
        const newUser: ErpUser = {
          ...user,
          id
        };
        set((state) => ({ users: [...state.users, newUser] }));
        get().addAuditEvent("Administrator", "Security", "Info", `invited new user ${user.username} with role ${user.role}`);
      },

      updateUserStatus: (id, status) => {
        set((state) => ({
          users: state.users.map((u) => u.id === id ? { ...u, status } : u)
        }));
        get().addAuditEvent("Administrator", "Security", "Info", `updated user ${id} access status to ${status}`);
      },

      updateRolePermissions: (role, module, access) => {
        set((state) => ({
          rolePermissions: state.rolePermissions.map((rp) => 
            rp.role === role 
              ? { ...rp, permissions: { ...rp.permissions, [module]: access } }
              : rp
          )
        }));
        get().addAuditEvent("Administrator", "Security", "Warning", `modified clearance level of ${role} on ${module} module to ${access}`);
      }
    }),
    {
      name: "orbis-erp-data",
      partialize: (state) => ({
        products: state.products,
        customers: state.customers,
        vendors: state.vendors,
        salesOrders: state.salesOrders,
        purchaseOrders: state.purchaseOrders,
        workOrders: state.workOrders,
        inventoryTransactions: state.inventoryTransactions,
        auditEvents: state.auditEvents,
        users: state.users,
        boms: state.boms,
        rolePermissions: state.rolePermissions
      })
    }
  )
);
