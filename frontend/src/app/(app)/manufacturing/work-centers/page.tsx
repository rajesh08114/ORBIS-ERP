import { Activity, Camera, Factory } from "@/components/icons";
import { PageHeader } from "@/components/erp/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const centers = ["CNC Station A", "Manual Assembly 4", "Painting Booth 2", "QC Lab", "Packaging Cell"];

export default function WorkCentersPage() {
  return (
    <>
      <PageHeader eyebrow="Manufacturing" title="Work Centers" description="Live station monitoring, load visualization, camera feeds, and shift logs." action="Add Center" />
      <div className="grid gap-4 lg:grid-cols-2">
        {centers.map((center, index) => (
          <Card key={center} className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Factory className="h-5 w-5 text-[var(--primary)]" />
                  <h3 className="text-lg font-bold">{center}</h3>
                </div>
                <p className="mt-2 text-sm text-[var(--muted)]">WO-{8842 + index} currently assigned. Load is monitored in real time.</p>
              </div>
              <Badge tone={index === 2 ? "danger" : "success"}>{index === 2 ? "Watch" : "Online"}</Badge>
            </div>
            <div className="mt-4 h-2 rounded-full bg-[var(--surface-muted)]">
              <div className="h-2 rounded-full bg-[var(--primary-strong)]" style={{ width: `${64 + index * 7}%` }} />
            </div>
            <div className="mt-4 flex gap-2">
              <Button variant="secondary"><Camera className="h-4 w-4" /> Live Feed</Button>
              <Button variant="ghost"><Activity className="h-4 w-4" /> Shift Log</Button>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
