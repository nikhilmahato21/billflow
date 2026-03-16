import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Check, Zap, ChevronRight, ChevronLeft, Plus, Trash2 } from "lucide-react";
import { onboardingApi, itemApi, customerApi, invoiceApi } from "../api/index";
import { useAuthStore } from "../store/auth";
import { useOnboardingStore } from "../store/auth";
import { cn } from "../lib/utils";

const TEMPLATES = [
  { slug: "gym", label: "Gym / Fitness", icon: "🏋️", desc: "Memberships, PT, Locker" },
  { slug: "clinic", label: "Clinic", icon: "🏥", desc: "Consultations, Lab Tests" },
  { slug: "restaurant", label: "Restaurant", icon: "🍽️", desc: "POS + Split GST" },
  { slug: "freelancer", label: "Freelancer", icon: "💻", desc: "Projects, Retainers" },
  { slug: "tutor", label: "Tutor", icon: "📚", desc: "Sessions, Courses" },
  { slug: "retail", label: "Retail", icon: "🛍️", desc: "Products + POS" },
  { slug: "custom", label: "Custom", icon: "⚙️", desc: "Build your own" },
];

const STEPS = [
  "Account", "Business", "Template", "Items",
  "Reminders", "Customer", "Invoice",
];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { step, nextStep, prevStep, data, setData } = useOnboardingStore();
  const { business, updateBusiness } = useAuthStore();

  const [loading, setLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [items, setItems] = useState([{ name: "", price: "", category: "" }]);
  const [reminders, setReminders] = useState({ before_3: true, before_1: true, on_due: true, after_1: true, after_3: false });
  const [customer, setCustomer] = useState({ name: "", phone: "", email: "" });
  const [invoice, setInvoice] = useState({ dueDate: "", notes: "" });
  const [customers, setCustomers] = useState<any[]>([]);
  const [createdCustomer, setCreatedCustomer] = useState<any>(null);

  const handleTemplateSelect = async (slug: string) => {
    setSelectedTemplate(slug);
    setLoading(true);
    try {
      await onboardingApi.applyTemplate(slug);
      // Fetch pre-seeded items
      const res = await itemApi.list();
      if (res.data.length > 0) {
        setItems(res.data.map((i: any) => ({ id: i.id, name: i.name, price: String(i.price), category: i.category || "" })));
      }
    } catch {}
    setLoading(false);
  };

  const handleBusinessSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const bizData = {
      name: form.get("name") as string,
      address: form.get("address") as string,
      gstin: form.get("gstin") as string,
    };
    setData(bizData);
    nextStep();
  };

  const handleItemsSave = async () => {
    setLoading(true);
    try {
      for (const item of items) {
        if (item.name && item.price) {
          if ((item as any).id) {
            await itemApi.update((item as any).id, { name: item.name, price: parseFloat(item.price), category: item.category });
          } else {
            await itemApi.create({ name: item.name, price: parseFloat(item.price), category: item.category, type: "service" });
          }
        }
      }
    } catch {}
    setLoading(false);
    nextStep();
  };

  const handleRemindersSave = async () => {
    setLoading(true);
    try {
      const before_due = [reminders.before_3 && 3, reminders.before_1 && 1].filter(Boolean) as number[];
      const after_due = [reminders.after_1 && 1, reminders.after_3 && 3].filter(Boolean) as number[];
      await onboardingApi.complete({ reminderConfig: { before_due, on_due: reminders.on_due, after_due } });
    } catch {}
    setLoading(false);
    nextStep();
  };

  const handleCustomerSave = async () => {
    if (!customer.name) { nextStep(); return; }
    setLoading(true);
    try {
      const res = await customerApi.create(customer);
      setCreatedCustomer(res.data);
      const cRes = await customerApi.list();
      setCustomers(cRes.data);
    } catch {}
    setLoading(false);
    nextStep();
  };

  const handleInvoiceCreate = async () => {
    if (!createdCustomer) {
      await finishOnboarding();
      return;
    }
    setLoading(true);
    try {
      const res = await itemApi.list();
      const firstItem = res.data[0];
      if (firstItem && invoice.dueDate) {
        await invoiceApi.create({
          customerId: createdCustomer.id,
          items: [{ itemId: firstItem.id, name: firstItem.name, quantity: 1, price: Number(firstItem.price), taxRate: Number(firstItem.taxRate) }],
          dueDate: invoice.dueDate,
          notes: invoice.notes,
        });
      }
    } catch {}
    await finishOnboarding();
    setLoading(false);
  };

  const finishOnboarding = async () => {
    await onboardingApi.complete({});
    updateBusiness({ onboardingComplete: true });
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex flex-col">
      {/* Header */}
      <header className="flex items-center gap-3 px-6 py-4">
        <div className="h-8 w-8 rounded-lg bg-indigo-500 flex items-center justify-center">
          <Zap className="h-5 w-5 text-white" />
        </div>
        <span className="font-bold text-white text-lg">BillFlow</span>
      </header>

      {/* Step indicators */}
      <div className="flex items-center justify-center gap-1.5 py-4 px-4">
        {STEPS.map((s, i) => (
          <React.Fragment key={s}>
            <div className={cn(
              "flex items-center justify-center h-7 w-7 rounded-full text-xs font-bold transition-all",
              i + 1 < step ? "bg-emerald-500 text-white" :
              i + 1 === step ? "bg-indigo-500 text-white ring-2 ring-indigo-400/50" :
              "bg-white/10 text-slate-400"
            )}>
              {i + 1 < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn("h-0.5 w-6 rounded transition-all", i + 1 < step ? "bg-emerald-500" : "bg-white/10")} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 flex items-start justify-center px-4 py-6">
        <div className="w-full max-w-2xl bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-8 shadow-2xl">

          {/* Step 1 - Skipped (handled on register) */}
          {step === 1 && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Account created! ✓</h2>
              <p className="text-slate-400 mb-6">Let's set up your business profile next.</p>
              <button onClick={nextStep} className="h-10 px-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors">
                Continue <ChevronRight className="h-4 w-4 inline" />
              </button>
            </div>
          )}

          {/* Step 2 - Business Details */}
          {step === 2 && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Business Details</h2>
              <p className="text-slate-400 mb-6">This appears on your invoices.</p>
              <form onSubmit={handleBusinessSave} className="space-y-4">
                {[
                  { name: "name", label: "Business Name", placeholder: "Sharma Enterprises", required: true },
                  { name: "address", label: "Address", placeholder: "123 MG Road, Bangalore" },
                  { name: "gstin", label: "GSTIN (optional)", placeholder: "22AAAAA0000A1Z5" },
                ].map(f => (
                  <div key={f.name} className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-300">{f.label}</label>
                    <input
                      name={f.name}
                      required={f.required}
                      placeholder={f.placeholder}
                      defaultValue={business?.name && f.name === "name" ? business.name : ""}
                      className="flex h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                ))}
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={prevStep} className="h-10 px-4 rounded-lg border border-white/10 text-slate-300 hover:bg-white/5 text-sm">
                    <ChevronLeft className="h-4 w-4 inline" /> Back
                  </button>
                  <button type="submit" className="h-10 px-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors">
                    Continue <ChevronRight className="h-4 w-4 inline" />
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Step 3 - Template */}
          {step === 3 && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Choose Your Business Type</h2>
              <p className="text-slate-400 mb-6">We'll pre-configure everything for you.</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                {TEMPLATES.map(t => (
                  <button
                    key={t.slug}
                    onClick={() => handleTemplateSelect(t.slug)}
                    className={cn(
                      "flex flex-col items-center gap-2 p-4 rounded-xl border transition-all text-left",
                      selectedTemplate === t.slug
                        ? "border-indigo-500 bg-indigo-500/20 text-white"
                        : "border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:bg-white/10"
                    )}
                  >
                    <span className="text-2xl">{t.icon}</span>
                    <span className="font-medium text-sm">{t.label}</span>
                    <span className="text-xs opacity-60 text-center">{t.desc}</span>
                    {selectedTemplate === t.slug && (
                      <div className="h-5 w-5 rounded-full bg-indigo-500 flex items-center justify-center">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={prevStep} className="h-10 px-4 rounded-lg border border-white/10 text-slate-300 hover:bg-white/5 text-sm">
                  <ChevronLeft className="h-4 w-4 inline" /> Back
                </button>
                <button
                  onClick={nextStep}
                  disabled={!selectedTemplate || loading}
                  className="h-10 px-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {loading ? <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin inline-block mr-1" /> : null}
                  Continue <ChevronRight className="h-4 w-4 inline" />
                </button>
              </div>
            </div>
          )}

          {/* Step 4 - Items */}
          {step === 4 && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Your Services & Products</h2>
              <p className="text-slate-400 mb-6">Edit or add items you'll put on invoices.</p>
              <div className="space-y-3 mb-4 max-h-64 overflow-y-auto pr-1">
                {items.map((item, idx) => (
                  <div key={idx} className="flex gap-2 items-start">
                    <input
                      value={item.name}
                      onChange={e => { const n = [...items]; n[idx].name = e.target.value; setItems(n); }}
                      placeholder="Item name"
                      className="flex-1 h-9 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <input
                      value={item.price}
                      onChange={e => { const n = [...items]; n[idx].price = e.target.value; setItems(n); }}
                      placeholder="₹ Price"
                      type="number"
                      className="w-28 h-9 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <input
                      value={item.category}
                      onChange={e => { const n = [...items]; n[idx].category = e.target.value; setItems(n); }}
                      placeholder="Category"
                      className="w-28 h-9 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <button onClick={() => setItems(items.filter((_, i) => i !== idx))} className="h-9 w-9 flex items-center justify-center text-slate-500 hover:text-rose-400">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
              <button onClick={() => setItems([...items, { name: "", price: "", category: "" }])} className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1 mb-6">
                <Plus className="h-4 w-4" /> Add item
              </button>
              <div className="flex gap-3">
                <button onClick={prevStep} className="h-10 px-4 rounded-lg border border-white/10 text-slate-300 hover:bg-white/5 text-sm">
                  <ChevronLeft className="h-4 w-4 inline" /> Back
                </button>
                <button onClick={handleItemsSave} disabled={loading} className="h-10 px-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium">
                  Save & Continue <ChevronRight className="h-4 w-4 inline" />
                </button>
              </div>
            </div>
          )}

          {/* Step 5 - Reminders */}
          {step === 5 && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Payment Reminders</h2>
              <p className="text-slate-400 mb-6">Auto-send WhatsApp reminders to customers.</p>
              <div className="space-y-3 mb-6">
                {[
                  { key: "before_3", label: "3 days before due date" },
                  { key: "before_1", label: "1 day before due date" },
                  { key: "on_due", label: "On due date" },
                  { key: "after_1", label: "1 day after due (overdue)" },
                  { key: "after_3", label: "3 days after due (overdue)" },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-3 p-3 rounded-lg border border-white/10 bg-white/5 cursor-pointer hover:bg-white/10 transition-colors">
                    <input
                      type="checkbox"
                      checked={reminders[key as keyof typeof reminders]}
                      onChange={e => setReminders({ ...reminders, [key]: e.target.checked })}
                      className="h-4 w-4 rounded border-white/20 accent-indigo-500"
                    />
                    <span className="text-sm text-slate-200">{label}</span>
                  </label>
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={prevStep} className="h-10 px-4 rounded-lg border border-white/10 text-slate-300 hover:bg-white/5 text-sm">
                  <ChevronLeft className="h-4 w-4 inline" /> Back
                </button>
                <button onClick={handleRemindersSave} disabled={loading} className="h-10 px-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium">
                  Save & Continue <ChevronRight className="h-4 w-4 inline" />
                </button>
              </div>
            </div>
          )}

          {/* Step 6 - First Customer */}
          {step === 6 && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Add Your First Customer</h2>
              <p className="text-slate-400 mb-6">You can always add more later.</p>
              <div className="space-y-4 mb-6">
                {[
                  { key: "name", label: "Customer Name", placeholder: "Priya Patel", required: true },
                  { key: "phone", label: "WhatsApp Number", placeholder: "+91 98765 43210" },
                  { key: "email", label: "Email (optional)", placeholder: "priya@example.com" },
                ].map(f => (
                  <div key={f.key} className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-300">{f.label}</label>
                    <input
                      value={customer[f.key as keyof typeof customer]}
                      onChange={e => setCustomer({ ...customer, [f.key]: e.target.value })}
                      placeholder={f.placeholder}
                      className="flex h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={prevStep} className="h-10 px-4 rounded-lg border border-white/10 text-slate-300 hover:bg-white/5 text-sm">
                  <ChevronLeft className="h-4 w-4 inline" /> Back
                </button>
                <button onClick={handleCustomerSave} disabled={loading || !customer.name} className="h-10 px-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium disabled:opacity-50">
                  Continue <ChevronRight className="h-4 w-4 inline" />
                </button>
                <button onClick={nextStep} className="h-10 px-4 rounded-lg border border-white/10 text-slate-300 hover:bg-white/5 text-sm">
                  Skip
                </button>
              </div>
            </div>
          )}

          {/* Step 7 - First Invoice */}
          {step === 7 && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Create Your First Invoice</h2>
              <p className="text-slate-400 mb-6">Get paid faster with a professional invoice.</p>
              {createdCustomer ? (
                <div className="space-y-4 mb-6">
                  <div className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-sm">
                    Billing to: <strong>{createdCustomer.name}</strong>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-300">Due Date</label>
                    <input
                      type="date"
                      value={invoice.dueDate}
                      onChange={e => setInvoice({ ...invoice, dueDate: e.target.value })}
                      min={new Date().toISOString().split("T")[0]}
                      className="flex h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-300">Notes (optional)</label>
                    <textarea
                      value={invoice.notes}
                      onChange={e => setInvoice({ ...invoice, notes: e.target.value })}
                      placeholder="Any special notes..."
                      className="flex w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[80px]"
                    />
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-lg border border-white/10 bg-white/5 text-slate-400 text-sm mb-6">
                  No customer added. You can create invoices from the dashboard.
                </div>
              )}
              <div className="flex gap-3">
                <button onClick={prevStep} className="h-10 px-4 rounded-lg border border-white/10 text-slate-300 hover:bg-white/5 text-sm">
                  <ChevronLeft className="h-4 w-4 inline" /> Back
                </button>
                <button
                  onClick={handleInvoiceCreate}
                  disabled={loading}
                  className="h-10 px-6 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium flex items-center gap-2"
                >
                  {loading && <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />}
                  {createdCustomer ? "Create Invoice & Go to Dashboard" : "Go to Dashboard"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
