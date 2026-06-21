"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { PageHeader } from "@/components/erp/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";
import { LoadingState } from "@/components/ui/states";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import { Plus, Users, Mail, ArrowRepeat, Trash2 } from "@/components/icons";
import { Telephone, ShieldCheck, PencilSquare, CheckCircle, XCircle } from "react-bootstrap-icons";

interface Group {
  id: number;
  name: string;
}

interface UserProfile {
  role_title: string;
  status: string;
  address?: string;
  mobile?: string;
}

interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_staff: boolean;
  is_superuser: boolean;
  is_active: boolean;
  groups: number[];
  groups_details: Group[];
  profile: UserProfile | null;
}

interface EditUserModalProps {
  user: User;
  roles: Group[];
  onClose: () => void;
  onSuccess: () => void;
}

function EditUserModal({ user, roles, onClose, onSuccess }: EditUserModalProps) {
  const [form, setForm] = useState({
    username: user.username,
    email: user.email,
    first_name: user.first_name || "",
    last_name: user.last_name || "",
    groupId: user.groups[0] || "",
    role_title: user.profile?.role_title || "",
    status: user.profile?.status || "active",
  });
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<"Sales" | "Purchase" | "Manufacturing" | "Product">("Sales");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.username || !form.email) {
      toast.error("Username and email are required.");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        username: form.username,
        email: form.email,
        first_name: form.first_name,
        last_name: form.last_name,
        groups: form.groupId ? [Number(form.groupId)] : [],
        profile: {
          role_title: form.role_title,
          status: form.status,
        },
      };

      await apiClient(`users/${user.id}/`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });

      toast.success("User profile and role updated successfully.");
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to update user.");
    } finally {
      setSubmitting(false);
    }
  };

  const salesRows = [
    { field: "Customer", c: true, v: true, e: true, d: true },
    { field: "Customer Address", c: true, v: true, e: true, d: true },
    { field: "Sales Person", c: true, v: true, e: true, d: true },
    { field: "Product", c: true, v: true, e: true, d: true },
    { field: "Ordered Quantity", c: true, v: true, e: true, d: true },
    { field: "Delivered Quantity", c: true, v: true, e: true, d: true },
    { field: "Sales Price", c: true, v: true, e: true, d: true },
    { field: "Status", c: true, v: true, e: true, d: false },
    { field: "Total", c: true, v: true, e: "Recomputed", d: null },
    { field: "Creation Date", c: "Auto Compute", v: true, e: false, d: false },
  ];

  const purchaseRows = [
    { field: "Vendor", c: true, v: true, e: true, d: true },
    { field: "Vendor Address", c: true, v: true, e: true, d: true },
    { field: "Responsible Person", c: true, v: true, e: true, d: true },
    { field: "Product", c: true, v: true, e: true, d: true },
    { field: "Ordered Quantity", c: true, v: true, e: true, d: true },
    { field: "Received Quantity", c: true, v: true, e: true, d: true },
    { field: "Cost Price", c: true, v: true, e: true, d: true },
    { field: "Total", c: "Auto Computed", v: true, e: false, d: false },
    { field: "Creation Date", c: "Auto Computed", v: true, e: false, d: false },
  ];

  const manufacturingRows = [
    { field: "Product To Manufacture", c: true, v: true, e: true, d: true },
    { field: "Product Quantity", c: true, v: true, e: true, d: true },
    { field: "BoM", c: true, v: true, e: true, d: true },
    { field: "Responsible Person", c: true, v: true, e: true, d: true },
    { field: "Finished Quantity", c: true, v: true, e: true, d: true },
    { field: "Creation Date", c: "Auto Computed", v: true, e: false, d: false },
  ];

  const productRows = [
    { field: "Product", c: true, v: true, e: true, d: true },
    { field: "Sales Price", c: true, v: true, e: true, d: true },
    { field: "Cost Price", c: true, v: true, e: true, d: true },
    { field: "On Hand Qty", c: true, v: true, e: true, d: true },
    { field: "Free To Use Qty", c: "Auto Computed", v: true, e: false, d: false },
    { field: "Procure On Demand", c: true, v: true, e: true, d: true },
    { field: "Vendor", c: true, v: true, e: true, d: true },
    { field: "Bill of Materials", c: true, v: true, e: true, d: true },
  ];

  const renderCell = (val: any) => {
    if (val === true) return "✓";
    if (val === false) return "✕";
    if (val === null) return "";
    return val;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-[4px]" onClick={onClose}>
      <div className="relative w-full max-w-2xl rounded-[16px] border border-[var(--border)] bg-[#101010] p-6 shadow-2xl text-slate-300 font-mono text-sm overflow-hidden flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
          <h3 className="text-lg font-bold text-white">User Management Form View</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white p-1 rounded-full transition">✕</button>
        </div>
        
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-6">
          {/* Top Section */}
          <div className="flex items-start justify-between border border-slate-800 rounded-[12px] p-5 border-dashed">
            <div className="space-y-3">
              <div className="text-xs text-rose-500 italic mb-2">readonly</div>
              <div className="flex"><span className="w-32 font-bold text-white">Name:</span> <span>{user.first_name} {user.last_name}</span></div>
              <div className="flex"><span className="w-32 font-bold text-white">Address:</span> <span>{user.profile?.address || "N/A"}</span></div>
              <div className="flex"><span className="w-32 font-bold text-white">Mobile Number:</span> <span>{user.profile?.mobile || "N/A"}</span></div>
              <div className="flex"><span className="w-32 font-bold text-white">Email ID:</span> <span>{user.email}</span></div>
              
              <div className="flex items-center pt-2 mt-2 border-t border-slate-800">
                <span className="w-32 font-bold text-white">Platform Role:</span> 
                <input 
                  value={form.role_title} 
                  onChange={(e) => setForm({ ...form, role_title: e.target.value })} 
                  className="bg-transparent border-b border-slate-700 text-white focus:outline-none focus:border-blue-500 px-1 py-0.5 w-48"
                />
                <span className="text-xs text-rose-500 italic ml-4">Only Platform Role is editable</span>
              </div>
            </div>
            
            <div className="flex flex-col items-end">
              <div className="relative w-24 h-32 rounded-[12px] border border-slate-700 bg-slate-900 flex items-center justify-center">
                <span className="text-xs text-slate-600">Avatar</span>
                <button type="button" className="absolute -bottom-2 -right-2 h-7 w-7 rounded-full bg-white text-black flex items-center justify-center shadow-lg hover:scale-105 transition">
                  <PencilSquare className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Section - Matrix */}
          <div className="border border-slate-800 rounded-[12px] overflow-hidden">
            <div className="flex border-b border-slate-800">
              {["Sales", "Purchase", "Manufacturing", "Product"].map(tab => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab as any)}
                  className={`px-4 py-2 border-r border-slate-800 text-xs font-bold ${activeTab === tab ? "bg-slate-800 text-white" : "bg-transparent text-slate-500 hover:text-slate-300"}`}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div className="p-0 overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[600px]">
                <thead className="border-b border-slate-800 text-white">
                  <tr>
                    <th className="py-2 px-3 border-r border-slate-800">Field</th>
                    <th className="py-2 px-3 border-r border-slate-800 text-center w-20">Create</th>
                    <th className="py-2 px-3 border-r border-slate-800 text-center w-20">View</th>
                    <th className="py-2 px-3 border-r border-slate-800 text-center w-24">Edit</th>
                    <th className="py-2 px-3 text-center w-20">Delete</th>
                  </tr>
                </thead>
                <tbody>
                  {(activeTab === "Sales" ? salesRows : activeTab === "Purchase" ? purchaseRows : activeTab === "Manufacturing" ? manufacturingRows : productRows).map((row, idx) => (
                    <tr key={idx} className="border-b border-slate-800/50 hover:bg-slate-800/20">
                      <td className="py-2 px-3 border-r border-slate-800 text-white">{row.field}</td>
                      <td className="py-2 px-3 border-r border-slate-800 text-center text-slate-400">{renderCell(row.c)}</td>
                      <td className="py-2 px-3 border-r border-slate-800 text-center text-slate-400">{renderCell(row.v)}</td>
                      <td className="py-2 px-3 border-r border-slate-800 text-center text-slate-400">{renderCell(row.e)}</td>
                      <td className="py-2 px-3 text-center text-slate-400">{renderCell(row.d)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-bold uppercase border border-slate-700 rounded-lg hover:bg-slate-800 text-white transition cursor-pointer">Cancel</button>
            <button type="submit" disabled={submitting} className="px-4 py-2 text-xs font-bold uppercase bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition cursor-pointer disabled:opacity-50">
              {submitting ? "Updating..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<"users" | "permissions">("users");

  // Fetch Users
  const { data: usersData, isLoading, error } = useQuery<any>({
    queryKey: ["users"],
    queryFn: () => apiClient<any>("users/"),
  });

  const users: User[] = usersData?.results || (Array.isArray(usersData) ? usersData : []);

  // Fetch Roles
  const { data: rolesData, isLoading: rolesLoading } = useQuery<any>({
    queryKey: ["roles"],
    queryFn: () => apiClient<any>("roles/"),
  });
  const roles: Group[] = rolesData?.results || (Array.isArray(rolesData) ? rolesData : []);

  // Toggle status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: (userId: number) => apiClient(`users/${userId}/toggle_status/`, { method: "POST" }),
    onSuccess: (data: any) => {
      toast.success(data.message || "User status updated successfully.");
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update user status.");
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: (userId: number) => apiClient(`users/${userId}/`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("User account deleted successfully.");
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete user account.");
    },
  });

  const handleDelete = (userId: number, name: string) => {
    if (confirm(`Are you absolutely sure you want to permanently delete user "${name}"? This cannot be undone.`)) {
      deleteUserMutation.mutate(userId);
    }
  };

  const filteredUsers = users.filter((u) => {
    const term = searchTerm.toLowerCase();
    const roleName = u.groups_details?.[0]?.name || u.profile?.role_title || "System User";
    return (
      u.username.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term) ||
      (u.first_name + " " + u.last_name).toLowerCase().includes(term) ||
      roleName.toLowerCase().includes(term)
    );
  });

  if (isLoading) return <LoadingState />;
  if (error) return <div className="p-6 text-red-500 font-bold">Error loading user list. Please verify your permissions.</div>;

  const totalUsers = users.length;
  const activeCount = users.filter((u) => u.is_active).length;
  const adminCount = users.filter((u) => u.is_superuser || u.is_staff || u.groups_details?.some(g => g.name === "Administrator")).length;
  const holdCount = totalUsers - activeCount;

  return (
    <>
      <PageHeader 
        eyebrow="Admin" 
        title="User Management" 
        description="Monitor system-wide user credentials, assign workspace roles, and configure clearance status." 
      />

      <div className="mt-4">
        <h2 className="text-lg font-bold text-[var(--foreground)] mb-4">System Administrator Dashboard</h2>
      </div>

      {/* KPI stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card className="p-4 border-[var(--border)] bg-[var(--surface)] flex flex-col justify-between">
          <div className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Total Workspace Users</div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-[var(--foreground)]">{totalUsers}</span>
            <Users className="h-6 w-6 text-[var(--primary)] opacity-40" />
          </div>
        </Card>
        <Card className="p-4 border-[var(--border)] bg-[var(--surface)] flex flex-col justify-between">
          <div className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Active Accounts</div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-emerald-500">{activeCount}</span>
            <CheckCircle className="h-6 w-6 text-emerald-500 opacity-40" />
          </div>
        </Card>
        <Card className="p-4 border-[var(--border)] bg-[var(--surface)] flex flex-col justify-between">
          <div className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Administrators</div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-[var(--foreground)]">{adminCount}</span>
            <ShieldCheck className="h-6 w-6 text-indigo-500 opacity-40" />
          </div>
        </Card>
        <Card className="p-4 border-[var(--border)] bg-[var(--surface)] flex flex-col justify-between">
          <div className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Access Hold / Review</div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-amber-500">{holdCount}</span>
            <XCircle className="h-6 w-6 text-amber-500 opacity-40" />
          </div>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-6">
        <div className="relative w-full sm:w-80">
          <Input 
            placeholder="Search username, email, role..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
        </div>
        <Link href="/users/new">
          <Button><Plus className="h-4 w-4 mr-2" /> Invite New User</Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredUsers.length === 0 ? (
          <div className="col-span-full text-center py-8 text-sm text-[var(--muted)]">
            No workspace users match your filter search.
          </div>
        ) : (
          filteredUsers.map((u) => {
            const groupName = u.groups_details?.[0]?.name || "System User";
            const roleLabel = u.profile?.role_title 
              ? `${groupName} (${u.profile.role_title})` 
              : groupName;

            return (
              <Card key={u.id} className="p-5 flex flex-col justify-between border-[var(--border)] bg-[var(--surface)] hover:shadow-md transition">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-[var(--muted)]">UID: #{u.id}</span>
                    <Badge tone={u.is_active ? "success" : "warning"}>
                      {u.is_active ? "Active" : "On Hold"}
                    </Badge>
                  </div>

                  <div className="mt-3 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center font-bold">
                      {u.username.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-bold text-[var(--foreground)] truncate">
                        {u.first_name || u.last_name ? `${u.first_name} ${u.last_name}` : u.username}
                      </h3>
                      <span className="text-[10px] text-[var(--muted)] block truncate">@{u.username}</span>
                      <span className="text-[11px] font-semibold text-[var(--primary)] block mt-0.5 truncate">{roleLabel}</span>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-2 text-xs text-[var(--muted)] border-t border-[var(--border)] pt-3">
                    <Mail className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{u.email}</span>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-[var(--border)] flex justify-between items-center gap-2">
                  <div className="flex gap-2">
                    <Button 
                      variant="ghost" 
                      className="h-8 px-2 text-xs text-[var(--muted)] hover:bg-[var(--surface-muted)]"
                      onClick={() => setEditingUser(u)}
                    >
                      <PencilSquare className="h-3.5 w-3.5 mr-1" /> Edit
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="h-8 px-2 text-xs text-red-500 hover:bg-red-500/10"
                      onClick={() => handleDelete(u.id, u.username)}
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                    </Button>
                  </div>
                  <Button 
                    variant="ghost" 
                    className="h-8 px-2 text-xs text-[var(--primary)] hover:bg-[var(--primary-soft)]"
                    onClick={() => toggleStatusMutation.mutate(u.id)}
                  >
                    <ArrowRepeat className="h-3 w-3 mr-1" /> Toggle Hold
                  </Button>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {editingUser && (
        <EditUserModal 
          user={editingUser} 
          roles={roles} 
          onClose={() => setEditingUser(null)} 
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ["users"] })} 
        />
      )}
    </>
  );
}
