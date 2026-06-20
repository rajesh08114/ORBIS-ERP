import { Activity, Boxes, Factory, ShieldCheck } from "@/components/icons";
import { OperationsBarChart, RevenueChart } from "@/components/erp/charts";
import { MetricCard } from "@/components/erp/metric-card";
import { PageHeader } from "@/components/erp/page-header";
import { TwinFlow } from "@/components/erp/twin-flow";

export default function ExecutivePage() {
  return (
    <>
      <PageHeader
        eyebrow="Executive Intelligence"
        title="The Digital Backbone of Manufacturing"
        description="Executive control tower for margin, risk, customer commitments, operational flow, and compliance pulse."
        action="Board Pack"
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Gross Margin" value="38.4%" trend="+2.1%" icon={Activity} tone="success" />
        <MetricCard label="Inventory Turns" value="8.7x" trend="Top quartile" icon={Boxes} tone="success" />
        <MetricCard label="Factory OEE" value="96%" trend="Target met" icon={Factory} tone="success" />
        <MetricCard label="Compliance Pulse" value="99.1%" trend="No blockers" icon={ShieldCheck} tone="info" />
      </div>
      <div className="mt-4">
        <TwinFlow />
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <RevenueChart />
        <OperationsBarChart />
      </div>
    </>
  );
}
