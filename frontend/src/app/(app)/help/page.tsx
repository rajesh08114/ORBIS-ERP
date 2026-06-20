import { HelpCircle } from "@/components/icons";
import { PageHeader } from "@/components/erp/page-header";
import { Card } from "@/components/ui/card";

export default function HelpPage() {
  return (
    <>
      <PageHeader eyebrow="Support" title="Help Center" description="Workflow guidance, release notes, keyboard shortcuts, and backend integration notes." />
      <div className="grid gap-4 md:grid-cols-3">
        {["Command Palette", "Receiving Workflow", "Manufacturing Kanban", "Audit Controls", "Dark Mode", "Backend Integration"].map((topic) => (
          <Card key={topic} className="p-4">
            <HelpCircle className="h-5 w-5 text-[var(--primary)]" />
            <h3 className="mt-3 font-bold">{topic}</h3>
            <p className="mt-2 text-sm text-[var(--muted)]">Operational guide and implementation reference.</p>
          </Card>
        ))}
      </div>
    </>
  );
}
