"use client";

import { PageHeader } from "@/components/erp/page-header";
import { LoadingState } from "@/components/ui/states";
import { useInventoryTransactions } from "@/hooks/use-erp";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, ArrowDown, ArrowUp, ArrowLeftRight } from "react-bootstrap-icons";

export default function InventoryTimelinePage() {
  const { data, isLoading } = useInventoryTransactions();

  if (isLoading || !data) return <LoadingState />;

  // Take first 25 recent items for display in the timeline
  const timelineItems = data.slice(0, 25);

  return (
    <>
      <PageHeader 
        eyebrow="Inventory" 
        title="Stock Movement Timeline" 
        description="A real-time visual feed of all material transfers, issues, and receiving tasks across Plant A facilities."
        action="Filter Locations"
      />

      <div className="max-w-3xl mx-auto mt-6">
        <div className="relative border-l-2 border-[var(--border)] ml-4 pl-8 space-y-8 py-2">
          {timelineItems.map((item) => {
            const isPositive = item.quantity > 0;
            const Icon = item.type === "Receipt" ? ArrowDown : item.type === "Issue" ? ArrowUp : ArrowLeftRight;
            const iconColor = item.type === "Receipt" ? "text-emerald-500 bg-emerald-500/10" : item.type === "Issue" ? "text-rose-500 bg-rose-500/10" : "text-amber-500 bg-amber-500/10";
            
            return (
              <div key={item.id} className="relative">
                {/* Node Dot */}
                <div className={`absolute -left-[45px] top-1.5 h-7 w-7 rounded-full flex items-center justify-center border border-[var(--border)] bg-[var(--surface)] shadow-sm ${iconColor}`}>
                  <Icon className="h-3.5 w-3.5" />
                </div>

                {/* Timeline Card */}
                <Card className="hover:shadow-md transition">
                  <CardContent className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-[var(--foreground)]">{item.product}</span>
                        <Badge tone={item.type === "Receipt" ? "success" : item.type === "Issue" ? "primary" : "warning"}>
                          {item.type}
                        </Badge>
                      </div>
                      <div className="text-xs text-[var(--muted)] mt-1 flex items-center gap-2">
                        <span>Location: <strong>{item.location}</strong></span>
                        <span>•</span>
                        <span>TX: <strong>{item.id}</strong></span>
                      </div>
                    </div>
                    
                    <div className="flex sm:flex-col items-end gap-2 text-right">
                      <span className={`text-base font-black ${isPositive ? "text-emerald-500" : "text-rose-500"}`}>
                        {isPositive ? `+${item.quantity}` : item.quantity} Units
                      </span>
                      <span className="text-[10px] text-[var(--muted)] flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {item.timestamp}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
