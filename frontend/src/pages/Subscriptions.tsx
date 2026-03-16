import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, CreditCard, Pause, X, Play } from "lucide-react";
import { subscriptionApi, customerApi, itemApi } from "../api/index";
import { Button, Card, Dialog, Input, Select, EmptyState, Spinner, Badge } from "../components/ui/index";
import { RoleGate } from "../components/ui/RoleGate";
import { formatCurrency, formatDate, cn } from "../lib/utils";
import { useForm } from "react-hook-form";

const CYCLE_OPTIONS = [
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "annual", label: "Annual" },
];

type FormData = { customerId: string; itemId: string; billingCycle: string; startDate: string; endDate: string };

const STATUS_BADGE: Record<string, string> = {
  active: "success",
  paused: "warning",
  cancelled: "danger",
};

export default function SubscriptionsPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: subs = [], isLoading } = useQuery({
    queryKey: ["subscriptions"],
    queryFn: () => subscriptionApi.list().then(r => r.data),
  });

  const { data: customers = [] } = useQuery({
    queryKey: ["customers"],
    queryFn: () => customerApi.list().then(r => r.data),
  });

  const { data: items = [] } = useQuery({
    queryKey: ["items"],
    queryFn: () => itemApi.list().then(r => r.data),
  });

  const { register, handleSubmit, reset } = useForm<FormData>();

  const createMutation = useMutation({
    mutationFn: (data: FormData) => subscriptionApi.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["subscriptions"] }); setOpen(false); reset(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => subscriptionApi.update(id, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["subscriptions"] }),
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Subscriptions</h1>
          <p className="text-sm text-muted-foreground">{(subs as any[]).length} subscriptions</p>
        </div>
        {/* Only owners can create subscriptions */}
        <RoleGate allow={["owner"]}>
          <Button onClick={() => { reset(); setOpen(true); }}>
            <Plus className="h-4 w-4" /> New Subscription
          </Button>
        </RoleGate>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : (subs as any[]).length === 0 ? (
        <EmptyState
          icon={<CreditCard className="h-12 w-12" />}
          title="No subscriptions yet"
          description="Set up recurring billing for your customers."
          action={
            <RoleGate allow={["owner"]}>
              <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Create Subscription</Button>
            </RoleGate>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(subs as any[]).map((sub) => (
            <Card key={sub.id} className="p-4">
              <div className="flex items-start justify-between mb-3">
                <Badge variant={STATUS_BADGE[sub.status] as any || "outline"}>{sub.status}</Badge>
                {/* Controls only for owner */}
                <RoleGate allow={["owner"]}>
                  <div className="flex gap-1">
                    {sub.status === "active" && (
                      <button
                        onClick={() => updateMutation.mutate({ id: sub.id, status: "paused" })}
                        className="h-7 w-7 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground"
                        title="Pause"
                      >
                        <Pause className="h-3.5 w-3.5" />
                      </button>
                    )}
                    {sub.status === "paused" && (
                      <button
                        onClick={() => updateMutation.mutate({ id: sub.id, status: "active" })}
                        className="h-7 w-7 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground"
                        title="Resume"
                      >
                        <Play className="h-3.5 w-3.5" />
                      </button>
                    )}
                    {sub.status !== "cancelled" && (
                      <button
                        onClick={() => { if (confirm("Cancel subscription?")) updateMutation.mutate({ id: sub.id, status: "cancelled" }); }}
                        className="h-7 w-7 rounded-md hover:bg-destructive/10 flex items-center justify-center text-muted-foreground hover:text-destructive"
                        title="Cancel"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </RoleGate>
              </div>
              <h3 className="font-semibold text-sm">{sub.customer?.name}</h3>
              <p className="text-xs text-muted-foreground">{sub.item?.name}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-lg font-bold text-indigo-600">{formatCurrency(sub.item?.price)}</span>
                <span className="text-xs text-muted-foreground capitalize">{sub.billingCycle}</span>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div><p className="font-medium text-foreground/70">Started</p><p>{formatDate(sub.startDate)}</p></div>
                {sub.nextBillingAt && (
                  <div><p className="font-medium text-foreground/70">Next Bill</p><p>{formatDate(sub.nextBillingAt)}</p></div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onClose={() => { setOpen(false); reset(); }} title="New Subscription">
        <form onSubmit={handleSubmit(d => createMutation.mutate(d))} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Customer</label>
            <select
              {...register("customerId", { required: true })}
              className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Select customer...</option>
              {(customers as any[]).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Plan / Item</label>
            <select
              {...register("itemId", { required: true })}
              className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Select item...</option>
              {(items as any[]).map((i) => <option key={i.id} value={i.id}>{i.name} — {formatCurrency(i.price)}</option>)}
            </select>
          </div>
          <Select label="Billing Cycle" options={CYCLE_OPTIONS} {...register("billingCycle", { required: true })} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Start Date" type="date" {...register("startDate", { required: true })} />
            <Input label="End Date (optional)" type="date" {...register("endDate")} />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => { setOpen(false); reset(); }}>Cancel</Button>
            <Button type="submit" loading={createMutation.isPending}>Create Subscription</Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
