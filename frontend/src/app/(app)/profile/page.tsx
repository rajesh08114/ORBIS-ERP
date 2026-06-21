"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/erp/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/field";
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
} from "@/components/icons";
import { PermissionsMatrix } from "@/components/erp/permissions-matrix";

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
          address: detailsForm.address
        })
      });
      
      if (user) {
        useAuthStore.setState({
          user: {
            ...user,
            first_name: detailsForm.firstName,
            last_name: detailsForm.lastName,
            email: detailsForm.email
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
    if (access === "write") return "text-emerald-500 bg-emerald-500/10 border-emerald-500/30";
    if (access === "read") return "text-blue-500 bg-blue-500/10 border-blue-500/30";
    return "text-rose-500 bg-rose-500/10 border-rose-500/30";
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 animate-in fade-in duration-200">
      
      {/* Premium Profile Header */}
      <div className="relative mb-10 overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)]/60 backdrop-blur-3xl shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--primary-soft)]/40 to-transparent pointer-events-none" />
        <div className="relative p-8 flex flex-col md:flex-row items-center gap-6">
          <div className="relative group">
            <div className="h-28 w-28 rounded-full overflow-hidden border-4 border-[var(--surface)] shadow-2xl bg-[var(--surface-muted)] flex items-center justify-center font-black text-3xl text-[var(--muted)]">
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
              className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer text-white shadow-inner"
              title="Upload new avatar"
            >
              <Camera className="h-6 w-6 mb-1 drop-shadow-md" />
              <span className="text-[9px] font-bold tracking-widest uppercase">Update</span>
              <input 
                type="file" 
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden" 
                disabled={uploadingAvatar}
              />
            </label>
          </div>
          
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl font-extrabold tracking-tight text-[var(--foreground)]">
              {`${profile.user?.first_name || ""} ${profile.user?.last_name || ""}`.trim() || profile.user?.username}
            </h1>
            <p className="text-sm font-semibold text-[var(--primary)] mt-1 uppercase tracking-widest">
              {profile.common_profile?.role_title || userRole}
            </p>
            <div className="flex items-center justify-center md:justify-start gap-2 mt-3">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs font-bold">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                SSO Connected
              </span>
              <span className="px-3 py-1 rounded-full bg-[var(--surface-muted)] border border-[var(--border)] text-[var(--muted)] text-xs font-bold uppercase tracking-wider">
                UID: {profile.user?.id}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-4">
        
        {/* Sleek Sidebar Navigation */}
        <div className="lg:col-span-1">
          <nav className="flex flex-row lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0 custom-scrollbar sticky top-24">
            {[
              { id: "details", label: "Personal Info", icon: Person },
              { id: "avatar", label: "Avatar Upload", icon: Camera },
              { id: "security", label: "Security", icon: ShieldLock },
              { id: "clearance", label: "Module Clearance", icon: ShieldCheck },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as ProfileTab)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-300 whitespace-nowrap ${
                    isActive
                      ? "bg-[var(--primary)] text-[var(--primary-fg)] shadow-[0_4px_20px_rgba(87,52,79,0.3)] scale-[1.02]"
                      : "bg-transparent text-[var(--muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)] hover:scale-[1.01]"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? "text-[var(--primary-soft)]" : "opacity-70"}`} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right Side: Active Tab Detail Screen */}
        <div className="lg:col-span-3">
          <Card className="border border-[var(--border)] bg-[var(--surface)]/90 backdrop-blur-xl rounded-3xl p-8 shadow-2xl relative overflow-hidden transition-all duration-200 min-h-[500px]">
            
            {/* Subtle internal top gradient */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[var(--primary)] to-transparent opacity-50" />

            {/* 1. Personal Info Tab */}
            {activeTab === "details" && (
              <form onSubmit={handleUpdateProfile} className="space-y-8 animate-in slide-in-from-right-4 fade-in duration-200">
                <div>
                  <h3 className="text-xl font-extrabold text-[var(--foreground)] tracking-tight">Personal Information</h3>
                  <p className="text-xs text-[var(--muted)] mt-1 font-medium">Update your core identity and contact details.</p>
                </div>
                
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">First Name</label>
                    <Input 
                      type="text" 
                      value={detailsForm.firstName}
                      onChange={(e) => setDetailsForm({ ...detailsForm, firstName: e.target.value })}
                      placeholder="e.g. Rajesh"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">Last Name</label>
                    <Input 
                      type="text" 
                      value={detailsForm.lastName}
                      onChange={(e) => setDetailsForm({ ...detailsForm, lastName: e.target.value })}
                      placeholder="e.g. Gupta"
                    />
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">Email Address</label>
                    <Input 
                      type="email" 
                      value={detailsForm.email}
                      onChange={(e) => setDetailsForm({ ...detailsForm, email: e.target.value })}
                      placeholder="name@company.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">Mobile Phone</label>
                    <Input 
                      type="text" 
                      value={detailsForm.mobile}
                      onChange={(e) => setDetailsForm({ ...detailsForm, mobile: e.target.value })}
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">Role Title</label>
                    <Input 
                      type="text" 
                      value={detailsForm.roleTitle}
                      onChange={(e) => setDetailsForm({ ...detailsForm, roleTitle: e.target.value })}
                      placeholder="e.g. Senior Procurement Manager"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">Department</label>
                    <Input 
                      type="text" 
                      value={detailsForm.position}
                      onChange={(e) => setDetailsForm({ ...detailsForm, position: e.target.value })}
                      placeholder="e.g. Operations Division"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">Physical Address</label>
                  <Textarea 
                    value={detailsForm.address}
                    onChange={(e) => setDetailsForm({ ...detailsForm, address: e.target.value })}
                    placeholder="Enter shipping or office location address"
                    rows={3}
                  />
                </div>

                <div className="flex justify-end pt-6 border-t border-[var(--border)]">
                  <Button type="submit" variant="primary" className="px-8 py-4 rounded-xl shadow-lg">
                    Save Changes
                  </Button>
                </div>
              </form>
            )}

            {/* 2. Avatar Upload Tab */}
            {activeTab === "avatar" && (
              <div className="space-y-8 animate-in slide-in-from-right-4 fade-in duration-200">
                <div>
                  <h3 className="text-xl font-extrabold text-[var(--foreground)] tracking-tight">Avatar Preferences</h3>
                  <p className="text-xs text-[var(--muted)] mt-1 font-medium">Update your profile picture. Uploads are securely hosted.</p>
                </div>

                <div className="relative group border-2 border-dashed border-[var(--border)] hover:border-[var(--primary)] hover:bg-[var(--primary-soft)]/20 transition-all duration-300 rounded-3xl p-12 flex flex-col items-center justify-center">
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[var(--surface-muted)]/50 rounded-3xl pointer-events-none" />
                  
                  <div className="relative z-10 h-32 w-32 rounded-full overflow-hidden border-4 border-[var(--surface)] shadow-2xl bg-[var(--surface-muted)] flex items-center justify-center font-bold text-4xl text-[var(--muted)] mb-6 group-hover:scale-105 transition-transform duration-200">
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
                  
                  <label className="relative z-10 px-6 py-3 border border-[var(--primary)]/30 rounded-xl bg-[var(--primary)] text-[var(--primary-fg)] font-bold text-sm shadow-[0_8px_20px_rgba(87,52,79,0.25)] hover:shadow-[0_12px_25px_rgba(87,52,79,0.4)] cursor-pointer transition-all duration-300 active:scale-95">
                    {uploadingAvatar ? "Uploading securely..." : "Choose Image File"}
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden" 
                      disabled={uploadingAvatar}
                    />
                  </label>
                  <span className="relative z-10 text-[10px] text-[var(--muted)] mt-4 font-bold uppercase tracking-widest">
                    Supported: PNG, JPEG (Max 5MB)
                  </span>
                </div>
              </div>
            )}

            {/* 3. Security Settings Tab */}
            {activeTab === "security" && (
              <form onSubmit={handleChangePassword} className="space-y-8 animate-in slide-in-from-right-4 fade-in duration-200">
                <div>
                  <h3 className="text-xl font-extrabold text-[var(--foreground)] tracking-tight">Security & Passwords</h3>
                  <p className="text-xs text-[var(--muted)] mt-1 font-medium">Manage your credentials and login parameters.</p>
                </div>
                
                <div className="space-y-6 max-w-lg">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">Current Password</label>
                    <Input 
                      type="password" 
                      value={passwordForm.oldPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                      placeholder="••••••••"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">New Password</label>
                    <Input 
                      type="password" 
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      placeholder="••••••••"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">Confirm New Password</label>
                    <Input 
                      type="password" 
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-start pt-6 border-t border-[var(--border)]">
                  <Button type="submit" variant="primary" className="px-8 py-4 rounded-xl shadow-lg">
                    Update Password
                  </Button>
                </div>
              </form>
            )}

            {/* 4. Module Clearance Tab */}
            {activeTab === "clearance" && (
              <div className="space-y-8 animate-in slide-in-from-right-4 fade-in duration-200">
                <div>
                  <h3 className="text-xl font-extrabold text-[var(--foreground)] tracking-tight">System Clearances</h3>
                  <p className="text-xs text-[var(--muted)] mt-1 font-medium">Your authorization is mapped to <strong className="text-[var(--primary)]">{userRole}</strong>.</p>
                </div>

                <div className="mt-4">
                  <PermissionsMatrix />
                </div>
              </div>
            )}

          </Card>
        </div>
      </div>
    </div>
  );
}
