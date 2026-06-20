import { ArrowDown, CheckCircle2, Factory, PackageSearch, ShoppingCart, Truck, Warehouse } from "@/components/icons";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const nodes = [
  { label: "Customer Orders", metric: "142 open", icon: ShoppingCart, tone: "success" as const },
  { label: "Inventory", metric: "92% health", icon: PackageSearch, tone: "success" as const },
  { label: "Procurement", metric: "8 risks", icon: Truck, tone: "warning" as const },
  { label: "Manufacturing", metric: "96% OEE", icon: Factory, tone: "success" as const },
  { label: "Warehouse", metric: "3 holds", icon: Warehouse, tone: "warning" as const },
  { label: "Delivery", metric: "98% SLA", icon: CheckCircle2, tone: "success" as const }
];

export function TwinFlow() {
  return (
    <Card className="overflow-hidden bg-[linear-gradient(135deg,var(--surface),var(--surface-muted))] p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold">ORBIS Live Twin</h3>
          <p className="text-sm text-[var(--muted)]">Customer order to delivery, monitored as one operational flow.</p>
        </div>
        <Badge tone="success">Streaming</Badge>
      </div>
      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        {nodes.map((node, index) => {
          const Icon = node.icon;
          return (
            <div key={node.label} className="relative">
              <div className="h-full rounded-[8px] border border-[var(--border)] bg-[var(--surface)] p-4">
                <div className="mb-4 grid h-10 w-10 place-items-center rounded-[8px] bg-[var(--primary-soft)] text-[var(--primary)]">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="font-semibold">{node.label}</div>
                <Badge tone={node.tone} className="mt-3">
                  {node.metric}
                </Badge>
              </div>
              {index < nodes.length - 1 ? <ArrowDown className="mx-auto my-2 h-4 w-4 text-[var(--muted)] xl:absolute xl:-right-2 xl:top-1/2 xl:rotate-[-90deg]" /> : null}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
