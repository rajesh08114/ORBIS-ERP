"use client";

import { use, useState, useEffect, useMemo } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/erp/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/field";
import { useBomDetail, useProducts, useOperations } from "@/hooks/use-erp";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import { Plus, Trash2, ArrowLeft, FileText } from "@/components/icons";
import { formatCurrency } from "@/lib/utils";

const lineSchema = z.object({
  id: z.number().optional(),
  component_id: z.string().min(1, "Component is required"),
  quantity_required: z.coerce.number().min(0.01, "Quantity > 0"),
  operation_id: z.string().optional(),
});

const schema = z.object({
  code: z.string().min(1, "Reference is required").max(8, "No more than 8 chars"),
  finished_product_id: z.string().min(1, "Finished product is required"),
  quantity: z.coerce.number().min(0.01, "Quantity > 0"),
  lines: z.array(lineSchema),
});

type FormValues = z.infer<typeof schema>;

export default function BOMDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const unwrappedParams = use(params);
  const isNew = unwrappedParams.id === "new";

  const { data: bom, isLoading: bomLoading } = useBomDetail(unwrappedParams.id);
  const { data: products = [] } = useProducts();
  const { data: operations = [] } = useOperations();

  const [activeTab, setActiveTab] = useState<"components" | "work_orders">("components");

  const { register, control, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      code: "",
      finished_product_id: "",
      quantity: 1,
      lines: []
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "lines"
  });

  useEffect(() => {
    if (!isNew && bom) {
      reset({
        code: bom.code,
        finished_product_id: bom.finished_product?.toString(),
        quantity: parseFloat(bom.quantity) || 1,
        lines: bom.lines?.map((l: any) => ({
          id: l.id,
          component_id: l.component?.toString(),
          quantity_required: parseFloat(l.quantity_required),
          operation_id: l.operation?.toString() || ""
        })) || []
      });
    }
  }, [isNew, bom, reset]);

  const productMap = useMemo(() => {
    const map = new Map<number, any>();
    products.forEach((p: any) => {
      map.set(p.id, p);
    });
    return map;
  }, [products]);

  const onSubmit = async (data: FormValues) => {
    try {
      if (isNew) {
        // Create BOM
        const bomRes = await apiClient<any>("boms/", {
          method: "POST",
          body: JSON.stringify({
            code: data.code,
            finished_product: Number(data.finished_product_id),
            quantity: data.quantity,
            version: 1,
            is_active: true
          })
        });

        // Create Lines
        if (data.lines.length > 0) {
          await Promise.all(data.lines.map((line) => 
            apiClient("bom-lines/", {
              method: "POST",
              body: JSON.stringify({
                bom: bomRes.id,
                component: Number(line.component_id),
                quantity_required: line.quantity_required,
                operation: line.operation_id ? Number(line.operation_id) : null,
              })
            })
          ));
        }
        toast.success(`Bill of Material ${bomRes.code} created successfully.`);
        router.push("/manufacturing/bom");
      } else {
        // Update BOM
        await apiClient(`boms/${unwrappedParams.id}/`, {
          method: "PATCH",
          body: JSON.stringify({
            code: data.code,
            finished_product: Number(data.finished_product_id),
            quantity: data.quantity,
          })
        });

        // Delete old lines, create new ones (simplification since backend doesn't support nested updates)
        if (bom?.lines) {
          await Promise.all(bom.lines.map((l: any) => 
            apiClient(`bom-lines/${l.id}/`, { method: "DELETE" }).catch(() => {})
          ));
        }

        if (data.lines.length > 0) {
          await Promise.all(data.lines.map((line) => 
            apiClient("bom-lines/", {
              method: "POST",
              body: JSON.stringify({
                bom: Number(unwrappedParams.id),
                component: Number(line.component_id),
                quantity_required: line.quantity_required,
                operation: line.operation_id ? Number(line.operation_id) : null,
              })
            })
          ));
        }
        toast.success(`Bill of Material updated successfully.`);
      }
      queryClient.invalidateQueries({ queryKey: ["boms"] });
      queryClient.invalidateQueries({ queryKey: ["bom", unwrappedParams.id] });
    } catch (error: any) {
      toast.error(`Error saving BOM: ${error.message || "Unknown error"}`);
    }
  };

  if (!isNew && bomLoading) return null;

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="secondary" onClick={() => router.push("/manufacturing/bom")}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          <Button variant="primary" onClick={handleSubmit(onSubmit)} disabled={isSubmitting}>
            Save
          </Button>
        </div>
        {!isNew && (
          <Link href={`/audit-logs?module=BOM&entity_id=${unwrappedParams.id}`}>
            <Button variant="secondary">
              <FileText className="h-4 w-4 mr-2" /> Logs
            </Button>
          </Link>
        )}
      </div>

      <Card className="max-w-5xl p-6 border-[var(--border)] bg-[var(--surface)]">
        <div className="flex flex-col mb-8 gap-4 border-b border-[var(--border)] pb-6">
          <div className="text-2xl font-bold flex flex-col w-64">
            <span className="text-xs text-[var(--muted)] font-normal tracking-wide uppercase mb-1">Reference</span>
            <Input 
              {...register("code")} 
              placeholder="BOM-0001" 
              className={`text-2xl font-bold h-12 ${errors.code ? "border-[var(--danger)]" : ""}`}
              maxLength={8}
            />
            {errors.code && <span className="text-xs text-[var(--danger)] mt-1">{errors.code.message}</span>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
            <div className="grid gap-2">
              <span className="text-sm font-semibold text-[var(--foreground)]">Finished product</span>
              <Select {...register("finished_product_id")} className={errors.finished_product_id ? "border-[var(--danger)]" : ""}>
                <option value="">Select a product...</option>
                {products?.map((p: any) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </Select>
              {errors.finished_product_id && <span className="text-xs text-[var(--danger)]">{errors.finished_product_id.message}</span>}
            </div>

            <div className="grid gap-2">
              <span className="text-sm font-semibold text-[var(--foreground)]">Quantity</span>
              <div className="flex items-center gap-2">
                <Input type="number" step="0.01" {...register("quantity")} className={`w-32 ${errors.quantity ? "border-[var(--danger)]" : ""}`} />
                <span className="text-sm font-medium text-[var(--muted)]">Units</span>
              </div>
              {errors.quantity && <span className="text-xs text-[var(--danger)]">{errors.quantity.message}</span>}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-[var(--border)] mb-4">
          <button
            type="button"
            className={`px-6 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === "components" ? "border-[var(--primary)] text-[var(--primary)]" : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
            onClick={() => setActiveTab("components")}
          >
            Components
          </button>
          <button
            type="button"
            className={`px-6 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === "work_orders" ? "border-[var(--primary)] text-[var(--primary)]" : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
            onClick={() => setActiveTab("work_orders")}
          >
            Work Orders
          </button>
        </div>

        {activeTab === "components" && (
          <div className="space-y-4">
            <table className="w-full text-sm text-left">
              <thead className="bg-[var(--surface-muted)] text-[var(--muted)] border-b border-[var(--border)]">
                <tr>
                  <th className="px-4 py-2 font-medium">Component</th>
                  <th className="px-4 py-2 font-medium w-32">Quantity</th>
                  <th className="px-4 py-2 font-medium w-12"></th>
                </tr>
              </thead>
              <tbody>
                {fields.map((field, index) => (
                  <tr key={field.id} className="border-b border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-muted)]">
                    <td className="px-4 py-2">
                      <Select {...register(`lines.${index}.component_id` as const)} className="h-9">
                        <option value="">Select Component...</option>
                        {products?.map((p: any) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </Select>
                      {errors.lines?.[index]?.component_id && <span className="text-[10px] text-[var(--danger)] block mt-1">{errors.lines[index]?.component_id?.message}</span>}
                    </td>
                    <td className="px-4 py-2">
                      <Input type="number" step="0.01" {...register(`lines.${index}.quantity_required` as const)} className="h-9 w-full" />
                      {errors.lines?.[index]?.quantity_required && <span className="text-[10px] text-[var(--danger)] block mt-1">{errors.lines[index]?.quantity_required?.message}</span>}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <button type="button" onClick={() => remove(index)} className="text-[var(--danger)] hover:opacity-80 p-2">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {errors.lines && !Array.isArray(errors.lines) && (
              <div className="text-xs text-[var(--danger)]">
                {errors.lines.message as string}
              </div>
            )}

            <Button 
              type="button" 
              variant="secondary" 
              onClick={() => append({ component_id: "", quantity_required: 1, operation_id: "" })} 
              className="text-sm font-semibold"
            >
              Add a product
            </Button>
          </div>
        )}

        {activeTab === "work_orders" && (
          <div className="space-y-4">
             <table className="w-full text-sm text-left">
              <thead className="bg-[var(--surface-muted)] text-[var(--muted)] border-b border-[var(--border)]">
                <tr>
                  <th className="px-4 py-2 font-medium">Operations</th>
                  <th className="px-4 py-2 font-medium">Work Center</th>
                  <th className="px-4 py-2 font-medium">Expected Duration</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-[var(--muted)] border-b border-[var(--border)]">
                    Work orders are assigned at the manufacturing order level or tied to specific components.
                  </td>
                </tr>
              </tbody>
            </table>
            <Button type="button" variant="secondary" className="text-sm font-semibold" disabled>
              Add a line
            </Button>
          </div>
        )}

      </Card>
    </>
  );
}
