"use client";

import Link from "next/link";
import { useErpStore } from "@/stores/erp-store";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { ChevronRight } from "@/components/icons";
import type { WorkOrder } from "@/types/erp";

const stages = ["Draft", "Assembly", "Painting", "Quality Check", "Packaging", "Completed"];

export function ManufacturingKanban({ workOrders }: { workOrders: WorkOrder[] }) {
  const updateWorkOrderStage = useErpStore((state) => state.updateWorkOrderStage);

  const handleAdvance = (e: React.MouseEvent, order: WorkOrder) => {
    e.preventDefault();
    e.stopPropagation();
    const currentIdx = stages.indexOf(order.stage);
    if (currentIdx === -1 || order.stage === "Completed") return;
    const nextStage = stages[currentIdx + 1];
    const progress = Math.min(100, Math.round(((currentIdx + 1) / (stages.length - 1)) * 100));
    
    updateWorkOrderStage(order.id, nextStage, progress);
    
    if (nextStage === "Completed") {
      toast.success(`Production completed for ${order.product}!`);
    } else {
      toast.success(`Advanced ${order.id} to ${nextStage}`);
    }
  };

  return (
    <div className="grid gap-3 xl:grid-cols-6 overflow-x-auto pb-4">
      {stages.map((stage) => {
        const stageOrders = workOrders.filter((order) => order.stage === stage);
        return (
          <Card key={stage} className="min-h-80 p-3 flex flex-col bg-[var(--surface)] border-[var(--border)] min-w-[200px]">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase text-[var(--muted)]">{stage}</h3>
              <Badge tone={stage === "Completed" ? "success" : "neutral"}>{stageOrders.length}</Badge>
            </div>
            <div className="space-y-3 flex-1 overflow-y-auto max-h-[600px] app-scrollbar pr-1">
              {stageOrders.map((order) => (
                <div 
                  key={order.id} 
                  className="group relative rounded-[8px] border border-[var(--border)] bg-[var(--surface-muted)] p-3 hover:bg-[var(--surface-raised)] hover:border-[var(--primary-soft)] transition cursor-pointer"
                >
                  <Link href={`/manufacturing/orders/${order.id}`}>
                    <div className="text-[10px] font-bold text-[var(--muted)]">{order.id}</div>
                    <div className="mt-1 text-xs font-bold text-[var(--foreground)] line-clamp-2">{order.product}</div>
                    <div className="mt-3 h-1.5 rounded-full bg-[var(--surface-raised)] overflow-hidden">
                      <div className="h-full rounded-full bg-[var(--primary)]" style={{ width: `${order.progress}%` }} />
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[10px] text-[var(--muted)]">
                      <span className="truncate max-w-[100px]">{order.workCenter}</span>
                      <span>{order.progress}%</span>
                    </div>
                  </Link>

                  {stage !== "Completed" && (
                    <button
                      onClick={(e) => handleAdvance(e, order)}
                      className="absolute bottom-2 right-2 p-1 rounded-md bg-[var(--primary)] text-white opacity-0 group-hover:opacity-100 transition shadow hover:bg-[var(--primary-strong)] flex items-center justify-center border-0 cursor-pointer"
                      title={`Advance to ${stages[stages.indexOf(stage) + 1]}`}
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
              {stageOrders.length === 0 && (
                <div className="h-24 flex items-center justify-center border border-dashed border-[var(--border)] rounded-[8px] text-[10px] text-[var(--muted)]">
                  Empty stage
                </div>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

