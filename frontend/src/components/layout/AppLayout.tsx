import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "../../lib/utils";
import { useAuthStore } from "../../store/auth";
import { useRole } from "../../hooks/useRole";
import {
  LayoutDashboard, Users, Package, FileText, CreditCard,
  ShoppingCart, Settings, LogOut, Zap, ChevronLeft, Menu, UserCog,
} from "lucide-react";

interface NavItem {
  to: string;
  icon: React.ElementType;
  label: string;
  permission?: keyof ReturnType<typeof useRole>;
  ownerOnly?: boolean;
}

const navItems: NavItem[] = [
  { to: "/dashboard",     icon: LayoutDashboard, label: "Dashboard" },
  { to: "/customers",     icon: Users,           label: "Customers" },
  { to: "/items",         icon: Package,         label: "Items" },
  { to: "/invoices",      icon: FileText,        label: "Invoices" },
  { to: "/subscriptions",            icon: CreditCard,      label: "Subscriptions" },
  { to: "/razorpay-subscriptions",  icon: Zap,            label: "Razorpay Billing", permission: "canManageSubscriptions" },
  { to: "/pos",           icon: ShoppingCart,    label: "POS",          permission: "canUsePOS" },
  { to: "/staff",         icon: UserCog,         label: "Staff",        permission: "canManageStaff" },
  { to: "/settings",      icon: Settings,        label: "Settings",     permission: "canManageSettings" },
];

const ROLE_BADGE: Record<string, string> = {
  owner:      "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
  staff:      "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  accountant: "bg-amber-500/20 text-amber-300 border-amber-500/30",
};

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, business, logout } = useAuthStore();
  const perms = useRole();

  const visibleNav = navItems.filter(item => {
    if (!item.permission) return true;
    return !!perms[item.permission];
  });

  const handleLogout = () => { logout(); navigate("/login"); };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={cn("flex items-center gap-3 px-4 py-5 border-b border-white/10", collapsed && "justify-center")}>
        <div className="h-8 w-8 rounded-lg bg-indigo-500 flex items-center justify-center flex-shrink-0">
          <Zap className="h-5 w-5 text-white" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <span className="font-bold text-white text-lg">BillFlow</span>
            <p className="text-xs text-slate-400 truncate">{business?.name}</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {visibleNav.map(({ to, icon: Icon, label }) => {
          const active = location.pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                active ? "bg-primary text-primary-foreground shadow-sm" : "text-slate-400 hover:text-white hover:bg-white/10",
                collapsed && "justify-center px-2"
              )}
              title={collapsed ? label : undefined}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User info + role badge */}
      <div className="px-3 py-4 border-t border-white/10 space-y-1">
        {!collapsed && user && (
          <div className="px-3 py-2 mb-1">
            <p className="text-xs font-medium text-slate-300 truncate">{user.name}</p>
            <p className="text-xs text-slate-500 truncate">{user.email}</p>
            <span className={cn(
              "inline-flex items-center mt-1.5 px-1.5 py-0.5 rounded border text-[10px] font-semibold uppercase tracking-wide",
              ROLE_BADGE[user.role] || ROLE_BADGE.staff
            )}>
              {user.role}
            </span>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-white/10 w-full transition-all"
          title={collapsed ? "Logout" : undefined}
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className={cn(
        "hidden lg:flex flex-col bg-[hsl(var(--bf-sidebar))] transition-all duration-200 flex-shrink-0 relative",
        collapsed ? "w-16" : "w-60"
      )}>
        <SidebarContent />
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute top-16 -right-3 bg-primary rounded-full p-0.5 shadow-md hidden lg:flex z-10"
        >
          <ChevronLeft className={cn("h-4 w-4 text-white transition-transform", collapsed && "rotate-180")} />
        </button>
      </aside>

      {/* Mobile Sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-60 h-full bg-[hsl(var(--bf-sidebar))] shadow-xl animate-slide-in">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 border-b bg-card">
          <button onClick={() => setMobileOpen(true)} className="p-1.5 rounded-md hover:bg-muted">
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded bg-indigo-500 flex items-center justify-center">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold">BillFlow</span>
          </div>
          {user && (
            <span className={cn(
              "ml-auto px-2 py-0.5 rounded border text-[10px] font-bold uppercase",
              ROLE_BADGE[user.role] || ROLE_BADGE.staff
            )}>
              {user.role}
            </span>
          )}
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6 animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
};
