import React from "react";
import { CheckCircle, XCircle } from "@/components/icons";

const PERMISSIONS = [
  { module: "Sales", action: "View", admin: true, user: true, none: "Optional" },
  { module: "Sales", action: "Create", admin: true, user: true, none: false },
  { module: "Sales", action: "Edit", admin: true, user: "Limited", none: false },
  { module: "Sales", action: "Delete", admin: true, user: false, none: false },
  { module: "Sales", action: "Approve(Confirm)", admin: true, user: false, none: false },
  
  { module: "Purchase", action: "View", admin: true, user: true, none: "Optional" },
  { module: "Purchase", action: "Approve", admin: true, user: false, none: false },
  { module: "Purchase", action: "Edit", admin: true, user: "Limited", none: false },
  { module: "Purchase", action: "Create", admin: true, user: true, none: false },

  { module: "Manufacturing", action: "Production Entry", admin: true, user: true, none: false },
  { module: "Manufacturing", action: "Edit BOM", admin: true, user: false, none: false },
  { module: "Manufacturing", action: "View", admin: true, user: true, none: "Optional" },

  { module: "Product", action: "View", admin: true, user: true, none: "Optional" },
  { module: "Product", action: "Create", admin: true, user: true, none: false },
  { module: "Product", action: "Edit", admin: true, user: "Limited", none: false },
];

function StatusCell({ value }: { value: boolean | string }) {
  if (value === true) return (
    <div className="mx-auto flex h-6 w-6 items-center justify-center rounded-[6px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 shadow-sm transition-transform hover:scale-110">
      <CheckCircle className="h-4 w-4 stroke-[3]" />
    </div>
  );
  if (value === false) return (
    <div className="mx-auto flex h-6 w-6 items-center justify-center rounded-[6px] bg-red-500/10 border border-red-500/20 text-red-500 shadow-sm transition-transform hover:scale-110">
      <XCircle className="h-4 w-4 stroke-[3]" />
    </div>
  );
  return (
    <span className="inline-flex items-center justify-center px-2 py-1 text-[9px] font-black uppercase tracking-widest bg-[var(--surface-raised)] border border-[var(--border)] rounded-md text-[var(--muted)] shadow-sm">
      {value}
    </span>
  );
}

export function PermissionsMatrix() {
  return (
    <div className="w-full overflow-x-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)]/60 backdrop-blur-xl shadow-lg">
      <table className="w-full text-left text-sm whitespace-nowrap">
        <thead className="bg-[var(--surface-muted)]/80 border-b border-[var(--border)] backdrop-blur-md">
          <tr>
            <th className="px-5 py-4 font-black text-[var(--primary)] uppercase tracking-widest text-[10px]">Module</th>
            <th className="px-5 py-4 font-black text-[var(--primary)] uppercase tracking-widest text-[10px]">Action</th>
            <th className="px-5 py-4 font-black text-[var(--primary)] uppercase tracking-widest text-[10px] text-center border-l border-[var(--border)]/50">Admin</th>
            <th className="px-5 py-4 font-black text-[var(--primary)] uppercase tracking-widest text-[10px] text-center border-l border-[var(--border)]/50">User</th>
            <th className="px-5 py-4 font-black text-[var(--primary)] uppercase tracking-widest text-[10px] text-center border-l border-[var(--border)]/50">None</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)]/60">
          {PERMISSIONS.map((row, idx) => (
            <tr key={idx} className="hover:bg-[var(--surface-muted)]/40 transition-colors group">
              <td className="px-5 py-3 font-bold text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors">{row.module}</td>
              <td className="px-5 py-3 font-medium text-[var(--muted)] group-hover:text-[var(--foreground)] transition-colors">{row.action}</td>
              <td className="px-5 py-3 text-center border-l border-[var(--border)]/50 bg-[var(--surface-muted)]/10"><StatusCell value={row.admin} /></td>
              <td className="px-5 py-3 text-center border-l border-[var(--border)]/50 bg-[var(--surface-muted)]/10"><StatusCell value={row.user} /></td>
              <td className="px-5 py-3 text-center border-l border-[var(--border)]/50 bg-[var(--surface-muted)]/10"><StatusCell value={row.none} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
