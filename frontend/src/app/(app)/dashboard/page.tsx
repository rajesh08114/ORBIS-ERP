"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from "recharts";
import { useDashboard, useCustomers, useProducts, useVendors } from "@/hooks/use-erp";
import { LoadingState } from "@/components/ui/states";
import { useAuthStore } from "@/stores/auth-store";
import { useUiStore } from "@/stores/ui-store";
import { useErpStore } from "@/stores/erp-store";
import { ProfileDropdown } from "@/components/layout/profile-dropdown";
import { PartnerCombobox } from "@/components/ui/partner-combobox";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import { formatCurrency, downloadCSV } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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
  Bell,
} from "@/components/icons";
import { MasterMenu } from "@/components/layout/master-menu";
import {
  KpiCard,
  ActionItem,
  OperationsSection,
  InventoryHealthBar,
  ActivityFeed,
  MyWorkItem,
  NotificationItem,
  DashboardPanel,
} from "@/components/dashboard/dashboard-widgets";

// ── helpers ──────────────────────────────────────────────────────────────────
function now() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function DashboardPage() {
  const { data, isLoading } = useDashboard();
  const user = useAuthStore((s) => s.user);
  const setSidebarOpen = useUiStore((s) => s.setSidebarOpen);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<"sales_order" | "purchase_order" | "product" | "user" | null>(null);

  const queryClient = useQueryClient();
  const router = useRouter();

  const { data: customers } = useCustomers();
  const { data: products } = useProducts();
  const { data: vendors } = useVendors();
  const addUser = useErpStore((s) => s.addUser);

  const [formSales, setFormSales] = useState({ customer: "", product: "", quantity: 1, unitPrice: 0, notes: "" });
  const [formPurchase, setFormPurchase] = useState({ vendor: "", product: "", quantity: 1, unitCost: 0, notes: "" });
  const [formProduct, setFormProduct] = useState({ name: "", sku: "", category: "Furniture Assemblies", salesPrice: 0, costPrice: 0, onHand: 10 });
  const [formUser, setFormUser] = useState({ username: "", email: "", password: "", role: "Sales User", status: "Active" as "Active" | "Review" });
  const [submitting, setSubmitting] = useState(false);

  // ── computed totals (safe defaults when data is undefined) ─────────────────
  const salesTotal = Object.values(data?.sales?.all || {}).reduce((a: number, b: any) => a + (b || 0), 0);
  const purchaseTotal = Object.values(data?.purchases?.all || {}).reduce((a: number, b: any) => a + (b || 0), 0);
  const mfgTotal = Object.values(data?.manufacturing?.all || {}).reduce((a: number, b: any) => a + (b || 0), 0);

  const pendingDeliveries = (data?.sales?.all?.confirmed || 0) + (data?.sales?.all?.partially_delivered || 0);
  const pendingReceipts = (data?.purchases?.all?.confirmed || 0) + (data?.purchases?.all?.partially_received || 0);
  const activeWorkOrders = (data?.manufacturing?.all?.confirmed || 0) + (data?.manufacturing?.all?.in_progress || 0);
  const inventoryVal = parseFloat(data?.inventory_value || "0");
  const lowStock = data?.products?.low_stock || 0;
  const totalProducts = data?.products?.total || 0;
  const lateSales = data?.sales?.all?.late || 0;
  const latePurchases = data?.purchases?.all?.late || 0;
  const healthScore = totalProducts > 0 ? Math.min(100, Math.round(100 - (lowStock / totalProducts) * 100)) : 95;

  // ── activity feed — must be declared before early return ─────────────────
  const activityEvents = useMemo(() => {
    if (!data) return [];
    const events: any[] = [];
    if (data.sales?.all?.confirmed > 0) events.push({ id: "s1", user: user?.first_name || "User", action: "confirmed a Sales Order", entity: "SO", entityId: `${data.sales.all.confirmed}`, timestamp: `Today at ${now()}`, status: "success" });
    if (pendingDeliveries > 0) events.push({ id: "s2", user: "System", action: "flagged pending deliveries", entity: "SO", entityId: `${pendingDeliveries}`, timestamp: "Today", status: "warning" });
    if (data.purchases?.all?.received > 0) events.push({ id: "p1", user: "Procurement", action: "received Purchase Order", entity: "PO", entityId: `${data.purchases.all.received}`, timestamp: "Today", status: "success" });
    if (activeWorkOrders > 0) events.push({ id: "m1", user: "Shop Floor", action: "running Manufacturing Orders", entity: "MO", entityId: `${activeWorkOrders}`, timestamp: "In progress", status: "info" });
    if (lowStock > 0) events.push({ id: "i1", user: "Inventory", action: "detected low stock items", entity: "SKU", entityId: `${lowStock}`, timestamp: "Just now", status: "error" });
    return events;
  }, [data, user, pendingDeliveries, activeWorkOrders, lowStock]);

  // ── notifications — must be declared before early return ─────────────────
  const notifications = useMemo(() => {
    const n: any[] = [];
    if (lateSales > 0) n.push({ severity: "critical", title: `${lateSales} Late Sales Orders`, body: "Customer deliveries are overdue. Review and take action.", time: "Now" });
    if (latePurchases > 0) n.push({ severity: "warning", title: `${latePurchases} Late Purchase Orders`, body: "Vendor receipts are delayed. Follow up immediately.", time: "Now" });
    if (lowStock > 0) n.push({ severity: "warning", title: `${lowStock} Low Stock Alerts`, body: "Products below reorder threshold. Raise procurement requests.", time: "Now" });
    if (activeWorkOrders > 0) n.push({ severity: "info", title: `${activeWorkOrders} Active Work Orders`, body: "Shop floor has open manufacturing orders in progress.", time: "Ongoing" });
    if (n.length === 0) n.push({ severity: "success", title: "All Systems Operational", body: "No critical alerts at this time.", time: "Now" });
    return n;
  }, [lateSales, latePurchases, lowStock, activeWorkOrders]);

  // ── early return after ALL hooks ─────────────────────────────────────────
  if (isLoading || !data) return <LoadingState />;


  const handleCreateSalesOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSales.customer || !formSales.product) { toast.error("Please fill in required fields."); return; }
    setSubmitting(true);
    try {
      const order = await apiClient<any>("sales-orders/", { method: "POST", body: JSON.stringify({ customer: parseInt(formSales.customer, 10), notes: formSales.notes }) });
      await apiClient("sales-order-lines/", { method: "POST", body: JSON.stringify({ order: order.id, product: parseInt(formSales.product, 10), quantity_ordered: formSales.quantity, unit_price: formSales.unitPrice }) });
      toast.success("Sales order created successfully.");
      setActiveModal(null);
      setFormSales({ customer: "", product: "", quantity: 1, unitPrice: 0, notes: "" });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["salesOrders"] });
    } catch (err: any) { toast.error(err.message || "Failed to create sales order."); } finally { setSubmitting(false); }
  };

  const handleCreatePurchaseOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPurchase.vendor || !formPurchase.product) { toast.error("Please fill in required fields."); return; }
    setSubmitting(true);
    try {
      const order = await apiClient<any>("purchase-orders/", { method: "POST", body: JSON.stringify({ vendor: parseInt(formPurchase.vendor, 10), notes: formPurchase.notes }) });
      await apiClient("purchase-order-lines/", { method: "POST", body: JSON.stringify({ order: order.id, product: parseInt(formPurchase.product, 10), quantity_ordered: formPurchase.quantity, unit_cost: formPurchase.unitCost }) });
      toast.success("Purchase order created successfully.");
      setActiveModal(null);
      setFormPurchase({ vendor: "", product: "", quantity: 1, unitCost: 0, notes: "" });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["purchaseOrders"] });
    } catch (err: any) { toast.error(err.message || "Failed to create purchase order."); } finally { setSubmitting(false); }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formProduct.name || !formProduct.sku) { toast.error("Please fill in name and SKU."); return; }
    setSubmitting(true);
    try {
      await apiClient("products/", { method: "POST", body: JSON.stringify({ name: formProduct.name, sku: formProduct.sku, category: formProduct.category, sales_price: formProduct.salesPrice, cost_price: formProduct.costPrice, on_hand_quantity: formProduct.onHand, reserved_quantity: 0 }) });
      toast.success("Product created successfully.");
      setActiveModal(null);
      setFormProduct({ name: "", sku: "", category: "Furniture Assemblies", salesPrice: 0, costPrice: 0, onHand: 10 });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    } catch (err: any) { toast.error(err.message || "Failed to register product."); } finally { setSubmitting(false); }
  };

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formUser.username || !formUser.email || !formUser.password) {
      toast.error("Please fill in username, email, and password.");
      return;
    }
    setSubmitting(true);
    try {
      const roleToGroupId: Record<string, number> = {
        "Admin": 7,
        "Sales User": 2,
        "Purchase User": 3,
        "Manufacturing User": 4,
        "Inventory Manager": 5,
        "Business Owner": 6,
      };

      const groupId = roleToGroupId[formUser.role] || 2;
      const backendStatus = formUser.status === "Active" ? "active" : "inactive";

      const payload = {
        username: formUser.username,
        email: formUser.email,
        password: formUser.password,
        first_name: "",
        last_name: "",
        groups: [groupId],
        profile: {
          role_title: formUser.role,
          status: backendStatus,
        }
      };

      await apiClient("users/", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      toast.success("User invited and created successfully.");
      setActiveModal(null);
      setFormUser({ username: "", email: "", password: "", role: "Sales User", status: "Active" });
      queryClient.invalidateQueries({ queryKey: ["users"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to invite user.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── label definitions ─────────────────────────────────────────────────────
  const salesAllLabels = [
    { key: "draft", label: "Draft", tone: "default" as const },
    { key: "confirmed", label: "Confirmed", tone: "info" as const },
    { key: "partially_delivered", label: "Part. Delivered", tone: "warning" as const },
    { key: "delivered", label: "Delivered", tone: "success" as const },
    { key: "late", label: "Late", tone: "danger" as const },
  ];
  const salesMyLabels = [
    { key: "confirmed", label: "Confirmed", tone: "info" as const },
    { key: "draft", label: "Draft", tone: "default" as const },
    { key: "delivered", label: "Delivered", tone: "success" as const },
  ];

  const purchasesAllLabels = [
    { key: "draft", label: "Draft", tone: "default" as const },
    { key: "confirmed", label: "Confirmed", tone: "info" as const },
    { key: "partially_received", label: "Part. Received", tone: "warning" as const },
    { key: "received", label: "Received", tone: "success" as const },
    { key: "late", label: "Late", tone: "danger" as const },
  ];
  const purchasesMyLabels = [
    { key: "confirmed", label: "Confirmed", tone: "info" as const },
    { key: "draft", label: "Draft", tone: "default" as const },
    { key: "received", label: "Received", tone: "success" as const },
  ];

  const mfgAllLabels = [
    { key: "draft", label: "Draft", tone: "default" as const },
    { key: "confirmed", label: "Confirmed", tone: "info" as const },
    { key: "in_progress", label: "In Progress", tone: "warning" as const },
    { key: "to_close", label: "To Close", tone: "warning" as const },
    { key: "done", label: "Done", tone: "success" as const },
  ];
  const mfgMyLabels = [
    { key: "confirmed", label: "Confirmed", tone: "info" as const },
    { key: "in_progress", label: "In Progress", tone: "warning" as const },
    { key: "done", label: "Done", tone: "success" as const },
  ];

  // ── action center items ───────────────────────────────────────────────────
  const actionItems = [
    { severity: "critical" as const, emoji: "🔴", count: lateSales, label: "Late Sales Deliveries", href: "/sales/orders?status=late", cta: "Review" },
    { severity: "warning" as const, emoji: "⚠️", count: latePurchases, label: "Overdue Purchase Orders", href: "/purchase/orders?status=late", cta: "Follow Up" },
    { severity: "warning" as const, emoji: "📦", count: lowStock, label: "Low Stock Items", href: "/products", cta: "Reorder" },
    { severity: "info" as const, emoji: "🏭", count: activeWorkOrders, label: "Active Work Orders", href: "/manufacturing/command-center", cta: "Open Queue" },
    { severity: "info" as const, emoji: "🛒", count: pendingReceipts, label: "Pending Receipts", href: "/purchase/orders?status=confirmed", cta: "Receive" },
    { severity: "info" as const, emoji: "🚚", count: pendingDeliveries, label: "Pending Deliveries", href: "/sales/orders?status=confirmed", cta: "Dispatch" },
  ].filter((a) => a.count > 0);

  return (
    <div className="min-h-screen bg-[var(--background)] -mt-5 -mx-4 lg:-mx-6 px-4 lg:px-6 pt-6 pb-28 transition-colors duration-200">
      <div className="max-w-[1400px] mx-auto space-y-6">

        {/* ── TOP NAVBAR BAR ─────────────────────────────────────────────────── */}
        <div className="relative flex items-center justify-between rounded-full border border-[var(--border)] bg-[var(--surface)] py-3 px-6 shadow-sm mb-8 transition-colors duration-200">
          <MasterMenu />

          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer">
            <div className="grid h-6 w-6 place-items-center rounded-full border-[3px] border-[var(--primary)] bg-[var(--surface)] transition-colors duration-200">
              <div className="h-1.5 w-1.5 rotate-45 rounded-[2px] bg-[var(--primary)] transition-colors duration-200" />
            </div>
            <span className="font-extrabold text-xs tracking-wider text-[var(--foreground)] uppercase transition-colors duration-200">ORBIS ERP</span>
            <span className="text-[9px] font-semibold text-[var(--muted)] border border-[var(--border)] rounded px-1.5 py-px ml-1 transition-colors duration-200">Command Center</span>
          </Link>

          <div className="flex items-center gap-2">
            <Button variant="secondary" className="h-7 text-[10px] px-2.5 hidden md:flex items-center gap-1" onClick={() => downloadCSV(activityEvents, "dashboard_activity_events.csv")}>
              Export CSV
            </Button>
            <span className="text-[10px] text-[var(--muted)] hidden sm:block transition-colors duration-200">
              {user?.first_name} {user?.last_name}
            </span>
            <ProfileDropdown />
          </div>
        </div>

      {/* ── ZONE 1: EXECUTIVE KPI STRIP ────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        <KpiCard
          label="Inventory Value"
          value={formatCurrency(inventoryVal)}
          subtext={`${totalProducts} SKUs tracked`}
          icon={Warehouse}
          tone="info"
          href="/inventory"
          statusDot={inventoryVal > 0 ? "green" : "amber"}
        />
        <KpiCard
          label="Sales Orders"
          value={salesTotal.toString()}
          trend={data.sales?.all?.confirmed ? `${data.sales.all.confirmed} confirmed` : undefined}
          trendUp={true}
          icon={ReceiptText}
          tone="primary"
          href="/sales/orders"
          statusDot="green"
        />
        <KpiCard
          label="Pending Deliveries"
          value={pendingDeliveries.toString()}
          subtext="Needs fulfillment"
          icon={Truck}
          tone={pendingDeliveries > 5 ? "warning" : "success"}
          href="/sales/orders?status=confirmed"
          statusDot={pendingDeliveries > 5 ? "amber" : "green"}
        />
        <KpiCard
          label="Pending Receipts"
          value={pendingReceipts.toString()}
          subtext="Inbound supply"
          icon={ShoppingCart}
          tone={pendingReceipts > 5 ? "warning" : "info"}
          href="/purchase/orders?status=confirmed"
          statusDot={pendingReceipts > 5 ? "amber" : "green"}
        />
        <KpiCard
          label="Work Orders"
          value={activeWorkOrders.toString()}
          subtext="Shop floor load"
          icon={Factory}
          tone="success"
          href="/manufacturing/command-center"
          statusDot={activeWorkOrders > 0 ? "green" : "amber"}
        />
        <KpiCard
          label="Low Stock Alerts"
          value={lowStock.toString()}
          subtext="Requires reorder"
          icon={AlertTriangle}
          tone={lowStock > 3 ? "danger" : "warning"}
          href="/products"
          statusDot={lowStock > 3 ? "red" : "amber"}
        />
        <KpiCard
          label="Purchase Orders"
          value={purchaseTotal.toString()}
          subtext={`${data.purchases?.all?.received || 0} received`}
          icon={ClipboardList}
          tone="info"
          href="/purchase/orders"
          statusDot="green"
        />
        <KpiCard
          label="Mfg Orders"
          value={mfgTotal.toString()}
          subtext={`${data.manufacturing?.all?.done || 0} done`}
          icon={Factory}
          tone="primary"
          href="/manufacturing/command-center"
          statusDot="green"
        />
        <KpiCard
          label="Bills of Material"
          value={(data.boms?.total || 0).toString()}
          subtext={`${data.boms?.active || 0} active`}
          icon={ClipboardList}
          tone="info"
          href="/manufacturing/bom"
          statusDot="green"
        />
        <KpiCard
          label="Audit Events"
          value={(data.audit_events?.total || 0).toString()}
          subtext="Security monitoring"
          icon={ShieldCheck}
          tone="neutral"
          href="/audit-logs"
          statusDot="green"
        />
        <KpiCard
          label="Team Members"
          value={(data.users?.total || 0).toString()}
          subtext={`${data.users?.active || 0} active users`}
          icon={Users}
          tone="primary"
          href="/users"
          statusDot="green"
        />
      </div>

      {/* ── ZONE 1.5: RECHARTS OVERVIEW ─────────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Sales + Purchase Orders Bar Chart */}
        <div className="rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
          <div className="mb-3">
            <h3 className="text-sm font-bold text-[var(--foreground)]">Order Status Overview</h3>
            <p className="text-[11px] text-[var(--muted)]">Sales & Purchase breakdown by status</p>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <RechartsBarChart
              data={[
                { name: "Draft", sales: data.sales?.all?.draft || 0, purchase: data.purchases?.all?.draft || 0 },
                { name: "Confirmed", sales: data.sales?.all?.confirmed || 0, purchase: data.purchases?.all?.confirmed || 0 },
                { name: "In Transit", sales: data.sales?.all?.partially_delivered || 0, purchase: data.purchases?.all?.partially_received || 0 },
                { name: "Done", sales: data.sales?.all?.delivered || 0, purchase: data.purchases?.all?.received || 0 },
                { name: "Late", sales: data.sales?.all?.late || 0, purchase: data.purchases?.all?.late || 0 },
              ]}
              margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
            >
              <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} stroke="var(--muted)" />
              <YAxis fontSize={10} tickLine={false} axisLine={false} stroke="var(--muted)" allowDecimals={false} />
              <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 11 }} />
              <Bar dataKey="sales" name="Sales" fill="#6366f1" radius={[3, 3, 0, 0]} maxBarSize={22} />
              <Bar dataKey="purchase" name="Purchase" fill="#10b981" radius={[3, 3, 0, 0]} maxBarSize={22} />
            </RechartsBarChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-4 mt-2 justify-center">
            <span className="flex items-center gap-1.5 text-[10px] font-semibold text-[var(--muted)]"><span className="h-2 w-2 rounded-sm bg-[#6366f1]" />Sales</span>
            <span className="flex items-center gap-1.5 text-[10px] font-semibold text-[var(--muted)]"><span className="h-2 w-2 rounded-sm bg-[#10b981]" />Purchase</span>
          </div>
        </div>

        {/* Manufacturing + Inventory Metrics Donut/Pie */}
        <div className="rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
          <div className="mb-3">
            <h3 className="text-sm font-bold text-[var(--foreground)]">Manufacturing Pipeline</h3>
            <p className="text-[11px] text-[var(--muted)]">Work order stage distribution</p>
          </div>
          <div className="flex items-center gap-4 h-[200px]">
            <div className="flex-1 h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: "Draft", value: data.manufacturing?.all?.draft || 0 },
                      { name: "Confirmed", value: data.manufacturing?.all?.confirmed || 0 },
                      { name: "In Progress", value: data.manufacturing?.all?.in_progress || 0 },
                      { name: "To Close", value: data.manufacturing?.all?.to_close || 0 },
                      { name: "Done", value: data.manufacturing?.all?.done || 0 },
                    ].filter(d => d.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {["#6366f1","#f59e0b","#3b82f6","#ef4444","#10b981"].map((color, i) => (
                      <Cell key={i} fill={color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-col gap-2 text-xs">
              {[
                { label: "Draft", value: data.manufacturing?.all?.draft || 0, color: "#6366f1" },
                { label: "Confirmed", value: data.manufacturing?.all?.confirmed || 0, color: "#f59e0b" },
                { label: "In Progress", value: data.manufacturing?.all?.in_progress || 0, color: "#3b82f6" },
                { label: "To Close", value: data.manufacturing?.all?.to_close || 0, color: "#ef4444" },
                { label: "Done", value: data.manufacturing?.all?.done || 0, color: "#10b981" },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                    <span className="text-[var(--muted)] font-semibold">{label}</span>
                  </div>
                  <span className="font-mono font-bold text-[var(--foreground)]">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT GRID ─────────────────────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-3">

        {/* LEFT COLUMN (span 2) */}
        <div className="lg:col-span-2 space-y-4">

          {/* ZONE 2: ACTION CENTER */}
          {actionItems.length > 0 && (
            <DashboardPanel title="⚡ Action Center" icon={Bell} className="border-amber-200 dark:border-amber-800">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {actionItems.map((item, i) => (
                  <ActionItem key={i} {...item} />
                ))}
              </div>
            </DashboardPanel>
          )}

          {/* ZONE 3: SALES OPERATIONS */}
          <OperationsSection
            title="Sales Operations"
            icon={ReceiptText}
            allData={data.sales?.all}
            myData={data.sales?.my}
            allLabels={salesAllLabels}
            myLabels={salesMyLabels}
            redirectPrefix="/sales/orders"
            href="/sales/orders"
          />

          {/* ZONE 4: PURCHASE OPERATIONS */}
          <OperationsSection
            title="Purchase Operations"
            icon={ShoppingCart}
            allData={data.purchases?.all}
            myData={data.purchases?.my}
            allLabels={purchasesAllLabels}
            myLabels={purchasesMyLabels}
            redirectPrefix="/purchase/orders"
            href="/purchase/orders"
          />

          {/* ZONE 5: MANUFACTURING OPERATIONS */}
          <OperationsSection
            title="Manufacturing Operations"
            icon={Factory}
            allData={data.manufacturing?.all}
            myData={data.manufacturing?.my}
            allLabels={mfgAllLabels}
            myLabels={mfgMyLabels}
            redirectPrefix="/manufacturing/command-center"
            href="/manufacturing/command-center"
          />

          {/* ZONE 7: ACTIVITY FEED */}
          <DashboardPanel title="Recent Activity" icon={ClipboardList} href="/audit-logs" hrefLabel="Audit Log">
            <ActivityFeed events={activityEvents} />
          </DashboardPanel>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-4">

          {/* ZONE 10: NOTIFICATIONS */}
          <DashboardPanel title="Notifications" icon={Bell}>
            <div className="space-y-1">
              {notifications.map((n, i) => (
                <NotificationItem key={i} {...n} />
              ))}
            </div>
          </DashboardPanel>

          {/* ZONE 8: MY WORK */}
          <DashboardPanel title={`My Work · ${user?.first_name || "User"}`} icon={Users}>
            <div className="space-y-1.5">
              <MyWorkItem label="My Sales Orders" count={data.sales?.my ? Object.values(data.sales.my).reduce((a: number, b: any) => a + (b || 0), 0) : 0} href="/sales/orders?mine=1" icon={ReceiptText} />
              <MyWorkItem label="My Purchase Orders" count={data.purchases?.my ? Object.values(data.purchases.my).reduce((a: number, b: any) => a + (b || 0), 0) : 0} href="/purchase/orders?mine=1" icon={ShoppingCart} />
              <MyWorkItem label="My Mfg Orders" count={data.manufacturing?.my ? Object.values(data.manufacturing.my).reduce((a: number, b: any) => a + (b || 0), 0) : 0} href="/manufacturing/command-center?mine=1" icon={Factory} />
              <MyWorkItem label="Late Deliveries" count={lateSales} href="/sales/orders?status=late" icon={Truck} urgency={lateSales > 0 ? "urgent" : "normal"} />
              <MyWorkItem label="Pending Approvals" count={pendingDeliveries} href="/sales/orders?status=confirmed" icon={ShieldCheck} urgency={pendingDeliveries > 5 ? "urgent" : "normal"} />
            </div>
          </DashboardPanel>

          {/* ZONE 6: INVENTORY INTELLIGENCE */}
          <DashboardPanel title="Inventory Intelligence" icon={Warehouse} href="/products" hrefLabel="View Products">
            <div className="space-y-3">
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">Inventory Health</span>
                  <span className="text-xs font-bold text-[var(--foreground)]">{healthScore}%</span>
                </div>
                <InventoryHealthBar score={healthScore} />
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] p-2.5 text-center hover:bg-[var(--surface-raised)] transition cursor-pointer" onClick={() => router.push("/products")}>
                  <div className="text-lg font-extrabold text-[var(--foreground)]">{totalProducts}</div>
                  <div className="text-[9px] font-semibold uppercase tracking-wider text-[var(--muted)]">Total SKUs</div>
                </div>
                <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20 p-2.5 text-center hover:bg-red-100 transition cursor-pointer" onClick={() => router.push("/products")}>
                  <div className="text-lg font-extrabold text-red-600 dark:text-red-400">{lowStock}</div>
                  <div className="text-[9px] font-semibold uppercase tracking-wider text-red-500">Low Stock</div>
                </div>
                <div className="rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/20 p-2.5 text-center hover:bg-emerald-100 transition cursor-pointer" onClick={() => router.push("/inventory")}>
                  <div className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">{formatCurrency(inventoryVal)}</div>
                  <div className="text-[9px] font-semibold uppercase tracking-wider text-emerald-600">Total Value</div>
                </div>
                <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] p-2.5 text-center hover:bg-[var(--surface-raised)] transition cursor-pointer" onClick={() => router.push("/inventory")}>
                  <div className="text-lg font-extrabold text-[var(--foreground)]">—</div>
                  <div className="text-[9px] font-semibold uppercase tracking-wider text-[var(--muted)]">Aging Items</div>
                </div>
              </div>
            </div>
          </DashboardPanel>

          {/* Quick Actions */}
          <DashboardPanel title="Quick Actions" icon={Plus}>
            <div className="space-y-1.5">
              {[
                { label: "Create Sales Order", desc: "New demand pipeline", modal: "sales_order" as const, icon: ReceiptText },
                { label: "Create Purchase Order", desc: "Draft procurement", modal: "purchase_order" as const, icon: ShoppingCart },
                { label: "Register Product", desc: "Add new SKU", modal: "product" as const, icon: PackageSearch },
                { label: "Invite User", desc: "Provision system access", modal: "user" as const, icon: Users },
              ].map(({ label, desc, modal, icon: Icon }) => (
                <button
                  key={modal}
                  onClick={() => setActiveModal(modal)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] hover:bg-[var(--surface-raised)] hover:border-[var(--primary-soft)] transition text-left cursor-pointer group"
                >
                  <div className="flex items-center gap-2">
                    <div className="grid h-7 w-7 place-items-center rounded-md bg-[var(--primary-soft)] text-[var(--primary)] group-hover:scale-105 transition-transform">
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-[var(--foreground)] block">{label}</span>
                      <span className="text-[10px] text-[var(--muted)]">{desc}</span>
                    </div>
                  </div>
                  <Plus className="h-3.5 w-3.5 text-[var(--muted)] group-hover:text-[var(--primary)] transition-colors" />
                </button>
              ))}
            </div>
          </DashboardPanel>
        </div>
      </div>

      {/* ── CREATION MODALS ───────────────────────────────────────────────── */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-[4px] animate-in fade-in duration-200" onClick={() => setActiveModal(null)}>
          <div className="relative w-full max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3 mb-4">
              <h3 className="text-base font-bold text-[var(--foreground)]">
                {activeModal === "sales_order" && "Quick Create Sales Order"}
                {activeModal === "purchase_order" && "Quick Create Purchase Order"}
                {activeModal === "product" && "Register Product Master Data"}
                {activeModal === "user" && "Invite New User"}
              </h3>
              <button onClick={() => setActiveModal(null)} className="text-[var(--muted)] hover:text-[var(--foreground)] text-sm font-bold p-1 rounded-full hover:bg-[var(--surface-muted)] transition">✕</button>
            </div>

            {activeModal === "sales_order" && (
              <form onSubmit={handleCreateSalesOrder} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-1">Customer</label>
                  <PartnerCombobox
                    value={formSales.customer}
                    onChange={(id) => setFormSales({ ...formSales, customer: id })}
                    options={(customers || []).map((c: any) => ({ id: c.id, name: c.name || `Customer #${c.id}`, code: c.customer_code }))}
                    placeholder="Type customer name..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-1">Product</label>
                    <select value={formSales.product} onChange={(e) => { const prod = products?.find((p: any) => p.id?.toString() === e.target.value?.toString()); setFormSales({ ...formSales, product: e.target.value, unitPrice: prod ? parseFloat(prod.sales_price || 0) : 0 }); }} className="block w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface-muted)] text-[var(--foreground)] focus:ring-1 focus:ring-[var(--primary)] focus:outline-none text-sm" required>
                      <option value="">Select Product...</option>
                      {products?.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-1">Quantity</label>
                    <input type="number" min="1" value={formSales.quantity} onChange={(e) => setFormSales({ ...formSales, quantity: parseInt(e.target.value, 10) || 1 })} className="block w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface-muted)] text-[var(--foreground)] focus:ring-1 focus:ring-[var(--primary)] focus:outline-none text-sm" required />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-1">Unit Price ($)</label>
                  <input type="number" step="0.01" min="0" value={formSales.unitPrice} onChange={(e) => setFormSales({ ...formSales, unitPrice: parseFloat(e.target.value) || 0 })} className="block w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface-muted)] text-[var(--foreground)] focus:ring-1 focus:ring-[var(--primary)] focus:outline-none text-sm" required />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-1">Notes</label>
                  <textarea value={formSales.notes} onChange={(e) => setFormSales({ ...formSales, notes: e.target.value })} className="block w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface-muted)] text-[var(--foreground)] focus:ring-1 focus:ring-[var(--primary)] focus:outline-none text-sm" rows={2} />
                </div>
                <div className="flex justify-end gap-3 pt-3 border-t border-[var(--border)]">
                  <button type="button" onClick={() => setActiveModal(null)} className="px-4 py-2 text-xs font-bold uppercase border border-[var(--border)] rounded-lg hover:bg-[var(--surface-muted)] text-[var(--foreground)] transition cursor-pointer">Cancel</button>
                  <button type="submit" disabled={submitting} className="px-4 py-2 text-xs font-bold uppercase bg-[var(--primary-strong)] text-white dark:text-[var(--primary-fg)] rounded-lg hover:opacity-90 active:scale-[0.98] transition cursor-pointer disabled:opacity-50">{submitting ? "Creating..." : "Create"}</button>
                </div>
              </form>
            )}

            {activeModal === "purchase_order" && (
              <form onSubmit={handleCreatePurchaseOrder} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-1">Vendor</label>
                  <PartnerCombobox
                    value={formPurchase.vendor}
                    onChange={(id) => setFormPurchase({ ...formPurchase, vendor: id })}
                    options={(vendors || []).map((v: any) => ({ id: v.id, name: v.name || `Vendor #${v.id}`, code: v.vendor_code }))}
                    placeholder="Type vendor name..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-1">Product</label>
                    <select value={formPurchase.product} onChange={(e) => { const prod = products?.find((p: any) => p.id?.toString() === e.target.value?.toString()); setFormPurchase({ ...formPurchase, product: e.target.value, unitCost: prod ? parseFloat(prod.cost_price || 0) : 0 }); }} className="block w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface-muted)] text-[var(--foreground)] focus:ring-1 focus:ring-[var(--primary)] focus:outline-none text-sm" required>
                      <option value="">Select Product...</option>
                      {products?.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-1">Quantity</label>
                    <input type="number" min="1" value={formPurchase.quantity} onChange={(e) => setFormPurchase({ ...formPurchase, quantity: parseInt(e.target.value, 10) || 1 })} className="block w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface-muted)] text-[var(--foreground)] focus:ring-1 focus:ring-[var(--primary)] focus:outline-none text-sm" required />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-1">Unit Cost ($)</label>
                  <input type="number" step="0.01" min="0" value={formPurchase.unitCost} onChange={(e) => setFormPurchase({ ...formPurchase, unitCost: parseFloat(e.target.value) || 0 })} className="block w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface-muted)] text-[var(--foreground)] focus:ring-1 focus:ring-[var(--primary)] focus:outline-none text-sm" required />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-1">Notes</label>
                  <textarea value={formPurchase.notes} onChange={(e) => setFormPurchase({ ...formPurchase, notes: e.target.value })} className="block w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface-muted)] text-[var(--foreground)] focus:ring-1 focus:ring-[var(--primary)] focus:outline-none text-sm" rows={2} />
                </div>
                <div className="flex justify-end gap-3 pt-3 border-t border-[var(--border)]">
                  <button type="button" onClick={() => setActiveModal(null)} className="px-4 py-2 text-xs font-bold uppercase border border-[var(--border)] rounded-lg hover:bg-[var(--surface-muted)] text-[var(--foreground)] transition cursor-pointer">Cancel</button>
                  <button type="submit" disabled={submitting} className="px-4 py-2 text-xs font-bold uppercase bg-[var(--primary-strong)] text-white dark:text-[var(--primary-fg)] rounded-lg hover:opacity-90 active:scale-[0.98] transition cursor-pointer disabled:opacity-50">{submitting ? "Creating..." : "Create"}</button>
                </div>
              </form>
            )}

            {activeModal === "product" && (
              <form onSubmit={handleCreateProduct} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-1">Product Name</label>
                  <input type="text" value={formProduct.name} onChange={(e) => setFormProduct({ ...formProduct, name: e.target.value })} className="block w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface-muted)] text-[var(--foreground)] focus:ring-1 focus:ring-[var(--primary)] focus:outline-none text-sm" placeholder="e.g. Servo Assembly X-4" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-1">SKU</label>
                    <input type="text" value={formProduct.sku} onChange={(e) => setFormProduct({ ...formProduct, sku: e.target.value })} className="block w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface-muted)] text-[var(--foreground)] focus:ring-1 focus:ring-[var(--primary)] focus:outline-none text-sm" placeholder="e.g. ORB-2051" required />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-1">Category</label>
                    <select value={formProduct.category} onChange={(e) => setFormProduct({ ...formProduct, category: e.target.value })} className="block w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface-muted)] text-[var(--foreground)] focus:ring-1 focus:ring-[var(--primary)] focus:outline-none text-sm">
                      <option>Furniture Assemblies</option>
                      <option>Wood Parts</option>
                      <option>Hardware</option>
                      <option>Raw Materials</option>
                      <option>Packaging</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-1">Sales Price ($)</label>
                    <input type="number" step="0.01" min="0" value={formProduct.salesPrice} onChange={(e) => setFormProduct({ ...formProduct, salesPrice: parseFloat(e.target.value) || 0 })} className="block w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface-muted)] text-[var(--foreground)] focus:ring-1 focus:ring-[var(--primary)] focus:outline-none text-sm" required />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-1">Cost Price ($)</label>
                    <input type="number" step="0.01" min="0" value={formProduct.costPrice} onChange={(e) => setFormProduct({ ...formProduct, costPrice: parseFloat(e.target.value) || 0 })} className="block w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface-muted)] text-[var(--foreground)] focus:ring-1 focus:ring-[var(--primary)] focus:outline-none text-sm" required />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-1">On Hand Qty</label>
                    <input type="number" min="0" value={formProduct.onHand} onChange={(e) => setFormProduct({ ...formProduct, onHand: parseInt(e.target.value, 10) || 0 })} className="block w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface-muted)] text-[var(--foreground)] focus:ring-1 focus:ring-[var(--primary)] focus:outline-none text-sm" required />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-3 border-t border-[var(--border)]">
                  <button type="button" onClick={() => setActiveModal(null)} className="px-4 py-2 text-xs font-bold uppercase border border-[var(--border)] rounded-lg hover:bg-[var(--surface-muted)] text-[var(--foreground)] transition cursor-pointer">Cancel</button>
                  <button type="submit" disabled={submitting} className="px-4 py-2 text-xs font-bold uppercase bg-[var(--primary-strong)] text-white dark:text-[var(--primary-fg)] rounded-lg hover:opacity-90 active:scale-[0.98] transition cursor-pointer disabled:opacity-50">{submitting ? "Registering..." : "Register"}</button>
                </div>
              </form>
            )}

            {activeModal === "user" && (
              <form onSubmit={handleInviteUser} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-1">Username</label>
                  <input type="text" value={formUser.username} onChange={(e) => setFormUser({ ...formUser, username: e.target.value })} className="block w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface-muted)] text-[var(--foreground)] focus:ring-1 focus:ring-[var(--primary)] focus:outline-none text-sm" placeholder="e.g. james.miller" required />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-1">Email</label>
                  <input type="email" value={formUser.email} onChange={(e) => setFormUser({ ...formUser, email: e.target.value })} className="block w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface-muted)] text-[var(--foreground)] focus:ring-1 focus:ring-[var(--primary)] focus:outline-none text-sm" placeholder="e.g. james.miller@orbis.com" required />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-1">Password</label>
                  <input type="password" value={formUser.password} onChange={(e) => setFormUser({ ...formUser, password: e.target.value })} className="block w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface-muted)] text-[var(--foreground)] focus:ring-1 focus:ring-[var(--primary)] focus:outline-none text-sm" placeholder="Must be secure (e.g. OrbisPass123!)" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-1">Clearance Role</label>
                    <select value={formUser.role} onChange={(e) => setFormUser({ ...formUser, role: e.target.value })} className="block w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface-muted)] text-[var(--foreground)] focus:ring-1 focus:ring-[var(--primary)] focus:outline-none text-sm">
                      <option>Admin</option>
                      <option>Sales User</option>
                      <option>Purchase User</option>
                      <option>Manufacturing User</option>
                      <option>Inventory Manager</option>
                      <option>Business Owner</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-1">Account Clearance</label>
                    <select value={formUser.status} onChange={(e) => setFormUser({ ...formUser, status: e.target.value as any })} className="block w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface-muted)] text-[var(--foreground)] focus:ring-1 focus:ring-[var(--primary)] focus:outline-none text-sm">
                      <option value="Active">Active (Clear)</option>
                      <option value="Review">Review (On Hold)</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-3 border-t border-[var(--border)]">
                  <button type="button" onClick={() => setActiveModal(null)} className="px-4 py-2 text-xs font-bold uppercase border border-[var(--border)] rounded-lg hover:bg-[var(--surface-muted)] text-[var(--foreground)] transition cursor-pointer">Cancel</button>
                  <button type="submit" disabled={submitting} className="px-4 py-2 text-xs font-bold uppercase bg-[var(--primary-strong)] text-white dark:text-[var(--primary-fg)] rounded-lg hover:opacity-90 active:scale-[0.98] transition cursor-pointer disabled:opacity-50">{submitting ? "Inviting..." : "Invite"}</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
