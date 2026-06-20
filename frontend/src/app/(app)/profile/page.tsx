"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/erp/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Select } from "@/components/ui/field";
import { LoadingState } from "@/components/ui/states";
import { useAuthStore } from "@/stores/auth-store";
import { useErpStore } from "@/stores/erp-store";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import { 
  Person, 
  ShieldLock, 
  Camera, 
  ShieldCheck, 
  Settings,
  Envelope
} from "@/components/icons";

type ProfileTab = "details" | "avatar" | "security" | "clearance";

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<ProfileTab>("details");
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  
  // Get backend profile data
  const { data: profile, isLoading, refetch } = useQuery({
    queryKey: ["profileMe"],
    queryFn: () => apiClient<any>("profiles/me/"),
    enabled: !!user,
  });

  // ERP Store clearance logic
  const rolePermissions = useErpStore((state) => state.rolePermissions);
  const userRole = user?.role || "System User";
  const permissionsMatrix = rolePermissions.find((rp) => rp.role === userRole)?.permissions || {
    Sales: "none",
    Procurement: "none",
    Manufacturing: "none",
    Governance: "none",
    Admin: "none"
  };

  // Profile details form state
  const [detailsForm, setDetailsForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    roleTitle: "",
    mobile: "",
    position: "",
    address: "",
    role: "System User"
  });

  useEffect(() => {
    if (profile) {
      setDetailsForm({
        firstName: profile.user?.first_name || "",
        lastName: profile.user?.last_name || "",
        email: profile.user?.email || "",
        roleTitle: profile.common_profile?.role_title || "",
        mobile: profile.common_profile?.mobile || "",
        position: profile.common_profile?.position || "",
        address: profile.common_profile?.address || "",
        role: profile.user?.role || "System User"
      });
    }
  }, [profile]);

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  // Avatar upload state
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  if (isLoading || !profile) return <LoadingState />;

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient("profiles/me/", {
        method: "PATCH",
        body: JSON.stringify({
          first_name: detailsForm.firstName,
          last_name: detailsForm.lastName,
          email: detailsForm.email,
          role_title: detailsForm.roleTitle,
          mobile: detailsForm.mobile,
          position: detailsForm.position,
          address: detailsForm.address,
          role: detailsForm.role
        })
      });
      
      // Update local store in real-time
      if (user) {
        useAuthStore.setState({
          user: {
            ...user,
            first_name: detailsForm.firstName,
            last_name: detailsForm.lastName,
            email: detailsForm.email,
            role: detailsForm.role as any,
            home: detailsForm.role === "Administrator" ? "/dashboard" : 
                  detailsForm.role === "Inventory Manager" ? "/inventory" :
                  detailsForm.role === "Procurement Manager" || detailsForm.role === "Purchase User" ? "/purchase/orders" :
                  detailsForm.role === "Manufacturing Manager" || detailsForm.role === "Manufacturing User" ? "/manufacturing/command-center" :
                  detailsForm.role === "Sales Manager" || detailsForm.role === "Sales User" ? "/sales/orders" : "/dashboard"
          }
        });
      }

      toast.success("Profile details updated successfully.");
      refetch();
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile details.");
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("avatar", file);

    setUploadingAvatar(true);
    try {
      // Need custom headers bypass for multipart
      const token = localStorage.getItem("auth_token");
      const res = await fetch("http://localhost:8000/api/v1/profiles/me/avatar/", {
        method: "POST",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || "Upload failed");
      }

      toast.success("Profile avatar uploaded successfully.");
      refetch();
      // Invalidate dashboard to update header dropdown too
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to upload avatar.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }
    try {
      await apiClient("auth/change-password/", {
        method: "POST",
        body: JSON.stringify({
          old_password: passwordForm.oldPassword,
          new_password: passwordForm.newPassword
        })
      });
      toast.success("Password updated successfully.");
      setPasswordForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err: any) {
      toast.error(err.message || "Failed to update password.");
    }
  };

  const getPermissionColor = (access: string) => {
    if (access === "write") return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
    if (access === "read") return "text-blue-500 bg-blue-500/10 border-blue-500/20";
    return "text-rose-500 bg-rose-500/10 border-rose-500/20";
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      {/* Profile Header */}
      <PageHeader 
        eyebrow="Profile" 
        title={`${profile.user?.first_name || ""} ${profile.user?.last_name || ""}`.trim() || profile.user?.username || "My Account"} 
        description="User profile, workspace preferences, notification routing, and role details." 
      />

      <div className="grid gap-6 md:grid-cols-4 mt-6">
        {/* Left Side: Avatar Card and Tabs List */}
        <div className="space-y-6 md:col-span-1">
          <Card className="p-5 flex flex-col items-center text-center relative overflow-hidden bg-[var(--surface)] border border-[var(--border)] rounded-[12px] shadow-[var(--shadow)]">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] opacity-70" />
            
            <div className="relative group mt-2">
              <div className="h-24 w-24 rounded-full overflow-hidden border-2 border-[var(--border)] bg-[var(--surface-muted)] flex items-center justify-center font-bold text-2xl text-[var(--muted)]">
                {profile.common_profile?.avatar_url ? (
                  <img 
                    src={profile.common_profile.avatar_url} 
                    alt="Avatar" 
                    className="h-full w-full object-cover" 
                  />
                ) : (
                  profile.user?.username?.substring(0, 2).toUpperCase()
                )}
              </div>
              <label 
                className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition duration-200 cursor-pointer text-white"
                title="Upload new avatar"
              >
                <Camera className="h-6 w-6" />
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden" 
                  disabled={uploadingAvatar}
                />
              </label>
            </div>

            {uploadingAvatar && (
              <span className="text-[10px] font-bold text-[var(--primary)] mt-2 animate-pulse">
                Uploading...
              </span>
            )}

            <h3 className="mt-4 font-bold text-lg text-[var(--foreground)] truncate max-w-full">
              {profile.user?.username}
            </h3>
            <span className="text-xs font-semibold text-[var(--muted)] block">
              {profile.common_profile?.role_title || userRole}
            </span>

            <div className="mt-4 w-full pt-3 border-t border-[var(--border)] flex items-center justify-center gap-2 text-xs text-[var(--muted)]">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              SSO Connected
            </div>
          </Card>

          {/* Navigation Menu Links */}
          <nav className="flex flex-col gap-1">
            <button
              onClick={() => setActiveTab("details")}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-left border transition ${
                activeTab === "details"
                  ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                  : "bg-transparent text-[var(--muted)] border-transparent hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)]"
              }`}
            >
              <Person className="h-4 w-4" />
              Personal Info
            </button>
            <button
              onClick={() => setActiveTab("avatar")}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-left border transition ${
                activeTab === "avatar"
                  ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                  : "bg-transparent text-[var(--muted)] border-transparent hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)]"
              }`}
            >
              <Camera className="h-4 w-4" />
              Upload Avatar
            </button>
            <button
              onClick={() => setActiveTab("security")}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-left border transition ${
                activeTab === "security"
                  ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                  : "bg-transparent text-[var(--muted)] border-transparent hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)]"
              }`}
            >
              <ShieldLock className="h-4 w-4" />
              Security Settings
            </button>
            <button
              onClick={() => setActiveTab("clearance")}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-left border transition ${
                activeTab === "clearance"
                  ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                  : "bg-transparent text-[var(--muted)] border-transparent hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)]"
              }`}
            >
              <ShieldCheck className="h-4 w-4" />
              Module Clearance
            </button>
          </nav>
        </div>

        {/* Right Side: Active Tab Detail Screen */}
        <div className="md:col-span-3">
          <Card className="border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow)] rounded-[12px] p-6">
            
            {/* 1. Personal Info Tab */}
            {activeTab === "details" && (
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <h3 className="text-md font-bold text-[var(--foreground)] pb-2 border-b border-[var(--border)]">
                  Personal Information
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-1.5">First Name</label>
                    <Input 
                      type="text" 
                      value={detailsForm.firstName}
                      onChange={(e) => setDetailsForm({ ...detailsForm, firstName: e.target.value })}
                      placeholder="Enter First Name"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-1.5">Last Name</label>
                    <Input 
                      type="text" 
                      value={detailsForm.lastName}
                      onChange={(e) => setDetailsForm({ ...detailsForm, lastName: e.target.value })}
                      placeholder="Enter Last Name"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-1.5">Email Address</label>
                    <Input 
                      type="email" 
                      value={detailsForm.email}
                      onChange={(e) => setDetailsForm({ ...detailsForm, email: e.target.value })}
                      placeholder="Enter Email Address"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-1.5">Mobile Phone</label>
                    <Input 
                      type="text" 
                      value={detailsForm.mobile}
                      onChange={(e) => setDetailsForm({ ...detailsForm, mobile: e.target.value })}
                      placeholder="Enter Mobile Number"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-1.5">Role Title</label>
                    <Input 
                      type="text" 
                      value={detailsForm.roleTitle}
                      onChange={(e) => setDetailsForm({ ...detailsForm, roleTitle: e.target.value })}
                      placeholder="e.g. Senior Procurement Manager"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-1.5">Department Position</label>
                    <Input 
                      type="text" 
                      value={detailsForm.position}
                      onChange={(e) => setDetailsForm({ ...detailsForm, position: e.target.value })}
                      placeholder="e.g. Procurement Division"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-1.5">Office/Home Address</label>
                  <Textarea 
                    value={detailsForm.address}
                    onChange={(e) => setDetailsForm({ ...detailsForm, address: e.target.value })}
                    placeholder="Enter physical shipping or office location address details"
                    rows={2}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-1.5">Clearance Role</label>
                    <Select
                      value={detailsForm.role}
                      onChange={(e) => setDetailsForm({ ...detailsForm, role: e.target.value })}
                    >
                      <option value="Administrator">Administrator</option>
                      <option value="Sales User">Sales User</option>
                      <option value="Purchase User">Purchase User</option>
                      <option value="Manufacturing User">Manufacturing User</option>
                      <option value="Inventory Manager">Inventory Manager</option>
                      <option value="Business Owner">Business Owner</option>
                      <option value="System User">System User</option>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end pt-3 border-t border-[var(--border)]">
                  <Button type="submit" variant="primary">
                    Save Changes
                  </Button>
                </div>
              </form>
            )}

            {/* 2. Avatar Upload Tab */}
            {activeTab === "avatar" && (
              <div className="space-y-6">
                <h3 className="text-md font-bold text-[var(--foreground)] pb-2 border-b border-[var(--border)]">
                  Avatar Upload & Preferences
                </h3>
                <p className="text-sm text-[var(--muted)]">
                  Change your system avatar. Upload files in PNG, JPG, or GIF formats. Uploads are hosted via secure Cloudinary storage.
                </p>

                <div className="border border-dashed border-[var(--border)] rounded-xl p-8 flex flex-col items-center justify-center bg-[var(--surface-muted)]">
                  <div className="h-20 w-20 rounded-full overflow-hidden border-2 border-[var(--border)] bg-[var(--surface)] flex items-center justify-center font-bold text-xl text-[var(--muted)] mb-4">
                    {profile.common_profile?.avatar_url ? (
                      <img 
                        src={profile.common_profile.avatar_url} 
                        alt="Current Avatar" 
                        className="h-full w-full object-cover" 
                      />
                    ) : (
                      profile.user?.username?.substring(0, 2).toUpperCase()
                    )}
                  </div>
                  
                  <label className="px-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface-raised)] hover:bg-[var(--surface-muted)] font-bold text-xs uppercase tracking-wider text-[var(--foreground)] cursor-pointer select-none transition">
                    {uploadingAvatar ? "Uploading Avatar..." : "Choose Image File"}
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden" 
                      disabled={uploadingAvatar}
                    />
                  </label>
                  <span className="text-[10px] text-[var(--muted)] mt-2 block font-semibold uppercase">
                    Supported: PNG, JPEG (Max 2MB)
                  </span>
                </div>
              </div>
            )}

            {/* 3. Security Settings Tab */}
            {activeTab === "security" && (
              <form onSubmit={handleChangePassword} className="space-y-6">
                <h3 className="text-md font-bold text-[var(--foreground)] pb-2 border-b border-[var(--border)]">
                  Security & Password Settings
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-1.5">Current Password</label>
                    <Input 
                      type="password" 
                      value={passwordForm.oldPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                      placeholder="••••••••"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-1.5">New Password</label>
                    <Input 
                      type="password" 
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      placeholder="••••••••"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-1.5">Confirm New Password</label>
                    <Input 
                      type="password" 
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-3 border-t border-[var(--border)]">
                  <Button type="submit" variant="primary">
                    Update Security Password
                  </Button>
                </div>
              </form>
            )}

            {/* 4. Module Clearance Tab */}
            {activeTab === "clearance" && (
              <div className="space-y-6">
                <h3 className="text-md font-bold text-[var(--foreground)] pb-2 border-b border-[var(--border)]">
                  Role-Based Module Clearance Matrix
                </h3>
                <p className="text-sm text-[var(--muted)]">
                  Your profile workspace authorization is linked to your SSO credentials. Your assigned role is <strong className="text-[var(--primary)]">{userRole}</strong>.
                </p>

                <div className="border border-[var(--border)] rounded-xl overflow-hidden">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-[var(--surface-muted)] text-[var(--muted)] border-b border-[var(--border)]">
                      <tr>
                        <th className="px-4 py-3 font-semibold uppercase tracking-wider text-xs">Module Segment</th>
                        <th className="px-4 py-3 font-semibold uppercase tracking-wider text-xs w-36 text-center">Clearance Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {Object.entries(permissionsMatrix).map(([module, access]) => (
                        <tr key={module} className="hover:bg-[var(--surface-muted)] transition bg-[var(--surface)]">
                          <td className="px-4 py-3.5 font-bold text-[var(--foreground)]">{module} Module</td>
                          <td className="px-4 py-3.5 text-center">
                            <span className={`inline-block px-2.5 py-1 text-[10px] font-extrabold uppercase border rounded-full tracking-wider ${getPermissionColor(access)}`}>
                              {access}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </Card>
        </div>
      </div>
    </div>
  );
}
