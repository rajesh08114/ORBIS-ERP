"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/erp/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/field";
import { LoadingState } from "@/components/ui/states";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import { Plus, Users, Mail, Trash2 } from "@/components/icons";
import { Telephone, GeoAlt, PencilSquare } from "react-bootstrap-icons";

interface Customer {
  id: number;
  customer_code: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  is_active: boolean;
}

function CustomerModal({ customer, onClose, onSuccess }: { customer?: Customer | null; onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({
    customer_code: customer?.customer_code || "",
    name: customer?.name || "",
    email: customer?.email || "",
    phone: customer?.phone || "",
    address: customer?.address || "",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.customer_code) { toast.error("Name and code are required."); return; }
    setSubmitting(true);
    try {
      if (customer) {
        await apiClient(`customers/${customer.id}/`, { method: "PATCH", body: JSON.stringify(form) });
        toast.success("Customer updated successfully.");
      } else {
        await apiClient("customers/", { method: "POST", body: JSON.stringify(form) });
        toast.success("Customer created successfully.");
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to save customer.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-[4px]" onClick={onClose}>
      <div className="relative w-full max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-3 mb-4">
          <h3 className="text-base font-bold text-[var(--foreground)]">{customer ? "Edit Customer" : "New Customer"}</h3>
          <button onClick={onClose} className="text-[var(--muted)] hover:text-[var(--foreground)] text-sm font-bold p-1 rounded-full hover:bg-[var(--surface-muted)] transition">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-1">Customer Code *</label>
              <Input value={form.customer_code} onChange={(e) => setForm({ ...form, customer_code: e.target.value })} placeholder="e.g. CUST-001" required />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-1">Name *</label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Company or person name" required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-1">Email</label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="contact@company.com" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-1">Phone</label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+1 555 000 0000" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-1">Address</label>
            <Textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Street, City, Country" className="min-h-16" />
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-[var(--border)]">
            <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-bold uppercase border border-[var(--border)] rounded-lg hover:bg-[var(--surface-muted)] text-[var(--foreground)] transition cursor-pointer">Cancel</button>
            <button type="submit" disabled={submitting} className="px-4 py-2 text-xs font-bold uppercase bg-[var(--primary-strong)] text-white rounded-lg hover:opacity-90 transition cursor-pointer disabled:opacity-50">
              {submitting ? "Saving..." : customer ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CustomersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [editTarget, setEditTarget] = useState<Customer | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["customersList"],
    queryFn: () => apiClient<any>("customers/").then((r) => r.results || r),
  });

  const customers: Customer[] = (data || []).filter((c: Customer) =>
    `${c.name} ${c.customer_code} ${c.email}`.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (customer: Customer) => {
    if (!confirm(`Delete customer "${customer.name}"? This action is irreversible.`)) return;
    try {
      await apiClient(`customers/${customer.id}/`, { method: "DELETE" });
      toast.success("Customer deleted.");
      queryClient.invalidateQueries({ queryKey: ["customersList"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to delete customer.");
    }
  };

  if (isLoading) return <LoadingState />;

  return (
    <>
      <PageHeader
        eyebrow="Partners"
        title="Customer Management"
        description="Create, edit, and manage your customer directory. Customers are used in Sales Orders."
      />

      {/* Stats + Create */}
      <div className="flex items-center justify-between mb-5 gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 flex items-center gap-3 shadow-sm">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--primary-soft)]">
              <Users className="h-4 w-4 text-[var(--primary)]" />
            </div>
            <div>
              <div className="text-lg font-extrabold text-[var(--foreground)]">{customers.length}</div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">Total Customers</div>
            </div>
          </div>
          <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/20 px-4 py-2.5 flex items-center gap-3 shadow-sm">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
              <Users className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <div className="text-lg font-extrabold text-emerald-600">{(data || []).filter((c: Customer) => c.is_active).length}</div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600">Active</div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Input
            placeholder="Search by name, code or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-64 text-sm"
          />
          <Button onClick={() => { setEditTarget(null); setModal("create"); }} className="h-9 text-xs">
            <Plus className="h-4 w-4 mr-1.5" /> New Customer
          </Button>
        </div>
      </div>

      {/* Customer Cards Grid */}
      {customers.length === 0 ? (
        <Card className="p-8 text-center border-[var(--border)] bg-[var(--surface)]">
          <div className="text-[var(--muted)] text-sm">No customers found. Create your first customer to get started.</div>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {customers.map((customer) => (
            <Card key={customer.id} className="p-5 flex flex-col justify-between border-[var(--border)] bg-[var(--surface)] hover:shadow-md transition">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold text-[var(--muted)] font-mono bg-[var(--surface-muted)] px-2 py-0.5 rounded-md">
                    {customer.customer_code}
                  </span>
                  <Badge tone={customer.is_active ? "success" : "warning"}>
                    {customer.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>

                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-full bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center font-bold text-sm shrink-0">
                    {customer.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[var(--foreground)]">{customer.name}</h3>
                  </div>
                </div>

                <div className="space-y-1.5">
                  {customer.email && (
                    <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
                      <Mail className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{customer.email}</span>
                    </div>
                  )}
                  {customer.phone && (
                    <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
                      <Telephone className="h-3.5 w-3.5 shrink-0" />
                      <span>{customer.phone}</span>
                    </div>
                  )}
                  {customer.address && (
                    <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
                      <GeoAlt className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{customer.address}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[var(--border)] flex justify-end gap-2">
                <Button
                  variant="ghost"
                  className="h-8 px-2 text-xs text-[var(--primary)] hover:bg-[var(--primary-soft)]"
                  onClick={() => { setEditTarget(customer); setModal("edit"); }}
                >
                  <PencilSquare className="h-3 w-3 mr-1" /> Edit
                </Button>
                <Button
                  variant="ghost"
                  className="h-8 px-2 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
                  onClick={() => handleDelete(customer)}
                >
                  <Trash2 className="h-3 w-3 mr-1" /> Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {(modal === "create" || modal === "edit") && (
        <CustomerModal
          customer={modal === "edit" ? editTarget : null}
          onClose={() => setModal(null)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["customersList"] });
            queryClient.invalidateQueries({ queryKey: ["customers"] });
          }}
        />
      )}
    </>
  );
}
