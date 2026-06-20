import { PageHeader } from "@/components/erp/page-header";
import { Card } from "@/components/ui/card";

export default function ProfilePage() {
  return (
    <>
      <PageHeader eyebrow="Profile" title="Alex Morgan" description="User profile, workspace preferences, notification routing, and role details." action="Edit Profile" />
      <Card className="max-w-2xl p-5">
        <h3 className="text-xl font-bold">Head of Operations</h3>
        <p className="mt-2 text-sm text-[var(--muted)]">Full access to executive, manufacturing, procurement, and audit modules.</p>
      </Card>
    </>
  );
}
