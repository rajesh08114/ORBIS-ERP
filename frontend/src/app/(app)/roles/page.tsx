"use client";

import { useState } from "react";
import { PageHeader } from "@/components/erp/page-header";
import { toast } from "sonner";
import { Info } from "@/components/icons";

type AccessState = "granted" | "denied" | "optional";

interface RBACRow {
  id: string;
  module: string;
  action: string;
  admin: AccessState;
  user: AccessState;
  group: AccessState;
}

const initialData: RBACRow[] = [
  { id: "s1", module: "Sales", action: "View", admin: "granted", user: "denied", group: "optional" },
  { id: "s2", module: "Sales", action: "Create", admin: "granted", user: "denied", group: "granted" },
  { id: "s3", module: "Sales", action: "Edit", admin: "granted", user: "optional", group: "granted" },
  { id: "s4", module: "Sales", action: "Delete", admin: "granted", user: "granted", group: "granted" },
  { id: "s5", module: "Sales", action: "Approve/Confirm", admin: "granted", user: "granted", group: "granted" },
  
  { id: "p1", module: "Purchase", action: "View", admin: "granted", user: "denied", group: "optional" },
  { id: "p2", module: "Purchase", action: "Approve", admin: "granted", user: "granted", group: "granted" },
  { id: "p3", module: "Purchase", action: "Create", admin: "granted", user: "optional", group: "granted" },
  
  { id: "m1", module: "Manufacturing", action: "Production Entry", admin: "granted", user: "denied", group: "granted" },
  { id: "m2", module: "Manufacturing", action: "Edit BOM", admin: "granted", user: "granted", group: "granted" },
  { id: "m3", module: "Manufacturing", action: "View", admin: "granted", user: "denied", group: "optional" },
  
  { id: "pr1", module: "Product", action: "View", admin: "granted", user: "denied", group: "optional" },
  { id: "pr2", module: "Product", action: "Create", admin: "granted", user: "denied", group: "granted" },
];

export default function RolesPermissionsPage() {
  const [rbac, setRbac] = useState<RBACRow[]>(initialData);

  const toggleAccess = (id: string, col: "admin" | "user" | "group") => {
    setRbac((prev) => 
      prev.map((row) => {
        if (row.id === id) {
          const current = row[col];
          const nextState: AccessState = 
            current === "granted" ? "denied" : 
            current === "denied" ? "optional" : "granted";
            
          toast.success(`Permission updated for ${row.module} ${row.action}`);
          return { ...row, [col]: nextState };
        }
        return row;
      })
    );
  };

  const renderBadge = (state: AccessState, id: string, col: "admin" | "user" | "group") => {
    let content = "";
    let colorClass = "";

    if (state === "granted") {
      content = "[ ✓ ]";
      colorClass = "text-emerald-500 font-bold";
    } else if (state === "denied") {
      content = "[ ✕ ]";
      colorClass = "text-rose-500 font-bold";
    } else {
      content = "[ Optional ]";
      colorClass = "text-slate-400 font-medium";
    }

    return (
      <button 
        type="button"
        onClick={() => toggleAccess(id, col)}
        className={`hover:opacity-70 transition cursor-pointer px-2 py-1 rounded bg-transparent ${colorClass}`}
      >
        {content}
      </button>
    );
  };

  return (
    <>
      <PageHeader 
        eyebrow="Admin / IAM" 
        title="Granular Access Clearance Matrix" 
        description="Configure precise Action-based RBAC overrides across all system modules." 
      />

      <div className="grid gap-6">
        <div className="p-5 border border-[var(--border)] bg-[#101010] rounded-[16px] shadow-2xl overflow-hidden font-mono text-sm">
          <div className="flex gap-3.5 items-start bg-slate-900 border border-slate-800 rounded-[8px] p-4 mb-6 text-sm text-slate-400">
            <Info className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white">Granular Permission Matrix</strong>
              <p className="mt-1 leading-relaxed">
                Click any bracket to cycle permissions between <span className="text-emerald-500 font-bold">[ ✓ ]</span> (Granted), <span className="text-rose-500 font-bold">[ ✕ ]</span> (Denied), and <span className="text-slate-400">[ Optional ]</span> (Conditional Access). Changes take effect instantly.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[600px] border-collapse">
              <thead className="border-y border-slate-700 text-slate-300">
                <tr>
                  <th className="py-3 px-4 border-x border-slate-700">Module</th>
                  <th className="py-3 px-4 border-r border-slate-700">Action</th>
                  <th className="py-3 px-4 border-r border-slate-700 text-center w-28">Admin</th>
                  <th className="py-3 px-4 border-r border-slate-700 text-center w-28">User</th>
                  <th className="py-3 px-4 border-r border-slate-700 text-center w-32">Group</th>
                </tr>
              </thead>
              <tbody>
                {rbac.map((row, idx) => (
                  <tr key={row.id} className="border-b border-slate-800/60 hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-4 border-x border-slate-700 text-slate-200 font-semibold">{row.module}</td>
                    <td className="py-2.5 px-4 border-r border-slate-700 text-slate-400">{row.action}</td>
                    <td className="py-1 px-4 border-r border-slate-700 text-center">
                      {renderBadge(row.admin, row.id, "admin")}
                    </td>
                    <td className="py-1 px-4 border-r border-slate-700 text-center">
                      {renderBadge(row.user, row.id, "user")}
                    </td>
                    <td className="py-1 px-4 border-r border-slate-700 text-center">
                      {renderBadge(row.group, row.id, "group")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
