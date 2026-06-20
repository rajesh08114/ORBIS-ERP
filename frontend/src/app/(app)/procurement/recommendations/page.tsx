import { Bot, Clock, DollarSign, TriangleAlert } from "@/components/icons";
import { PageHeader } from "@/components/erp/page-header";
import { MetricCard } from "@/components/erp/metric-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ProcurementRecommendationsPage() {
  return (
    <>
      <PageHeader eyebrow="AI Procurement" title="Procurement Recommendations" description="Supplier comparisons, best-price recommendations, lead-time alerts, and queue backlog." action="Apply Recommendation" />
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Savings Found" value="$248K" trend="Best price" icon={DollarSign} tone="success" />
        <MetricCard label="Lead Time Risk" value="8" trend="Watch" icon={Clock} tone="warning" />
        <MetricCard label="Critical Shortages" value="3" trend="Act now" icon={TriangleAlert} tone="danger" />
        <MetricCard label="AI Confidence" value="94%" trend="High" icon={Bot} tone="info" />
      </div>
      <Card className="mt-4 p-5">
        <h3 className="text-xl font-bold">Titanium Alloy Housing - Unit A4</h3>
        <p className="mt-2 text-sm text-[var(--muted)]">Recommend split sourcing across Titanium Corp and Apex Materials to reduce lead-time risk while preserving target margin.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button>Generate PO</Button>
          <Button variant="secondary">Compare Vendors</Button>
          <Button variant="secondary">Dismiss</Button>
        </div>
      </Card>
    </>
  );
}
