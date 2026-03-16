import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus, RefreshCw, PauseCircle, PlayCircle, XCircle,
  CreditCard, ExternalLink, Zap, CheckCircle2, AlertCircle,
  Copy, RotateCcw,
} from "lucide-react";
import { razorpayApi, itemApi, customerApi } from "../api/index";
import {
  Button, Card, CardHeader, CardTitle, CardContent,
  Dialog, Input, Select, EmptyState, Spinner, Badge,
} from "../components/ui/index";
import { RoleGate } from "../components/ui/RoleGate";
import { useRazorpayCheckout, RazorpayPaymentResponse } from "../hooks/useRazorpayCheckout";
import { useAuthStore } from "../store/auth";
import { formatCurrency, formatDate, cn } from "../lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────
interface RazorpayPlan {
  id: string;
  razorpayPlanId: string;
  name: string;
  period: string;
  interval: number;
  amount: number;
  currency: string;
  item?: { id: string; name: string; price: number };
}

interface RazorpaySub {
  id: string;
  razorpaySubscriptionId: string;
  status: string;
  totalCount: number;
  paidCount: number;
  shortUrl: string | null;
  chargeAt: string | null;
  currentStart: string | null;
  currentEnd: string | null;
  customer: { id: string; name: string; phone?: string; email?: string };
  item: { id: string; name: string; price: number };
  plan: { razorpayPlanId: string; name: string; period: string };
}

// ─── Status badge helpers ─────────────────────────────────────────────────────
const STATUS_COLOR: Record<string, string> = {
  created:       "bg-slate-100 text-slate-700 border-slate-200",
  authenticated: "bg-blue-50 text-blue-700 border-blue-200",
  active:        "bg-emerald-50 text-emerald-700 border-emerald-200",
  pending:       "bg-amber-50 text-amber-700 border-amber-200",
  halted:        "bg-orange-50 text-orange-700 border-orange-200",
  cancelled:     "bg-rose-50 text-rose-700 border-rose-200",
  completed:     "bg-slate-50 text-slate-600 border-slate-200",
  paused:        "bg-yellow-50 text-yellow-700 border-yellow-200",
  expired:       "bg-slate-100 text-slate-500 border-slate-200",
};

const PERIOD_LABEL: Record<string, string> = {
  daily:   "day",
  weekly:  "week",
  monthly: "month",
  yearly:  "year",
};

