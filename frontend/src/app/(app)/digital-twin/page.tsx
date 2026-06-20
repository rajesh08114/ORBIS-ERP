import Link from "next/link";
import { Activity, Bot, Factory, PackageCheck } from "@/components/icons";
import { PageHeader } from "@/components/erp/page-header";
import { MetricCard } from "@/components/erp/metric-card";
import { TwinFlow } from "@/components/erp/twin-flow";
import { OperationsBarChart, RevenueChart } from "@/components/erp/charts";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function DigitalTwinPage() {
  return (
    <>
      <PageHeader
        eyebrow="Flagship Screen"
        title="ORBIS Business Flow Live Twin"
        description="Animated operational map from customer orders through inventory, procurement, manufacturing, warehouse, and delivery."
        action="Simulate Scenario"
      />
      <TwinFlow />
      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Twin Efficiency" value="98.2%" trend="Streaming" icon={Activity} tone="success" />
        <MetricCard label="Inventory Confidence" value="94%" trend="Healthy" icon={PackageCheck} tone="success" />
        <MetricCard label="Factory Load" value="87%" trend="Balanced" icon={Factory} tone="info" />
        <MetricCard label="AI Recommendations" value="14" trend="3 urgent" icon={Bot} tone="warning" />
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <RevenueChart />
        <Card className="p-4">
          <h3 className="text-lg font-bold">Active Bottlenecks</h3>
          <div className="mt-4 space-y-3">
            {["Titanium alloy lead time drift", "QC Lab queue above threshold", "Warehouse B2 receiving hold"].map((item) => (
              <div key={item} className="rounded-[8px] border border-[var(--border)] bg-[var(--surface-muted)] p-3 text-sm font-semibold">
                {item}
              </div>
            ))}
          </div>
          <Link href="/digital-twin/hub" className="mt-4 block">
            <Button className="w-full">Open Operations Hub</Button>
          </Link>
        </Card>
      </div>
      <div className="mt-4">
        <OperationsBarChart />
      </div>
    </>
  );
}
