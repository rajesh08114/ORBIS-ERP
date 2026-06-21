"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { PageHeader } from "@/components/erp/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/field";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import { Image as ImageIcon } from "@/components/icons";
import { useVendors, useBoms } from "@/hooks/use-erp";

const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  sku: z.string().min(1, "SKU is required"),
  category: z.string().min(1, "Category is required"),
  sales_price: z.coerce.number().min(0, "Sales price cannot be negative"),
  cost_price: z.coerce.number().min(0, "Cost price cannot be negative"),
  on_hand_quantity: z.coerce.number().min(0, "Quantity cannot be negative"),
  procure_on_demand: z.boolean(),
  procurement_type: z.enum(["purchase", "manufacture"]),
  vendor_id: z.string().optional(),
  bom_id: z.string().optional(),
});

type FormValues = z.infer<typeof productSchema>;

export default function NewProductPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const { data: vendors = [] } = useVendors();
  const { data: boms = [] } = useBoms();

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      sku: "",
      category: "Furniture Assemblies",
      sales_price: 0,
      cost_price: 0,
      on_hand_quantity: 0,
      procure_on_demand: false,
      procurement_type: "purchase",
      vendor_id: "",
      bom_id: ""
    }
  });

  const procureOnDemand = watch("procure_on_demand");
  const procurementType = watch("procurement_type");

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (data: FormValues) => {
    try {
      let body: any;
      let headers: Record<string, string> = {};

      const payloadData: any = { 
        ...data, 
        procurement_strategy: data.procure_on_demand ? "mto" : "mts" 
      };

      if (data.procure_on_demand) {
        if (data.procurement_type === "purchase" && data.vendor_id) {
          payloadData.vendor = data.vendor_id;
        } else if (data.procurement_type === "manufacture" && data.bom_id) {
          payloadData.default_bom = data.bom_id;
        }
      }

      if (imageFile) {
        // Use FormData if there's an image
        const formData = new FormData();
        Object.entries(payloadData).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            formData.append(key, String(value));
          }
        });
        formData.append('image', imageFile);
        formData.append('reserved_quantity', '0');
        body = formData;
        // Let browser set Content-Type for FormData
      } else {
        body = JSON.stringify({
          ...payloadData,
          reserved_quantity: 0
        });
        headers['Content-Type'] = 'application/json';
      }

      const newProduct = await apiClient<any>("products/", {
        method: "POST",
        headers,
        body
      });

      toast.success("Product created successfully.");
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      router.push(`/products/${newProduct.id}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to create product.");
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Inventory"
        title="Create New Product"
        description="Register a new SKU into the system inventory."
      />
      <Card className="max-w-4xl p-6 border-[var(--border)] bg-[var(--surface)] rounded-[12px]">
        <form className="grid gap-6" onSubmit={handleSubmit(onSubmit)}>
          
          {/* Main Info */}
          <div className="flex gap-6 items-start">
            {/* Image Upload Area */}
            <div className="flex-shrink-0 w-48">
              <label className="block w-full aspect-square border-2 border-dashed border-[var(--border)] rounded-[12px] flex flex-col items-center justify-center text-[var(--muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)] transition-colors cursor-pointer bg-[var(--surface)] relative overflow-hidden group">
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleImageChange}
                />
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <>
                    <ImageIcon className="h-8 w-8 mb-2 opacity-50 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-semibold uppercase tracking-wider">Upload</span>
                  </>
                )}
              </label>
            </div>

            <div className="flex-1 grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2 grid gap-1">
                <span className="text-sm font-semibold text-[var(--foreground)]">Product Name</span>
                <Input
                  placeholder="e.g. Executive Desk"
                  {...register("name")}
                />
                {errors.name && <span className="text-xs text-[var(--danger)]">{errors.name.message}</span>}
              </div>
              <div className="grid gap-1">
                <span className="text-sm font-semibold text-[var(--foreground)]">SKU</span>
                <Input
                  placeholder="e.g. FURN-001"
                  {...register("sku")}
                />
                {errors.sku && <span className="text-xs text-[var(--danger)]">{errors.sku.message}</span>}
              </div>
              <div className="grid gap-1">
                <span className="text-sm font-semibold text-[var(--foreground)]">Category</span>
                <Select {...register("category")}>
                  <option value="Furniture Assemblies">Furniture Assemblies</option>
                  <option value="Raw Materials">Raw Materials</option>
                  <option value="Components">Components</option>
                  <option value="Finished Goods">Finished Goods</option>
                </Select>
                {errors.category && <span className="text-xs text-[var(--danger)]">{errors.category.message}</span>}
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3 border-t border-[var(--border)] pt-6">
            <div className="grid gap-1">
              <span className="text-sm font-semibold text-[var(--foreground)]">Sales Price</span>
              <Input
                type="number"
                {...register("sales_price")}
              />
              {errors.sales_price && <span className="text-xs text-[var(--danger)]">{errors.sales_price.message}</span>}
            </div>
            <div className="grid gap-1">
              <span className="text-sm font-semibold text-[var(--foreground)]">Cost Price</span>
              <Input
                type="number"
                {...register("cost_price")}
              />
              {errors.cost_price && <span className="text-xs text-[var(--danger)]">{errors.cost_price.message}</span>}
            </div>
            <div className="grid gap-1">
              <span className="text-sm font-semibold text-[var(--foreground)]">Initial On Hand Quantity</span>
              <Input
                type="number"
                {...register("on_hand_quantity")}
              />
              {errors.on_hand_quantity && <span className="text-xs text-[var(--danger)]">{errors.on_hand_quantity.message}</span>}
            </div>
          </div>

          {/* Procurement Automation Section */}
          <div className="border-t border-[var(--border)] pt-6">
            <h3 className="text-sm font-bold text-[var(--foreground)] mb-4">Procurement Automation</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <input 
                  type="checkbox" 
                  {...register("procure_on_demand")} 
                  className="h-4 w-4 rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)]" 
                />
                <label className="text-sm font-semibold text-[var(--foreground)]">Procure on Demand (Enable automatic replenishment)</label>
              </div>

              {procureOnDemand && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-1">
                    <span className="text-sm font-semibold text-[var(--foreground)]">Procurement Type</span>
                    <Select {...register("procurement_type")}>
                      <option value="purchase">Purchase</option>
                      <option value="manufacture">Manufacturing</option>
                    </Select>
                  </div>

                  {procurementType === "purchase" && (
                    <div className="grid gap-1">
                      <span className="text-sm font-semibold text-[var(--foreground)]">Vendor</span>
                      <Select {...register("vendor_id")}>
                        <option value="">Select Vendor...</option>
                        {vendors?.map((v: any) => (
                          <option key={v.id} value={v.id}>{v.name}</option>
                        ))}
                      </Select>
                    </div>
                  )}

                  {procurementType === "manufacture" && (
                    <div className="grid gap-1">
                      <span className="text-sm font-semibold text-[var(--foreground)]">Bill of Materials</span>
                      <Select {...register("bom_id")}>
                        <option value="">Select BoM...</option>
                        {boms?.map((b: any) => (
                          <option key={b.id} value={b.id}>{b.code}</option>
                        ))}
                      </Select>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-[var(--border)] pt-6">
            <Button variant="secondary" type="button" onClick={() => router.back()}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Product"}
            </Button>
          </div>
        </form>
      </Card>
    </>
  );
}
