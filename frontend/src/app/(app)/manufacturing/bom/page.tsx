"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Search } from "@/components/icons";
import { PageHeader } from "@/components/erp/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { LoadingState } from "@/components/ui/states";
import { DataTable } from "@/components/ui/data-table";
import { useBoms, useProducts } from "@/hooks/use-erp";
import type { ColumnDef } from "@tanstack/react-table";

export default function BomPage() {
  const { data: boms = [], isLoading: bomsLoading, error: bomsError } = useBoms();
  const { data: products = [], isLoading: productsLoading } = useProducts();
  const [search, setSearch] = useState("");

  if (bomsLoading || productsLoading) {
    return <LoadingState />;
  }

  if (bomsError) {
    return (
      <div className="p-6 text-red-500 font-bold border border-red-200 rounded-[12px] bg-red-50/50">
        Error loading Bills of Materials. Please check your workspace permissions.
      </div>
    );
  }

  const productMap = new Map<number, any>();
  (products || []).forEach((p: any) => {
    productMap.set(p.id, p);
  });

  const enrichedBoms = boms.map((bom: any) => {
    const parentProduct = productMap.get(bom.finished_product);
    return {
      id: bom.id,
      code: bom.code,
      finishedProduct: parentProduct?.name || `Product #${bom.finished_product}`,
      quantity: parseFloat(bom.quantity) || 1.0,
      unit: "Units",
    };
  });

  const filteredBoms = enrichedBoms.filter((bom: any) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      (bom.code && bom.code.toLowerCase().includes(term)) ||
      (bom.finishedProduct && bom.finishedProduct.toLowerCase().includes(term))
    );
  });

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "code",
      header: "Reference",
      cell: ({ row }) => (
        <Link href={`/manufacturing/bom/${row.original.id}`} className="text-[var(--primary)] hover:underline font-bold">
          {row.original.code}
        </Link>
      ),
    },
    { accessorKey: "finishedProduct", header: "Finished Product", cell: ({ row }) => <span className="font-semibold">{row.original.finishedProduct}</span> },
    { accessorKey: "quantity", header: "Quantity", cell: ({ row }) => <span className="font-mono">{row.original.quantity.toFixed(2)}</span> },
    { accessorKey: "unit", header: "Unit" },
  ];

  return (
    <>
      <PageHeader 
        eyebrow="Manufacturing" 
        title="Bills of Materials" 
        description="Configure product formulas, component requirements, and production routings." 
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Link href="/manufacturing/bom/new">
            <Button variant="primary">
              <Plus className="h-4 w-4 mr-2" /> 
              New Bill of Materials
            </Button>
          </Link>
        </div>

        <div className="relative flex-1 sm:w-64 sm:max-w-xs ml-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted)]" />
          <Input
            placeholder="Search BOMs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10 w-full bg-[var(--surface)]"
          />
        </div>
      </div>

      <DataTable data={filteredBoms} columns={columns} />
    </>
  );
}
