"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useDashboard, useCustomers, useProducts, useVendors } from "@/hooks/use-erp";
import { LoadingState } from "@/components/ui/states";
import { useAuthStore } from "@/stores/auth-store";
import { useUiStore } from "@/stores/ui-store";
import { useErpStore } from "@/stores/erp-store";
import { ProfileDropdown } from "@/components/layout/profile-dropdown";
import { MetricCard } from "@/components/erp/metric-card";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import {
  Menu,
  ReceiptText,
  ShoppingCart,
  Factory,
  ClipboardList,
  ShieldCheck,
  PackageSearch,
  Warehouse,
  Truck,
  Plus,
  Users,
  AlertTriangle,
  Person
} from "@/components/icons";

function MetricBox({ value, label, onClick }: { value: number | string; label: string; onClick?: () => void }) {
  return (
    <div 
      onClick={onClick}
      className="flex items-center gap-2.5 px-4 py-2 border border-[var(--border)] rounded-full bg-[var(--surface-muted)] hover:bg-[var(--surface-raised)] hover:scale-105 active:scale-[0.98] transition-all duration-200 shadow-sm cursor-pointer select-none"
    >
      <span className="text-sm font-bold text-[var(--foreground)]">{value}</span>
      <span className="text-[10px] text-[var(--muted)] font-semibold uppercase tracking-wider">{label}</span>
    </div>
  );
}

