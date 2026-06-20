"use client";

import { useState, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/erp/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";
import { LoadingState } from "@/components/ui/states";
import { useAuditEntries, useAuditSummary } from "@/hooks/use-erp";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { ChevronLeft, ChevronRight, Filter, ArrowRepeat } from "@/components/icons";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid, 
  PieChart, 
  Pie, 
  Cell 
} from "recharts";

const COLORS: Record<string, string> = {
  Created: "#10b981", // Emerald-500
  Updated: "#f59e0b", // Amber-500
  Deleted: "#ef4444", // Rose-500
  Toggled_status: "#6366f1", // Indigo-500
  Default: "#3b82f6", // Blue-500
};

function AuditLogsList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Read initial query params
  const paramModule = searchParams.get("entity_type") || "";
  const paramEntityId = searchParams.get("entity_id") || "";

  // State filters
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedModule, setSelectedModule] = useState(paramModule);
  const [selectedAction, setSelectedAction] = useState("");
  const [entityIdSearch, setEntityIdSearch] = useState(paramEntityId);
  const [page, setPage] = useState(1);

  // Fetch summary metrics
  const { data: summary, isLoading: summaryLoading } = useAuditSummary();

  // Fetch users for filter dropdown
  const { data: usersData } = useQuery({
    queryKey: ["usersList"],
    queryFn: () => apiClient<any>("users/").catch(() => null)
  });
  const users = usersData?.results || [];

  // Build query params
  const queryParams = useMemo(() => {
    return {
      page,
      actor: selectedUser,
      entity_type: selectedModule,
      action: selectedAction,
      entity_id: entityIdSearch,
      start_date: startDate,
      end_date: endDate,
    };
  }, [page, selectedUser, selectedModule, selectedAction, entityIdSearch, startDate, endDate]);

  // Fetch paginated audit entries
  const { data: entriesResponse, isLoading: entriesLoading, refetch } = useAuditEntries(queryParams);

  const handleReset = () => {
    setStartDate("");
    setEndDate("");
    setSelectedUser("");
    setSelectedModule("");
    setSelectedAction("");
    setEntityIdSearch("");
    setPage(1);
    router.push("/audit-logs");
  };

  const handleFilter = () => {
    setPage(1);
    refetch();
  };

  const totals = summary?.totals || {};
  const byAction = summary?.by_action || {};

  // Formatted counts for KPI cards
  const totalLogs = totals.audit_entries || 0;
  const createCount = byAction.created || byAction.Created || 0;
  const updateCount = byAction.updated || byAction.Updated || 0;
  const deleteCount = byAction.deleted || byAction.Deleted || 0;

  const entries = entriesResponse?.results || [];
  const totalCount = entriesResponse?.count || 0;
  const pageSize = 25;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  // Prepare chart data
  const timelineData = useMemo(() => {
    return (summary?.timeline || []).map((item: any) => ({
      date: item.date,
      Events: item.count,
    }));
  }, [summary?.timeline]);

  const actionData = useMemo(() => {
    return Object.entries(byAction).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value: Number(value),
    }));
  }, [byAction]);

  if (summaryLoading || entriesLoading) return <LoadingState />;

  return (
    <>
      <PageHeader 
        eyebrow="Governance" 
        title="Audit Logs" 
        description="Comprehensive audit trail of entity modifications, field values, and user access history."
      />

      {/* KPI Stats cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card className="p-4 border-l-4 border-blue-500 bg-[var(--surface)] border-[var(--border)] rounded-[12px] flex flex-col justify-between h-24">
          <span className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider">Total Logs</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-3xl font-extrabold text-blue-500">{totalLogs}</span>
            <span className="text-[10px] font-semibold text-[var(--muted)]">All time logs</span>
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-emerald-500 bg-[var(--surface)] border-[var(--border)] rounded-[12px] flex flex-col justify-between h-24">
          <span className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider">Create Actions</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-3xl font-extrabold text-emerald-500">{createCount}</span>
            <span className="text-[10px] font-semibold text-[var(--muted)]">Records Created</span>
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-amber-500 bg-[var(--surface)] border-[var(--border)] rounded-[12px] flex flex-col justify-between h-24">
          <span className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider">Update Actions</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-3xl font-extrabold text-amber-500">{updateCount}</span>
            <span className="text-[10px] font-semibold text-[var(--muted)]">Records Updated</span>
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-rose-500 bg-[var(--surface)] border-[var(--border)] rounded-[12px] flex flex-col justify-between h-24">
          <span className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider">Delete Actions</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-3xl font-extrabold text-rose-500">{deleteCount}</span>
            <span className="text-[10px] font-semibold text-[var(--muted)]">Records Deleted</span>
          </div>
        </Card>
      </div>

      {/* Chart Section */}
      <div className="grid gap-6 md:grid-cols-2 mb-6">
        {/* Activity Timeline Area Chart */}
        <Card className="p-5 border-[var(--border)] bg-[var(--surface)] rounded-[12px] flex flex-col h-80">
          <div>
            <h3 className="text-sm font-bold text-[var(--foreground)]">Audit Activity Timeline</h3>
            <p className="text-[11px] text-[var(--muted)] mb-3">Governance events count by date</p>
          </div>
          <div className="flex-1 min-h-0">
            {timelineData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-[var(--muted)]">
                No activity data to chart.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorEvents" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="5%" stopColor="var(--chart-1, #3b82f6)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--chart-1, #3b82f6)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" stroke="var(--muted)" fontSize={10} tickLine={false} />
                  <YAxis stroke="var(--muted)" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 11 }}
                    labelStyle={{ fontWeight: "bold", color: "var(--foreground)" }}
                  />
                  <Area type="monotone" dataKey="Events" stroke="var(--chart-1, #3b82f6)" fill="url(#colorEvents)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        {/* Action Breakdown Pie Chart */}
        <Card className="p-5 border-[var(--border)] bg-[var(--surface)] rounded-[12px] flex flex-col h-80">
          <div>
            <h3 className="text-sm font-bold text-[var(--foreground)]">Action Distribution</h3>
            <p className="text-[11px] text-[var(--muted)] mb-3">Distribution of operations by type</p>
          </div>
          <div className="flex-1 min-h-0 flex items-center justify-center">
            {actionData.length === 0 ? (
              <span className="text-xs text-[var(--muted)]">No operations logged yet.</span>
            ) : (
              <div className="w-full h-full flex flex-row items-center justify-between gap-4">
                <div className="w-1/2 h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={actionData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {actionData.map((entry, index) => {
                          const actionKey = entry.name;
                          const fill = COLORS[actionKey] || COLORS.Default;
                          return <Cell key={`cell-${index}`} fill={fill} />;
                        })}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 11 }}
                        itemStyle={{ color: "var(--foreground)" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-1/2 flex flex-col gap-2 max-h-full overflow-y-auto pr-2">
                  {actionData.map((entry) => {
                    const actionKey = entry.name;
                    const fill = COLORS[actionKey] || COLORS.Default;
                    return (
                      <div key={entry.name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: fill }} />
                          <span className="text-[var(--foreground)] font-semibold truncate">{entry.name}</span>
                        </div>
                        <span className="text-[var(--muted)] font-mono">{entry.value}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Filters bar */}
      <Card className="p-4 mb-6 border-[var(--border)] bg-[var(--surface-muted)] rounded-[12px] flex flex-col gap-4">
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-6 items-end">
          <div className="grid gap-1">
            <span className="text-xs font-bold text-[var(--muted)] uppercase">Start Date</span>
            <Input 
              type="date" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)} 
              className="h-9 text-xs"
            />
          </div>

          <div className="grid gap-1">
            <span className="text-xs font-bold text-[var(--muted)] uppercase">End Date</span>
            <Input 
              type="date" 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)} 
              className="h-9 text-xs"
            />
          </div>

          <div className="grid gap-1">
            <span className="text-xs font-bold text-[var(--muted)] uppercase">User</span>
            <Select 
              value={selectedUser} 
              onChange={(e) => setSelectedUser(e.target.value)}
              className="h-9 text-xs"
            >
              <option value="">All Users</option>
              {users.map((u: any) => (
                <option key={u.id} value={u.id}>
                  {u.first_name || u.last_name ? `${u.first_name} ${u.last_name}`.trim() : u.username}
                </option>
              ))}
            </Select>
          </div>

          <div className="grid gap-1">
            <span className="text-xs font-bold text-[var(--muted)] uppercase">Module</span>
            <Select 
              value={selectedModule} 
              onChange={(e) => setSelectedModule(e.target.value)}
              className="h-9 text-xs"
            >
              <option value="">All Modules</option>
              <option value="SalesOrder">Sales Orders</option>
              <option value="SalesOrderLine">Sales Order Lines</option>
              <option value="PurchaseOrder">Purchase Orders</option>
              <option value="PurchaseOrderLine">Purchase Order Lines</option>
              <option value="Product">Products</option>
              <option value="Customer">Customers</option>
              <option value="Vendor">Vendors</option>
              <option value="User">Users</option>
              <option value="BillOfMaterial">Bills of Material</option>
              <option value="ManufacturingOrder">Manufacturing Orders</option>
            </Select>
          </div>

          <div className="grid gap-1">
            <span className="text-xs font-bold text-[var(--muted)] uppercase">Action</span>
            <Select 
              value={selectedAction} 
              onChange={(e) => setSelectedAction(e.target.value)}
              className="h-9 text-xs"
            >
              <option value="">All Actions</option>
              <option value="created">Created</option>
              <option value="updated">Updated</option>
              <option value="deleted">Deleted</option>
              <option value="confirmed">Confirmed</option>
              <option value="delivered">Delivered</option>
              <option value="received">Received</option>
            </Select>
          </div>

          <div className="grid gap-1">
            <span className="text-xs font-bold text-[var(--muted)] uppercase">Record ID</span>
            <Input 
              type="text" 
              placeholder="e.g. 23"
              value={entityIdSearch} 
              onChange={(e) => setEntityIdSearch(e.target.value)} 
              className="h-9 text-xs"
            />
          </div>
        </div>

        <div className="flex gap-2 justify-end border-t border-[var(--border)] pt-3">
          <Button variant="primary" onClick={handleFilter} className="h-8 text-xs px-4">
            <Filter className="h-3.5 w-3.5 mr-1" /> Filter
          </Button>
          <Button variant="secondary" onClick={handleReset} className="h-8 text-xs px-4">
            <ArrowRepeat className="h-3.5 w-3.5 mr-1" /> Reset
          </Button>
        </div>
      </Card>

      {/* Audit Log table */}
      <div className="overflow-hidden rounded-[8px] border border-[var(--border)] bg-[var(--surface)]">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-[var(--surface-muted)] text-left text-xs uppercase text-[var(--muted)]">
              <tr>
                <th className="px-4 py-3 font-semibold">Date & Time</th>
                <th className="px-4 py-3 font-semibold">User</th>
                <th className="px-4 py-3 font-semibold">Module</th>
                <th className="px-4 py-3 font-semibold">Record ID</th>
                <th className="px-4 py-3 font-semibold">Action</th>
                <th className="px-4 py-3 font-semibold">Field Changed</th>
                <th className="px-4 py-3 font-semibold">Old Value</th>
                <th className="px-4 py-3 font-semibold">New Value</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry: any) => {
                const actionStr = entry.action || "";
                let badgeTone: "info" | "success" | "warning" | "danger" = "info";
                if (actionStr === "created") badgeTone = "success";
                if (actionStr === "updated" || actionStr === "status_changed") badgeTone = "warning";
                if (actionStr === "deleted") badgeTone = "danger";

                return (
                  <tr key={entry.id} className="border-t border-[var(--border)] hover:bg-[var(--surface-muted)] transition">
                    <td className="px-4 py-3 align-middle whitespace-nowrap text-xs text-[var(--muted)]">
                      {new Date(entry.timestamp).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 align-middle font-medium">
                      {entry.actor_name || "System"}
                    </td>
                    <td className="px-4 py-3 align-middle font-semibold text-xs text-[var(--muted)]">
                      {entry.entity_type}
                    </td>
                    <td className="px-4 py-3 align-middle font-mono text-xs">
                      #{entry.entity_id}
                    </td>
                    <td className="px-4 py-3 align-middle">
                      <Badge tone={badgeTone}>{entry.action}</Badge>
                    </td>
                    <td className="px-4 py-3 align-middle font-semibold text-xs text-amber-600">
                      {entry.field_name || "-"}
                    </td>
                    <td className="px-4 py-3 align-middle text-xs truncate max-w-[120px]" title={entry.old_value}>
                      {entry.old_value !== null ? String(entry.old_value) : "-"}
                    </td>
                    <td className="px-4 py-3 align-middle text-xs truncate max-w-[120px] font-medium" title={JSON.stringify(entry.new_value)}>
                      {entry.new_value !== null ? (typeof entry.new_value === "object" ? JSON.stringify(entry.new_value) : String(entry.new_value)) : "-"}
                    </td>
                  </tr>
                );
              })}
              {entries.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-[var(--muted)] font-medium">
                    No matching audit entries found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        <div className="flex items-center justify-between border-t border-[var(--border)] px-4 py-3 text-sm text-[var(--muted)] bg-[var(--surface-muted)]">
          <span>
            Page {page} of {totalPages} ({totalCount} total events)
          </span>
          <div className="flex gap-2">
            <Button 
              variant="secondary" 
              size="icon" 
              onClick={() => setPage(p => Math.max(1, p - 1))} 
              disabled={page <= 1}
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button 
              variant="secondary" 
              size="icon" 
              onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
              disabled={page >= totalPages}
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

export default function AuditLogsPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <AuditLogsList />
    </Suspense>
  );
}
