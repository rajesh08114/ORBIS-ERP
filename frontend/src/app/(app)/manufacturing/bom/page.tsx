"use client";

import { useState } from "react";
import Link from "next/link";
import { GitBranch, Package, Route, WalletCards, Plus } from "@/components/icons";
import { PageHeader } from "@/components/erp/page-header";
import { MetricCard } from "@/components/erp/metric-card";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useErpStore } from "@/stores/erp-store";
import { formatCurrency } from "@/lib/utils";

export default function BomPage() {
  const boms = useErpStore((state) => state.boms);
  const [selectedBomId, setSelectedBomId] = useState<string>(boms[0]?.id || "");
  const selectedBom = boms.find((b) => b.id === selectedBomId) || boms[0];

  // Stats
  const totalBoms = boms.length;
  const avgCost = boms.reduce((sum, b) => sum + b.costRollup, 0) / (totalBoms || 1);
  const totalComponentsCount = boms.reduce((sum, b) => sum + b.components.length, 0);

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
        <MetricCard label="Routing Stages" value="6" trend="Standard flow" icon={Route} tone="success" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Left Side: BOM List */}
        <Card className="p-5 border-[var(--border)] bg-[var(--surface)]">
          <h3 className="text-base font-bold mb-4">Product Assemblies Directory</h3>
          <div className="space-y-2">
            {boms.map((bom) => {
              const active = bom.id === selectedBomId;
              return (
                <button
                  key={bom.id}
                  onClick={() => setSelectedBomId(bom.id)}
                  className={`w-full text-left p-3 rounded-[8px] border transition flex flex-col gap-1.5 ${
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
                <Badge tone="primary">{selectedBom.id}</Badge>
              </div>

              <h4 className="text-sm font-bold text-[var(--muted)] uppercase tracking-wider mb-3">Formula Components</h4>
              <div className="space-y-2.5">
                {selectedBom.components.map((comp, idx) => (
                  <div 
                    key={comp.name} 
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
                ))}
              </div>
            </Card>

            <Card className="p-5 border-[var(--border)] bg-[var(--surface)]">
              <h4 className="text-sm font-bold text-[var(--muted)] uppercase tracking-wider mb-4">Standard Routing Sequence</h4>
              <div className="space-y-3">
                {selectedBom.routing.map((step, index) => (
                  <div key={step} className="flex items-center gap-4 text-sm">
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
    </>
  );
}

