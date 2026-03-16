import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Save, Building2, Package, Zap, Bell, Receipt } from "lucide-react";
import { businessApi } from "../api/index";
import { Button, Card, Input, Textarea, Spinner } from "../components/ui/index";
import { useAuthStore } from "../store/auth";
import { cn } from "../lib/utils";
import ItemsPage from "./Items";

const TABS = [
  { id: "profile", label: "Business Profile", icon: Building2 },
  { id: "items", label: "Menu & Items", icon: Package },
  { id: "features", label: "Features", icon: Zap },
  { id: "reminders", label: "Reminders", icon: Bell },
  { id: "tax", label: "Tax Settings", icon: Receipt },
];

const FEATURES = [
  { key: "pos_mode", label: "POS Mode", desc: "Enable point-of-sale checkout screen" },
  { key: "subscriptions", label: "Subscriptions", desc: "Recurring billing for customers" },
  { key: "recurring", label: "Auto-renewals", desc: "Automatically generate invoices" },
  { key: "split_tax", label: "Split GST", desc: "Show CGST + SGST separately on invoices" },
  { key: "pdf_receipts", label: "PDF Receipts", desc: "Auto-generate PDF for every invoice" },
  { key: "whatsapp_reminders", label: "WhatsApp Reminders", desc: "Send payment reminders via WhatsApp" },
  { key: "inventory", label: "Inventory Tracking", desc: "Track product stock levels" },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");
  const qc = useQueryClient();
  const { business } = useAuthStore();
  const [saved, setSaved] = useState(false);

  const { data: biz, isLoading } = useQuery({
    queryKey: ["business", business?.id],
    queryFn: () => businessApi.get(business!.id).then(r => r.data),
    enabled: !!business?.id,
  });

  const profileMutation = useMutation({
    mutationFn: (data: object) => businessApi.updateProfile(business!.id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["business"] }); flashSaved(); },
  });

  const settingsMutation = useMutation({
    mutationFn: (data: object) => businessApi.updateSettings(business!.id, { settings: data }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["business"] }); flashSaved(); },
  });

  const remindersMutation = useMutation({
    mutationFn: (data: object) => businessApi.updateReminders(business!.id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["business"] }); flashSaved(); },
  });

  const taxMutation = useMutation({
    mutationFn: (data: object) => businessApi.updateTax(business!.id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["business"] }); flashSaved(); },
  });

  const flashSaved = () => { setSaved(true); setTimeout(() => setSaved(false), 2500); };

  if (isLoading) return <div className="flex justify-center py-16"><Spinner /></div>;

  const effectiveFeatures = biz?.effectiveFeatures || {};
  const reminderConfig = biz?.reminderConfig || {};
  const taxConfig = (biz?.settingsOverride as any)?.tax || {};

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        {saved && (
          <span className="text-sm text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg animate-fade-in">
            ✓ Saved
          </span>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar tabs */}
        <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible lg:w-48 flex-shrink-0">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap",
                activeTab === id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Profile */}
          {activeTab === "profile" && (
            <Card className="p-6">
              <h2 className="font-semibold mb-4">Business Profile</h2>
              <form
                onSubmit={async e => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  profileMutation.mutate(Object.fromEntries(fd));
                }}
                className="space-y-4"
              >
                <Input name="name" label="Business Name" defaultValue={biz?.name} />
                <Input name="address" label="Address" defaultValue={biz?.address || ""} />
                <Input name="gstin" label="GSTIN" defaultValue={biz?.gstin || ""} placeholder="22AAAAA0000A1Z5" />
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Currency</label>
                  <select
                    name="currency"
                    defaultValue={biz?.currency || "INR"}
                    className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="INR">INR — Indian Rupee</option>
                    <option value="USD">USD — US Dollar</option>
                    <option value="EUR">EUR — Euro</option>
                    <option value="GBP">GBP — British Pound</option>
                  </select>
                </div>
                <Button type="submit" loading={profileMutation.isPending}>
                  <Save className="h-4 w-4" /> Save Profile
                </Button>
              </form>
            </Card>
          )}

          {/* Items — reuse the Items page */}
          {activeTab === "items" && <ItemsPage />}

          {/* Features */}
          {activeTab === "features" && (
            <Card className="p-6">
              <h2 className="font-semibold mb-4">Feature Toggles</h2>
              <p className="text-sm text-muted-foreground mb-5">
                These override your template defaults. Changes take effect immediately.
              </p>
              <div className="space-y-3">
                {FEATURES.map(({ key, label, desc }) => (
                  <label key={key} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/30 cursor-pointer transition-colors">
                    <div>
                      <p className="text-sm font-medium">{label}</p>
                      <p className="text-xs text-muted-foreground">{desc}</p>
                    </div>
                    <input
                      type="checkbox"
                      defaultChecked={!!effectiveFeatures[key]}
                      onChange={e => settingsMutation.mutate({ [key]: e.target.checked })}
                      className="h-4 w-4 rounded accent-indigo-600"
                    />
                  </label>
                ))}
              </div>
            </Card>
          )}

          {/* Reminders */}
          {activeTab === "reminders" && (
            <Card className="p-6">
              <h2 className="font-semibold mb-4">Payment Reminder Settings</h2>
              <form
                onSubmit={e => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  const before_due = [fd.get("before_3") && 3, fd.get("before_1") && 1].filter(Boolean) as number[];
                  const after_due = [fd.get("after_1") && 1, fd.get("after_3") && 3].filter(Boolean) as number[];
                  remindersMutation.mutate({
                    before_due,
                    on_due: !!fd.get("on_due"),
                    after_due,
                    channel: fd.get("channel"),
                    messageTemplate: fd.get("messageTemplate"),
                  });
                }}
                className="space-y-5"
              >
                <div>
                  <p className="text-sm font-medium mb-3">When to send reminders</p>
                  <div className="space-y-2">
                    {[
                      { name: "before_3", label: "3 days before due date" },
                      { name: "before_1", label: "1 day before due date" },
                      { name: "on_due", label: "On due date" },
                      { name: "after_1", label: "1 day after due (overdue)" },
                      { name: "after_3", label: "3 days after due (overdue)" },
                    ].map(({ name, label }) => (
                      <label key={name} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/30 cursor-pointer">
                        <input
                          type="checkbox"
                          name={name}
                          defaultChecked={
                            (name === "before_3" && reminderConfig.before_due?.includes(3)) ||
                            (name === "before_1" && reminderConfig.before_due?.includes(1)) ||
                            (name === "on_due" && reminderConfig.on_due) ||
                            (name === "after_1" && reminderConfig.after_due?.includes(1)) ||
                            (name === "after_3" && reminderConfig.after_due?.includes(3))
                          }
                          className="h-4 w-4 rounded accent-indigo-600"
                        />
                        <span className="text-sm">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Channel</label>
                  <select
                    name="channel"
                    defaultValue={reminderConfig.channel || "whatsapp"}
                    className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="whatsapp">WhatsApp</option>
                    <option value="email">Email</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Custom Message Template</label>
                  <textarea
                    name="messageTemplate"
                    defaultValue={reminderConfig.messageTemplate || "Hi {customer_name}, your payment of {amount} to {business_name} is due on {due_date}. Please pay at your earliest convenience."}
                    rows={4}
                    className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <p className="text-xs text-muted-foreground">
                    Variables: &#123;customer_name&#125; &#123;amount&#125; &#123;business_name&#125; &#123;due_date&#125;
                  </p>
                </div>

                <Button type="submit" loading={remindersMutation.isPending}>
                  <Save className="h-4 w-4" /> Save Reminder Settings
                </Button>
              </form>
            </Card>
          )}

          {/* Tax */}
          {activeTab === "tax" && (
            <Card className="p-6">
              <h2 className="font-semibold mb-4">Tax Configuration</h2>
              <form
                onSubmit={e => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  taxMutation.mutate({
                    defaultTaxRate: parseFloat(fd.get("defaultTaxRate") as string) || 0,
                    splitTax: fd.get("splitTax") === "on",
                    taxInclusive: fd.get("taxInclusive") === "on",
                  });
                }}
                className="space-y-4"
              >
                <Input
                  name="defaultTaxRate"
                  label="Default GST Rate (%)"
                  type="number"
                  step="0.5"
                  defaultValue={taxConfig.defaultTaxRate ?? 18}
                  placeholder="18"
                />
                <label className="flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-muted/30">
                  <div>
                    <p className="text-sm font-medium">Split GST (CGST + SGST)</p>
                    <p className="text-xs text-muted-foreground">Show GST split as 9% CGST + 9% SGST on invoices</p>
                  </div>
                  <input type="checkbox" name="splitTax" defaultChecked={taxConfig.splitTax} className="h-4 w-4 rounded accent-indigo-600" />
                </label>
                <label className="flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-muted/30">
                  <div>
                    <p className="text-sm font-medium">Tax-Inclusive Pricing</p>
                    <p className="text-xs text-muted-foreground">Item prices already include tax (no tax added on top)</p>
                  </div>
                  <input type="checkbox" name="taxInclusive" defaultChecked={taxConfig.taxInclusive} className="h-4 w-4 rounded accent-indigo-600" />
                </label>
                <Button type="submit" loading={taxMutation.isPending}>
                  <Save className="h-4 w-4" /> Save Tax Settings
                </Button>
              </form>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
