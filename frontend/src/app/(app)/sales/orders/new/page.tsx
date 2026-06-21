"use client";

import { useForm, useFieldArray, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/erp/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Select, Textarea } from "@/components/ui/field";
import { PartnerCombobox } from "@/components/ui/partner-combobox";
import { toast } from "sonner";
import { useCustomers, useProducts } from "@/hooks/use-erp";
import { apiClient } from "@/lib/api-client";
import { Plus, Trash2 } from "@/components/icons";

const lineSchema = z.object({
  product: z.string().min(1, "Product is required"),
  quantity_ordered: z.coerce.number().min(1, "Quantity must be at least 1"),
  unit_price: z.coerce.number().min(0, "Price cannot be negative"),
});

const schema = z.object({
  customer: z.string().min(1, "Customer is required"),
  notes: z.string().optional(),
  lines: z.array(lineSchema).min(1, "At least one order line is required"),
});

type FormValues = z.infer<typeof schema>;

export default function NewSalesOrderPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: customers } = useCustomers();
  const { data: products } = useProducts();

  const { register, control, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      customer: "",
      notes: "",
      lines: [{ product: "", quantity_ordered: 1, unit_price: 0 }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "lines"
  });

  const linesWatch = watch("lines");
  const totalValue = linesWatch.reduce((sum, line) => sum + (Number(line.quantity_ordered) || 0) * (Number(line.unit_price) || 0), 0);

  const onSubmit = async (data: FormValues) => {
    try {
      // 1. Create the Sales Order
      const orderRes = await apiClient<any>("sales-orders/", {
        method: "POST",
        body: JSON.stringify({
          reference: `SO-${Date.now()}`,
          customer: parseInt(data.customer, 10),
          notes: data.notes
        })
      });

      // 2. Create the Order Lines
      await Promise.all(data.lines.map(line => 
        apiClient("sales-order-lines/", {
          method: "POST",
          body: JSON.stringify({
            order: orderRes.id,
            product: parseInt(line.product, 10),
            quantity_ordered: line.quantity_ordered,
            unit_price: line.unit_price
          })
        })
      ));

      toast.success(`Sales order ${orderRes.reference || orderRes.id} created successfully.`);
      queryClient.invalidateQueries({ queryKey: ["salesOrders"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      router.push("/sales/orders");
    } catch (error: any) {
      const errorMessage = error.data && typeof error.data === 'object' && Object.keys(error.data).length > 0 
        ? error.data[Object.keys(error.data)[0]][0] 
        : error.message;
      toast.error(`Failed to create sales order: ${errorMessage}`);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Sales"
        title="Create Sales Order"
        description="Select customer and add products to lines."
      />
      <Card className="max-w-4xl p-6 border-[var(--border)] bg-[var(--surface)] rounded-[12px]">
        <form className="grid gap-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="grid gap-2">
              <span className="text-sm font-semibold text-[var(--foreground)]">Customer</span>
              <Select
                {...register("customer")}
                className={errors.customer ? "border-[var(--danger)]" : ""}
              >
                <option value="">Select a customer...</option>
                {customers?.map((c: any) => (
                  <option key={c.id} value={c.id.toString()}>{c.name}</option>
                ))}
              </Select>
              {errors.customer && (
                <span className="text-xs text-[var(--danger)]">{errors.customer.message}</span>
              )}
            </div>

            <div className="grid gap-2">
              <span className="text-sm font-semibold text-[var(--foreground)]">Order Total</span>
              <div className="flex h-10 w-full items-center rounded-md border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-sm">
                ${totalValue.toFixed(2)}
              </div>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-md font-semibold text-[var(--foreground)]">Order Lines</h3>
              <Button type="button" variant="secondary" onClick={() => append({ product: "", quantity_ordered: 1, unit_price: 0 })} size="sm">
                <Plus className="h-4 w-4 mr-1" /> Add Line
              </Button>
            </div>
            
            <div className="border rounded-lg overflow-hidden border-[var(--border)]">
              <table className="w-full text-sm text-left">
                <thead className="bg-[var(--surface-muted)] text-[var(--muted)]">
                  <tr>
                    <th className="px-4 py-2 font-medium">Product</th>
                    <th className="px-4 py-2 font-medium w-24">Qty</th>
                    <th className="px-4 py-2 font-medium w-32">Unit Price</th>
                    <th className="px-4 py-2 font-medium w-32">Subtotal</th>
                    <th className="px-4 py-2 w-12"></th>
                  </tr>
                </thead>
                <tbody>
                  {fields.map((field, index) => {
                    const qty = Number(linesWatch[index]?.quantity_ordered) || 0;
                    const price = Number(linesWatch[index]?.unit_price) || 0;
                    const subtotal = qty * price;
                    
                    return (
                      <tr key={field.id} className="border-t border-[var(--border)] bg-[var(--surface)]">
                        <td className="px-4 py-2">
                          <Select {...register(`lines.${index}.product` as const)} className="h-8">
                            <option value="">Select Product...</option>
                            {products?.map((p: any) => (
                              <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                          </Select>
                          {errors.lines?.[index]?.product && <span className="text-[10px] text-[var(--danger)]">{errors.lines[index]?.product?.message}</span>}
                        </td>
                        <td className="px-4 py-2">
                          <Input type="number" {...register(`lines.${index}.quantity_ordered` as const)} className="h-8 w-full" />
                        </td>
                        <td className="px-4 py-2">
                          <Input type="number" step="0.01" {...register(`lines.${index}.unit_price` as const)} className="h-8 w-full" />
                        </td>
                        <td className="px-4 py-2 flex items-center h-12">
                          ${subtotal.toFixed(2)}
                        </td>
                        <td className="px-4 py-2 text-right">
                          <button type="button" onClick={() => remove(index)} className="text-[var(--danger)] hover:opacity-80">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {errors.lines && !Array.isArray(errors.lines) && (
                <div className="p-2 text-xs text-[var(--danger)] border-t border-[var(--border)]">
                  {errors.lines.message as string}
                </div>
              )}
            </div>
          </div>

          <div className="grid gap-2">
            <span className="text-sm font-semibold text-[var(--foreground)]">Notes</span>
            <Textarea
              placeholder="Specify delivery constraints or customer notes"
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
