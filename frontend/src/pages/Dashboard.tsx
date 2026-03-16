import React from "react";
import { useQuery } from "@tanstack/react-query";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, Users, FileText, AlertTriangle, MessageSquare, ArrowUpRight } from "lucide-react";
import { dashboardApi } from "../api/index";
import { formatCurrency } from "../lib/utils";
import { Card, CardContent, CardHeader, CardTitle, Spinner } from "../components/ui/index";
import { RoleGate } from "../components/ui/RoleGate";
import { useAuthStore } from "../store/auth";
import { Link } from "react-router-dom";

function StatCard({ title, value, sub, icon: Icon, color, link }: any) {
  return (
    <Link to={link || "#"} className="block">
      <div className="stat-card group cursor-pointer">
        <div className="flex items-start justify-between">
          <div className={`h-10 w-10 rounded-xl ${color} flex items-center justify-center`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
          <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        <div className="pt-3">
          <p className="text-2xl font-bold tracking-tight">{value}</p>
          <p className="text-sm text-muted-foreground">{title}</p>
          {sub && <p className="text-xs text-muted-foreground/70 mt-0.5">{sub}</p>}
        </div>
      </div>
    </Link>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

export default function DashboardPage() {
  const { user, business } = useAuthStore();

  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => dashboardApi.stats().then(r => r.data),
  });

  const { data: revenue } = useQuery({
    queryKey: ["dashboard-revenue"],
    queryFn: () => dashboardApi.revenue("monthly").then(r => r.data),
  });

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Spinner className="h-8 w-8" /></div>;
  }

  const waPercent = stats ? Math.min(Math.round((stats.whatsapp.used / stats.whatsapp.limit) * 100), 100) : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Good {getGreeting()}, {user?.name?.split(" ")[0]} 👋</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {business?.name} · {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
          </p>
        </div>
        {/* Only staff/owner can create invoices */}
        <RoleGate permission="canWrite">
          <Link
            to="/invoices"
            className="inline-flex items-center gap-2 h-9 px-4 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <FileText className="h-4 w-4" /> New Invoice
          </Link>
        </RoleGate>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Revenue" value={formatCurrency(stats?.totalRevenue || 0)} icon={TrendingUp} color="bg-indigo-500" link="/invoices?status=paid" />
        <StatCard title="Pending" value={formatCurrency(stats?.pending?.amount || 0)} sub={`${stats?.pending?.count || 0} invoices`} icon={FileText} color="bg-amber-500" link="/invoices?status=pending" />
        <StatCard title="Overdue" value={formatCurrency(stats?.overdue?.amount || 0)} sub={`${stats?.overdue?.count || 0} invoices`} icon={AlertTriangle} color="bg-rose-500" link="/invoices?status=overdue" />
        <StatCard title="Customers" value={stats?.totalCustomers || 0} icon={Users} color="bg-emerald-500" link="/customers" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Revenue — Last 6 Months</CardTitle></CardHeader>
          <CardContent>
            {revenue ? (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={revenue} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => [formatCurrency(v), "Revenue"]}
                    contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "12px" }} />
                  <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} fill="url(#revenueGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-56 flex items-center justify-center text-muted-foreground text-sm">No data yet</div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          {/* WhatsApp usage — relevant to owner/accountant */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <MessageSquare className="h-4 w-4 text-emerald-500" />
                WhatsApp Messages
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between mb-2">
                <span className="text-2xl font-bold">{stats?.whatsapp?.used || 0}</span>
                <span className="text-sm text-muted-foreground">/ {stats?.whatsapp?.limit || 500}</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${waPercent > 80 ? "bg-rose-500" : waPercent > 60 ? "bg-amber-500" : "bg-emerald-500"}`}
                  style={{ width: `${waPercent}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">{waPercent}% used this month</p>
            </CardContent>
          </Card>

          {stats?.topItems?.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-sm">Top Items</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {stats.topItems.map((item: any, i: number) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-sm truncate max-w-[120px]">{item.name}</span>
                    <span className="text-sm font-medium text-indigo-600">{formatCurrency(item.revenue)}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Plan info — only owner needs to see upgrade link */}
      {stats && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="uppercase font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">
            {stats.plan} plan
          </span>
          <RoleGate allow={["owner"]}>
            <Link to="/settings" className="hover:text-primary transition-colors">Upgrade plan →</Link>
          </RoleGate>
        </div>
      )}
    </div>
  );
}
