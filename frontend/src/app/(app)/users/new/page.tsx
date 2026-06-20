"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useErpStore } from "@/stores/erp-store";
import { PageHeader } from "@/components/erp/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/field";
import { toast } from "sonner";
import { ArrowLeft } from "@/components/icons";
import type { UserRole } from "@/stores/auth-store";

const schema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").regex(/^[a-z0-9._-]+$/, "Only letters, numbers, dots, dashes, and underscores are allowed"),
  email: z.string().email("Please enter a valid email address"),
  role: z.enum(["Administrator", "Inventory Manager", "Procurement Manager", "Manufacturing Manager", "Sales Manager"], {
    required_error: "Role assignment is required"
  }),
  status: z.enum(["Active", "Review"])
});

type FormValues = z.infer<typeof schema>;

export default function NewUserPage() {
  const router = useRouter();
  const addUser = useErpStore((state) => state.addUser);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      username: "",
      email: "",
      role: "Manufacturing Manager",
      status: "Active"
    }
  });

  const onSubmit = (data: FormValues) => {
    try {
      addUser({
        username: data.username,
        email: data.email,
        role: data.role as UserRole,
        status: data.status
      });
      toast.success(`User ${data.username} invited successfully.`);
      router.push("/users");
    } catch (error) {
      toast.error("Failed to invite new user.");
    }
  };

  return (
    <>
      <div className="mb-4">
        <Link href="/users" className="inline-flex items-center gap-2 text-xs font-bold text-[var(--muted)] hover:text-[var(--foreground)] transition">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Users List
        </Link>
      </div>

      <PageHeader
        eyebrow="Admin / IAM"
        title="Invite New User"
        description="Provide workspace credentials, assign system-wide user roles, and define security access clearance."
      />

      <Card className="max-w-2xl p-6 border-[var(--border)] bg-[var(--surface)] rounded-[12px]">
        <form className="grid gap-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="grid gap-2">
              <span className="text-sm font-semibold text-[var(--foreground)]">Username</span>
              <Input
                placeholder="e.g. jason.bourne"
                {...register("username")}
                className={errors.username ? "border-[var(--danger)]" : ""}
              />
              {errors.username && (
                <span className="text-xs text-[var(--danger)]">{errors.username.message}</span>
              )}
            </div>

            <div className="grid gap-2">
              <span className="text-sm font-semibold text-[var(--foreground)]">Work Email</span>
              <Input
                type="email"
                placeholder="e.g. jason@orbis.example"
                {...register("email")}
                className={errors.email ? "border-[var(--danger)]" : ""}
              />
              {errors.email && (
                <span className="text-xs text-[var(--danger)]">{errors.email.message}</span>
              )}
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="grid gap-2">
              <span className="text-sm font-semibold text-[var(--foreground)]">Workspace Role Assignment</span>
              <Select {...register("role")} className={errors.role ? "border-[var(--danger)]" : ""}>
                <option value="Administrator">Administrator</option>
                <option value="Inventory Manager">Inventory Manager</option>
                <option value="Procurement Manager">Procurement Manager</option>
                <option value="Manufacturing Manager">Manufacturing Manager</option>
                <option value="Sales Manager">Sales Manager</option>
              </Select>
              {errors.role && (
                <span className="text-xs text-[var(--danger)]">{errors.role.message}</span>
              )}
            </div>

            <div className="grid gap-2">
              <span className="text-sm font-semibold text-[var(--foreground)]">Clearance Status</span>
              <Select {...register("status")} className={errors.status ? "border-[var(--danger)]" : ""}>
                <option value="Active">Active (Permit Clearance)</option>
                <option value="Review">Review (Hold / Pending Audit)</option>
              </Select>
              {errors.status && (
                <span className="text-xs text-[var(--danger)]">{errors.status.message}</span>
              )}
            </div>
          </div>

          <div className="flex gap-3 border-t border-[var(--border)] pt-5 mt-2">
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? "Inviting..." : "Send Workspace Invite"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.push("/users")}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </>
  );
}
