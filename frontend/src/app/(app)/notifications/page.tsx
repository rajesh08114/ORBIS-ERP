import { Bell } from "@/components/icons";
import { PageHeader } from "@/components/erp/page-header";
import { Card } from "@/components/ui/card";

export default function NotificationsPage() {
  return (
    <>
      <PageHeader eyebrow="Notifications" title="Notification Center" description="Operational alerts, approvals, procurement warnings, and system events." />
      <div className="space-y-3">
        {["PO approval required", "QC queue above target", "Inventory shortage predicted", "Vendor SLA restored"].map((item) => (
          <Card key={item} className="flex items-center gap-3 p-4">
            <Bell className="h-5 w-5 text-[var(--primary)]" />
            <span className="font-semibold">{item}</span>
          </Card>
        ))}
      </div>
    </>
  );
}
