import { QrCode, ScanLine } from "@/components/icons";
import { PageHeader } from "@/components/erp/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function PurchaseReceiptPage() {
  return (
    <>
      <PageHeader eyebrow="Receiving" title="Receive Items" description="Scan, validate, receive, quarantine, and post inventory from purchase orders." action="Post Receipt" />
      <Card className="p-5">
        <div className="grid gap-4 lg:grid-cols-[0.7fr_1.3fr]">
          <div className="grid min-h-80 place-items-center rounded-[8px] border border-dashed border-[var(--border)] bg-[var(--surface-muted)]">
            <div className="text-center">
              <QrCode className="mx-auto h-16 w-16 text-[var(--primary)]" />
              <p className="mt-3 text-sm font-semibold">Ready to scan PO labels</p>
            </div>
          </div>
          <div className="space-y-3">
            {["Titanium Housing", "Optical Sensor Array", "Packaging Inserts"].map((item) => (
              <div key={item} className="flex items-center justify-between rounded-[8px] border border-[var(--border)] p-4">
                <div>
                  <div className="font-semibold">{item}</div>
                  <div className="text-sm text-[var(--muted)]">Expected 120 units, QC required</div>
                </div>
                <Button variant="secondary"><ScanLine className="h-4 w-4" /> Scan</Button>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </>
  );
}
