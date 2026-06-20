"use client";

import { PageHeader } from "@/components/erp/page-header";
import { LoadingState } from "@/components/ui/states";
import { useProducts } from "@/hooks/use-erp";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/components/erp/metric-card";
import { Badge } from "@/components/ui/badge";
import { Boxes, ShieldAlert, BarChart3, TrendingUp } from "@/components/icons";

export default function InventoryHealthPage() {
  const { data, isLoading } = useProducts();

  if (isLoading || !data) return <LoadingState />;

  // Compute stats
  const totalValuation = data.reduce((sum, item) => sum + (item.onHand * item.unitCost), 0);
  const criticalItems = data.filter((item) => item.status === "Critical");
  const lowStockItems = data.filter((item) => item.onHand < 150 && item.status !== "Completed");
  const healthyItemsCount = data.filter((item) => item.status === "Healthy" || item.status === "Completed").length;

  return (
    <>
      <PageHeader 
        eyebrow="Stock Optimization" 
        title="Inventory Health Diagnostics" 
        description="Predictive signals monitoring component shortages, holding costs, slow-moving parts, and valuation levels."
        action="Run Simulation"
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total Valuation" value={`$${(totalValuation / 1000000).toFixed(2)}M`} trend="Asset value" icon={Boxes} tone="success" />
        <MetricCard label="Critical Shortages" value={criticalItems.length.toString()} trend="Immediate risk" icon={ShieldAlert} tone="danger" />
        <MetricCard label="Low Stock Warning" value={lowStockItems.length.toString()} trend="Replenishment cue" icon={TrendingUp} tone="warning" />
        <MetricCard label="Healthy Status Ratio" value={`${((healthyItemsCount / data.length) * 100).toFixed(1)}%`} trend="Target 90%" icon={BarChart3} tone="success" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {/* Critical Shortage Watchlist */}
        <Card>
          <CardHeader>
            <CardTitle>Shortage Watchlist</CardTitle>
            <span className="text-xs text-[var(--muted)]">Items requiring immediate procurement triggers</span>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {criticalItems.slice(0, 5).map((item) => (
                <div key={item.id} className="flex justify-between items-center p-3 rounded-[8px] border border-red-500/20 bg-red-500/5">
                  <div>
                    <span className="text-sm font-bold text-[var(--foreground)] block">{item.name}</span>
                    <span className="text-[10px] text-[var(--muted)]">SKU: {item.sku} | Category: {item.category}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-rose-500 block">{item.onHand} On Hand</span>
                    <Badge tone="danger">Critical</Badge>
                  </div>
                </div>
              ))}
              {criticalItems.length === 0 && (
                <div className="text-sm text-[var(--muted)] text-center py-6">No critical shortages logged.</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Slow-Moving Stock analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Slow-Moving Inventories</CardTitle>
            <span className="text-xs text-[var(--muted)]">High on-hand counts with low monthly demand pull</span>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.filter((item) => item.onHand > 800).slice(0, 5).map((item) => (
                <div key={item.id} className="flex justify-between items-center p-3 rounded-[8px] border border-[var(--border)] bg-[var(--surface-muted)]">
                  <div>
                    <span className="text-sm font-bold text-[var(--foreground)] block">{item.name}</span>
                    <span className="text-[10px] text-[var(--muted)]">SKU: {item.sku} | Unit Cost: ${item.unitCost}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-[var(--foreground)] block">{item.onHand} Units</span>
                    <span className="text-[10px] text-[var(--muted)]">Turns: 0.8x / yr</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
