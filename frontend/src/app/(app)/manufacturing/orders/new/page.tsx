"use client";

import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/erp/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/field";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import { useProducts, useBoms } from "@/hooks/use-erp";

const schema = z.object({
  reference: z.string().min(1, "Reference is required"),
  bom_id: z.string().optional(),
  finished_product_id: z.string().min(1, "Product is required"),
  quantity: z.coerce.number().min(0.01, "Quantity must be > 0")
});

type FormValues = z.infer<typeof schema>;

export default function NewManufacturingOrderPage() {
  const router = useRouter();
  const { data: products = [], isLoading: productsLoading } = useProducts();
  const { data: boms = [], isLoading: bomsLoading } = useBoms();

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      reference: `MO-${Math.floor(Math.random() * 10000)}`,
      bom_id: "",
      finished_product_id: "",
      quantity: 1,
    }
  });

  const selectedBomId = watch("bom_id");

  const bomMap = useMemo(() => {
    const map = new Map<number, any>();
    boms.forEach((b: any) => map.set(b.id, b));
    return map;
  }, [boms]);

  useEffect(() => {
    if (selectedBomId) {
      const bom = bomMap.get(Number(selectedBomId));
      if (bom) {
        setValue("finished_product_id", bom.finished_product?.toString());
        setValue("quantity", parseFloat(bom.quantity) || 1.0);
      }
    }
  }, [selectedBomId, bomMap, setValue]);

  const onSubmit = async (data: FormValues) => {
    try {
      const payload: any = {
        reference: data.reference,
        finished_product: Number(data.finished_product_id),
        quantity: data.quantity,
      };
      if (data.bom_id) {
        payload.bom = Number(data.bom_id);
      }
      
      await apiClient("manufacturing-orders/", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      
      toast.success("Manufacturing order created successfully.");
      router.push("/manufacturing/orders");
    } catch (error: any) {
      toast.error(`Failed to create order: ${error.message}`);
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
            <span className="text-sm font-semibold text-[var(--foreground)]">Reference</span>
            <Input {...register("reference")} className={errors.reference ? "border-[var(--danger)]" : ""} />
            {errors.reference && <span className="text-xs text-[var(--danger)]">{errors.reference.message}</span>}
          </div>

          <div className="grid gap-2">
            <span className="text-sm font-semibold text-[var(--foreground)]">Bill of Material (Optional)</span>
            <Select {...register("bom_id")} className={errors.bom_id ? "border-[var(--danger)]" : ""}>
              <option value="">No BOM</option>
              {boms.map((b: any) => (
                <option key={b.id} value={b.id}>
                  {b.code}
                </option>
              ))}
            </Select>
            <span className="text-[10px] text-[var(--muted)]">Selecting a BOM will auto-fill the product and quantity.</span>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="grid gap-2">
              <span className="text-sm font-semibold text-[var(--foreground)]">Finished Product</span>
              <Select {...register("finished_product_id")} className={errors.finished_product_id ? "border-[var(--danger)]" : ""}>
                <option value="">Select a product...</option>
                {products.map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
              {errors.finished_product_id && (
                <span className="text-xs text-[var(--danger)]">{errors.finished_product_id.message}</span>
              )}
            </div>

            <div className="grid gap-2">
              <span className="text-sm font-semibold text-[var(--foreground)]">Quantity to Produce</span>
              <Input type="number" step="0.01" {...register("quantity")} className={errors.quantity ? "border-[var(--danger)]" : ""} />
              {errors.quantity && (
                <span className="text-xs text-[var(--danger)]">{errors.quantity.message}</span>
              )}
            </div>
          </div>

          <div className="flex gap-3 border-t border-[var(--border)] pt-5 mt-2">
            <Button type="submit" variant="primary" disabled={isSubmitting || productsLoading || bomsLoading}>
              {isSubmitting ? "Queueing..." : "Create Order"}
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
