import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Edit2, Trash2, Phone, Mail, Users } from "lucide-react";
import { customerApi } from "../api/index";
import { Button, Card, Dialog, Input, Textarea, EmptyState, Spinner } from "../components/ui/index";
import { RoleGate } from "../components/ui/RoleGate";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1, "Name required"),
  phone: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  notes: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export default function CustomersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ["customers", search],
    queryFn: () => customerApi.list(search).then(r => r.data),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const createMutation = useMutation({
    mutationFn: (data: FormData) => customerApi.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["customers"] }); setOpen(false); reset(); },
  });

  const updateMutation = useMutation({
    mutationFn: (data: FormData) => customerApi.update(editing.id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["customers"] }); setOpen(false); reset(); setEditing(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => customerApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customers"] }),
  });

  const openCreate = () => { setEditing(null); reset({}); setOpen(true); };
  const openEdit = (c: any) => { setEditing(c); reset(c); setOpen(true); };
  const onSubmit = (data: FormData) => editing ? updateMutation.mutate(data) : createMutation.mutate(data);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Customers</h1>
          <p className="text-sm text-muted-foreground">{customers.length} total</p>
        </div>
        <RoleGate permission="canWrite">
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Add Customer
          </Button>
        </RoleGate>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, phone, email..."
          className="flex h-9 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : customers.length === 0 ? (
        <EmptyState
          icon={<Users className="h-12 w-12" />}
          title="No customers yet"
          description="Add your first customer to start creating invoices."
          action={<Button onClick={openCreate}><Plus className="h-4 w-4" /> Add Customer</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {customers.map((c: any) => (
            <Card key={c.id} className="p-4 hover:shadow-md transition-shadow group">
              <div className="flex items-start justify-between mb-3">
                <div className="h-10 w-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-semibold text-sm">
                  {c.name.charAt(0).toUpperCase()}
                </div>
                <RoleGate permission="canWrite"><div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(c)} className="h-7 w-7 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground">
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => { if (confirm("Delete this customer?")) deleteMutation.mutate(c.id); }}
                    className="h-7 w-7 rounded-md hover:bg-destructive/10 flex items-center justify-center text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div></RoleGate>
              </div>
              <h3 className="font-semibold text-sm">{c.name}</h3>
              {c.phone && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                  <Phone className="h-3 w-3" />{c.phone}
                </div>
              )}
              {c.email && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                  <Mail className="h-3 w-3" />{c.email}
                </div>
              )}
              {c.notes && <p className="text-xs text-muted-foreground/70 mt-2 line-clamp-2">{c.notes}</p>}
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onClose={() => { setOpen(false); setEditing(null); reset(); }} title={editing ? "Edit Customer" : "New Customer"}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Name" error={errors.name?.message} {...register("name")} />
          <Input label="WhatsApp / Phone" {...register("phone")} placeholder="+91 98765 43210" />
          <Input label="Email" type="email" error={errors.email?.message} {...register("email")} />
          <Textarea label="Notes" {...register("notes")} placeholder="Any notes about this customer..." />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => { setOpen(false); reset(); }}>Cancel</Button>
            <Button type="submit" loading={createMutation.isPending || updateMutation.isPending}>
              {editing ? "Save Changes" : "Add Customer"}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
