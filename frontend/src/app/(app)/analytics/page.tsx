import { PageHeader } from "@/components/erp/page-header";
import { OperationsBarChart, RevenueChart } from "@/components/erp/charts";
import { TwinFlow } from "@/components/erp/twin-flow";

export default function AnalyticsPage() {
  return (
    <>
      <PageHeader eyebrow="Analytics" title="Executive Analytics" description="Inventory, sales, procurement, manufacturing, and executive analytics consolidated into one command surface." action="Create Report" />
      <div className="grid gap-4 xl:grid-cols-2">
        <RevenueChart />
        <OperationsBarChart />
      </div>
      <div className="mt-4">
        <TwinFlow />
      </div>
    </>
  );
}
