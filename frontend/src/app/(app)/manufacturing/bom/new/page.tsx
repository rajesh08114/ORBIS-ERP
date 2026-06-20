"use client";

import { useForm, useFieldArray, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/erp/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Select, Textarea } from "@/components/ui/field";
import { useProducts, useOperations } from "@/hooks/use-erp";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import { Plus, Trash2, ArrowLeft } from "@/components/icons";
import { formatCurrency } from "@/lib/utils";
import { useMemo } from "react";

const lineSchema = z.object({
  component_id: z.string().min(1, "Component product is required"),
  quantity_required: z.coerce.number().min(1, "Quantity must be at least 1"),
  operation_id: z.string().optional(),
});

const schema = z.object({
  code: z.string().min(3, "BOM Code must be at least 3 characters"),
  finished_product_id: z.string().min(1, "Parent finished product is required"),
  version: z.coerce.number().min(1, "Version must be at least 1"),
  notes: z.string().optional(),
  lines: z.array(lineSchema).min(1, "At least one component line is required"),
});

type FormValues = z.infer<typeof schema>;

export default function NewBOMPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: products = [], isLoading: productsLoading } = useProducts();
  const { data: operations = [], isLoading: operationsLoading } = useOperations();

  const { register, control, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      code: "BOM-NEW",
      finished_product_id: "",
      version: 1,
      notes: "",
      lines: [{ component_id: "", quantity_required: 1, operation_id: "" }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "lines"
  });

  // Map products for cost calculations
  const productMap = useMemo(() => {
    const map = new Map<number, any>();
    products.forEach((p: any) => {
      map.set(p.id, p);
    });
    return map;
  }, [products]);

  // Calculate live rollup cost
  const linesWatch = watch("lines") || [];
  const costRollup = linesWatch.reduce((sum, line) => {
    if (!line.component_id) return sum;
    const prod = productMap.get(Number(line.component_id));
    const cost = parseFloat(prod?.cost_price || 0);
    const qty = Number(line.quantity_required) || 0;
    return sum + (qty * cost);
  }, 0);

  const onSubmit = async (data: FormValues) => {
    try {
      // 1. Create the parent Bill of Material
      const bomRes = await apiClient<any>("boms/", {
        method: "POST",
        body: JSON.stringify({
          code: data.code,
          finished_product: Number(data.finished_product_id),
          version: Number(data.version),
          notes: data.notes,
          is_active: true
        })
      });

      // 2. Create the Bill of Material Lines in parallel
      await Promise.all(data.lines.map((line, index) => 
        apiClient("bom-lines/", {
          method: "POST",
          body: JSON.stringify({
            bom: bomRes.id,
            component: Number(line.component_id),
            quantity_required: Number(line.quantity_required),
            operation: line.operation_id ? Number(line.operation_id) : null,
            sequence: (index + 1) * 10
          })
        })
      ));

      toast.success(`Bill of Materials ${data.code} created successfully.`);
      queryClient.invalidateQueries({ queryKey: ["boms"] });
      router.push("/manufacturing/bom");
    } catch (error: any) {
      toast.error(error.message || "Failed to create Bill of Materials.");
    }
  };

  const isLoading = productsLoading || operationsLoading;

  return (
    <>
      <div className="mb-4">
        <Link href="/manufacturing/bom" className="inline-flex items-center gap-2 text-xs font-bold text-[var(--muted)] hover:text-[var(--foreground)] transition">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to BOMs
        </Link>
      </div>

      <PageHeader
        eyebrow="Manufacturing BOM"
        title="Create Bill of Materials"
        description="Link raw material components and operational routings to construct mechanical assemblies."
      />

      <form className="grid gap-6 md:grid-cols-3" onSubmit={handleSubmit(onSubmit)}>
        {/* Main Configuration */}
        <div className="md:col-span-2 space-y-6">
          <Card className="p-6 border-[var(--border)] bg-[var(--surface)] rounded-[12px] space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <span className="text-sm font-semibold text-[var(--foreground)]">BOM Reference Code *</span>
                <Input
                  placeholder="e.g. BOM-PROD-XYZ"
                  {...register("code")}
                  className={errors.code ? "border-[var(--danger)]" : ""}
                />
                {errors.code && (
                  <span className="text-xs text-[var(--danger)]">{errors.code.message}</span>
                )}
              </div>
              <div className="grid gap-2">
                <span className="text-sm font-semibold text-[var(--foreground)]">Version Number *</span>
                <Input
                  type="number"
                  placeholder="e.g. 1"
                  {...register("version")}
                  className={errors.version ? "border-[var(--danger)]" : ""}
                />
                {errors.version && (
                  <span className="text-xs text-[var(--danger)]">{errors.version.message}</span>
                )}
              </div>
            </div>

            <div className="grid gap-2">
              <span className="text-sm font-semibold text-[var(--foreground)]">Finished Parent Product *</span>
              <Select {...register("finished_product_id")} className={errors.finished_product_id ? "border-[var(--danger)]" : ""}>
                <option value="">{isLoading ? "Loading products..." : "Select parent product assembly..."}</option>
                {products.map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (SKU: {p.sku})
                  </option>
                ))}
              </Select>
              {errors.finished_product_id && (
                <span className="text-xs text-[var(--danger)]">{errors.finished_product_id.message}</span>
              )}
            </div>
          </Card>

          {/* Component Line Items */}
          <Card className="p-6 border-[var(--border)] bg-[var(--surface)] rounded-[12px]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold">Raw Material Components</h3>
              <Button
                type="button"
                variant="secondary"
                className="h-8 px-3 text-xs flex items-center gap-1"
                onClick={() => append({ component_id: "", quantity_required: 1, operation_id: "" })}
              >
                <Plus className="h-3.5 w-3.5" /> Add Component
              </Button>
            </div>

            {fields.map((field, idx) => {
              const compId = linesWatch[idx]?.component_id;
              const prod = compId ? productMap.get(Number(compId)) : null;
              const cost = parseFloat(prod?.cost_price || 0);
              const qty = Number(linesWatch[idx]?.quantity_required) || 0;

              return (
                <div key={field.id} className="grid gap-4 sm:grid-cols-12 items-end border-b border-[var(--border)] pb-4 mb-4 last:border-0 last:pb-0 last:mb-0">
                  <div className="sm:col-span-4 grid gap-2">
                    <span className="text-xs font-semibold text-[var(--muted)]">Component Product *</span>
                    <Select
                      {...register(`lines.${idx}.component_id` as const)}
                      className={errors.lines?.[idx]?.component_id ? "border-[var(--danger)]" : ""}
                    >
                      <option value="">Select component product...</option>
                      {products.map((p: any) => (
                        <option key={p.id} value={p.id}>{p.name} (${parseFloat(p.cost_price || 0).toFixed(2)})</option>
                      ))}
                    </Select>
                  </div>
                  <div className="sm:col-span-2 grid gap-2">
                    <span className="text-xs font-semibold text-[var(--muted)]">Qty *</span>
                    <Input
                      type="number"
                      min="1"
                      {...register(`lines.${idx}.quantity_required` as const)}
                      className={errors.lines?.[idx]?.quantity_required ? "border-[var(--danger)]" : ""}
                    />
                  </div>
                  <div className="sm:col-span-3 grid gap-2">
                    <span className="text-xs font-semibold text-[var(--muted)]">Routing Operation</span>
                    <Select
                      {...register(`lines.${idx}.operation_id` as const)}
                    >
                      <option value="">No Routing Linked</option>
                      {operations.map((o: any) => (
                        <option key={o.id} value={o.id}>{o.name}</option>
                      ))}
                    </Select>
                  </div>
                  <div className="sm:col-span-2 grid gap-2 text-right">
                    <span className="text-xs font-semibold text-[var(--muted)]">Subtotal</span>
                    <div className="text-xs font-mono text-[var(--primary)] h-10 flex items-center justify-end px-2 bg-[var(--surface-muted)] rounded-lg border border-[var(--border)]">
                      {formatCurrency(cost * qty)}
                    </div>
                  </div>
                  <div className="sm:col-span-1 flex justify-center pb-1">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => remove(idx)}
                      disabled={fields.length === 1}
                      className="text-[var(--danger)] hover:bg-[var(--danger)]/10 h-10 w-10 p-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
            {errors.lines && (
              <span className="text-xs text-[var(--danger)] mt-2 block">{errors.lines.message}</span>
            )}
          </Card>
        </div>

        {/* Cost Summary & Routing */}
        <div className="space-y-6">
          <Card className="p-6 border-[var(--border)] bg-[var(--surface)] rounded-[12px] flex flex-col justify-between">
            <div>
              <h3 className="text-base font-bold mb-4">Rollup Summary</h3>
              <div className="rounded-[8px] bg-[var(--surface-muted)] p-4 border border-[var(--border)] text-center">
                <span className="text-xs text-[var(--muted)] block uppercase tracking-wider font-semibold">Total Rollup Cost</span>
                <span className="text-3xl font-extrabold text-[var(--foreground)] mt-2 block">
                  {formatCurrency(costRollup)}
                </span>
              </div>
            </div>

            <div className="grid gap-2 mt-4">
              <span className="text-sm font-semibold text-[var(--foreground)]">Assembly Notes</span>
              <Textarea
                placeholder="Specify assembly notes or formula descriptions..."
                {...register("notes")}
              />
            </div>

            <div className="pt-6 border-t border-[var(--border)] mt-6 flex flex-col gap-2">
              <Button type="submit" variant="primary" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Save Bill of Materials"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.push("/manufacturing/bom")}
              >
                Cancel
              </Button>
            </div>
          </Card>
        </div>
      </form>
    </>
  );
}
