"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
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
import { Plus, Trash2, ArrowLeft, Factory } from "@/components/icons";
import { formatCurrency } from "@/lib/utils";

const componentSchema = z.object({
  name: z.string().min(1, "Component name is required"),
  qty: z.coerce.number().min(1, "Quantity must be at least 1"),
  cost: z.coerce.number().min(0.01, "Cost must be greater than 0")
});

const schema = z.object({
  product: z.string().min(2, "Product assembly name is required"),
  components: z.array(componentSchema).min(1, "At least one component is required"),
  routing: z.array(z.string()).min(1, "Select at least one routing step")
});

type FormValues = z.infer<typeof schema>;

const routingOptions = ["Machining", "Winding", "Assembly", "Balancing Test", "Calibration", "Inspection", "Packaging"];

export default function NewBOMPage() {
  const router = useRouter();
  const products = useErpStore((state) => state.products).slice(0, 15);
  const addBOM = useErpStore((state) => state.addBOM);

  const { register, control, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      product: products[0]?.name || "",
      components: [{ name: "Titanium Raw Plates", qty: 2, cost: 240 }],
      routing: ["Assembly", "Inspection"]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "components"
  });

  // Calculate live rollup cost
  const watchedComponents = watch("components") || [];
  const costRollup = watchedComponents.reduce((sum, item) => {
    const q = Number(item.qty) || 0;
    const c = Number(item.cost) || 0;
    return sum + (q * c);
  }, 0);

  const onSubmit = (data: FormValues) => {
    try {
      addBOM({
        product: data.product,
        costRollup,
        components: data.components,
        routing: data.routing
      });
      toast.success("New Bill of Materials created successfully.");
      router.push("/manufacturing/bom");
    } catch (error) {
      toast.error("Failed to create BOM.");
    }
  };

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
          <Card className="p-6 border-[var(--border)] bg-[var(--surface)] rounded-[12px]">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <span className="text-sm font-semibold text-[var(--foreground)]">Parent Assembly Product</span>
                <Select {...register("product")} className={errors.product ? "border-[var(--danger)]" : ""}>
                  {products.map((p) => (
                    <option key={p.id} value={p.name}>
                      {p.name} (SKU: {p.sku})
                    </option>
                  ))}
                </Select>
                {errors.product && (
                  <span className="text-xs text-[var(--danger)]">{errors.product.message}</span>
                )}
              </div>
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
                onClick={() => append({ name: "", qty: 1, cost: 10 })}
              >
                <Plus className="h-3.5 w-3.5" /> Add Component
              </Button>
            </div>

            {fields.map((field, idx) => (
              <div key={field.id} className="grid gap-4 sm:grid-cols-12 items-end border-b border-[var(--border)] pb-4 mb-4 last:border-0 last:pb-0 last:mb-0">
                <div className="sm:col-span-6 grid gap-2">
                  <span className="text-xs font-semibold text-[var(--muted)]">Component Name</span>
                  <Input
                    placeholder="e.g. Micro Controller"
                    {...register(`components.${idx}.name` as const)}
                    className={errors.components?.[idx]?.name ? "border-[var(--danger)]" : ""}
                  />
                </div>
                <div className="sm:col-span-2 grid gap-2">
                  <span className="text-xs font-semibold text-[var(--muted)]">Qty</span>
                  <Input
                    type="number"
                    {...register(`components.${idx}.qty` as const)}
                    className={errors.components?.[idx]?.qty ? "border-[var(--danger)]" : ""}
                  />
                </div>
                <div className="sm:col-span-3 grid gap-2">
                  <span className="text-xs font-semibold text-[var(--muted)]">Cost (USD)</span>
                  <Input
                    type="number"
                    step="0.01"
                    {...register(`components.${idx}.cost` as const)}
                    className={errors.components?.[idx]?.cost ? "border-[var(--danger)]" : ""}
                  />
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
            ))}
            {errors.components && (
              <span className="text-xs text-[var(--danger)] mt-2 block">{errors.components.message}</span>
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

            <div className="mt-6 border-t border-[var(--border)] pt-4">
              <span className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider block mb-3">
                Routing Operations Steps
              </span>
              <div className="space-y-2">
                {routingOptions.map((step) => (
                  <label key={step} className="flex items-center gap-3.5 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      value={step}
                      {...register("routing")}
                      className="rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)] h-4 w-4"
                    />
                    <span>{step}</span>
                  </label>
                ))}
              </div>
              {errors.routing && (
                <span className="text-xs text-[var(--danger)] mt-2 block">{errors.routing.message}</span>
              )}
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
