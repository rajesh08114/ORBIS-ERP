"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { GitBranch, Package, Route, WalletCards, Plus } from "@/components/icons";
import { PageHeader } from "@/components/erp/page-header";
import { MetricCard } from "@/components/erp/metric-card";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/ui/states";
import { useBoms, useProducts, useOperations } from "@/hooks/use-erp";
import { formatCurrency } from "@/lib/utils";

interface EnrichedBom {
  id: string;
  dbId: number;
  product: string;
  costRollup: number;
  components: Array<{
    name: string;
    qty: number;
    cost: number;
  }>;
  routing: string[];
  is_active: boolean;
}

export default function BomPage() {
  const { data: rawBoms = [], isLoading: bomsLoading, error: bomsError } = useBoms();
  const { data: products = [], isLoading: productsLoading } = useProducts();
  const { data: operations = [], isLoading: operationsLoading } = useOperations();

  const [selectedBomId, setSelectedBomId] = useState<string>("");

  const productMap = useMemo(() => {
    const map = new Map<number, any>();
    (products || []).forEach((p: any) => {
      map.set(p.id, p);
    });
    return map;
  }, [products]);

  const operationMap = useMemo(() => {
    const map = new Map<number, any>();
    (operations || []).forEach((o: any) => {
      map.set(o.id, o);
    });
    return map;
  }, [operations]);

  const enrichedBoms = useMemo<EnrichedBom[]>(() => {
    return rawBoms.map((bom: any) => {
      const parentProduct = productMap.get(bom.finished_product);
      const parentName = parentProduct?.name || `Product Assembly #${bom.finished_product}`;
      
      const rollupCost = (bom.lines || []).reduce((sum: number, line: any) => {
        const componentProduct = productMap.get(line.component);
        const cost = parseFloat(componentProduct?.cost_price || 0);
        const qty = parseFloat(line.quantity_required) || 0;
        return sum + (cost * qty);
      }, 0);

      const components = (bom.lines || []).map((line: any) => {
        const compProd = productMap.get(line.component);
        return {
          name: compProd?.name || `Component #${line.component}`,
          qty: parseFloat(line.quantity_required) || 0,
          cost: parseFloat(compProd?.cost_price || 0),
        };
      });

      const routing = (bom.lines || [])
        .map((line: any) => line.operation)
        .filter(Boolean)
        .map((opId: number) => operationMap.get(opId)?.name)
        .filter(Boolean);

      // Fallback standard routing steps if no operations registered in lines
      const routingList = routing.length > 0 ? routing : ["Assembly", "Inspection"];

      return {
        id: bom.code || `BOM-${bom.id}`,
        dbId: bom.id,
        product: parentName,
        costRollup: rollupCost,
        components,
        routing: routingList,
        is_active: bom.is_active,
      };
    });
  }, [rawBoms, productMap, operationMap]);

  if (bomsLoading || productsLoading || operationsLoading) {
    return <LoadingState />;
  }

  if (bomsError) {
    return (
      <div className="p-6 text-red-500 font-bold border border-red-200 rounded-[12px] bg-red-50/50">
        Error loading Bills of Materials. Please check your workspace permissions.
      </div>
    );
  }

  const activeBomId = selectedBomId || enrichedBoms[0]?.id || "";
  const selectedBom = enrichedBoms.find((b) => b.id === activeBomId) || enrichedBoms[0];

  // Stats
  const totalBoms = enrichedBoms.length;
  const avgCost = totalBoms > 0 
    ? enrichedBoms.reduce((sum, b) => sum + b.costRollup, 0) / totalBoms 
    : 0;
  const totalComponentsCount = enrichedBoms.reduce((sum, b) => sum + b.components.length, 0);

  return (
    <>
      <PageHeader 
        eyebrow="Manufacturing BOM" 
        title="Bills of Materials" 
        description="Configure product formulas, component costs, and production step routings." 
      />

      <div className="mb-4">
        <Link href="/manufacturing/bom/new">
          <Button><Plus className="h-4 w-4 mr-2" /> Define New BOM</Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Active BOMs" value={totalBoms.toString()} trend="Configured" icon={Package} tone="info" />
        <MetricCard label="Total Components" value={totalComponentsCount.toString()} trend="Across products" icon={GitBranch} tone="warning" />
        <MetricCard label="Avg Rollup Cost" value={formatCurrency(avgCost)} trend="Staged standard" icon={WalletCards} tone="success" />
        <MetricCard label="Routing Stages" value={operations.length.toString()} trend="Standard flow" icon={Route} tone="success" />
      </div>

      {enrichedBoms.length === 0 ? (
        <Card className="mt-6 p-8 text-center border-[var(--border)] bg-[var(--surface)] text-[var(--muted)]">
          No Bills of Materials exist yet. Click "Define New BOM" to construct one.
        </Card>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          {/* Left Side: BOM List */}
          <Card className="p-5 border-[var(--border)] bg-[var(--surface)]">
            <h3 className="text-base font-bold mb-4">Product Assemblies Directory</h3>
            <div className="space-y-2">
              {enrichedBoms.map((bom) => {
                const active = bom.id === activeBomId;
                return (
                  <button
                    key={bom.id}
                    onClick={() => setSelectedBomId(bom.id)}
                    className={`w-full text-left p-3 rounded-[8px] border transition flex flex-col gap-1.5 cursor-pointer ${
                      active 
                        ? "border-[var(--primary)] bg-[var(--primary-soft)]" 
                        : "border-[var(--border)] bg-[var(--surface-muted)] hover:bg-[var(--surface-raised)]"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-[var(--muted)]">{bom.id}</span>
                      <span className="text-xs font-bold text-[var(--foreground)]">{formatCurrency(bom.costRollup)}</span>
                    </div>
                    <span className="text-sm font-semibold text-[var(--foreground)] truncate">{bom.product}</span>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Right Side: Selected BOM Detail */}
          {selectedBom ? (
            <div className="lg:col-span-2 space-y-6">
              <Card className="p-5 border-[var(--border)] bg-[var(--surface)]">
                <div className="flex items-center justify-between border-b border-[var(--border)] pb-3 mb-4">
                  <div>
                    <span className="text-xs text-[var(--muted)] block">Selected Assembly Formula</span>
                    <h4 className="text-lg font-bold">{selectedBom.product}</h4>
                  </div>
                  <Badge tone={selectedBom.is_active ? "success" : "warning"}>
                    {selectedBom.id} {selectedBom.is_active ? "" : "(Inactive)"}
                  </Badge>
                </div>

                <h4 className="text-sm font-bold text-[var(--muted)] uppercase tracking-wider mb-3">Formula Components</h4>
                <div className="space-y-2.5">
                  {selectedBom.components.length === 0 ? (
                    <span className="text-xs text-[var(--muted)]">No components defined for this assembly formula.</span>
                  ) : (
                    selectedBom.components.map((comp, idx) => (
                      <div 
                        key={`${comp.name}-${idx}`} 
                        className="flex justify-between items-center p-3 rounded-[8px] bg-[var(--surface-muted)] border border-[var(--border)] text-sm"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-semibold text-[var(--muted)]">{idx + 1}.</span>
                          <span className="font-semibold">{comp.name}</span>
                        </div>
                        <div className="flex items-center gap-6 text-xs text-[var(--muted)]">
                          <span>Qty: <strong className="text-[var(--foreground)]">{comp.qty}</strong></span>
                          <span>Unit: <strong className="text-[var(--foreground)]">{formatCurrency(comp.cost)}</strong></span>
                          <span>Total: <strong className="text-[var(--primary)]">{formatCurrency(comp.qty * comp.cost)}</strong></span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>

              <Card className="p-5 border-[var(--border)] bg-[var(--surface)]">
                <h4 className="text-sm font-bold text-[var(--muted)] uppercase tracking-wider mb-4">Standard Routing Sequence</h4>
                <div className="space-y-3">
                  {selectedBom.routing.map((step, index) => (
                    <div key={`${step}-${index}`} className="flex items-center gap-4 text-sm">
                      <div className="h-6 w-6 rounded-full bg-[var(--primary-soft)] text-[var(--primary)] font-bold flex items-center justify-center text-xs">
                        {index + 1}
                      </div>
                      <span className="font-semibold text-[var(--foreground)]">{step}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          ) : (
            <div className="lg:col-span-2 flex items-center justify-center p-12 text-sm text-[var(--muted)] border border-dashed border-[var(--border)] rounded-[8px]">
              Please select an assembly to view its Bill of Materials formula details.
            </div>
          )}
        </div>
      )}
    </>
  );
}
