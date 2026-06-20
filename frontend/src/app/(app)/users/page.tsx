"use client";

import Link from "next/link";
import { Users, Plus, ShieldCheck, Mail, ArrowRepeat } from "@/components/icons";
import { PageHeader } from "@/components/erp/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useErpStore } from "@/stores/erp-store";
import { toast } from "sonner";

export default function UsersPage() {
  const users = useErpStore((state) => state.users);
  const updateUserStatus = useErpStore((state) => state.updateUserStatus);

  const handleToggleStatus = (id: string, currentStatus: "Active" | "Review") => {
    const nextStatus = currentStatus === "Active" ? "Review" : "Active";
    updateUserStatus(id, nextStatus);
    toast.success(`User access status updated to ${nextStatus}.`);
  };

  return (
    <>
      <PageHeader 
        eyebrow="Admin" 
        title="User Management" 
        description="Monitor system-wide user credentials, assign workspace roles, and configure clearance status." 
      />

      <div className="mb-4">
        <Link href="/users/new">
          <Button><Plus className="h-4 w-4 mr-2" /> Invite New User</Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {users.map((user) => (
          <Card key={user.id} className="p-5 flex flex-col justify-between border-[var(--border)] bg-[var(--surface)] hover:shadow-md transition">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-[var(--muted)]">{user.id}</span>
                <Badge tone={user.status === "Review" ? "warning" : "success"}>
                  {user.status}
                </Badge>
              </div>

              <div className="mt-3 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center font-bold">
                  {user.username.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[var(--foreground)]">{user.username}</h3>
                  <span className="text-[11px] font-semibold text-[var(--muted)] block">{user.role}</span>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2 text-xs text-[var(--muted)] border-t border-[var(--border)] pt-3">
                <Mail className="h-3.5 w-3.5" />
                <span className="truncate">{user.email}</span>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-[var(--border)] flex justify-between items-center">
              <span className="text-[10px] text-[var(--muted)] flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> SSO Clear
              </span>
              <Button 
                variant="ghost" 
                className="h-8 px-2 text-xs text-[var(--primary)] hover:bg-[var(--primary-soft)]"
                onClick={() => handleToggleStatus(user.id, user.status)}
              >
                <ArrowRepeat className="h-3 w-3 mr-1" /> Toggle Hold
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}

