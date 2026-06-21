"use client";

import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/erp/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/field";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import { ArrowLeft } from "@/components/icons";

interface Group {
  id: number;
  name: string;
}

const schema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").regex(/^[a-z0-9._-]+$/, "Only letters, numbers, dots, dashes, and underscores are allowed"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters").regex(/[a-z]/, "Must contain a lowercase letter").regex(/[A-Z]/, "Must contain an uppercase letter").regex(/[\W_]/, "Must contain a special character"),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  roleId: z.string().min(1, "Role assignment is required"),
  role_title: z.string().optional(),
  status: z.enum(["active", "inactive"])
});

type FormValues = z.infer<typeof schema>;

export default function NewUserPage() {
  const router = useRouter();

  // Query database roles
  const { data: rolesData, isLoading } = useQuery<any>({
    queryKey: ["roles"],
    queryFn: () => apiClient<any>("roles/"),
  });
  const roles: Group[] = rolesData?.results || (Array.isArray(rolesData) ? rolesData : []);

  const { register, handleSubmit, control, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      first_name: "",
      last_name: "",
      roleId: "",
      role_title: "",
      status: "active"
    }
  });

  const onSubmit = async (data: FormValues) => {
    try {
      const payload = {
        username: data.username,
        email: data.email,
        password: data.password,
        first_name: data.first_name,
        last_name: data.last_name,
        groups: [Number(data.roleId)],
        profile: {
          role_title: data.role_title || "",
          status: data.status,
        }
      };

      await apiClient("users/", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      toast.success(`User ${data.username} invited successfully.`);
      router.push("/users");
    } catch (error: any) {
      toast.error(error.message || "Failed to invite new user.");
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
              <span className="text-sm font-semibold text-[var(--foreground)]">Username *</span>
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
              <span className="text-sm font-semibold text-[var(--foreground)]">Work Email *</span>
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
              <span className="text-sm font-semibold text-[var(--foreground)]">First Name</span>
              <Input
                placeholder="e.g. Jason"
                {...register("first_name")}
              />
            </div>

            <div className="grid gap-2">
              <span className="text-sm font-semibold text-[var(--foreground)]">Last Name</span>
              <Input
                placeholder="e.g. Bourne"
                {...register("last_name")}
              />
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="grid gap-2">
              <span className="text-sm font-semibold text-[var(--foreground)]">Secure Password *</span>
              <Input
                type="password"
                placeholder="Must be secure & robust"
                {...register("password")}
                className={errors.password ? "border-[var(--danger)]" : ""}
              />
              {errors.password && (
                <span className="text-xs text-[var(--danger)]">{errors.password.message}</span>
              )}
            </div>

            <div className="grid gap-2">
              <span className="text-sm font-semibold text-[var(--foreground)]">Job Title</span>
              <Input
                placeholder="e.g. Manufacturing Coordinator"
                {...register("role_title")}
              />
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="grid gap-2">
              <span className="text-sm font-semibold text-[var(--foreground)]">Workspace Role Assignment *</span>
              <Select {...register("roleId")} className={errors.roleId ? "border-[var(--danger)]" : ""}>
                <option value="">{isLoading ? "Loading roles..." : "Select Group Role"}</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </Select>
              {errors.roleId && (
                <span className="text-xs text-[var(--danger)]">{errors.roleId.message}</span>
              )}
            </div>

            <div className="grid gap-2">
              <span className="text-sm font-semibold text-[var(--foreground)]">Clearance Status *</span>
              <Select {...register("status")} className={errors.status ? "border-[var(--danger)]" : ""}>
                <option value="active">Active (Permit Clearance)</option>
                <option value="inactive">On Hold (Pending Audit)</option>
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
