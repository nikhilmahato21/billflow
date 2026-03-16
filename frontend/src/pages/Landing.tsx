import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Zap, FileText, MessageSquare, BarChart2, ShoppingCart, Users,
  ChevronRight, CheckCircle2, ArrowRight, Star, Menu, X,
  Receipt, RefreshCw, Shield, Smartphone
} from "lucide-react";

// ─── Data ─────────────────────────────────────────────────────────────────────

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "Templates", href: "#templates" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
];

const FEATURES = [
  {
    icon: FileText,
    title: "Smart Invoicing",
    desc: "Create professional GST-ready invoices in seconds. Auto-calculate CGST, SGST, and totals. PDF generation included.",
    color: "from-indigo-500 to-violet-500",
  },
  {
    icon: MessageSquare,
    title: "WhatsApp Reminders",
    desc: "Automatically chase payments via WhatsApp before and after due dates. Customers actually read WhatsApp.",
    color: "from-emerald-500 to-teal-500",
  },
  {
    icon: ShoppingCart,
    title: "POS Mode",
    desc: "A full point-of-sale screen for walk-in customers. Item grid, cart, instant receipt — built for speed.",
    color: "from-amber-500 to-orange-500",
  },
  {
    icon: RefreshCw,
    title: "Subscriptions",
    desc: "Recurring billing for memberships, retainers, monthly plans. Auto-renew and track payment history.",
    color: "from-rose-500 to-pink-500",
  },
  {
    icon: BarChart2,
    title: "Revenue Dashboard",
    desc: "See your money at a glance. Revenue charts, overdue alerts, top items, WhatsApp usage — all on one screen.",
    color: "from-sky-500 to-blue-500",
  },
  {
    icon: Shield,
    title: "Team RBAC",
    desc: "Owner, Staff, and Accountant roles. Staff can create invoices. Accountants record payments. You control access.",
    color: "from-purple-500 to-indigo-500",
  },
];

const TEMPLATES = [
  { slug: "gym", emoji: "🏋️", label: "Gym", desc: "Memberships, PT sessions, locker rental", tags: ["Subscriptions", "WhatsApp"] },
  { slug: "clinic", emoji: "🏥", label: "Clinic", desc: "Consultations, lab tests, diagnostics", tags: ["Split GST", "PDF"] },
  { slug: "restaurant", emoji: "🍽️", label: "Restaurant", desc: "POS + split GST + category menu", tags: ["POS Mode", "CGST+SGST"] },
  { slug: "freelancer", emoji: "💻", label: "Freelancer", desc: "Projects, retainers, hourly billing", tags: ["Recurring", "WhatsApp"] },
  { slug: "tutor", emoji: "📚", label: "Tutor", desc: "Monthly tuition, crash courses, sessions", tags: ["Subscriptions"] },
  { slug: "retail", emoji: "🛍️", label: "Retail", desc: "Products, inventory, POS checkout", tags: ["POS Mode", "Inventory"] },
];

const PLANS = [
  {
    name: "Basic",
    price: "₹499",
    period: "/month",
    highlight: false,
    features: [
      "150 clients", "150 invoices/month", "500 WhatsApp msgs",
      "PDF receipts", "Subscriptions (manual)", "1 workspace",
    ],
    cta: "Start Free",
  },
  {
    name: "Growth",
    price: "₹999",
    period: "/month",
    highlight: true,
    badge: "Most Popular",
    features: [
      "Unlimited clients", "300 invoices/month", "1,000 WhatsApp msgs",
      "POS mode", "Auto-renewals", "Email support",
    ],
    cta: "Start Free",
  },
  {
    name: "Pro",
    price: "₹1,999",
    period: "/month",
    highlight: false,
    features: [
      "Unlimited everything", "2,000 WhatsApp msgs", "3 staff logins",
      "Custom reminder templates", "Priority support", "All features",
    ],
    cta: "Start Free",
  },
];

const FAQS = [
  {
    q: "Do I need a WhatsApp Business account?",
    a: "Yes. BillFlow uses the official Meta Cloud API, so you need a WhatsApp Business account and an approved phone number. Setup takes about 15 minutes.",
  },
  {
    q: "Is GST included? Can I split CGST and SGST?",
    a: "Yes — full GST support. Enable split tax in settings and invoices automatically show CGST + SGST side-by-side. GSTIN appears on all invoices.",
  },
  {
    q: "Can my staff use it without seeing sensitive data?",
    a: "Yes. Staff can create invoices and do POS checkout, but cannot delete records or access business settings. Accountants can only record payments.",
  },
  {
    q: "What happens if I exceed my WhatsApp limit?",
    a: "Additional messages are charged at ₹1 each. You'll see your usage on the dashboard in real-time before you hit the limit.",
  },
  {
    q: "Can I try it before paying?",
    a: "Yes — create an account and use BillFlow free during your trial. No credit card required to sign up.",
  },
];

