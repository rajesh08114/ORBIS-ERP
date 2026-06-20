"use client";

import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef
} from "@tanstack/react-table";
import { ChevronLeft, ChevronRight } from "@/components/icons";
import { Button } from "@/components/ui/button";

export function DataTable<TData>({ data, columns }: { data: TData[]; columns: ColumnDef<TData>[] }) {
  const table = useReactTable({ data, columns, getCoreRowModel: getCoreRowModel(), getPaginationRowModel: getPaginationRowModel() });

  return (
    <div className="overflow-hidden rounded-[8px] border border-[var(--border)] bg-[var(--surface)]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-sm">
          <thead className="bg-[var(--surface-muted)] text-left text-xs uppercase text-[var(--muted)]">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="px-4 py-3 font-semibold">
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="border-t border-[var(--border)] hover:bg-[var(--surface-muted)]">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3 align-middle">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between border-t border-[var(--border)] px-4 py-3 text-sm text-[var(--muted)]">
        <span>
          Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
        </span>
        <div className="flex gap-2">
          <Button variant="secondary" size="icon" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} aria-label="Previous page">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="secondary" size="icon" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} aria-label="Next page">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
