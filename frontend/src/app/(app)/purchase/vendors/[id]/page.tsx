import { PageHeader } from "@/components/erp/page-header";
import { OperationsBarChart } from "@/components/erp/charts";
import { Card } from "@/components/ui/card";

export default async function VendorProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <>
      <PageHeader eyebrow="Vendor Profile" title={id.toUpperCase()} description="Reliability rating, active orders, account manager, supply performance, and contract health." action="Create PO" />
      <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <Card className="p-5">
          <h3 className="text-xl font-bold">Titanium Corp</h3>
          <p className="mt-2 text-sm text-[var(--muted)]">Strategic metals supplier with 94% reliability and 8-day average lead time.</p>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-[8px] bg-[var(--surface-muted)] p-3"><b>Rating</b><br />94%</div>
            <div className="rounded-[8px] bg-[var(--surface-muted)] p-3"><b>Spend</b><br />$1.2M</div>
          </div>
        </Card>
        <OperationsBarChart />
      </div>
    </>
  );
}
