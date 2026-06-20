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
  customer: z.string().min(2, "Customer is required"),
  requestedDate: z.string().min(1, "Requested date is required"),
  value: z.coerce.number().min(1, "Order value must be greater than 0"),
  notes: z.string().optional()
});

type FormValues = z.infer<typeof schema>;

export default function NewSalesOrderPage() {
  const router = useRouter();
  const customers = useErpStore((state) => state.customers);
  const addSalesOrder = useErpStore((state) => state.addSalesOrder);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      customer: customers[0]?.name || "",
      requestedDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      value: 15000,
      notes: ""
    }
  });

  const onSubmit = (data: FormValues) => {
    try {
      addSalesOrder({
        party: data.customer,
        due: data.requestedDate,
        value: data.value
      });
      toast.success("Sales order created successfully.");
      router.push("/sales/orders");
    } catch (error) {
      toast.error("Failed to create sales order.");
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Sales"
        title="Create Sales Order"
        description="Production-grade form with validation, review fields, and dynamic database staging."
      />
      <Card className="max-w-3xl p-6 border-[var(--border)] bg-[var(--surface)] rounded-[12px]">
        <form className="grid gap-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-2">
            <span className="text-sm font-semibold text-[var(--foreground)]">Customer</span>
            <Select {...register("customer")} className={errors.customer ? "border-[var(--danger)]" : ""}>
              {customers.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name} ({c.segment})
                </option>
              ))}
            </Select>
            {errors.customer && (
              <span className="text-xs text-[var(--danger)]">{errors.customer.message}</span>
            )}
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="grid gap-2">
              <span className="text-sm font-semibold text-[var(--foreground)]">Requested Due Date</span>
              <Input
                type="date"
                {...register("requestedDate")}
                className={errors.requestedDate ? "border-[var(--danger)]" : ""}
              />
              {errors.requestedDate && (
                <span className="text-xs text-[var(--danger)]">{errors.requestedDate.message}</span>
              )}
            </div>

            <div className="grid gap-2">
              <span className="text-sm font-semibold text-[var(--foreground)]">Order Value (USD)</span>
              <Input
                type="number"
                placeholder="15000"
                {...register("value")}
                className={errors.value ? "border-[var(--danger)]" : ""}
              />
              {errors.value && (
                <span className="text-xs text-[var(--danger)]">{errors.value.message}</span>
              )}
            </div>
          </div>

          <div className="grid gap-2">
            <span className="text-sm font-semibold text-[var(--foreground)]">Notes / Fulfillment Instructions</span>
            <Textarea
              placeholder="Specify delivery constraints, custom production routing instructions, or customer notes"
              {...register("notes")}
            />
          </div>

          <div className="flex gap-3 border-t border-[var(--border)] pt-5 mt-2">
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Sales Order"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.push("/sales/orders")}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </>
  );
}

