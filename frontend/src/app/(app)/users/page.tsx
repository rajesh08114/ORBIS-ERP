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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-[4px]" onClick={onClose}>
      <div className="relative w-full max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-3 mb-4">
          <h3 className="text-base font-bold text-[var(--foreground)]">Edit User Settings</h3>
          <button onClick={onClose} className="text-[var(--muted)] hover:text-[var(--foreground)] text-sm font-bold p-1 rounded-full hover:bg-[var(--surface-muted)] transition">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-1">Username *</label>
              <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-1">Email *</label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-1">First Name</label>
              <Input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-1">Last Name</label>
              <Input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-1">Workspace Group / Role</label>
              <Select value={form.groupId} onChange={(e) => setForm({ ...form, groupId: e.target.value })}>
                <option value="">No Role Group Assigned</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </Select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-1">Job Title</label>
              <Input value={form.role_title} onChange={(e) => setForm({ ...form, role_title: e.target.value })} placeholder="e.g. Senior ERP Analyst" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-1">SSO clearance Status</label>
            <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="active">Active (Permit Access)</option>
              <option value="inactive">Inactive / Hold (Lock Access)</option>
            </Select>
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-[var(--border)]">
            <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-bold uppercase border border-[var(--border)] rounded-lg hover:bg-[var(--surface-muted)] text-[var(--foreground)] transition cursor-pointer">Cancel</button>
            <button type="submit" disabled={submitting} className="px-4 py-2 text-xs font-bold uppercase bg-[var(--primary-strong)] text-white rounded-lg hover:opacity-90 transition cursor-pointer disabled:opacity-50">
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

  // Fetch Users
  const { data: usersData, isLoading, error } = useQuery<any>({
    queryKey: ["users"],
    queryFn: () => apiClient<any>("users/"),
  });

  const users: User[] = usersData?.results || (Array.isArray(usersData) ? usersData : []);

  // Fetch Roles
  const { data: roles = [] } = useQuery<Group[]>({
    queryKey: ["roles"],
    queryFn: () => apiClient<Group[]>("roles/"),
  });

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
