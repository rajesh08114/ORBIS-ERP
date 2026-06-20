import { PageHeader } from "@/components/erp/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/field";

export default function NewProductPage() {
  return (
    <>
      <PageHeader eyebrow="Product Master" title="Create Product" description="Create a new SKU with costing, category, inventory policy, and procurement routing." action="Import CSV" />
      <Card className="max-w-3xl p-5">
        <div className="grid gap-4 md:grid-cols-2">
          <Input placeholder="Product name" />
          <Input placeholder="SKU" />
          <Select><option>Drone Components</option><option>Raw Materials</option></Select>
          <Input placeholder="Unit cost" />
          <Textarea className="md:col-span-2" placeholder="Description" />
          <Button>Create Product</Button>
        </div>
      </Card>
    </>
  );
}
