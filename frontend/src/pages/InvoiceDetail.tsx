import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Download, CreditCard, Trash2, ChevronDown } from "lucide-react";
import { invoiceApi } from "../api/index";
import { Button, Card, CardHeader, CardTitle, CardContent, Dialog, Select, Spinner } from "../components/ui/index";
import { RoleGate } from "../components/ui/RoleGate";
import { formatCurrency, formatDate, getStatusColor, cn } from "../lib/utils";

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "pending", label: "Pending" },
  { value: "paid", label: "Paid" },
  { value: "overdue", label: "Overdue" },
];

const METHOD_OPTIONS = [
  { value: "cash", label: "Cash" },
  { value: "upi", label: "UPI" },
  { value: "card", label: "Card" },
  { value: "online", label: "Online" },
];

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [payOpen, setPayOpen] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("cash");

  const { data: invoice, isLoading } = useQuery({
    queryKey: ["invoice", id],
    queryFn: () => invoiceApi.get(id!).then(r => r.data),
  });

  const statusMutation = useMutation({
    mutationFn: (status: string) => invoiceApi.updateStatus(id!, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["invoice", id] }),
  });

  const paymentMutation = useMutation({
    mutationFn: () => invoiceApi.addPayment(id!, { amount: parseFloat(payAmount), method: payMethod }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoice", id] });
      setPayOpen(false);
      setPayAmount("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => invoiceApi.delete(id!),
    onSuccess: () => navigate("/invoices"),
  });

  if (isLoading) return <div className="flex justify-center py-16"><Spinner className="h-8 w-8" /></div>;
  if (!invoice) return <div className="text-center py-16 text-muted-foreground">Invoice not found</div>;

  const totalPaid = invoice.payments?.reduce((s: number, p: any) => s + Number(p.amount), 0) || 0;
  const balanceDue = Number(invoice.totalAmount) - totalPaid;

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/invoices" className="h-9 w-9 flex items-center justify-center rounded-lg border hover:bg-muted transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold font-mono">{invoice.invoiceNumber}</h1>
            <p className="text-sm text-muted-foreground">Created {formatDate(invoice.createdAt)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Status changer */}
          <div className="relative">
            <select
              value={invoice.status}
              onChange={e => statusMutation.mutate(e.target.value)}
              className={cn(
                "h-9 pl-3 pr-8 rounded-lg border text-xs font-medium appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring",
                getStatusColor(invoice.status)
              )}
            >
              {STATUS_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3" />
          </div>
          {invoice.pdfUrl && (
            <a href={invoice.pdfUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm"><Download className="h-4 w-4" /> PDF</Button>
            </a>
          )}
          <RoleGate permission="canManagePayments">
            {invoice.status !== "paid" && (
              <Button size="sm" onClick={() => setPayOpen(true)}>
                <CreditCard className="h-4 w-4" /> Record Payment
              </Button>
            )}
          </RoleGate>
          <RoleGate permission="canDelete">
            <Button
              variant="outline"
              size="icon"
              onClick={() => { if (confirm("Delete this invoice?")) deleteMutation.mutate(); }}
              className="text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </RoleGate>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Invoice body */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardContent className="pt-5">
              {/* Business & Customer header */}
              <div className="flex justify-between mb-6">
                <div>
                  <p className="font-bold text-lg">{invoice.business?.name}</p>
                  {invoice.business?.address && <p className="text-sm text-muted-foreground">{invoice.business.address}</p>}
                  {invoice.business?.gstin && <p className="text-xs text-muted-foreground">GSTIN: {invoice.business.gstin}</p>}
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-indigo-600">INVOICE</p>
                  <p className="text-sm font-mono font-medium">#{invoice.invoiceNumber}</p>
                  <p className="text-xs text-muted-foreground">Due: {formatDate(invoice.dueDate)}</p>
                </div>
              </div>

              <div className="border-t pt-4 mb-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Bill To</p>
                <p className="font-semibold">{invoice.customer?.name}</p>
                {invoice.customer?.phone && <p className="text-sm text-muted-foreground">{invoice.customer.phone}</p>}
                {invoice.customer?.email && <p className="text-sm text-muted-foreground">{invoice.customer.email}</p>}
              </div>

              {/* Line items */}
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 font-medium text-muted-foreground">Item</th>
                    <th className="text-center py-2 font-medium text-muted-foreground">Qty</th>
                    <th className="text-right py-2 font-medium text-muted-foreground">Price</th>
                    <th className="text-right py-2 font-medium text-muted-foreground">Tax</th>
                    <th className="text-right py-2 font-medium text-muted-foreground">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.invoiceItems?.map((item: any) => (
                    <tr key={item.id} className="border-b border-border/50">
                      <td className="py-2.5">{item.name}</td>
                      <td className="py-2.5 text-center">{item.quantity}</td>
                      <td className="py-2.5 text-right">{formatCurrency(item.price)}</td>
                      <td className="py-2.5 text-right text-muted-foreground">{Number(item.taxRate)}%</td>
                      <td className="py-2.5 text-right font-medium">{formatCurrency(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div className="mt-4 ml-auto max-w-xs space-y-1.5 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatCurrency(invoice.subtotal)}</span></div>
                {Number(invoice.taxAmount) > 0 && (
                  <div className="flex justify-between"><span className="text-muted-foreground">Tax</span><span>{formatCurrency(invoice.taxAmount)}</span></div>
                )}
                <div className="flex justify-between font-bold text-base border-t pt-1.5">
                  <span>Total</span><span className="text-indigo-600">{formatCurrency(invoice.totalAmount)}</span>
                </div>
                {totalPaid > 0 && (
                  <>
                    <div className="flex justify-between text-emerald-600"><span>Paid</span><span>- {formatCurrency(totalPaid)}</span></div>
                    <div className="flex justify-between font-bold text-base border-t pt-1.5">
                      <span>Balance Due</span><span className={balanceDue > 0 ? "text-rose-600" : "text-emerald-600"}>{formatCurrency(balanceDue)}</span>
                    </div>
                  </>
                )}
              </div>

              {invoice.notes && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Notes</p>
                  <p className="text-sm">{invoice.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Payment history */}
          <Card>
            <CardHeader><CardTitle className="text-sm">Payment History</CardTitle></CardHeader>
            <CardContent>
              {invoice.payments?.length === 0 ? (
                <p className="text-sm text-muted-foreground">No payments recorded</p>
              ) : (
                <div className="space-y-2">
                  {invoice.payments?.map((p: any) => (
                    <div key={p.id} className="flex items-center justify-between text-sm">
                      <div>
                        <p className="font-medium">{formatCurrency(p.amount)}</p>
                        <p className="text-xs text-muted-foreground capitalize">{p.method} · {formatDate(p.paidAt)}</p>
                      </div>
                      <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">Paid</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Reminders */}
          {invoice.reminders?.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-sm">Scheduled Reminders</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {invoice.reminders.map((r: any) => (
                    <div key={r.id} className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{r.type} · {formatDate(r.scheduledAt)}</span>
                      <span className={cn(
                        "px-2 py-0.5 rounded-full border",
                        r.status === "sent" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                        r.status === "failed" ? "bg-rose-50 text-rose-700 border-rose-200" :
                        "bg-amber-50 text-amber-700 border-amber-200"
                      )}>{r.status}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Payment Dialog */}
      <Dialog open={payOpen} onClose={() => setPayOpen(false)} title="Record Payment" size="sm">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Amount (₹)</label>
            <input
              type="number"
              step="0.01"
              value={payAmount}
              onChange={e => setPayAmount(e.target.value)}
              placeholder={String(balanceDue.toFixed(2))}
              className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Payment Method</label>
            <select
              value={payMethod}
              onChange={e => setPayMethod(e.target.value)}
              className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {METHOD_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setPayOpen(false)}>Cancel</Button>
            <Button
              onClick={() => paymentMutation.mutate()}
              loading={paymentMutation.isPending}
              disabled={!payAmount || parseFloat(payAmount) <= 0}
            >
              Record Payment
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