function SectionGrid({ title, allData, myData, allLabels, myLabels, redirectPrefix }: any) {
  const router = useRouter();
  
  const handleRedirect = (key: string) => {
    if (redirectPrefix) {
      router.push(`${redirectPrefix}?status=${key}`);
    }
  };

  return (
    <div className="border border-[var(--border)] rounded-[12px] p-6 bg-[var(--surface)] shadow-[var(--shadow)] mb-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] opacity-70" />
      <h2 className="text-center text-lg font-bold text-[var(--foreground)] mb-6 border-b border-[var(--border)] pb-2">{title}</h2>
      
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <span className="w-8 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">All</span>
          <div className="flex flex-wrap gap-3">
            {allLabels.map((l: any) => (
              <MetricBox 
                key={l.key} 
                value={allData?.[l.key] ?? 0} 
                label={l.label} 
                onClick={() => handleRedirect(l.key)}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="w-8 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">My</span>
          <div className="flex flex-wrap gap-3">
            {myLabels.map((l: any) => (
              <MetricBox 
                key={l.key} 
                value={myData?.[l.key] ?? 0} 
                label={l.label} 
                onClick={() => handleRedirect(l.key)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { data, isLoading } = useDashboard();
  const user = useAuthStore((s) => s.user);
  const setSidebarOpen = useUiStore((s) => s.setSidebarOpen);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<"sales_order" | "purchase_order" | "product" | "user" | null>(null);
  
  const queryClient = useQueryClient();
  const router = useRouter();

  // For Modals
  const { data: customers } = useCustomers();
  const { data: products } = useProducts();
  const { data: vendors } = useVendors();
  const addUser = useErpStore((s) => s.addUser);

  // Form states
  const [formSales, setFormSales] = useState({ customer: "", product: "", quantity: 1, unitPrice: 0, notes: "" });
  const [formPurchase, setFormPurchase] = useState({ vendor: "", product: "", quantity: 1, unitCost: 0, notes: "" });
  const [formProduct, setFormProduct] = useState({ name: "", sku: "", category: "Drone Components", salesPrice: 0, costPrice: 0, onHand: 10 });
  const [formUser, setFormUser] = useState({ username: "", email: "", role: "Sales User", status: "Active" as "Active" | "Review" });

  const [submitting, setSubmitting] = useState(false);

  if (isLoading || !data) return <LoadingState />;

  const salesAllLabels = [
    { key: "draft", label: "Draft" },
    { key: "confirmed", label: "Confirmed" },
    { key: "partially_delivered", label: "Partially Delivered" },
    { key: "delivered", label: "Delivered" },
    { key: "late", label: "Late" },
  ];
  const salesMyLabels = [
    { key: "confirmed", label: "Confirmed" },
    { key: "draft", label: "Draft" },
    { key: "delivered", label: "Delivered" },
  ];

  const purchasesAllLabels = [
    { key: "draft", label: "Draft" },
    { key: "confirmed", label: "Confirmed" },
    { key: "partially_received", label: "Partially Received" },
    { key: "received", label: "Received" },
    { key: "late", label: "Late" },
  ];
  const purchasesMyLabels = [
    { key: "confirmed", label: "Confirmed" },
    { key: "draft", label: "Draft" },
    { key: "received", label: "Received" },
  ];

  const mfgAllLabels = [
    { key: "draft", label: "Draft" },
    { key: "confirmed", label: "Confirmed" },
    { key: "in_progress", label: "In-Progress" },
    { key: "to_close", label: "To Close" },
    { key: "done", label: "Done" },
  ];
  const mfgMyLabels = [
    { key: "confirmed", label: "Confirmed" },
    { key: "in_progress", label: "In-Progress" },
    { key: "done", label: "Done" },
  ];

  // Totals computations
  const totalSalesCount = (data.sales?.all?.draft || 0) + (data.sales?.all?.confirmed || 0) + (data.sales?.all?.delivered || 0) + (data.sales?.all?.partially_delivered || 0);
  const pendingDeliveries = (data.sales?.all?.confirmed || 0) + (data.sales?.all?.partially_delivered || 0);
  const pendingReceipts = (data.purchases?.all?.confirmed || 0) + (data.purchases?.all?.partially_received || 0);
  const activeWorkOrders = (data.manufacturing?.all?.confirmed || 0) + (data.manufacturing?.all?.in_progress || 0);
  const inventoryVal = parseFloat(data.inventory_value || "0");

  // Form handlers
  const handleCreateSalesOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSales.customer || !formSales.product) {
      toast.error("Please fill in required fields.");
      return;
    }
    setSubmitting(true);
    try {
      const order = await apiClient<any>("sales-orders/", {
        method: "POST",
        body: JSON.stringify({
          customer: parseInt(formSales.customer, 10),
          notes: formSales.notes
        })
      });
      await apiClient("sales-order-lines/", {
        method: "POST",
        body: JSON.stringify({
          order: order.id,
          product: parseInt(formSales.product, 10),
          quantity_ordered: formSales.quantity,
          unit_price: formSales.unitPrice
        })
      });
      toast.success("Sales order created successfully.");
      setActiveModal(null);
      setFormSales({ customer: "", product: "", quantity: 1, unitPrice: 0, notes: "" });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["salesOrders"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to create sales order.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreatePurchaseOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPurchase.vendor || !formPurchase.product) {
      toast.error("Please fill in required fields.");
      return;
    }
    setSubmitting(true);
    try {
      const order = await apiClient<any>("purchase-orders/", {
        method: "POST",
        body: JSON.stringify({
          vendor: parseInt(formPurchase.vendor, 10),
          notes: formPurchase.notes
        })
      });
      await apiClient("purchase-order-lines/", {
        method: "POST",
        body: JSON.stringify({
          order: order.id,
          product: parseInt(formPurchase.product, 10),
          quantity_ordered: formPurchase.quantity,
          unit_cost: formPurchase.unitCost
        })
      });
      toast.success("Purchase order created successfully.");
      setActiveModal(null);
      setFormPurchase({ vendor: "", product: "", quantity: 1, unitCost: 0, notes: "" });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["purchaseOrders"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to create purchase order.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formProduct.name || !formProduct.sku) {
      toast.error("Please fill in name and SKU.");
      return;
    }
    setSubmitting(true);
    try {
      await apiClient("products/", {
        method: "POST",
        body: JSON.stringify({
          name: formProduct.name,
          sku: formProduct.sku,
          category: formProduct.category,
          sales_price: formProduct.salesPrice,
          cost_price: formProduct.costPrice,
          on_hand_quantity: formProduct.onHand,
          reserved_quantity: 0
        })
      });
      toast.success("Product created successfully.");
      setActiveModal(null);
      setFormProduct({ name: "", sku: "", category: "Drone Components", salesPrice: 0, costPrice: 0, onHand: 10 });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to register product.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleInviteUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formUser.username || !formUser.email) {
      toast.error("Please fill in username and email.");
      return;
    }
    try {
      addUser({
        username: formUser.username,
        email: formUser.email,
        role: formUser.role as any,
        status: formUser.status
      });
      toast.success("User invited successfully.");
      setActiveModal(null);
      setFormUser({ username: "", email: "", role: "Sales User", status: "Active" });
    } catch (err: any) {
      toast.error(err.message || "Failed to invite user.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      {/* Dashboard Header Bar */}
      <div className="relative flex justify-between items-center mb-8 border border-[var(--border)] rounded-full py-2 px-4 bg-[var(--surface)] shadow-[var(--shadow)]">
        {/* Left: Master Menu Toggle */}
        <button
          onClick={() => {
            if (typeof window !== "undefined" && window.innerWidth < 1024) {
              setSidebarOpen(true);
            } else {
              setMenuOpen(!menuOpen);
            }
          }}
          className="p-2 rounded-full hover:bg-[var(--surface-muted)] border border-[var(--border)] text-[var(--foreground)] transition flex items-center justify-center cursor-pointer focus:outline-none"
          title="Master Menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Center: App Logo and Name */}
        <div className="flex items-center gap-2.5">
          <div className="grid h-7 w-7 place-items-center rounded-full border-[4px] border-[var(--primary-strong)] bg-[var(--surface)]">
            <div className="h-2 w-2 rotate-45 rounded-[2px] bg-[var(--primary-strong)]" />
          </div>
          <span className="font-extrabold text-sm tracking-wider text-[var(--foreground)] uppercase">ORBIS ERP</span>
        </div>

        {/* Right: User Login Avatar Dropdown */}
        <ProfileDropdown />

        {/* Dropdown Master Menu */}
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setMenuOpen(false)} />
            
            <div className="absolute left-4 top-14 z-50 w-64 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2.5 shadow-xl animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between px-3 py-1.5 border-b border-[var(--border)] mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--primary)]">Master Menu</span>
                <button 
                  onClick={() => setMenuOpen(false)}
                  className="text-[var(--muted)] hover:text-[var(--foreground)] text-xs font-bold focus:outline-none p-1 rounded-full hover:bg-[var(--surface-muted)] transition"
                >
                  ✕
                </button>
              </div>
              <nav className="space-y-1">
                <Link 
                  href="/sales/orders" 
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold text-[var(--muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)] transition"
                  onClick={() => setMenuOpen(false)}
                >
                  <ReceiptText className="w-4 h-4 text-[var(--primary)]" />
                  Sale Orders
                </Link>
                <Link 
                  href="/purchase/orders" 
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold text-[var(--muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)] transition"
                  onClick={() => setMenuOpen(false)}
                >
                  <ShoppingCart className="w-4 h-4 text-[var(--primary)]" />
                  Purchase Orders
                </Link>
                <Link 
                  href="/manufacturing/command-center" 
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold text-[var(--muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)] transition"
                  onClick={() => setMenuOpen(false)}
                >
                  <Factory className="w-4 h-4 text-[var(--primary)]" />
                  Manufacturing Orders
                </Link>
                <Link 
                  href="/manufacturing/bom" 
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold text-[var(--muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)] transition"
                  onClick={() => setMenuOpen(false)}
                >
                  <ClipboardList className="w-4 h-4 text-[var(--primary)]" />
                  Bills of Materials
                </Link>
                <Link 
                  href="/products" 
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold text-[var(--muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)] transition"
                  onClick={() => setMenuOpen(false)}
                >
                  <PackageSearch className="w-4 h-4 text-[var(--primary)]" />
                  Products
                </Link>
                <Link 
                  href="/audit-logs" 
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold text-[var(--muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)] transition"
                  onClick={() => setMenuOpen(false)}
                >
                  <ShieldCheck className="w-4 h-4 text-[var(--primary)]" />
                  Audit Logs
                </Link>
              </nav>
            </div>
          </>
        )}
      </div>

      {/* Top 6 KPI summary cards grid */}
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 mb-8">
        <MetricCard 
          label="Inventory Value" 
          value={formatCurrency(inventoryVal)} 
          trend={`${data.products?.total || 0} SKUs`} 
          icon={Warehouse} 
          tone="info" 
          href="/inventory"
        />
        <MetricCard 
          label="Total Sales Orders" 
          value={totalSalesCount.toString()} 
          trend="Order history" 
          icon={ReceiptText} 
          tone="primary" 
          href="/sales/orders"
        />
        <MetricCard 
          label="Pending Deliveries" 
          value={pendingDeliveries.toString()} 
          trend="Needs fulfillment" 
          icon={Truck} 
          tone="warning" 
          href="/sales/orders?status=confirmed"
        />
        <MetricCard 
          label="Pending Receipts" 
          value={pendingReceipts.toString()} 
          trend="Inbound supply" 
          icon={ShoppingCart} 
          tone="info" 
          href="/purchase/orders?status=confirmed"
        />
        <MetricCard 
          label="Active Work Orders" 
          value={activeWorkOrders.toString()} 
          trend="Shop floor load" 
          icon={Factory} 
          tone="success" 
          href="/manufacturing/command-center?status=confirmed"
        />
        <MetricCard 
          label="Low Stock Items" 
          value={(data.products?.low_stock || 0).toString()} 
          trend="Requires reorder" 
          icon={AlertTriangle} 
          tone="danger" 
          href="/products"
        />
      </div>

      {/* Main content grid: Section grids + Quick Actions panel */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Metric boxes by category */}
        <div className="lg:col-span-2 space-y-6">
          <SectionGrid
            title="Sale Orders"
            allData={data.sales?.all}
            myData={data.sales?.my}
            allLabels={salesAllLabels}
            myLabels={salesMyLabels}
            redirectPrefix="/sales/orders"
          />
          
          <SectionGrid
            title="Purchase Orders"
            allData={data.purchases?.all}
            myData={data.purchases?.my}
            allLabels={purchasesAllLabels}
            myLabels={purchasesMyLabels}
            redirectPrefix="/purchase/orders"
          />

          <SectionGrid
            title="Manufacturing Orders"
            allData={data.manufacturing?.all}
            myData={data.manufacturing?.my}
            allLabels={mfgAllLabels}
            myLabels={mfgMyLabels}
            redirectPrefix="/manufacturing/command-center"
          />
        </div>

        {/* Right Column: Quick Actions Panel */}
        <div className="space-y-6">
          <div className="border border-[var(--border)] rounded-[12px] p-6 bg-[var(--surface)] shadow-[var(--shadow)] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-[var(--primary)] opacity-80" />
            <h2 className="text-lg font-bold text-[var(--foreground)] mb-6 border-b border-[var(--border)] pb-2">Quick Actions</h2>
            
            <div className="space-y-4">
              <button 
                onClick={() => setActiveModal("sales_order")}
                className="w-full flex items-center justify-between p-3.5 border border-[var(--border)] rounded-xl bg-[var(--surface-muted)] hover:bg-[var(--surface-raised)] hover:border-[var(--primary-soft)] transition text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-[var(--primary-soft)] text-[var(--primary)] group-hover:scale-105 transition-transform">
                    <ReceiptText className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-[var(--foreground)] block">Create Sales Order</span>
                    <span className="text-[11px] text-[var(--muted)] font-medium">Launch new demand pipelines</span>
                  </div>
                </div>
                <Plus className="h-5 w-5 text-[var(--muted)] group-hover:text-[var(--primary)] transition-colors" />
              </button>

              <button 
                onClick={() => setActiveModal("purchase_order")}
                className="w-full flex items-center justify-between p-3.5 border border-[var(--border)] rounded-xl bg-[var(--surface-muted)] hover:bg-[var(--surface-raised)] hover:border-[var(--primary-soft)] transition text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-[var(--primary-soft)] text-[var(--primary)] group-hover:scale-105 transition-transform">
                    <ShoppingCart className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-[var(--foreground)] block">Create Purchase Order</span>
                    <span className="text-[11px] text-[var(--muted)] font-medium">Draft procurement requisitions</span>
                  </div>
                </div>
                <Plus className="h-5 w-5 text-[var(--muted)] group-hover:text-[var(--primary)] transition-colors" />
              </button>

              <button 
                onClick={() => setActiveModal("product")}
                className="w-full flex items-center justify-between p-3.5 border border-[var(--border)] rounded-xl bg-[var(--surface-muted)] hover:bg-[var(--surface-raised)] hover:border-[var(--primary-soft)] transition text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-[var(--primary-soft)] text-[var(--primary)] group-hover:scale-105 transition-transform">
                    <ClipboardList className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-[var(--foreground)] block">Register Product</span>
                    <span className="text-[11px] text-[var(--muted)] font-medium">Add a new SKU to master record</span>
                  </div>
                </div>
                <Plus className="h-5 w-5 text-[var(--muted)] group-hover:text-[var(--primary)] transition-colors" />
              </button>

              <button 
                onClick={() => setActiveModal("user")}
                className="w-full flex items-center justify-between p-3.5 border border-[var(--border)] rounded-xl bg-[var(--surface-muted)] hover:bg-[var(--surface-raised)] hover:border-[var(--primary-soft)] transition text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-[var(--primary-soft)] text-[var(--primary)] group-hover:scale-105 transition-transform">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-[var(--foreground)] block">Invite User</span>
                    <span className="text-[11px] text-[var(--muted)] font-medium">Provision new system clearances</span>
                  </div>
                </div>
                <Plus className="h-5 w-5 text-[var(--muted)] group-hover:text-[var(--primary)] transition-colors" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Creation Modals */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-[4px] animate-in fade-in duration-200">
          <div 
            className="relative w-full max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3 mb-4">
              <h3 className="text-lg font-bold text-[var(--foreground)]">
                {activeModal === "sales_order" && "Quick Create Sales Order"}
                {activeModal === "purchase_order" && "Quick Create Purchase Order"}
                {activeModal === "product" && "Register Product Master Data"}
                {activeModal === "user" && "Invite New User"}
              </h3>
              <button 
                onClick={() => setActiveModal(null)}
                className="text-[var(--muted)] hover:text-[var(--foreground)] text-sm font-bold p-1 rounded-full hover:bg-[var(--surface-muted)] transition"
              >
                ✕
              </button>
            </div>

            {/* Sales Order Modal Form */}
            {activeModal === "sales_order" && (
              <form onSubmit={handleCreateSalesOrder} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-1">Customer</label>
                  <select 
                    value={formSales.customer}
                    onChange={(e) => setFormSales({ ...formSales, customer: e.target.value })}
                    className="block w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface-muted)] text-[var(--foreground)] focus:ring-1 focus:ring-[var(--primary)] focus:outline-none text-sm"
                    required
                  >
                    <option value="">Select Customer...</option>
                    {customers?.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.name || `Customer #${c.id}`}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-1">Product</label>
                    <select 
                      value={formSales.product}
                      onChange={(e) => {
                        const prod = products?.find((p: any) => p.id?.toString() === e.target.value?.toString());
                        setFormSales({ 
                          ...formSales, 
                          product: e.target.value,
                          unitPrice: prod ? parseFloat(prod.sales_price || 0) : 0
                        });
                      }}
                      className="block w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface-muted)] text-[var(--foreground)] focus:ring-1 focus:ring-[var(--primary)] focus:outline-none text-sm"
                      required
                    >
                      <option value="">Select Product...</option>
                      {products?.map((p: any) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-1">Quantity</label>
                    <input 
                      type="number" 
                      min="1"
                      value={formSales.quantity}
                      onChange={(e) => setFormSales({ ...formSales, quantity: parseInt(e.target.value, 10) || 1 })}
                      className="block w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface-muted)] text-[var(--foreground)] focus:ring-1 focus:ring-[var(--primary)] focus:outline-none text-sm"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-1">Unit Price ($)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    min="0"
                    value={formSales.unitPrice}
                    onChange={(e) => setFormSales({ ...formSales, unitPrice: parseFloat(e.target.value) || 0 })}
                    className="block w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface-muted)] text-[var(--foreground)] focus:ring-1 focus:ring-[var(--primary)] focus:outline-none text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-1">Notes</label>
                  <textarea 
                    value={formSales.notes}
                    onChange={(e) => setFormSales({ ...formSales, notes: e.target.value })}
                    className="block w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface-muted)] text-[var(--foreground)] focus:ring-1 focus:ring-[var(--primary)] focus:outline-none text-sm"
                    rows={2}
                  />
                </div>
                <div className="flex justify-end gap-3 pt-3 border-t border-[var(--border)]">
                  <button 
                    type="button" 
                    onClick={() => setActiveModal(null)} 
                    className="px-4 py-2 text-xs font-bold uppercase border border-[var(--border)] rounded-lg hover:bg-[var(--surface-muted)] text-[var(--foreground)] transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={submitting}
                    className="px-4 py-2 text-xs font-bold uppercase bg-[var(--primary-strong)] text-white dark:text-[var(--primary-fg)] rounded-lg hover:opacity-90 active:scale-[0.98] transition cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? "Creating..." : "Create"}
                  </button>
                </div>
              </form>
            )}

            {/* Purchase Order Modal Form */}
            {activeModal === "purchase_order" && (
              <form onSubmit={handleCreatePurchaseOrder} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-1">Vendor</label>
                  <select 
                    value={formPurchase.vendor}
                    onChange={(e) => setFormPurchase({ ...formPurchase, vendor: e.target.value })}
                    className="block w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface-muted)] text-[var(--foreground)] focus:ring-1 focus:ring-[var(--primary)] focus:outline-none text-sm"
                    required
                  >
                    <option value="">Select Vendor...</option>
                    {vendors?.map((v: any) => (
                      <option key={v.id} value={v.id}>{v.name || `Vendor #${v.id}`}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-1">Product</label>
                    <select 
                      value={formPurchase.product}
                      onChange={(e) => {
                        const prod = products?.find((p: any) => p.id?.toString() === e.target.value?.toString());
                        setFormPurchase({ 
                          ...formPurchase, 
                          product: e.target.value,
                          unitCost: prod ? parseFloat(prod.cost_price || 0) : 0
                        });
                      }}
                      className="block w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface-muted)] text-[var(--foreground)] focus:ring-1 focus:ring-[var(--primary)] focus:outline-none text-sm"
                      required
                    >
                      <option value="">Select Product...</option>
                      {products?.map((p: any) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-1">Quantity</label>
                    <input 
                      type="number" 
                      min="1"
                      value={formPurchase.quantity}
                      onChange={(e) => setFormPurchase({ ...formPurchase, quantity: parseInt(e.target.value, 10) || 1 })}
                      className="block w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface-muted)] text-[var(--foreground)] focus:ring-1 focus:ring-[var(--primary)] focus:outline-none text-sm"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-1">Unit Cost ($)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    min="0"
                    value={formPurchase.unitCost}
                    onChange={(e) => setFormPurchase({ ...formPurchase, unitCost: parseFloat(e.target.value) || 0 })}
                    className="block w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface-muted)] text-[var(--foreground)] focus:ring-1 focus:ring-[var(--primary)] focus:outline-none text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-1">Notes</label>
                  <textarea 
                    value={formPurchase.notes}
                    onChange={(e) => setFormPurchase({ ...formPurchase, notes: e.target.value })}
                    className="block w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface-muted)] text-[var(--foreground)] focus:ring-1 focus:ring-[var(--primary)] focus:outline-none text-sm"
                    rows={2}
                  />
                </div>
                <div className="flex justify-end gap-3 pt-3 border-t border-[var(--border)]">
                  <button 
                    type="button" 
                    onClick={() => setActiveModal(null)} 
                    className="px-4 py-2 text-xs font-bold uppercase border border-[var(--border)] rounded-lg hover:bg-[var(--surface-muted)] text-[var(--foreground)] transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={submitting}
                    className="px-4 py-2 text-xs font-bold uppercase bg-[var(--primary-strong)] text-white dark:text-[var(--primary-fg)] rounded-lg hover:opacity-90 active:scale-[0.98] transition cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? "Creating..." : "Create"}
                  </button>
                </div>
              </form>
            )}

            {/* Product Modal Form */}
            {activeModal === "product" && (
              <form onSubmit={handleCreateProduct} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-1">Product Name</label>
                  <input 
                    type="text" 
                    value={formProduct.name}
                    onChange={(e) => setFormProduct({ ...formProduct, name: e.target.value })}
                    className="block w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface-muted)] text-[var(--foreground)] focus:ring-1 focus:ring-[var(--primary)] focus:outline-none text-sm"
                    placeholder="e.g. Servo Assembly X-4"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-1">SKU</label>
                    <input 
                      type="text" 
                      value={formProduct.sku}
                      onChange={(e) => setFormProduct({ ...formProduct, sku: e.target.value })}
                      className="block w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface-muted)] text-[var(--foreground)] focus:ring-1 focus:ring-[var(--primary)] focus:outline-none text-sm"
                      placeholder="e.g. ORB-2051"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-1">Category</label>
                    <select 
                      value={formProduct.category}
                      onChange={(e) => setFormProduct({ ...formProduct, category: e.target.value })}
                      className="block w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface-muted)] text-[var(--foreground)] focus:ring-1 focus:ring-[var(--primary)] focus:outline-none text-sm"
                    >
                      <option value="Drone Components">Drone Components</option>
                      <option value="Industrial Frames">Industrial Frames</option>
                      <option value="Control Systems">Control Systems</option>
                      <option value="Raw Materials">Raw Materials</option>
                      <option value="Packaging">Packaging</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-1">Sales Price ($)</label>
                    <input 
                      type="number" 
                      step="0.01"
                      min="0"
                      value={formProduct.salesPrice}
                      onChange={(e) => setFormProduct({ ...formProduct, salesPrice: parseFloat(e.target.value) || 0 })}
                      className="block w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface-muted)] text-[var(--foreground)] focus:ring-1 focus:ring-[var(--primary)] focus:outline-none text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-1">Cost Price ($)</label>
                    <input 
                      type="number" 
                      step="0.01"
                      min="0"
                      value={formProduct.costPrice}
                      onChange={(e) => setFormProduct({ ...formProduct, costPrice: parseFloat(e.target.value) || 0 })}
                      className="block w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface-muted)] text-[var(--foreground)] focus:ring-1 focus:ring-[var(--primary)] focus:outline-none text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-1">On Hand Qty</label>
                    <input 
                      type="number" 
                      min="0"
                      value={formProduct.onHand}
                      onChange={(e) => setFormProduct({ ...formProduct, onHand: parseInt(e.target.value, 10) || 0 })}
                      className="block w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface-muted)] text-[var(--foreground)] focus:ring-1 focus:ring-[var(--primary)] focus:outline-none text-sm"
                      required
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-3 border-t border-[var(--border)]">
                  <button 
                    type="button" 
                    onClick={() => setActiveModal(null)} 
                    className="px-4 py-2 text-xs font-bold uppercase border border-[var(--border)] rounded-lg hover:bg-[var(--surface-muted)] text-[var(--foreground)] transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={submitting}
                    className="px-4 py-2 text-xs font-bold uppercase bg-[var(--primary-strong)] text-white dark:text-[var(--primary-fg)] rounded-lg hover:opacity-90 active:scale-[0.98] transition cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? "Registering..." : "Register"}
                  </button>
                </div>
              </form>
            )}

            {/* Invite User Modal Form */}
            {activeModal === "user" && (
              <form onSubmit={handleInviteUser} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-1">Username</label>
                  <input 
                    type="text" 
                    value={formUser.username}
                    onChange={(e) => setFormUser({ ...formUser, username: e.target.value })}
                    className="block w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface-muted)] text-[var(--foreground)] focus:ring-1 focus:ring-[var(--primary)] focus:outline-none text-sm"
                    placeholder="e.g. james.miller"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-1">Email</label>
                  <input 
                    type="email" 
                    value={formUser.email}
                    onChange={(e) => setFormUser({ ...formUser, email: e.target.value })}
                    className="block w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface-muted)] text-[var(--foreground)] focus:ring-1 focus:ring-[var(--primary)] focus:outline-none text-sm"
                    placeholder="e.g. james.miller@orbis.example"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-1">Clearance Role</label>
                    <select 
                      value={formUser.role}
                      onChange={(e) => setFormUser({ ...formUser, role: e.target.value })}
                      className="block w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface-muted)] text-[var(--foreground)] focus:ring-1 focus:ring-[var(--primary)] focus:outline-none text-sm"
                    >
                      <option value="Administrator">Administrator</option>
                      <option value="Sales User">Sales User</option>
                      <option value="Purchase User">Purchase User</option>
                      <option value="Manufacturing User">Manufacturing User</option>
                      <option value="Inventory Manager">Inventory Manager</option>
                      <option value="Business Owner">Business Owner</option>
                      <option value="System User">System User</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-1">Account Clearance</label>
                    <select 
                      value={formUser.status}
                      onChange={(e) => setFormUser({ ...formUser, status: e.target.value as any })}
                      className="block w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface-muted)] text-[var(--foreground)] focus:ring-1 focus:ring-[var(--primary)] focus:outline-none text-sm"
                    >
                      <option value="Active">Active (Clear)</option>
                      <option value="Review">Review (On Hold)</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-3 border-t border-[var(--border)]">
                  <button 
                    type="button" 
                    onClick={() => setActiveModal(null)} 
                    className="px-4 py-2 text-xs font-bold uppercase border border-[var(--border)] rounded-lg hover:bg-[var(--surface-muted)] text-[var(--foreground)] transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="px-4 py-2 text-xs font-bold uppercase bg-[var(--primary-strong)] text-white dark:text-[var(--primary-fg)] rounded-lg hover:opacity-90 active:scale-[0.98] transition cursor-pointer"
                  >
                    Invite
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
