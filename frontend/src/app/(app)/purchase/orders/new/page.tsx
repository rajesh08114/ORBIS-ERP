"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useErpStore } from "@/stores/erp-store";
import { PageHeader } from "@/components/erp/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Select, Textarea } from "@/components/ui/field";
import { toast } from "sonner";

const schema = z.object({
  vendor: z.string().min(2, "Vendor is required"),
  product: z.string().min(2, "Product is required"),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
  unitCost: z.coerce.number().min(0.01, "Unit cost must be greater than 0"),
  dueDate: z.string().min(1, "Due date is required"),
  notes: z.string().optional()
});

type FormValues = z.infer<typeof schema>;

export default function NewPurchaseOrderPage() {
  const router = useRouter();
  const vendors = useErpStore((state) => state.vendors);
  const products = useErpStore((state) => state.products).filter((p) => p.status === "Healthy" || p.status === "Confirmed" || p.status === "Draft" || p.status === "Completed" || p.status === "Critical" || p.status === "Delayed"); // All products
  const addPurchaseOrder = useErpStore((state) => state.addPurchaseOrder);

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      vendor: vendors[0]?.name || "",
      product: products[0]?.name || "",
      quantity: 100,
      unitCost: products[0]?.unitCost || 120,
      dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      notes: ""
    }
  });

  const selectedProduct = watch("product");

  // Auto-fill unit cost when product changes
  const handleProductChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const prodName = e.target.value;
    const prod = products.find((p) => p.name === prodName);
    if (prod) {
      setValue("unitCost", prod.unitCost);
    }
  };

  const onSubmit = (data: FormValues) => {
    try {
      const orderValue = data.quantity * data.unitCost;
      addPurchaseOrder({
        party: data.vendor,
        due: data.dueDate,
        value: orderValue
      });
      toast.success("Purchase order staged for approval.");
      router.push("/purchase/orders");
    } catch (error) {
      toast.error("Failed to create purchase order.");
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Procurement"
        title="Create Purchase Order"
        description="Raise PO for raw material replenishment. Integrates with inventory tracking and ledger logic."
      />
      <Card className="max-w-3xl p-6 border-[var(--border)] bg-[var(--surface)] rounded-[12px]">
        <form className="grid gap-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="grid gap-2">
              <span className="text-sm font-semibold text-[var(--foreground)]">Vendor</span>
              <Select {...register("vendor")} className={errors.vendor ? "border-[var(--danger)]" : ""}>
                {vendors.map((v) => (
                  <option key={v.id} value={v.name}>
                    {v.name} ({v.category})
                  </option>
                ))}
              </Select>
              {errors.vendor && (
                <span className="text-xs text-[var(--danger)]">{errors.vendor.message}</span>
              )}
            </div>

            <div className="grid gap-2">
              <span className="text-sm font-semibold text-[var(--foreground)]">Product Components</span>
              <Select 
                {...register("product")} 
                onChange={(e) => {
                  register("product").onChange(e);
                  handleProductChange(e);
                }}
                className={errors.product ? "border-[var(--danger)]" : ""}
              >
                {products.slice(0, 15).map((p) => (
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

          <div className="grid gap-6 md:grid-cols-3">
            <div className="grid gap-2">
              <span className="text-sm font-semibold text-[var(--foreground)]">Quantity</span>
              <Input
                type="number"
                {...register("quantity")}
                className={errors.quantity ? "border-[var(--danger)]" : ""}
              />
              {errors.quantity && (
                <span className="text-xs text-[var(--danger)]">{errors.quantity.message}</span>
              )}
            </div>

            <div className="grid gap-2">
              <span className="text-sm font-semibold text-[var(--foreground)]">Unit Cost (USD)</span>
              <Input
                type="number"
                step="0.01"
                {...register("unitCost")}
                className={errors.unitCost ? "border-[var(--danger)]" : ""}
              />
              {errors.unitCost && (
                <span className="text-xs text-[var(--danger)]">{errors.unitCost.message}</span>
              )}
            </div>

            <div className="grid gap-2">
              <span className="text-sm font-semibold text-[var(--foreground)]">Expected Delivery Date</span>
              <Input
                type="date"
                {...register("dueDate")}
                className={errors.dueDate ? "border-[var(--danger)]" : ""}
              />
              {errors.dueDate && (
                <span className="text-xs text-[var(--danger)]">{errors.dueDate.message}</span>
              )}
            </div>
          </div>

          <div className="grid gap-2">
            <span className="text-sm font-semibold text-[var(--foreground)]">Delivery & Terms Notes</span>
            <Textarea
              placeholder="FOB Destination, standard net 30 terms, packaging requirements, custom quality instructions"
              {...register("notes")}
            />
          </div>

          <div className="flex gap-3 border-t border-[var(--border)] pt-5 mt-2">
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Purchase Order"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.push("/purchase/orders")}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </>
  );
}
