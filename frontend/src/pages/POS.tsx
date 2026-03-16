import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ShoppingCart, Plus, Minus, Trash2, CheckCircle, Search } from "lucide-react";
import { itemApi, customerApi, posApi } from "../api/index";
import { Button, Card, Spinner } from "../components/ui/index";
import { formatCurrency, cn } from "../lib/utils";

type CartItem = {
  id: string;
  name: string;
  price: number;
  taxRate: number;
  category: string;
  quantity: number;
};

const PAYMENT_METHODS = [
  { value: "cash", label: "Cash", icon: "💵" },
  { value: "upi", label: "UPI", icon: "📱" },
  { value: "card", label: "Card", icon: "💳" },
  { value: "online", label: "Online", icon: "🌐" },
];

export default function POSPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [payMethod, setPayMethod] = useState("cash");
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [search, setSearch] = useState("");
  const [success, setSuccess] = useState<any>(null);

  const { data: rawItems = [], isLoading } = useQuery({
    queryKey: ["items"],
    queryFn: () => itemApi.list().then(r => r.data),
  });

  const { data: customers = [] } = useQuery({
    queryKey: ["customers"],
    queryFn: () => customerApi.list().then(r => r.data),
  });

  const items = (rawItems as any[]).filter((i: any) => i.active);
  const categories = ["all", ...Array.from(new Set((items as any[]).map((i: any) => i.category || "Other")))] as string[];

  const filtered: any[] = (items as any[]).filter((i: any) => {
    const matchCat = activeCategory === "all" || (i.category || "Other") === activeCategory;
    const matchSearch = !search || i.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const addToCart = (item: any) => {
    setCart(prev => {
      const existing = prev.find(c => c.id === item.id);
      if (existing) {
        return prev.map(c => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      }
      return [...prev, { id: item.id, name: item.name, price: Number(item.price), taxRate: Number(item.taxRate), category: item.category || "", quantity: 1 }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart(prev =>
      prev.map(c => c.id === id ? { ...c, quantity: Math.max(0, c.quantity + delta) } : c)
        .filter(c => c.quantity > 0)
    );
  };

  const removeFromCart = (id: string) => setCart(prev => prev.filter(c => c.id !== id));
  const clearCart = () => setCart([]);

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = cart.reduce((sum, item) => sum + (item.price * item.quantity * item.taxRate) / 100, 0);
  const total = subtotal + tax;

  const checkoutMutation = useMutation({
    mutationFn: () => posApi.checkout({
      customerId: selectedCustomer || undefined,
      items: cart.map(c => ({ itemId: c.id, quantity: c.quantity })),
      paymentMethod: payMethod,
    }),
    onSuccess: (res) => {
      setSuccess(res.data);
      setCart([]);
    },
  });

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4 animate-fade-in">
        <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center">
          <CheckCircle className="h-10 w-10 text-emerald-500" />
        </div>
        <h2 className="text-xl font-bold">Payment Successful!</h2>
        <p className="text-muted-foreground">Invoice: <span className="font-mono font-medium">{success.invoiceNumber}</span></p>
        <p className="text-2xl font-bold text-emerald-600">{formatCurrency(success.totalAmount)}</p>
        <Button onClick={() => setSuccess(null)}>New Sale</Button>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-5rem)] flex gap-4 animate-fade-in">
      {/* Left panel - Items */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="page-header mb-4">
          <h1 className="page-title">Point of Sale</h1>
        </div>

        {/* Category tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-2 flex-shrink-0">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors",
                activeCategory === cat
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              {cat === "all" ? "All" : cat}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative mt-3 mb-3 flex-shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search items..."
            className="flex h-9 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Items grid */}
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center"><Spinner className="h-8 w-8" /></div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {(filtered as any[]).map((item: any) => {
                const inCart = cart.find(c => c.id === item.id);
                const isVeg = item.customFields?.veg === true;
                return (
                  <button
                    key={item.id}
                    onClick={() => addToCart(item)}
                    className={cn(
                      "relative text-left p-3 rounded-xl border transition-all hover:shadow-md active:scale-[0.98]",
                      inCart ? "border-indigo-300 bg-indigo-50" : "border-border bg-card hover:border-border/80"
                    )}
                  >
                    {/* Veg indicator */}
                    {item.customFields?.veg !== undefined && (
                      <div className={cn(
                        "absolute top-2 right-2 h-4 w-4 rounded-sm border-2 flex items-center justify-center",
                        isVeg ? "border-emerald-500" : "border-rose-500"
                      )}>
                        <div className={cn("h-2 w-2 rounded-full", isVeg ? "bg-emerald-500" : "bg-rose-500")} />
                      </div>
                    )}
                    <p className="font-medium text-sm leading-tight mb-1 pr-5">{item.name}</p>
                    <p className="text-indigo-600 font-bold">{formatCurrency(item.price)}</p>
                    {Number(item.taxRate) > 0 && (
                      <p className="text-xs text-muted-foreground">+{item.taxRate}% GST</p>
                    )}
                    {inCart && (
                      <div className="absolute bottom-2 right-2 h-5 w-5 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-bold">
                        {inCart.quantity}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Right panel - Bill */}
      <div className="w-80 flex-shrink-0 flex flex-col border rounded-xl bg-card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold text-sm">Bill</span>
          </div>
          {cart.length > 0 && (
            <button onClick={clearCart} className="text-xs text-muted-foreground hover:text-destructive">Clear</button>
          )}
        </div>

        {/* Cart items */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground/50">
              <ShoppingCart className="h-8 w-8 mb-2" />
              <p className="text-sm">Tap items to add</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex items-center gap-2 text-sm">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{formatCurrency(item.price)} each</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => updateQty(item.id, -1)} className="h-6 w-6 rounded-md bg-muted flex items-center justify-center hover:bg-muted/80">
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="w-5 text-center font-medium text-xs">{item.quantity}</span>
                  <button onClick={() => updateQty(item.id, 1)} className="h-6 w-6 rounded-md bg-muted flex items-center justify-center hover:bg-muted/80">
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
                <div className="w-16 text-right font-medium text-xs">{formatCurrency(item.price * item.quantity)}</div>
                <button onClick={() => removeFromCart(item.id)} className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Bill summary */}
        <div className="border-t p-4 space-y-3">
          {cart.length > 0 && (
            <div className="space-y-1 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span><span>{formatCurrency(subtotal)}</span>
              </div>
              {tax > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>GST</span><span>{formatCurrency(tax)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base border-t pt-1.5">
                <span>Total</span><span className="text-indigo-600">{formatCurrency(total)}</span>
              </div>
            </div>
          )}

          {/* Customer (optional) */}
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Customer (optional)</label>
            <select
              value={selectedCustomer}
              onChange={e => setSelectedCustomer(e.target.value)}
              className="flex h-8 w-full rounded-lg border border-input bg-background px-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Walk-in Customer</option>
              {customers.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Payment method */}
          <div className="grid grid-cols-4 gap-1.5">
            {PAYMENT_METHODS.map(m => (
              <button
                key={m.value}
                onClick={() => setPayMethod(m.value)}
                className={cn(
                  "flex flex-col items-center gap-0.5 p-1.5 rounded-lg border text-xs font-medium transition-colors",
                  payMethod === m.value
                    ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                    : "border-border text-muted-foreground hover:border-border/80"
                )}
              >
                <span>{m.icon}</span>
                <span>{m.label}</span>
              </button>
            ))}
          </div>

          <Button
            className="w-full"
            disabled={cart.length === 0}
            loading={checkoutMutation.isPending}
            onClick={() => checkoutMutation.mutate()}
          >
            Charge {cart.length > 0 ? formatCurrency(total) : ""}
          </Button>
        </div>
      </div>
    </div>
  );
}
