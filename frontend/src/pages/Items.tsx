import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit2, Trash2, Package, Tag } from "lucide-react";
import { itemApi } from "../api/index";
import { Button, Card, Dialog, Input, Select, EmptyState, Spinner, Badge } from "../components/ui/index";
import { RoleGate } from "../components/ui/RoleGate";
import { useForm } from "react-hook-form";
import { formatCurrency } from "../lib/utils";

type FormData = { name: string; type: string; price: string; taxRate: string; category: string };

const TYPE_OPTIONS = [
  { value: "product", label: "Product" },
  { value: "service", label: "Service" },
  { value: "membership", label: "Membership" },
  { value: "subscription", label: "Subscription" },
];

export default function ItemsPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<string>("all");

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["items"],
    queryFn: () => itemApi.list().then(r => r.data),
  });

  const categories = ["all", ...Array.from(new Set((items as any[]).map((i) => i.category || "Uncategorized")))] as string[];

  const filtered: any[] = activeTab === "all" ? items as any[] : (items as any[]).filter((i) => (i.category || "Uncategorized") === activeTab);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>();

  const createMutation = useMutation({
    mutationFn: (data: FormData) => itemApi.create({ ...data, price: parseFloat(data.price), taxRate: parseFloat(data.taxRate || "0") }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["items"] }); setOpen(false); reset(); },
  });

  const updateMutation = useMutation({
    mutationFn: (data: FormData) => itemApi.update(editing.id, { ...data, price: parseFloat(data.price), taxRate: parseFloat(data.taxRate || "0") }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["items"] }); setOpen(false); setEditing(null); reset(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => itemApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["items"] }),
  });

  const openCreate = () => { setEditing(null); reset({ type: "service", taxRate: "18" }); setOpen(true); };
  const openEdit = (i: any) => { setEditing(i); reset({ ...i, price: String(i.price), taxRate: String(i.taxRate) }); setOpen(true); };
  const onSubmit = (data: FormData) => editing ? updateMutation.mutate(data) : createMutation.mutate(data);

  const typeColor: Record<string, string> = {
    product: "default",
    service: "outline",
    membership: "success",
    subscription: "warning",
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Items & Services</h1>
          <p className="text-sm text-muted-foreground">{items.length} items</p>
        </div>
        <RoleGate permission="canWrite"><Button onClick={openCreate}><Plus className="h-4 w-4" /> Add Item</Button></RoleGate>
      </div>

      {/* Category tabs */}
      {categories.length > 1 && (
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveTab(cat)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === cat ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {cat === "all" ? "All Items" : cat}
            </button>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Package className="h-12 w-12" />}
          title="No items yet"
          description="Add your services, products or memberships to use on invoices."
          action={<Button onClick={openCreate}><Plus className="h-4 w-4" /> Add Item</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {(filtered as any[]).map((item: any) => (
            <Card key={item.id} className="p-4 group hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <Badge variant={typeColor[item.type] as any || "default"}>{item.type}</Badge>
                <RoleGate permission="canWrite"><div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(item)} className="h-6 w-6 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted">
                    <Edit2 className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => { if (confirm("Delete item?")) deleteMutation.mutate(item.id); }}
                    className="h-6 w-6 rounded flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div></RoleGate>
              </div>
              <h3 className="font-semibold text-sm mt-2 mb-1">{item.name}</h3>
              <p className="text-lg font-bold text-indigo-600">{formatCurrency(item.price)}</p>
              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                {item.category && (
                  <span className="flex items-center gap-1"><Tag className="h-3 w-3" />{item.category}</span>
                )}
                {Number(item.taxRate) > 0 && <span>GST {item.taxRate}%</span>}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onClose={() => { setOpen(false); setEditing(null); reset(); }} title={editing ? "Edit Item" : "New Item"}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Name" {...register("name", { required: true })} error={errors.name && "Name required"} />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Type" options={TYPE_OPTIONS} {...register("type")} />
            <Input label="Price (₹)" type="number" step="0.01" {...register("price", { required: true })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Tax Rate (%)" type="number" step="0.5" {...register("taxRate")} placeholder="18" />
            <Input label="Category" {...register("category")} placeholder="Services" />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => { setOpen(false); reset(); }}>Cancel</Button>
            <Button type="submit" loading={createMutation.isPending || updateMutation.isPending}>
              {editing ? "Save" : "Add Item"}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
