"use client";

import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useErpStore } from "@/stores/erp-store";
import { PageHeader } from "@/components/erp/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2, AlertTriangle, ShieldCheck, Factory, Play, ChevronRight } from "@/components/icons";
import { formatCurrency } from "@/lib/utils";

const stages = ["Draft", "Assembly", "Painting", "Quality Check", "Packaging", "Completed"];

export default function ManufacturingOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  
  const orderId = id.toUpperCase();
  const workOrders = useErpStore((state) => state.workOrders);
  const updateWorkOrderStage = useErpStore((state) => state.updateWorkOrderStage);
  const boms = useErpStore((state) => state.boms);

  const wo = workOrders.find((w) => w.id === orderId);
  
  if (!wo) {
    return (
      <div className="p-8 text-center max-w-md mx-auto">
        <AlertTriangle className="h-12 w-12 text-[var(--danger)] mx-auto mb-4" />
        <h3 className="text-xl font-bold">Manufacturing Order Not Found</h3>
        <p className="text-sm text-[var(--muted)] mt-2">The manufacturing order with ID {orderId} could not be located in our records.</p>
        <Link href="/manufacturing/orders">
          <Button className="mt-6"><ArrowLeft className="h-4 w-4 mr-2" /> Back to Queue</Button>
        </Link>
      </div>
    );
  }

  // Find linked BOM
  const linkedBom = boms.find((b) => b.product.toLowerCase().includes(wo.product.toLowerCase()) || wo.product.toLowerCase().includes(b.product.toLowerCase()));

  const currentStageIdx = stages.indexOf(wo.stage);
  const isCompleted = wo.stage === "Completed";
  
  const handleAdvanceStage = () => {
    if (isCompleted) return;
    const nextStageIdx = currentStageIdx + 1;
    const nextStage = stages[nextStageIdx];
    // Calculate simulated progress
    const progress = Math.min(100, Math.round((nextStageIdx / (stages.length - 1)) * 100));
    
    updateWorkOrderStage(wo.id, nextStage, progress);
    
    if (nextStage === "Completed") {
      toast.success(`Production completed for ${wo.product}. 50 units received into inventory!`);
    } else {
      toast.success(`Order advanced to stage: ${nextStage}`);
    }
  };

  return (
    <>
      <div className="mb-4">
        <Link href="/manufacturing/orders" className="inline-flex items-center gap-2 text-xs font-bold text-[var(--muted)] hover:text-[var(--foreground)] transition">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Production Queue
        </Link>
      </div>

      <PageHeader 
        eyebrow="Manufacturing Order Detail" 
        title={wo.id} 
        description={`Production operation for ${wo.product} executing at ${wo.workCenter}.`}
      />

      <div className="grid gap-6">
        {/* Stage Progression Action Bar */}
        <Card className="p-4 flex flex-wrap gap-3 items-center bg-[var(--surface-muted)] border-[var(--border)] rounded-[12px]">
          <span className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider mr-2">
            Work Order Stage Progression:
          </span>

          {!isCompleted ? (
            <Button onClick={handleAdvanceStage} variant="primary" className="flex items-center gap-2">
              <Play className="h-4 w-4" /> Advance to {stages[currentStageIdx + 1]}
            </Button>
          ) : (
            <div className="flex items-center gap-2 text-emerald-500 font-bold text-sm">
              <CheckCircle2 className="h-5 w-5" /> Manufacturing Stage Complete
            </div>
          )}

          <div className="ml-auto flex items-center gap-3">
            <span className="text-xs text-[var(--muted)]">Priority:</span>
            <Badge tone={wo.priority === "High" ? "danger" : wo.priority === "Medium" ? "warning" : "success"}>
              {wo.priority}
            </Badge>
            <span className="text-xs text-[var(--muted)]">Progress:</span>
            <div className="w-32 bg-[var(--border)] h-2 rounded-full overflow-hidden">
              <div 
                className="bg-[var(--primary)] h-full transition-all duration-300"
                style={{ width: `${wo.progress}%` }}
              />
            </div>
            <span className="text-xs font-semibold">{wo.progress}%</span>
          </div>
        </Card>

        {/* Dynamic Stepper */}
        <Card className="p-5 border-[var(--border)] bg-[var(--surface)]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {stages.map((stage, idx) => {
              const active = idx <= currentStageIdx;
              const current = idx === currentStageIdx;
              return (
                <div key={stage} className="flex items-center gap-2 flex-1 min-w-[120px]">
                  <div className="flex items-center gap-2">
                    <div 
                      className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold transition ${
                        current 
                          ? "bg-[var(--primary)] text-white" 
                          : active 
                          ? "bg-[var(--primary-soft)] text-[var(--primary)]" 
                          : "bg-[var(--surface-muted)] text-[var(--muted)] border border-[var(--border)]"
                      }`}
                    >
                      {idx + 1}
                    </div>
                    <span className={`text-xs font-semibold ${active ? "text-[var(--foreground)]" : "text-[var(--muted)]"}`}>
                      {stage}
                    </span>
                  </div>
                  {idx < stages.length - 1 && <ChevronRight className="h-3 w-3 text-[var(--border)] ml-auto" />}
                </div>
              );
            })}
          </div>
        </Card>

        {/* Content detail columns */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Bill of Material Breakdown */}
          <Card className="lg:col-span-2 p-5 border-[var(--border)] bg-[var(--surface)]">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Factory className="h-5 w-5 text-[var(--primary)]" /> Material Specifications & BOM Rollup
            </h3>
            
            {linkedBom ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                  <div>
                    <span className="text-xs text-[var(--muted)] block">Linked BOM Reference</span>
                    <span className="font-bold text-[var(--primary)]">{linkedBom.id}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-[var(--muted)] block">Calculated Rollup Cost</span>
                    <span className="font-extrabold text-[var(--foreground)]">{formatCurrency(linkedBom.costRollup)}</span>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-[8px] border border-[var(--border)]">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-[var(--surface-muted)] text-[var(--muted)] font-semibold text-left border-b border-[var(--border)]">
                        <th className="p-3">Component Component</th>
                        <th className="p-3 text-right">Required Qty (per Unit)</th>
                        <th className="p-3 text-right">Unit Component Cost</th>
                        <th className="p-3 text-right">Total Standard Cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      {linkedBom.components.map((comp) => (
                        <tr key={comp.name} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-muted)] transition">
                          <td className="p-3 font-semibold">{comp.name}</td>
                          <td className="p-3 text-right">{comp.qty}</td>
                          <td className="p-3 text-right">{formatCurrency(comp.cost)}</td>
                          <td className="p-3 text-right font-bold">{formatCurrency(comp.qty * comp.cost)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider mb-2">Standard Process Routing</h4>
                  <div className="flex flex-wrap gap-2">
                    {linkedBom.routing.map((step, idx) => (
                      <Badge key={step} tone="neutral" className="flex items-center gap-1">
                        <span className="text-[10px] opacity-70">{idx + 1}.</span> {step}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-sm text-[var(--muted)]">
                No Bill of Material definition located for product "{wo.product}".
              </div>
            )}
          </Card>

          {/* Operational logs */}
          <div className="space-y-6">
            <Card className="p-5 border-[var(--border)] bg-[var(--surface)]">
              <h3 className="text-lg font-bold mb-4">Operations Meta</h3>
              <div className="space-y-3.5 text-sm">
                <div>
                  <span className="text-xs text-[var(--muted)] block">Target Assembly</span>
                  <span className="font-semibold">{wo.product}</span>
                </div>
                <div>
                  <span className="text-xs text-[var(--muted)] block">Assigned Station</span>
                  <span className="font-semibold">{wo.workCenter}</span>
                </div>
                <div>
                  <span className="text-xs text-[var(--muted)] block">Clearance Sign-off</span>
                  <span className="flex items-center gap-1.5 text-emerald-500 font-bold mt-0.5">
                    <ShieldCheck className="h-4 w-4" /> Ready for Dispatch
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
