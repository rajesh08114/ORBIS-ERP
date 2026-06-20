import { PageHeader } from "@/components/erp/page-header";
import { Card } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/field";

export default function SettingsPage() {
  return (
    <>
      <PageHeader eyebrow="Settings" title="Workspace Settings" description="Company profile, preferences, theme defaults, integrations, and backend readiness." action="Save Changes" />
      <Card className="max-w-3xl p-5">
        <div className="grid gap-4">
          <label className="grid gap-2 text-sm font-semibold">Workspace Name<Input defaultValue="ORBIS ERP" /></label>
          <label className="grid gap-2 text-sm font-semibold">Default Density<Select defaultValue="compact"><option value="compact">Compact</option><option value="comfortable">Comfortable</option></Select></label>
          <label className="grid gap-2 text-sm font-semibold">Region<Select defaultValue="global"><option value="global">Global Operations</option><option value="us">United States</option><option value="in">India</option></Select></label>
        </div>
      </Card>
    </>
  );
}
