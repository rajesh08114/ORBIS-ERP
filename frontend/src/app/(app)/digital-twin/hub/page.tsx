import { PageHeader } from "@/components/erp/page-header";
import { TwinFlow } from "@/components/erp/twin-flow";
import { RevenueChart } from "@/components/erp/charts";

export default function DigitalTwinHubPage() {
  return (
    <>
      <PageHeader
        eyebrow="Operations Hub"
        title="Customer Promise to Delivery Control Hub"
        description="Desktop-ready hub based on the Stitch digital twin operations screens, normalized into the ORBIS shell."
        action="Refresh Twin"
      />
      <TwinFlow />
      <div className="mt-4">
        <RevenueChart />
      </div>
    </>
  );
}
