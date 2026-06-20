"use client";

import { useErpStore } from "@/stores/erp-store";
import { PageHeader } from "@/components/erp/page-header";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/field";
import { toast } from "sonner";
import { ShieldCheck, Info } from "@/components/icons";
import type { UserRole } from "@/stores/auth-store";
import type { PermissionAccess } from "@/stores/erp-store";

const modulesList = ["Sales", "Procurement", "Manufacturing", "Governance", "Admin"] as const;

export default function RolesPermissionsPage() {
  const rolePermissions = useErpStore((state) => state.rolePermissions);
  const updateRolePermissions = useErpStore((state) => state.updateRolePermissions);

  const handlePermissionChange = (
    role: UserRole,
    module: typeof modulesList[number],
    access: PermissionAccess
  ) => {
    updateRolePermissions(role, module, access);
    toast.success(`Clearance level updated: ${role} now has ${access} access on ${module}.`);
  };

  return (
    <>
      <PageHeader 
        eyebrow="Admin / IAM" 
        title="Access Clearance Matrix" 
        description="Configure role-based access control (RBAC) rules. Modifications update permission check gates instantly." 
      />

      <div className="grid gap-6">
        <Card className="p-5 border-[var(--border)] bg-[var(--surface)]">
          <div className="flex gap-3.5 items-start bg-[var(--surface-muted)] border border-[var(--border)] rounded-[8px] p-4 mb-6 text-sm text-[var(--muted)]">
            <Info className="h-5 w-5 text-[var(--primary)] shrink-0 mt-0.5" />
            <div>
              <strong className="text-[var(--foreground)]">Security Clearance Enforcement</strong>
              <p className="mt-1">
                Permissions modified here propagate dynamically. "Write" clearance allows mutations (e.g. creating/approving records), "Read" allows viewing-only access, and "None" enforces a restricted route exception (redirecting operators to access-denied warnings).
              </p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-[8px] border border-[var(--border)]">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-[var(--surface-muted)] text-[var(--muted)] font-semibold text-left border-b border-[var(--border)]">
                  <th className="p-4 min-w-[200px]">System Workspace Role</th>
                  {modulesList.map((m) => (
                    <th key={m} className="p-4 text-center">{m} Module</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rolePermissions.map((rp) => (
                  <tr key={rp.role} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-muted)] transition">
                    <td className="p-4 font-bold text-[var(--foreground)] flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-[var(--primary)]" />
                      {rp.role}
                    </td>
                    {modulesList.map((mod) => {
                      const currentAccess = rp.permissions[mod];
                      return (
                        <td key={mod} className="p-4 text-center">
                          <Select
                            value={currentAccess}
                            onChange={(e) => handlePermissionChange(rp.role, mod, e.target.value as PermissionAccess)}
                            className="h-8 max-w-[120px] mx-auto text-xs"
                            disabled={rp.role === "Administrator"} // Protect admin rules
                          >
                            <option value="write">Write</option>
                            <option value="read">Read</option>
                            <option value="none">None</option>
                          </Select>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </>
  );
}
