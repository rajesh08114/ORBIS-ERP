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
import { Plus, ShoppingCart, Mail, Trash2 } from "@/components/icons";
import { Telephone, GeoAlt, PencilSquare, Building } from "react-bootstrap-icons";

interface Vendor {
  id: number;
  vendor_code: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  is_active: boolean;
}

function VendorModal({ vendor, onClose, onSuccess }: { vendor?: Vendor | null; onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({
    vendor_code: vendor?.vendor_code || "",
    name: vendor?.name || "",
    email: vendor?.email || "",
    phone: vendor?.phone || "",
    address: vendor?.address || "",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.vendor_code) { toast.error("Name and code are required."); return; }
    setSubmitting(true);
    try {
      if (vendor) {
        await apiClient(`vendors/${vendor.id}/`, { method: "PATCH", body: JSON.stringify(form) });
        toast.success("Vendor updated successfully.");
      } else {
        await apiClient("vendors/", { method: "POST", body: JSON.stringify(form) });
        toast.success("Vendor created successfully.");
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to save vendor.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-[4px]" onClick={onClose}>
      <div className="relative w-full max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-3 mb-4">
          <h3 className="text-base font-bold text-[var(--foreground)]">{vendor ? "Edit Vendor" : "New Vendor"}</h3>
          <button onClick={onClose} className="text-[var(--muted)] hover:text-[var(--foreground)] text-sm font-bold p-1 rounded-full hover:bg-[var(--surface-muted)] transition">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-1">Vendor Code *</label>
              <Input value={form.vendor_code} onChange={(e) => setForm({ ...form, vendor_code: e.target.value })} placeholder="e.g. VEND-001" required />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-1">Name *</label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Company or person name" required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-1">Email</label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="contact@vendor.com" />
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
              {submitting ? "Saving..." : vendor ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function VendorsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [editTarget, setEditTarget] = useState<Vendor | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["vendorsList"],
    queryFn: () => apiClient<any>("vendors/").then((r) => r.results || r),
  });

  const vendors: Vendor[] = (data || []).filter((v: Vendor) =>
    `${v.name} ${v.vendor_code} ${v.email}`.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (vendor: Vendor) => {
    if (!confirm(`Delete vendor "${vendor.name}"? This action is irreversible.`)) return;
    try {
      await apiClient(`vendors/${vendor.id}/`, { method: "DELETE" });
      toast.success("Vendor deleted.");
      queryClient.invalidateQueries({ queryKey: ["vendorsList"] });
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to delete vendor.");
    }
  };

  if (isLoading) return <LoadingState />;

  return (
    <>
      <PageHeader
        eyebrow="Partners"
        title="Vendor Management"
        description="Create, edit, and manage your vendor directory. Vendors are used in Purchase Orders."
      />

      <div className="flex items-center justify-between mb-5 gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 flex items-center gap-3 shadow-sm">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--primary-soft)]">
              <Building className="h-4 w-4 text-[var(--primary)]" />
            </div>
            <div>
              <div className="text-lg font-extrabold text-[var(--foreground)]">{vendors.length}</div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">Total Vendors</div>
            </div>
          </div>
          <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/20 px-4 py-2.5 flex items-center gap-3 shadow-sm">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
              <Building className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <div className="text-lg font-extrabold text-emerald-600">{(data || []).filter((v: Vendor) => v.is_active).length}</div>
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
            <Plus className="h-4 w-4 mr-1.5" /> New Vendor
          </Button>
        </div>
      </div>

      {vendors.length === 0 ? (
        <Card className="p-8 text-center border-[var(--border)] bg-[var(--surface)]">
          <div className="text-[var(--muted)] text-sm">No vendors found. Create your first vendor to get started.</div>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {vendors.map((vendor) => (
            <Card key={vendor.id} className="p-5 flex flex-col justify-between border-[var(--border)] bg-[var(--surface)] hover:shadow-md transition">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold text-[var(--muted)] font-mono bg-[var(--surface-muted)] px-2 py-0.5 rounded-md">
                    {vendor.vendor_code}
                  </span>
                  <Badge tone={vendor.is_active ? "success" : "warning"}>
                    {vendor.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-full bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center font-bold text-sm shrink-0">
                    {vendor.name.substring(0, 2).toUpperCase()}
                  </div>
                  <h3 className="text-sm font-bold text-[var(--foreground)]">{vendor.name}</h3>
                </div>
                <div className="space-y-1.5">
                  {vendor.email && (
                    <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
                      <Mail className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{vendor.email}</span>
                    </div>
                  )}
                  {vendor.phone && (
                    <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
                      <Telephone className="h-3.5 w-3.5 shrink-0" />
                      <span>{vendor.phone}</span>
                    </div>
                  )}
                  {vendor.address && (
                    <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
                      <GeoAlt className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{vendor.address}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-[var(--border)] flex justify-end gap-2">
                <Button variant="ghost" className="h-8 px-2 text-xs text-[var(--primary)] hover:bg-[var(--primary-soft)]" onClick={() => { setEditTarget(vendor); setModal("edit"); }}>
                  <PencilSquare className="h-3 w-3 mr-1" /> Edit
                </Button>
                <Button variant="ghost" className="h-8 px-2 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20" onClick={() => handleDelete(vendor)}>
                  <Trash2 className="h-3 w-3 mr-1" /> Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {(modal === "create" || modal === "edit") && (
        <VendorModal
          vendor={modal === "edit" ? editTarget : null}
          onClose={() => setModal(null)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["vendorsList"] });
            queryClient.invalidateQueries({ queryKey: ["vendors"] });
          }}
        />
      )}
    </>
  );
}
