"use client";

import { use, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/field";
import { useProductDetail, useVendors, useBoms } from "@/hooks/use-erp";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import { ArrowLeft, FileText, Image as ImageIcon } from "@/components/icons";

const schema = z.object({
  name: z.string().min(1, "Product name is required"),
  sku: z.string().optional(),
  salesPrice: z.coerce.number().min(0, "Price cannot be negative"),
  costPrice: z.coerce.number().min(0, "Cost cannot be negative"),
  onHand: z.coerce.number().min(0, "Quantity cannot be negative"),
  procureOnDemand: z.boolean(),
  procurementType: z.enum(["purchase", "manufacture"]),
  vendor_id: z.string().optional(),
  bom_id: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const unwrappedParams = use(params);
  const isNew = unwrappedParams.id === "new";

  const { data: product, isLoading: productLoading } = useProductDetail(unwrappedParams.id);
  const { data: vendors = [] } = useVendors();
  const { data: boms = [] } = useBoms();
  const [imageFile, setImageFile] = useState<File | null>(null);

  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      sku: "",
      salesPrice: 0,
      costPrice: 0,
      onHand: 0,
      procureOnDemand: false,
      procurementType: "purchase",
      vendor_id: "",
      bom_id: ""
    }
  });

  const procureOnDemand = watch("procureOnDemand");
  const procurementType = watch("procurementType");

  useEffect(() => {
    if (!isNew && product) {
      reset({
        name: product.name,
        sku: product.sku || "",
        salesPrice: parseFloat(product.sales_price) || 0,
        costPrice: parseFloat(product.cost_price) || 0,
        onHand: parseFloat(product.on_hand_quantity) || 0,
        procureOnDemand: product.procure_on_demand || false,
        procurementType: product.procurement_type || "purchase",
        vendor_id: product.vendor?.toString() || "",
        bom_id: product.default_bom?.toString() || ""
      });
    }
  }, [isNew, product, reset]);

  const onSubmit = async (data: FormValues) => {
    try {
      const payload: any = {
        name: data.name,
        sku: data.sku,
        sales_price: data.salesPrice,
        cost_price: data.costPrice,
        on_hand_quantity: data.onHand,
        procure_on_demand: data.procureOnDemand,
        procurement_type: data.procurementType,
        procurement_strategy: data.procureOnDemand ? "mto" : "mts",
      };

      if (data.procureOnDemand) {
        if (data.procurementType === "purchase" && data.vendor_id) {
          payload.vendor = Number(data.vendor_id);
          payload.default_bom = null;
        } else if (data.procurementType === "manufacture" && data.bom_id) {
          payload.default_bom = Number(data.bom_id);
          payload.vendor = null;
        }
      } else {
        // Even if not procuring on demand, they might want to link a vendor/bom, but let's clear it if they switched
        if (data.procurementType === "purchase" && data.vendor_id) {
            payload.vendor = Number(data.vendor_id);
        } else if (data.procurementType === "manufacture" && data.bom_id) {
            payload.default_bom = Number(data.bom_id);
        }
      }

      let finalPayload: any;

      if (imageFile) {
        const formData = new FormData();
        formData.append("name", data.name);
        if (data.sku) formData.append("sku", data.sku);
        formData.append("sales_price", String(data.salesPrice));
        formData.append("cost_price", String(data.costPrice));
        formData.append("on_hand_quantity", String(data.onHand));
        formData.append("procure_on_demand", String(data.procureOnDemand ? "True" : "False"));
        formData.append("procurement_type", data.procurementType);
        formData.append("procurement_strategy", data.procureOnDemand ? "mto" : "mts");
        
        if (data.procureOnDemand) {
          if (data.procurementType === "purchase" && data.vendor_id) formData.append("vendor", data.vendor_id);
          else if (data.procurementType === "manufacture" && data.bom_id) formData.append("default_bom", data.bom_id);
        } else {
          if (data.procurementType === "purchase" && data.vendor_id) formData.append("vendor", data.vendor_id);
          else if (data.procurementType === "manufacture" && data.bom_id) formData.append("default_bom", data.bom_id);
        }
        
        formData.append("image", imageFile);
        finalPayload = formData;
      } else {
        finalPayload = JSON.stringify(payload);
      }

      if (isNew) {
        await apiClient<any>("products/", {
          method: "POST",
          body: finalPayload
        });
        toast.success(`Product created successfully.`);
        router.push("/products");
      } else {
        await apiClient(`products/${unwrappedParams.id}/`, {
          method: "PATCH",
          body: finalPayload
        });
        toast.success(`Product updated successfully.`);
      }
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product", unwrappedParams.id] });
    } catch (error: any) {
      toast.error(`Error saving product: ${error.message || "Unknown error"}`);
    }
  };

  if (!isNew && productLoading) return null;

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="secondary" onClick={() => router.push("/products")}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          <Button variant="primary" onClick={handleSubmit(onSubmit)} disabled={isSubmitting}>
            Save
          </Button>
        </div>
        {!isNew && (
          <Link href={`/audit-logs?module=Product&entity_id=${unwrappedParams.id}`}>
            <Button variant="secondary">
              <FileText className="h-4 w-4 mr-2" /> Logs
            </Button>
          </Link>
        )}
      </div>

      <h1 className="text-2xl font-bold mb-6 text-[var(--foreground)]">Product Form View</h1>

      <Card className="max-w-4xl p-8 border-[var(--border)] bg-[var(--surface)]">
        <div className="flex flex-col md:flex-row gap-12">
          
          {/* Left Column: Form Fields */}
          <div className="flex-1 space-y-6">
            <div className="flex items-center">
              <label className="w-1/3 text-sm font-semibold text-[var(--foreground)]">Product</label>
              <div className="w-2/3">
                <Input {...register("name")} className={`border-b-2 border-t-0 border-l-0 border-r-0 rounded-none bg-transparent px-0 shadow-none focus-visible:ring-0 ${errors.name ? "border-[var(--danger)]" : "border-[var(--border)]"}`} />
                {errors.name && <span className="text-xs text-[var(--danger)]">{errors.name.message}</span>}
              </div>
            </div>

            <div className="flex items-center">
              <label className="w-1/3 text-sm font-semibold text-[var(--foreground)]">Reference / SKU</label>
              <div className="w-2/3">
                <Input {...register("sku")} className={`border-b-2 border-t-0 border-l-0 border-r-0 rounded-none bg-transparent px-0 shadow-none focus-visible:ring-0 ${errors.sku ? "border-[var(--danger)]" : "border-[var(--border)]"}`} />
              </div>
            </div>

            <div className="flex items-center">
              <label className="w-1/3 text-sm font-semibold text-[var(--foreground)]">Sales Price</label>
              <div className="w-2/3">
                <Input type="number" step="0.01" {...register("salesPrice")} className={`border-b-2 border-t-0 border-l-0 border-r-0 rounded-none bg-transparent px-0 shadow-none focus-visible:ring-0 ${errors.salesPrice ? "border-[var(--danger)]" : "border-[var(--border)]"}`} />
                {errors.salesPrice && <span className="text-xs text-[var(--danger)]">{errors.salesPrice.message}</span>}
              </div>
            </div>

            <div className="flex items-center">
              <label className="w-1/3 text-sm font-semibold text-[var(--foreground)]">Cost Price</label>
              <div className="w-2/3">
                <Input type="number" step="0.01" {...register("costPrice")} className={`border-b-2 border-t-0 border-l-0 border-r-0 rounded-none bg-transparent px-0 shadow-none focus-visible:ring-0 ${errors.costPrice ? "border-[var(--danger)]" : "border-[var(--border)]"}`} />
                {errors.costPrice && <span className="text-xs text-[var(--danger)]">{errors.costPrice.message}</span>}
              </div>
            </div>

            <div className="flex items-center">
              <label className="w-1/3 text-sm font-semibold text-[var(--foreground)]">On Hand Qty</label>
              <div className="w-2/3">
                <Input type="number" step="0.01" {...register("onHand")} className={`border-b-2 border-t-0 border-l-0 border-r-0 rounded-none bg-transparent px-0 shadow-none focus-visible:ring-0 ${errors.onHand ? "border-[var(--danger)]" : "border-[var(--border)]"}`} />
                {errors.onHand && <span className="text-xs text-[var(--danger)]">{errors.onHand.message}</span>}
              </div>
            </div>

            <div className="flex items-center">
              <label className="w-1/3 text-sm font-semibold text-[var(--foreground)]">Free to Use Qty</label>
              <div className="w-2/3">
                <Input value={!isNew && product ? parseFloat(product.free_to_use_quantity || 0) : watch("onHand")} readOnly disabled className="border-b-2 border-t-0 border-l-0 border-r-0 rounded-none bg-transparent px-0 shadow-none opacity-50" />
              </div>
            </div>
            
            <div className="pt-4 mt-4">
              <div className="flex items-center gap-4 mb-4">
                <label className="text-sm font-semibold text-[var(--foreground)]">Procure on Demand</label>
                <input type="checkbox" {...register("procureOnDemand")} className="h-4 w-4 rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)]" />
              </div>

              {procureOnDemand && (
                <div className="flex items-center mb-4">
                  <Select {...register("procurementType")} className="w-full border-b-2 border-t-0 border-l-0 border-r-0 rounded-none bg-transparent px-0 shadow-none focus-visible:ring-0">
                    <option value="purchase">Purchase</option>
                    <option value="manufacture">Manufacturing</option>
                  </Select>
                </div>
              )}

              {procureOnDemand && procurementType === "purchase" && (
                <div className="flex items-center">
                  <label className="w-1/3 text-sm font-semibold text-[var(--foreground)]">Vendor</label>
                  <div className="w-2/3">
                    <Select {...register("vendor_id")} className="w-full border-b-2 border-t-0 border-l-0 border-r-0 rounded-none bg-transparent px-0 shadow-none focus-visible:ring-0">
                      <option value="">Select Vendor...</option>
                      {vendors?.map((v: any) => (
                        <option key={v.id} value={v.id}>{v.name}</option>
                      ))}
                    </Select>
                  </div>
                </div>
              )}

              {procureOnDemand && procurementType === "manufacture" && (
                <div className="flex items-center">
                  <label className="w-1/3 text-sm font-semibold text-[var(--foreground)]">Bill of Materials</label>
                  <div className="w-2/3">
                    <Select {...register("bom_id")} className="w-full border-b-2 border-t-0 border-l-0 border-r-0 rounded-none bg-transparent px-0 shadow-none focus-visible:ring-0">
                      <option value="">Select BoM...</option>
                      {boms?.map((b: any) => (
                        <option key={b.id} value={b.id}>{b.code}</option>
                      ))}
                    </Select>
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* Right Column: Image Upload Area */}
          <div className="flex-shrink-0 w-48 relative group">
            <input 
              type="file" 
              accept="image/*"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              onChange={(e) => {
                if (e.target.files?.[0]) setImageFile(e.target.files[0]);
              }}
            />
            <div className="w-full aspect-square border-2 border-dashed border-[var(--border)] rounded-[12px] flex flex-col items-center justify-center text-[var(--muted)] group-hover:bg-[var(--surface-muted)] group-hover:text-[var(--foreground)] transition-colors bg-[var(--surface)] overflow-hidden">
              {imageFile ? (
                <img src={URL.createObjectURL(imageFile)} alt="Preview" className="w-full h-full object-cover" />
              ) : (!isNew && product?.image) ? (
                <img src={product.image} alt="Product" className="w-full h-full object-cover" />
              ) : (
                <>
                  <ImageIcon className="h-8 w-8 mb-2" />
                  <span className="text-[10px] font-bold tracking-wider uppercase">Image</span>
                </>
              )}
            </div>
          </div>

        </div>
      </Card>
    </>
  );
}
