import { CheckCircle2, Timer } from "@/components/icons";
import { PageHeader } from "@/components/erp/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function WorkOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <>
      <PageHeader eyebrow="Work Order" title={id.toUpperCase()} description="Status stepper, component checklist, production notes, time tracking, QC requirements, and digital twin placeholder." action="Complete Stage" />
      <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
        <Card className="p-5">
          <h3 className="text-xl font-bold">Production Checklist</h3>
          <div className="mt-4 space-y-3">
            {["Components staged", "Assembly torque verified", "Painting inspection", "QC dimensional scan"].map((item, index) => (
              <div key={item} className="flex items-center gap-3 rounded-[8px] border border-[var(--border)] p-3">
                <CheckCircle2 className={`h-5 w-5 ${index < 2 ? "text-[var(--success)]" : "text-[var(--muted)]"}`} />
                <span className="font-semibold">{item}</span>
                <Badge className="ml-auto" tone={index < 2 ? "success" : "neutral"}>{index < 2 ? "Done" : "Open"}</Badge>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-5">
          <div className="grid min-h-80 place-items-center rounded-[8px] bg-[radial-gradient(circle,var(--primary-soft),var(--surface-muted))]">
            <div className="text-center">
              <Timer className="mx-auto h-14 w-14 text-[var(--primary)]" />
              <h3 className="mt-3 text-xl font-bold">Digital Twin Render</h3>
              <p className="mt-2 text-sm text-[var(--muted)]">3D-ready panel reserved for product visualization.</p>
              <Button className="mt-4">Start Timer</Button>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