// ─── Create Plan Dialog ───────────────────────────────────────────────────────
function CreatePlanDialog({
  open, onClose,
}: { open: boolean; onClose: () => void }) {
  const qc      = useQueryClient();
  const [mode, setMode] = useState<"item" | "custom">("item");

  const { data: items = [] } = useQuery({
    queryKey: ["items"],
    queryFn:  () => itemApi.list().then(r => r.data),
  });

  const fromItemMutation = useMutation({
    mutationFn: (itemId: string) => razorpayApi.createPlanForItem(itemId),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ["rz-plans"] }); onClose(); },
  });

  const customMutation = useMutation({
    mutationFn: (data: object) => razorpayApi.createPlan(data),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ["rz-plans"] }); onClose(); },
  });

  const [customForm, setCustomForm] = useState({
    itemName: "", period: "monthly", interval: 1, amount: "", description: "",
  });

  return (
    <Dialog open={open} onClose={onClose} title="Create Razorpay Plan" size="md">
      {/* Mode toggle */}
      <div className="flex rounded-lg border border-border overflow-hidden mb-5">
        {(["item", "custom"] as const).map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={cn(
              "flex-1 py-2 text-sm font-medium transition-colors",
              mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
            )}
          >
            {m === "item" ? "From existing item" : "Custom plan"}
          </button>
        ))}
      </div>

      {mode === "item" ? (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Select an item — BillFlow will create a Razorpay plan matching its price.
          </p>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {(items as any[]).map((item) => (
              <button
                key={item.id}
                onClick={() => fromItemMutation.mutate(item.id)}
                disabled={fromItemMutation.isPending}
                className="w-full flex items-center justify-between p-3 rounded-lg border hover:border-primary hover:bg-primary/5 transition-colors text-left"
              >
                <div>
                  <p className="font-medium text-sm">{item.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{item.type} · {item.category || "General"}</p>
                </div>
                <span className="font-bold text-indigo-600">{formatCurrency(item.price)}/mo</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <Input
            label="Plan Name"
            value={customForm.itemName}
            onChange={e => setCustomForm({ ...customForm, itemName: e.target.value })}
            placeholder="Monthly Membership"
          />
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Billing Period"
              value={customForm.period}
              onChange={e => setCustomForm({ ...customForm, period: e.target.value })}
              options={[
                { value: "daily",   label: "Daily" },
                { value: "weekly",  label: "Weekly" },
                { value: "monthly", label: "Monthly" },
                { value: "yearly",  label: "Yearly" },
              ]}
            />
            <Input
              label="Interval"
              type="number"
              min="1"
              value={customForm.interval}
              onChange={e => setCustomForm({ ...customForm, interval: parseInt(e.target.value) })}
              hint="e.g. 1 = every 1 month"
            />
          </div>
          <Input
            label="Amount (₹)"
            type="number"
            min="1"
            value={customForm.amount}
            onChange={e => setCustomForm({ ...customForm, amount: e.target.value })}
            placeholder="999"
          />
          <Input
            label="Description (optional)"
            value={customForm.description}
            onChange={e => setCustomForm({ ...customForm, description: e.target.value })}
          />
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button
              loading={customMutation.isPending}
              disabled={!customForm.itemName || !customForm.amount}
              onClick={() => customMutation.mutate({ ...customForm, amount: parseFloat(customForm.amount) })}
            >
              Create Plan on Razorpay
            </Button>
          </div>
        </div>
      )}
    </Dialog>
  );
}

// ─── Create Subscription Dialog ───────────────────────────────────────────────
function CreateSubscriptionDialog({
  open, onClose, plans,
}: { open: boolean; onClose: () => void; plans: RazorpayPlan[] }) {
  const qc = useQueryClient();
  const { business } = useAuthStore();

  const { data: customers = [] } = useQuery({
    queryKey: ["customers"],
    queryFn:  () => customerApi.list().then(r => r.data),
  });

  const [form, setForm] = useState({
    customerId: "", itemId: "", razorpayPlanId: "",
    totalCount: 12, notifyCustomer: true,
  });

  const mutation = useMutation({
    mutationFn: (data: object) => razorpayApi.createSubscription(data),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ["rz-subs"] }); onClose(); },
  });

  const selectedCustomer = (customers as any[]).find(c => c.id === form.customerId);

  return (
    <Dialog open={open} onClose={onClose} title="Create Razorpay Subscription" size="md">
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Customer</label>
          <select
            value={form.customerId}
            onChange={e => setForm({ ...form, customerId: e.target.value })}
            className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Select customer…</option>
            {(customers as any[]).map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Razorpay Plan</label>
          <select
            value={form.razorpayPlanId}
            onChange={e => {
              const plan = plans.find(p => p.razorpayPlanId === e.target.value);
              setForm({ ...form, razorpayPlanId: e.target.value, itemId: plan?.item?.id || "" });
            }}
            className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Select plan…</option>
            {plans.map(p => (
              <option key={p.razorpayPlanId} value={p.razorpayPlanId}>
                {p.name} — {formatCurrency(p.amount)}/{PERIOD_LABEL[p.period] || p.period}
              </option>
            ))}
          </select>
        </div>

        <Input
          label="Total billing cycles"
          type="number"
          min="1"
          value={form.totalCount}
          onChange={e => setForm({ ...form, totalCount: parseInt(e.target.value) })}
          hint="e.g. 12 = 1 year of monthly billing"
        />

        <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/30">
          <input
            type="checkbox"
            checked={form.notifyCustomer}
            onChange={e => setForm({ ...form, notifyCustomer: e.target.checked })}
            className="h-4 w-4 rounded accent-indigo-600"
          />
          <div>
            <p className="text-sm font-medium">Notify customer via Razorpay</p>
            <p className="text-xs text-muted-foreground">Razorpay will send payment link to customer's email/phone</p>
          </div>
        </label>

        {mutation.error && (
          <p className="text-xs text-destructive">
            {(mutation.error as any)?.response?.data?.message || "Failed to create subscription"}
          </p>
        )}

        <div className="flex gap-3 pt-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            loading={mutation.isPending}
            disabled={!form.customerId || !form.razorpayPlanId}
            onClick={() => mutation.mutate({
              customerId:     form.customerId,
              itemId:         form.itemId,
              razorpayPlanId: form.razorpayPlanId,
              totalCount:     form.totalCount,
              notifyCustomer: form.notifyCustomer,
            })}
          >
            <Zap className="h-4 w-4" />
            Create on Razorpay
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

// ─── Subscription card ────────────────────────────────────────────────────────
function SubCard({ sub, onAction }: { sub: RazorpaySub; onAction: () => void }) {
  const [copied, setCopied] = useState(false);

  const copyLink = () => {
    if (sub.shortUrl) {
      navigator.clipboard.writeText(sub.shortUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const statusClass = STATUS_COLOR[sub.status] || STATUS_COLOR.created;
  const canAct      = !["cancelled", "completed", "expired"].includes(sub.status);

  return (
    <Card className="p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="font-semibold text-sm">{sub.customer.name}</p>
          <p className="text-xs text-muted-foreground">{sub.plan?.name || sub.item.name}</p>
        </div>
        <span className={cn("text-[11px] font-semibold px-2.5 py-1 rounded-full border capitalize", statusClass)}>
          {sub.status}
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-muted/40 rounded-lg p-2">
          <p className="text-xs text-muted-foreground">Amount</p>
          <p className="font-bold text-sm">{formatCurrency(sub.item.price)}</p>
        </div>
        <div className="bg-muted/40 rounded-lg p-2">
          <p className="text-xs text-muted-foreground">Paid</p>
          <p className="font-bold text-sm">{sub.paidCount} / {sub.totalCount}</p>
        </div>
        <div className="bg-muted/40 rounded-lg p-2">
          <p className="text-xs text-muted-foreground">Next charge</p>
          <p className="font-bold text-sm">{sub.chargeAt ? formatDate(sub.chargeAt) : "—"}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-500 rounded-full transition-all"
            style={{ width: `${Math.min((sub.paidCount / sub.totalCount) * 100, 100)}%` }}
          />
        </div>
        <p className="text-[10px] text-muted-foreground mt-1">
          {sub.paidCount} of {sub.totalCount} payments completed
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-wrap">
        {sub.shortUrl && (
          <button
            onClick={copyLink}
            className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-500 transition-colors"
          >
            {copied ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied!" : "Payment link"}
          </button>
        )}
        {sub.shortUrl && (
          <a
            href={sub.shortUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <ExternalLink className="h-3.5 w-3.5" /> Open
          </a>
        )}

        <RoleGate allow={["owner"]}>
          {canAct && (
            <div className="flex gap-1.5 ml-auto">
              <ActionButtons sub={sub} onDone={onAction} />
            </div>
          )}
        </RoleGate>
      </div>
    </Card>
  );
}

function ActionButtons({ sub, onDone }: { sub: RazorpaySub; onDone: () => void }) {
  const qc = useQueryClient();

  const pause = useMutation({
    mutationFn: () => razorpayApi.pauseSubscription(sub.id),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ["rz-subs"] }); onDone(); },
  });
  const resume = useMutation({
    mutationFn: () => razorpayApi.resumeSubscription(sub.id),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ["rz-subs"] }); onDone(); },
  });
  const cancel = useMutation({
    mutationFn: () => razorpayApi.cancelSubscription(sub.id),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ["rz-subs"] }); onDone(); },
  });
  const sync = useMutation({
    mutationFn: () => razorpayApi.syncSubscription(sub.id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ["rz-subs"] }),
  });

  return (
    <>
      <button
        onClick={() => sync.mutate()}
        disabled={sync.isPending}
        className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        title="Sync from Razorpay"
      >
        <RotateCcw className={cn("h-3.5 w-3.5", sync.isPending && "animate-spin")} />
      </button>

      {sub.status === "active" && (
        <button
          onClick={() => pause.mutate()}
          disabled={pause.isPending}
          className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-amber-50 text-muted-foreground hover:text-amber-600 transition-colors"
          title="Pause"
        >
          <PauseCircle className="h-3.5 w-3.5" />
        </button>
      )}

      {sub.status === "paused" && (
        <button
          onClick={() => resume.mutate()}
          disabled={resume.isPending}
          className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-emerald-50 text-muted-foreground hover:text-emerald-600 transition-colors"
          title="Resume"
        >
          <PlayCircle className="h-3.5 w-3.5" />
        </button>
      )}

      {["active", "paused", "created", "authenticated", "pending"].includes(sub.status) && (
        <button
          onClick={() => { if (confirm("Cancel this subscription?")) cancel.mutate(); }}
          disabled={cancel.isPending}
          className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-rose-50 text-muted-foreground hover:text-rose-600 transition-colors"
          title="Cancel"
        >
          <XCircle className="h-3.5 w-3.5" />
        </button>
      )}
    </>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function RazorpaySubscriptionsPage() {
  const qc = useQueryClient();
  const { business } = useAuthStore();
  const [planDialogOpen, setPlanDialogOpen]   = useState(false);
  const [subDialogOpen,  setSubDialogOpen]    = useState(false);

  const { data: plans = [], isLoading: plansLoading } = useQuery({
    queryKey: ["rz-plans"],
    queryFn:  () => razorpayApi.listPlans().then(r => r.data),
  });

  const { data: subs = [], isLoading: subsLoading } = useQuery({
    queryKey: ["rz-subs"],
    queryFn:  () => razorpayApi.listSubscriptions().then(r => r.data),
  });

  // Razorpay checkout hook (for customer-side payment flow within the app)
  const { openCheckout } = useRazorpayCheckout({
    keyId:        import.meta.env.VITE_RAZORPAY_KEY_ID || "",
    businessName: business?.name || "BillFlow",
    onSuccess:    async (response: RazorpayPaymentResponse) => {
      try {
        await razorpayApi.verifyPayment({
          razorpayPaymentId:      response.razorpay_payment_id,
          razorpaySubscriptionId: response.razorpay_subscription_id,
          razorpaySignature:      response.razorpay_signature,
        });
        qc.invalidateQueries({ queryKey: ["rz-subs"] });
        alert("✅ Payment verified successfully!");
      } catch {
        alert("Payment verification failed. Contact support.");
      }
    },
  });

  const isLoading = plansLoading || subsLoading;
  const typedPlans  = plans  as RazorpayPlan[];
  const typedSubs   = subs   as RazorpaySub[];

  // Stats
  const activeSubs    = typedSubs.filter(s => s.status === "active").length;
  const haltedSubs    = typedSubs.filter(s => ["halted","pending"].includes(s.status)).length;
  const monthlyRevenue = typedSubs
    .filter(s => s.status === "active")
    .reduce((sum, s) => sum + Number(s.item.price), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Razorpay Subscriptions</h1>
          <p className="text-sm text-muted-foreground">Automated recurring billing via Razorpay</p>
        </div>
        <RoleGate allow={["owner"]}>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setPlanDialogOpen(true)}>
              <Plus className="h-4 w-4" /> New Plan
            </Button>
            <Button onClick={() => setSubDialogOpen(true)} disabled={typedPlans.length === 0}>
              <Zap className="h-4 w-4" /> New Subscription
            </Button>
          </div>
        </RoleGate>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Active",       value: activeSubs,                     color: "bg-emerald-500", icon: CheckCircle2 },
          { label: "Attention",    value: haltedSubs,                     color: "bg-amber-500",   icon: AlertCircle },
          { label: "Monthly MRR", value: formatCurrency(monthlyRevenue),  color: "bg-indigo-500",  icon: CreditCard },
          { label: "Plans",        value: typedPlans.length,              color: "bg-violet-500",  icon: RefreshCw },
        ].map(stat => (
          <Card key={stat.label} className="p-4">
            <div className="flex items-start justify-between">
              <div className={`h-9 w-9 rounded-xl ${stat.color} flex items-center justify-center`}>
                <stat.icon className="h-4 w-4 text-white" />
              </div>
            </div>
            <div className="pt-3">
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Plans */}
      {typedPlans.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Razorpay Plans</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {typedPlans.map(plan => (
                <div key={plan.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border">
                  <div>
                    <p className="font-medium text-sm">{plan.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{plan.razorpayPlanId}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-indigo-600">{formatCurrency(plan.amount)}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      every {plan.interval > 1 ? plan.interval : ""} {PERIOD_LABEL[plan.period] || plan.period}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Subscriptions grid */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : typedSubs.length === 0 ? (
        <EmptyState
          icon={<CreditCard className="h-12 w-12" />}
          title="No Razorpay subscriptions yet"
          description={
            typedPlans.length === 0
              ? "Create a Razorpay plan first, then add subscriptions."
              : "Create a subscription to start automated recurring billing."
          }
          action={
            <RoleGate allow={["owner"]}>
              <div className="flex gap-2">
                {typedPlans.length === 0 && (
                  <Button variant="outline" onClick={() => setPlanDialogOpen(true)}>
                    <Plus className="h-4 w-4" /> Create Plan First
                  </Button>
                )}
                <Button onClick={() => setSubDialogOpen(true)} disabled={typedPlans.length === 0}>
                  <Zap className="h-4 w-4" /> New Subscription
                </Button>
              </div>
            </RoleGate>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {typedSubs.map(sub => (
            <SubCard
              key={sub.id}
              sub={sub}
              onAction={() => qc.invalidateQueries({ queryKey: ["rz-subs"] })}
            />
          ))}
        </div>
      )}

      {/* Dialogs */}
      <CreatePlanDialog
        open={planDialogOpen}
        onClose={() => setPlanDialogOpen(false)}
      />
      <CreateSubscriptionDialog
        open={subDialogOpen}
        onClose={() => setSubDialogOpen(false)}
        plans={typedPlans}
      />
    </div>
  );
}