const TESTIMONIALS = [
  {
    name: "Arjun Mehta",
    role: "Gym Owner, Mumbai",
    avatar: "AM",
    color: "bg-indigo-500",
    quote: "We used to chase members on the phone every month. Now WhatsApp reminders go out automatically. Collections improved 40% in the first month.",
  },
  {
    name: "Dr. Priya Nair",
    role: "Clinic, Bangalore",
    avatar: "PN",
    color: "bg-emerald-500",
    quote: "GST invoices with CGST/SGST split used to take 10 minutes each. Now it's under 30 seconds. My accountant loves it.",
  },
  {
    name: "Ravi Kumar",
    role: "Freelance Designer, Pune",
    avatar: "RK",
    color: "bg-amber-500",
    quote: "I finally stopped chasing clients on email. The 3-day-before reminder on WhatsApp gets paid 80% of the time before due date.",
  },
];

// ─── Hooks ────────────────────────────────────────────────────────────────────

function useInView(ref: React.RefObject<Element>, threshold = 0.15) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold }
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [ref, threshold]);
  return visible;
}

// ─── Animated section wrapper ─────────────────────────────────────────────────
function FadeIn({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useInView(ref as React.RefObject<Element>);
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(28px)",
        transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

// ─── Navbar ───────────────────────────────────────────────────────────────────
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: scrolled ? "rgba(5,5,20,0.92)" : "transparent",
        backdropFilter: scrolled ? "blur(12px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(255,255,255,0.06)" : "none",
      }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <span className="font-extrabold text-white text-xl tracking-tight">BillFlow</span>
        </div>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          {NAV_LINKS.map(l => (
            <a key={l.label} href={l.href}
              className="text-sm text-slate-400 hover:text-white transition-colors font-medium">
              {l.label}
            </a>
          ))}
        </nav>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Link to="/login" className="text-sm text-slate-300 hover:text-white transition-colors font-medium">
            Sign in
          </Link>
          <Link to="/register"
            className="h-9 px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-lg shadow-indigo-500/20">
            Start Free <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Mobile menu toggle */}
        <button onClick={() => setOpen(!open)} className="md:hidden text-slate-300 p-1">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile nav */}
      {open && (
        <div className="md:hidden bg-slate-950/98 border-t border-white/10 px-4 py-4 space-y-3">
          {NAV_LINKS.map(l => (
            <a key={l.label} href={l.href} onClick={() => setOpen(false)}
              className="block text-slate-300 hover:text-white text-sm font-medium py-1.5">
              {l.label}
            </a>
          ))}
          <div className="pt-3 flex flex-col gap-2 border-t border-white/10">
            <Link to="/login" onClick={() => setOpen(false)}
              className="text-center text-sm text-slate-300 py-2 rounded-lg border border-white/10">
              Sign in
            </Link>
            <Link to="/register" onClick={() => setOpen(false)}
              className="text-center h-10 bg-indigo-600 text-white text-sm font-semibold rounded-lg flex items-center justify-center gap-1.5">
              Start Free <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-indigo-950/60 to-slate-950" />
        {/* Glow orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-violet-600/15 rounded-full blur-3xl" />
        {/* Grid */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: "linear-gradient(rgba(99,102,241,1) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,1) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-20 text-center">
        {/* Badge */}
        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-sm font-medium mb-8"
          style={{ animation: "fadeInDown 0.6s ease both" }}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
          Built for Indian businesses · GST ready · WhatsApp native
        </div>

        {/* Headline */}
        <h1
          className="text-5xl sm:text-6xl md:text-7xl font-extrabold text-white leading-[1.05] tracking-tight mb-6"
          style={{ animation: "fadeInDown 0.6s ease 0.1s both" }}
        >
          Stop chasing
          <br />
          <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-indigo-400 bg-clip-text text-transparent">
            payments manually.
          </span>
        </h1>

        <p
          className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed"
          style={{ animation: "fadeInDown 0.6s ease 0.2s both" }}
        >
          BillFlow sends WhatsApp reminders automatically, generates GST invoices in seconds,
          and gives you a full POS — all from one dashboard built for gyms, clinics,
          freelancers, restaurants, and more.
        </p>

        {/* CTAs */}
        <div
          className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-16"
          style={{ animation: "fadeInDown 0.6s ease 0.3s both" }}
        >
          <Link
            to="/register"
            className="group h-12 px-8 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-2xl shadow-indigo-500/30 flex items-center gap-2 text-base"
          >
            Start for free
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <a
            href="#features"
            className="h-12 px-8 border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-white font-semibold rounded-xl transition-all text-base"
          >
            See how it works
          </a>
        </div>

        {/* Stat pills */}
        <div
          className="flex flex-wrap items-center justify-center gap-4 text-sm"
          style={{ animation: "fadeInDown 0.6s ease 0.4s both" }}
        >
          {[
            { value: "7 templates", label: "ready to go" },
            { value: "₹1/msg", label: "WhatsApp overage" },
            { value: "< 30 sec", label: "to first invoice" },
            { value: "0 credit card", label: "to sign up" },
          ].map(s => (
            <div key={s.value} className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
              <span className="font-bold text-white">{s.value}</span>
              <span className="text-slate-400">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Mock dashboard preview */}
        <FadeIn delay={200} className="mt-20 relative">
          <div className="relative mx-auto max-w-4xl">
            {/* Glow behind card */}
            <div className="absolute -inset-4 bg-indigo-500/10 rounded-3xl blur-2xl" />
            <div className="relative rounded-2xl border border-white/10 bg-slate-900/80 backdrop-blur overflow-hidden shadow-2xl">
              {/* Fake browser chrome */}
              <div className="flex items-center gap-1.5 px-4 py-3 border-b border-white/10 bg-white/[0.03]">
                <div className="h-3 w-3 rounded-full bg-rose-500/60" />
                <div className="h-3 w-3 rounded-full bg-amber-500/60" />
                <div className="h-3 w-3 rounded-full bg-emerald-500/60" />
                <div className="ml-4 flex-1 h-5 rounded bg-white/5 max-w-xs text-[10px] text-slate-500 flex items-center px-2">
                  app.billflow.in/dashboard
                </div>
              </div>
              {/* Dashboard preview */}
              <div className="p-5">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <div className="h-3 w-32 bg-white/20 rounded mb-1.5" />
                    <div className="h-2.5 w-20 bg-white/10 rounded" />
                  </div>
                  <div className="h-8 w-28 rounded-lg bg-indigo-600/80 flex items-center justify-center gap-1.5">
                    <div className="h-3 w-3 rounded-sm bg-white/50" />
                    <div className="h-2 w-16 rounded bg-white/50" />
                  </div>
                </div>
                {/* Stat cards */}
                <div className="grid grid-cols-4 gap-3 mb-5">
                  {[
                    { color: "bg-indigo-500/20 border-indigo-500/30", w: "w-16" },
                    { color: "bg-amber-500/20 border-amber-500/30", w: "w-12" },
                    { color: "bg-rose-500/20 border-rose-500/30", w: "w-14" },
                    { color: "bg-emerald-500/20 border-emerald-500/30", w: "w-10" },
                  ].map((c, i) => (
                    <div key={i} className={`rounded-xl border p-3 ${c.color}`}>
                      <div className="h-7 w-7 rounded-lg bg-white/10 mb-2" />
                      <div className={`h-3 ${c.w} bg-white/30 rounded mb-1`} />
                      <div className="h-2 w-16 bg-white/15 rounded" />
                    </div>
                  ))}
                </div>
                {/* Chart placeholder */}
                <div className="rounded-xl border border-white/10 p-4 bg-white/[0.02]">
                  <div className="h-2.5 w-36 bg-white/20 rounded mb-4" />
                  <div className="flex items-end gap-2 h-16">
                    {[30, 50, 40, 70, 55, 90].map((h, i) => (
                      <div key={i} className="flex-1 rounded-t bg-indigo-500/40" style={{ height: `${h}%` }} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>

      <style>{`
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
}

// ─── Features ─────────────────────────────────────────────────────────────────
function Features() {
  return (
    <section id="features" className="py-24 bg-slate-950">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <FadeIn className="text-center mb-16">
          <p className="text-indigo-400 font-semibold text-sm uppercase tracking-widest mb-3">Features</p>
          <h2 className="text-4xl md:text-5xl font-extrabold text-white leading-tight">
            Everything your business needs.<br />
            <span className="text-slate-400 font-normal">Nothing it doesn't.</span>
          </h2>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f, i) => (
            <FadeIn key={f.title} delay={i * 80}>
              <div className="group relative p-6 rounded-2xl border border-white/8 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/15 transition-all duration-300 overflow-hidden">
                {/* Hover glow */}
                <div className={`absolute -top-8 -right-8 h-24 w-24 rounded-full bg-gradient-to-br ${f.color} opacity-0 group-hover:opacity-20 blur-xl transition-opacity`} />
                <div className={`h-11 w-11 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4 shadow-lg`}>
                  <f.icon className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-bold text-white text-lg mb-2">{f.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Templates ────────────────────────────────────────────────────────────────
function Templates() {
  return (
    <section id="templates" className="py-24 bg-gradient-to-b from-slate-950 to-indigo-950/20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <FadeIn className="text-center mb-16">
          <p className="text-indigo-400 font-semibold text-sm uppercase tracking-widest mb-3">Business Templates</p>
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
            Pick your type.<br />We handle the rest.
          </h2>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            Each template pre-configures items, tax settings, reminder schedules, and features suited to your business.
          </p>
        </FadeIn>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {TEMPLATES.map((t, i) => (
            <FadeIn key={t.slug} delay={i * 70}>
              <div className="group p-5 rounded-2xl border border-white/8 bg-white/[0.03] hover:bg-white/[0.07] hover:border-indigo-500/30 transition-all duration-300 cursor-pointer">
                <div className="text-3xl mb-3">{t.emoji}</div>
                <h3 className="font-bold text-white text-base mb-1">{t.label}</h3>
                <p className="text-slate-400 text-sm mb-3 leading-snug">{t.desc}</p>
                <div className="flex flex-wrap gap-1.5">
                  {t.tags.map(tag => (
                    <span key={tag} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </FadeIn>
          ))}
        </div>

        <FadeIn delay={100} className="mt-10 text-center">
          <Link to="/register"
            className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
            Start onboarding with your template
            <ArrowRight className="h-4 w-4" />
          </Link>
        </FadeIn>
      </div>
    </section>
  );
}

// ─── How it works ─────────────────────────────────────────────────────────────
function HowItWorks() {
  const steps = [
    { n: "01", title: "Create your account", desc: "Sign up free in 30 seconds. No credit card needed.", icon: Users },
    { n: "02", title: "Pick your template", desc: "Choose Gym, Restaurant, Clinic, or any of 7 business types.", icon: Zap },
    { n: "03", title: "Add your customers", desc: "Import or manually add customers with WhatsApp numbers.", icon: Smartphone },
    { n: "04", title: "Send invoices", desc: "Create GST invoices and let BillFlow chase payments for you.", icon: Receipt },
  ];

  return (
    <section className="py-24 bg-slate-950">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <FadeIn className="text-center mb-16">
          <p className="text-indigo-400 font-semibold text-sm uppercase tracking-widest mb-3">How it works</p>
          <h2 className="text-4xl md:text-5xl font-extrabold text-white">Up in under 5 minutes.</h2>
        </FadeIn>

        <div className="relative">
          {/* Connecting line */}
          <div className="hidden md:block absolute top-8 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {steps.map((s, i) => (
              <FadeIn key={s.n} delay={i * 100} className="text-center">
                <div className="relative inline-flex mb-4">
                  <div className="h-16 w-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mx-auto">
                    <s.icon className="h-7 w-7 text-indigo-400" />
                  </div>
                  <span className="absolute -top-2 -right-2 text-[10px] font-black text-indigo-400 bg-slate-950 px-1.5 py-0.5 rounded-full border border-indigo-500/30">
                    {s.n}
                  </span>
                </div>
                <h3 className="font-bold text-white mb-2">{s.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{s.desc}</p>
              </FadeIn>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Testimonials ─────────────────────────────────────────────────────────────
function Testimonials() {
  return (
    <section className="py-24 bg-gradient-to-b from-slate-950 to-indigo-950/20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <FadeIn className="text-center mb-16">
          <div className="flex items-center justify-center gap-1 mb-4">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />
            ))}
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold text-white">Loved by Indian businesses</h2>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {TESTIMONIALS.map((t, i) => (
            <FadeIn key={t.name} delay={i * 100}>
              <div className="p-6 rounded-2xl border border-white/8 bg-white/[0.03] hover:bg-white/[0.06] transition-colors h-full flex flex-col">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <blockquote className="text-slate-300 text-sm leading-relaxed flex-1 mb-5">
                  "{t.quote}"
                </blockquote>
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-full ${t.color} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                    {t.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-white text-sm">{t.name}</p>
                    <p className="text-slate-400 text-xs">{t.role}</p>
                  </div>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Pricing ──────────────────────────────────────────────────────────────────
function Pricing() {
  return (
    <section id="pricing" className="py-24 bg-slate-950">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <FadeIn className="text-center mb-16">
          <p className="text-indigo-400 font-semibold text-sm uppercase tracking-widest mb-3">Pricing</p>
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4">Simple, honest pricing.</h2>
          <p className="text-slate-400 text-lg">No setup fees. No hidden charges. Cancel any time.</p>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
          {PLANS.map((plan, i) => (
            <FadeIn key={plan.name} delay={i * 80}>
              <div className={`relative rounded-2xl p-6 border transition-all ${
                plan.highlight
                  ? "border-indigo-500 bg-indigo-950/50 shadow-2xl shadow-indigo-500/20"
                  : "border-white/10 bg-white/[0.03]"
              }`}>
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[11px] font-bold px-3 py-1 rounded-full">
                    {plan.badge}
                  </div>
                )}

                <h3 className="font-bold text-white text-lg mb-1">{plan.name}</h3>
                <div className="flex items-end gap-1 mb-5">
                  <span className="text-4xl font-extrabold text-white">{plan.price}</span>
                  <span className="text-slate-400 mb-1">{plan.period}</span>
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2.5 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-300">{f}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  to="/register"
                  className={`block w-full text-center h-10 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-1.5 ${
                    plan.highlight
                      ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                      : "border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-white"
                  }`}
                >
                  {plan.cta} <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </FadeIn>
          ))}
        </div>

        <FadeIn delay={100}>
          <p className="text-center text-sm text-slate-500 mt-8">
            WhatsApp overage: ₹1/message above plan limit · All plans include 7-day free trial
          </p>
        </FadeIn>
      </div>
    </section>
  );
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────
function FAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section id="faq" className="py-24 bg-gradient-to-b from-slate-950 to-indigo-950/20">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <FadeIn className="text-center mb-14">
          <p className="text-indigo-400 font-semibold text-sm uppercase tracking-widest mb-3">FAQ</p>
          <h2 className="text-4xl font-extrabold text-white">Common questions</h2>
        </FadeIn>

        <div className="space-y-3">
          {FAQS.map((faq, i) => (
            <FadeIn key={i} delay={i * 50}>
              <div
                className="rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden cursor-pointer hover:border-white/15 transition-colors"
                onClick={() => setOpen(open === i ? null : i)}
              >
                <div className="flex items-center justify-between px-5 py-4 gap-4">
                  <span className="font-medium text-white text-sm">{faq.q}</span>
                  <ChevronRight
                    className="h-4 w-4 text-slate-400 flex-shrink-0 transition-transform"
                    style={{ transform: open === i ? "rotate(90deg)" : "rotate(0deg)" }}
                  />
                </div>
                {open === i && (
                  <div className="px-5 pb-4 text-slate-400 text-sm leading-relaxed border-t border-white/8">
                    <div className="pt-3">{faq.a}</div>
                  </div>
                )}
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── CTA Banner ───────────────────────────────────────────────────────────────
function CTABanner() {
  return (
    <section className="py-24 bg-slate-950">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <FadeIn>
          <div className="relative rounded-3xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-violet-600" />
            <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23fff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-40" />
            <div className="relative text-center px-8 py-16">
              <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4 leading-tight">
                Ready to get paid faster?
              </h2>
              <p className="text-indigo-200 text-lg mb-8 max-w-xl mx-auto">
                Join thousands of Indian businesses using BillFlow to invoice smarter, chase less, and earn more.
              </p>
              <Link
                to="/register"
                className="inline-flex items-center gap-2 h-13 px-10 bg-white text-indigo-700 font-extrabold rounded-xl hover:bg-indigo-50 transition-colors text-base shadow-xl"
              >
                Create your free account
                <ArrowRight className="h-5 w-5" />
              </Link>
              <p className="text-indigo-200/60 text-sm mt-4">No credit card · Free 7-day trial · Setup in 5 minutes</p>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="bg-slate-950 border-t border-white/8 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-indigo-500 flex items-center justify-center">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="font-extrabold text-white text-lg">BillFlow</span>
            <span className="text-slate-600 text-sm ml-2">© {new Date().getFullYear()}</span>
          </div>

          <div className="flex items-center gap-6 text-sm text-slate-400">
            {["Privacy", "Terms", "Support"].map(l => (
              <a key={l} href="#" className="hover:text-white transition-colors">{l}</a>
            ))}
          </div>

          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span>Built for 🇮🇳 India</span>
            <span>·</span>
            <span>GST · WhatsApp · UPI</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div className="bg-slate-950 min-h-screen font-sans">
      <Navbar />
      <Hero />
      <Features />
      <Templates />
      <HowItWorks />
      <Testimonials />
      <Pricing />
      <FAQ />
      <CTABanner />
      <Footer />
    </div>
  );
}
