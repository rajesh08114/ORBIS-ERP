"use client";

import { Filter, Search, ShieldCheck } from "@/components/icons";
import { AuditTimeline } from "@/components/erp/audit-timeline";
import { PageHeader } from "@/components/erp/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { LoadingState } from "@/components/ui/states";
import { useAuditEvents } from "@/hooks/use-erp";

export default function AuditLogsPage() {
  const { data, isLoading } = useAuditEvents();
  if (isLoading || !data) return <LoadingState />;
  return (
    <>
      <PageHeader eyebrow="Governance" title="Audit Log" description="Timeline, filtering, search, severity, module tracking, and security event visibility." action="Export" />
      <div className="mb-4 flex flex-col gap-3 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-[var(--muted)]" />
          <Input className="pl-9" placeholder="Search audit events" />
        </div>
        <Button variant="secondary"><Filter className="h-4 w-4" /> Filters</Button>
        <Button variant="secondary"><ShieldCheck className="h-4 w-4" /> Security</Button>
      </div>
      <AuditTimeline events={data} />
    </>
  );
}
