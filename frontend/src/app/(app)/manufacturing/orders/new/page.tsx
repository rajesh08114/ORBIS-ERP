"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useErpStore } from "@/stores/erp-store";
import { PageHeader } from "@/components/erp/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/field";
import { toast } from "sonner";

const schema = z.object({
  product: z.string().min(2, "Product is required"),
  workCenter: z.string().min(2, "Work Center is required"),
  priority: z.enum(["Low", "Medium", "High"], { required_error: "Priority is required" })
});

type FormValues = z.infer<typeof schema>;

const workCenters = ["CNC Station A", "Manual Assembly 4", "Painting Booth 2", "QC Lab", "Packaging Cell"];

export default function NewManufacturingOrderPage() {
  const router = useRouter();
  const products = useErpStore((state) => state.products).slice(0, 15); // Show first 15 products for mock selection
  const addWorkOrder = useErpStore((state) => state.addWorkOrder);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      product: products[0]?.name || "",
      workCenter: workCenters[0],
      priority: "Medium"
    }
  });

  const onSubmit = (data: FormValues) => {
    try {
      addWorkOrder({
        product: data.product,
        workCenter: data.workCenter,
        stage: "Draft",
        priority: data.priority
      });
      toast.success("Manufacturing order queued successfully.");
      router.push("/manufacturing/orders");
    } catch (error) {
      toast.error("Failed to queue manufacturing order.");
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Manufacturing"
        title="New Manufacturing Order"
        description="Initialize a new production run routing components through industrial work centers."
      />
      <Card className="max-w-2xl p-6 border-[var(--border)] bg-[var(--surface)] rounded-[12px]">
        <form className="grid gap-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-2">
            <span className="text-sm font-semibold text-[var(--foreground)]">Product Assembly</span>
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

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="grid gap-2">
              <span className="text-sm font-semibold text-[var(--foreground)]">Routing Work Center</span>
              <Select {...register("workCenter")} className={errors.workCenter ? "border-[var(--danger)]" : ""}>
                {workCenters.map((wc) => (
                  <option key={wc} value={wc}>
                    {wc}
                  </option>
                ))}
              </Select>
              {errors.workCenter && (
                <span className="text-xs text-[var(--danger)]">{errors.workCenter.message}</span>
              )}
            </div>

            <div className="grid gap-2">
              <span className="text-sm font-semibold text-[var(--foreground)]">Operational Priority</span>
              <Select {...register("priority")} className={errors.priority ? "border-[var(--danger)]" : ""}>
                <option value="Low">Low Clearance (Standard)</option>
                <option value="Medium">Medium Clearance (Expedite)</option>
                <option value="High">High Clearance (Critical)</option>
              </Select>
              {errors.priority && (
                <span className="text-xs text-[var(--danger)]">{errors.priority.message}</span>
              )}
            </div>
          </div>

          <div className="flex gap-3 border-t border-[var(--border)] pt-5 mt-2">
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? "Queueing..." : "Queue Order"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.push("/manufacturing/orders")}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </>
  );
}
