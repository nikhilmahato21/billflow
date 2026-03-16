import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { Plus, Search, Eye, Trash2, FileText, ChevronLeft, ChevronRight } from "lucide-react";
import { invoiceApi, customerApi, itemApi } from "../api/index";
import { Button, Card, Dialog, Input, EmptyState, Spinner } from "../components/ui/index";
import { RoleGate } from "../components/ui/RoleGate";
import { formatCurrency, formatDate, getStatusColor, cn } from "../lib/utils";
import { useForm, useFieldArray } from "react-hook-form";

const STATUS_OPTIONS = [
  { value: "", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "paid", label: "Paid" },
  { value: "overdue", label: "Overdue" },
  { value: "draft", label: "Draft" },
];

type InvoiceForm = {
  customerId: string;
  dueDate: string;
  notes: string;
  items: Array<{ itemId: string; name: string; quantity: number; price: string; taxRate: string }>;
};

export default function InvoicesPage() {
  const qc = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(1);

  const statusFilter = searchParams.get("status") || "";

  const { data, isLoading } = useQuery({
    queryKey: ["invoices", statusFilter, page],
    queryFn: () => invoiceApi.list({ status: statusFilter || undefined, page, limit: 15 }).then(r => r.data),
  });

  const { data: customers = [] } = useQuery({
    queryKey: ["customers"],
    queryFn: () => customerApi.list().then(r => r.data),
  });

  const { data: items = [] } = useQuery({
    queryKey: ["items"],
    queryFn: () => itemApi.list().then(r => r.data),
  });

  const { register, handleSubmit, control, watch, setValue, reset } = useForm<InvoiceForm>({
    defaultValues: { items: [{ itemId: "", name: "", quantity: 1, price: "", taxRate: "0" }] },
  });
  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const watchedItems = watch("items");

  const subtotal = watchedItems.reduce((s, i) => s + (Number(i.quantity) || 0) * (parseFloat(i.price) || 0), 0);
  const taxTotal = watchedItems.reduce((s, i) => {
    const base = (Number(i.quantity) || 0) * (parseFloat(i.price) || 0);
    return s + (base * (parseFloat(i.taxRate) || 0)) / 100;
  }, 0);

  const handleItemSelect = (idx: number, itemId: string) => {
    const found = (items as any[]).find((i) => i.id === itemId);
    if (found) {
      setValue(`items.${idx}.name`, found.name);
      setValue(`items.${idx}.price`, String(found.price));
      setValue(`items.${idx}.taxRate`, String(found.taxRate));
    }
  };

  const createMutation = useMutation({
    mutationFn: (data: InvoiceForm) =>
      invoiceApi.create({
        customerId: data.customerId,
        dueDate: data.dueDate,
        notes: data.notes,
        items: data.items.map(i => ({
          itemId: i.itemId || undefined,
          name: i.name,
          quantity: Number(i.quantity),
          price: parseFloat(i.price),
          taxRate: parseFloat(i.taxRate || "0"),
        })),
      }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["invoices"] }); setOpen(false); reset(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => invoiceApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["invoices"] }),
  });

  const invoices: any[] = data?.invoices || [];
  const totalPages = data?.totalPages || 1;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Invoices</h1>
          <p className="text-sm text-muted-foreground">{data?.total || 0} total</p>
        </div>
        <RoleGate permission="canWrite">
          <Button onClick={() => { reset(); setOpen(true); }}>
            <Plus className="h-4 w-4" /> New Invoice
          </Button>
        </RoleGate>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex gap-1.5 flex-wrap">
          {STATUS_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => { setSearchParams(opt.value ? { status: opt.value } : {}); setPage(1); }}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                statusFilter === opt.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : invoices.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-12 w-12" />}
          title="No invoices found"
          description="Create your first invoice to get paid."
          action={
            <RoleGate permission="canWrite">
              <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Create Invoice</Button>
            </RoleGate>
          }
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Invoice #</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Customer</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Due Date</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Amount</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-muted/20 transition-colors group">
                    <td className="px-4 py-3 font-mono text-xs font-medium text-indigo-600">{inv.invoiceNumber}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{inv.customer?.name}</div>
                      {inv.customer?.phone && <div className="text-xs text-muted-foreground">{inv.customer.phone}</div>}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(inv.dueDate)}</td>
                    <td className="px-4 py-3 text-right font-semibold">{formatCurrency(inv.totalAmount)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border", getStatusColor(inv.status))}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link
                          to={`/invoices/${inv.id}`}
                          className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Link>
                        <RoleGate permission="canDelete">
                          <button
                            onClick={() => { if (confirm("Delete invoice?")) deleteMutation.mutate(inv.id); }}
                            className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </RoleGate>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <p className="text-sm text-muted-foreground">Page {page} of {totalPages}</p>
              <div className="flex gap-1.5">
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Create Invoice Dialog — only reachable by canWrite roles */}
      <Dialog open={open} onClose={() => setOpen(false)} title="New Invoice" size="lg">
        <form onSubmit={handleSubmit(d => createMutation.mutate(d))} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Customer</label>
              <select
                {...register("customerId", { required: true })}
                className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Select customer...</option>
                {(customers as any[]).map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <Input
              label="Due Date"
              type="date"
              {...register("dueDate", { required: true })}
              min={new Date().toISOString().split("T")[0]}
            />
          </div>

          {/* Line items */}
          <div>
            <label className="text-sm font-medium block mb-2">Line Items</label>
            <div className="space-y-2">
              {fields.map((field, idx) => (
                <div key={field.id} className="grid grid-cols-12 gap-2 items-start">
                  <div className="col-span-4">
                    <select
                      {...register(`items.${idx}.itemId`)}
                      onChange={e => handleItemSelect(idx, e.target.value)}
                      className="flex h-9 w-full rounded-lg border border-input bg-background px-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="">Custom</option>
                      {(items as any[]).map((i) => (
                        <option key={i.id} value={i.id}>{i.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-3">
                    <input {...register(`items.${idx}.name`, { required: true })} placeholder="Description"
                      className="flex h-9 w-full rounded-lg border border-input bg-background px-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                  <div className="col-span-1">
                    <input {...register(`items.${idx}.quantity`)} type="number" min="1" placeholder="Qty"
                      className="flex h-9 w-full rounded-lg border border-input bg-background px-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                  <div className="col-span-2">
                    <input {...register(`items.${idx}.price`, { required: true })} type="number" step="0.01" placeholder="Price"
                      className="flex h-9 w-full rounded-lg border border-input bg-background px-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                  <div className="col-span-1">
                    <input {...register(`items.${idx}.taxRate`)} type="number" placeholder="Tax%"
                      className="flex h-9 w-full rounded-lg border border-input bg-background px-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                  <div className="col-span-1 flex justify-center pt-2">
                    {fields.length > 1 && (
                      <button type="button" onClick={() => remove(idx)} className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => append({ itemId: "", name: "", quantity: 1, price: "", taxRate: "0" })}
              className="mt-2 text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
            >
              <Plus className="h-3.5 w-3.5" /> Add line item
            </button>
          </div>

          {/* Totals */}
          <div className="bg-muted/40 rounded-lg p-3 space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Tax</span><span>{formatCurrency(taxTotal)}</span></div>
            <div className="flex justify-between font-semibold text-base border-t pt-1.5 mt-1">
              <span>Total</span><span className="text-indigo-600">{formatCurrency(subtotal + taxTotal)}</span>
            </div>
          </div>

          <Input label="Notes (optional)" {...register("notes")} placeholder="Payment terms, notes..." />

          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" loading={createMutation.isPending}>Create Invoice</Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
