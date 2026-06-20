import { PageHeader } from "@/components/erp/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <>
      <PageHeader eyebrow="Product Detail" title={id.toUpperCase()} description="Product details, inventory posture, BOM links, procurement rules, and transaction history." action="Edit Product" />
      <div className="grid gap-4 lg:grid-cols-3">
        {["Overview", "Inventory", "Procurement", "BOM Usage", "Transactions", "Risk"].map((item) => (
          <Card key={item} className="p-4">
            <h3 className="font-bold">{item}</h3>
            <Badge tone="success" className="mt-3">Ready</Badge>
            <p className="mt-3 text-sm text-[var(--muted)]">Production-ready detail section for this product surface.</p>
          </Card>
        ))}
      </div>
    </>
  );
}
