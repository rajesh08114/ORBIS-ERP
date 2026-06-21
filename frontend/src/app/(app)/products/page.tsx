"use client";

import { Plus } from "@/components/icons";
import { PageHeader } from "@/components/erp/page-header";
import { ProductTable } from "@/components/erp/product-table";
import { LoadingState } from "@/components/ui/states";
import { useProducts } from "@/hooks/use-erp";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ProductsPage() {
  const { data, isLoading } = useProducts();
  if (isLoading || !data) return <LoadingState />;

  return (
    <>
      <PageHeader eyebrow="Product Master" title="Products List View" description="Search, filter, create, edit, and monitor product master data with inventory visibility." />
      <div className="mb-4">
        <Link href="/products/new">
          <Button><Plus className="h-4 w-4 mr-2" /> New Product</Button>
        </Link>
      </div>
      <div className="mt-4">
        <ProductTable products={data} />
      </div>
    </>
  );
}
