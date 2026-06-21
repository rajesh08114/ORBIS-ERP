"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  BarChart3,
  Boxes,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Factory,
  Moon,
  Users,
  ShieldCheck,
  Sun,
  TrendingUp,
  Truck,
  Loader2,
  Plus
} from "@/components/icons";
import { OrbisLogo } from "@/components/layout/orbis-logo";
import { useAuthStore } from "@/stores/auth-store";

const slides = [
  {
    title: "Executive Command Center",
    description: "One operating picture for revenue, margins, and fulfillment capacity across all furniture lines.",
    image: "/product/executive.png",
    metric: "$1.4M",
    label: "Monthly revenue",
    trend: "+12.8% MoM",
    icon: Activity,
  },
  {
    title: "Inventory & Stock Tracking",
    description: "Real-time visibility into every wooden leg, top, and screw as it moves through the warehouse.",
    image: "/product/digital-twin.png",
    metric: "98.4%",
    label: "Stock accuracy",
    trend: "Real-time sync",
    icon: Boxes,
  },
  {
    title: "Procurement Automation",
    description: "Automatically trigger purchase orders for raw materials when stock falls below thresholds.",
    image: "/product/inventory.png",
    metric: "4.2x",
    label: "Inventory turns",
    trend: "Zero shortages",
    icon: BarChart3,
  },
  {
    title: "Manufacturing Tracking",
    description: "Convert Bill of Materials into active work orders, tracking assembly, painting, and packing.",
    image: "/product/manufacturing.png",
    metric: "87.6%",
    label: "Production efficiency",
    trend: "+4.1% target",
    icon: Factory,
  },
  {
    title: "Sales & Delivery",
    description: "Manage customer orders, reserve stock dynamically, and ensure on-time delivery.",
    image: "/product/procurement.png",
    metric: "14 Days",
    label: "Avg lead time",
    trend: "MTO & MTS flows",
    icon: Truck,
  }
] as const;

const workflows = [
  {
    step: "01",
    department: "Sales Module",
    title: "Order Received",
    description: "Customer orders stream into the system, initiating stock availability checks.",
    kpi: "SO-2026-0042",
    label: "Sales Order",
    color: "from-blue-500 to-indigo-500",
  },
  {
    step: "02",
    department: "Inventory Module",
    title: "Stock Reservation",
    description: "Dynamic allocation engine checks warehouse stock, reserving finished goods if Make-to-Stock.",
    kpi: "MTS / MTO Check",
    label: "Flow Type",
    color: "from-teal-500 to-emerald-500",
  },
  {
    step: "03",
    department: "Purchase Module",
    title: "Procurement Trigger",
    description: "If raw materials (like Wood, Screws) drop below threshold, purchase orders are automatically created.",
    kpi: "PO-2026-0812",
    label: "Purchase Order",
    color: "from-amber-500 to-orange-500",
  },
  {
    step: "04",
    department: "Manufacturing Module",
    title: "Work Order Execution",
    description: "BoM definitions expand into manufacturing orders. Assembly, painting, and packing steps are tracked.",
    kpi: "MO-8842 Active",
    label: "Manufacturing Order",
    color: "from-purple-500 to-pink-500",
  },
  {
    step: "05",
    department: "Fulfillment",
    title: "Product Delivered",
    description: "Finished goods are added to stock, then dispatched to the customer. Stock ledger updates instantly.",
    kpi: "100% Delivered",
    label: "Fulfillment Status",
    color: "from-emerald-500 to-green-600",
  },
  {
    step: "06",
    department: "System Audit",
    title: "End-to-End Traceability",
    description: "Every order, purchase, manufacturing task, and inventory movement is permanently logged.",
    kpi: "AUD-1049 Logged",
    label: "Audit Event",
    color: "from-slate-600 to-slate-800",
  }
];

export default function HomePage() {
  const [active, setActive] = useState(0);
  const [activeWorkflow, setActiveWorkflow] = useState(0);
  const { resolvedTheme, setTheme } = useTheme();

  const user = useAuthStore((state) => state.user);
  const hydrated = useAuthStore((state) => state.hydrated);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const showLoggedIn = isClient && hydrated && !!user;

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActive((current) => (current + 1) % slides.length);
    }, 8000);
    return () => window.clearInterval(timer);
  }, []);

  const slide = slides[active];

  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)] overflow-x-hidden font-sans">

      {/* 1. Header (Sticky & Glassmorphism) */}
      <header className="glass fixed inset-x-0 top-0 z-50 border-b border-[var(--border)]">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-5 lg:px-8">
          <div className="flex items-center gap-2">
            <OrbisLogo />
          </div>

          {/* Header Navigation removed per request */}          <div className="flex items-center gap-4">
            <button
              className="focus-ring grid h-9 w-9 place-items-center rounded-[8px] border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-muted)] transition"
              aria-label="Toggle theme"
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            >
              {resolvedTheme === "dark" ? <Sun className="h-4 w-4 text-amber-500" /> : <Moon className="h-4 w-4" />}
            </button>
            {showLoggedIn ? (
              <Link className="rounded-[8px] bg-[var(--primary)] px-4 py-2 text-sm font-bold text-white dark:text-[#0d0d0f] hover:bg-[var(--primary-strong)] transition" href={user?.home || "/dashboard"}>
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link className="hidden sm:block text-sm font-semibold hover:text-[var(--primary)] transition" href="/login">
                  Sign In
                </Link>
                <Link className="rounded-[8px] bg-[var(--primary)] px-4 py-2 text-sm font-bold text-white dark:text-[#0d0d0f] hover:bg-[var(--primary-strong)] transition" href="/login">
                  Explore Demo Workspace
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 2. Hero Section (Gradient & Glowing Backgrounds with Embedded Product Carousel) */}
      <section className="relative min-h-[90vh] flex items-center border-b border-[var(--border)] pt-20 overflow-hidden bg-gradient-to-b from-[var(--background)] to-[var(--surface-muted)]">
        <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-[var(--primary)]/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-[600px] h-[300px] bg-[var(--secondary)]/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808006_1px,transparent_1px),linear-gradient(to_bottom,#80808006_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

        <div className="relative mx-auto max-w-[1440px] px-5 py-12 lg:px-8 grid lg:grid-cols-12 gap-12 items-center w-full">
          {/* Left: Headline, Call-to-Actions & Metrics */}
          <div className="lg:col-span-5 space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)]/80 px-3.5 py-1.5 text-xs font-semibold text-[var(--primary)] shadow-sm">
              <Activity className="h-3.5 w-3.5 animate-pulse" /> Shiv Furniture Works
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-[1.1]">
              Mini ERP: <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)]">
                From Demand to Delivery
              </span>
            </h1>

            <p className="text-sm leading-relaxed text-[var(--muted)] max-w-md">
              Ditch the disconnected spreadsheets. <br />
              Digitally manage your complete business flow from Sales and Manufacturing to Procurement and Inventory.
            </p>

            <div className="flex flex-wrap gap-3 pt-1">
              <Link className="inline-flex items-center gap-1.5 rounded-[8px] bg-[var(--primary)] px-5 py-3 text-sm font-bold text-white dark:text-[#0d0d0f] shadow-lg shadow-[var(--primary)]/10 hover:bg-[var(--primary-strong)] transition cursor-pointer" href={showLoggedIn ? (user?.home || "/dashboard") : "/login"}>
                Explore Dashboard <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <a className="rounded-[8px] border border-[var(--border)] bg-[var(--surface)] px-5 py-3 text-sm font-bold text-[var(--foreground)] hover:bg-[var(--surface-muted)] transition shadow-sm cursor-pointer" href="#twin">
                Watch Demo
              </a>
            </div>

            {/* Quick Metrics Grid (Aligned with reference screen) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-[var(--border)] pt-6 mt-8 w-full">
              <div>
                <div className="text-[10px] uppercase font-bold text-[var(--muted)] leading-none">Total Orders</div>
                <div className="text-lg font-extrabold text-[var(--foreground)] mt-1.5">1,248</div>
                <span className="inline-flex mt-1 text-[9px] font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded leading-none">+12.5%</span>
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-[var(--muted)] leading-none">On-Time Delivery</div>
                <div className="text-lg font-extrabold text-[var(--foreground)] mt-1.5">96.8%</div>
                <span className="inline-flex mt-1 text-[9px] font-bold text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded leading-none">-3.2%</span>
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-[var(--muted)] leading-none">Inventory Health</div>
                <div className="text-lg font-extrabold text-[var(--foreground)] mt-1.5">88.6%</div>
                <span className="inline-flex mt-1 text-[9px] font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded leading-none">+1.1%</span>
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-[var(--muted)] leading-none">Mfg. Efficiency</div>
                <div className="text-lg font-extrabold text-[var(--foreground)] mt-1.5">91.3%</div>
                <span className="inline-flex mt-1 text-[9px] font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded leading-none">+4.4%</span>
              </div>
            </div>
          </div>

          {/* Right: Embedded Overlapping Product Carousel */}
          <div className="lg:col-span-7 space-y-4">
            {/* Slide Navigation Tabs removed per request */}

            {/* Stacked 3D overlapping mockup panels */}
            <div className="relative w-full aspect-[16/10] select-none mt-4 lg:mt-0">
              {/* Back card (deco) */}
              <div className="absolute inset-0 rounded-[16px] border border-white/5 bg-[#161618]/40 shadow-xl transform translate-x-4 -translate-y-4 scale-[0.98] rotate-[1.5deg] blur-[0.5px] pointer-events-none transition duration-700 ease-out hidden sm:block" />

              {/* Middle card (deco) */}
              <div className="absolute inset-0 rounded-[16px] border border-white/10 bg-[#161618]/60 shadow-2xl transform -translate-x-2 translate-y-2 -rotate-[1deg] blur-[0.2px] pointer-events-none transition duration-700 ease-out hidden sm:block" />

              {/* Main front active card */}
              <div className="absolute inset-0 rounded-[16px] border border-[var(--border)] bg-[#151118]/95 overflow-hidden shadow-2xl z-10 flex flex-col">
                {/* Browser control header */}
                <div className="flex h-10 items-center justify-between border-b border-white/10 bg-black/40 px-4 text-white/50">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#ff7b72]/85" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#d7b45b]/85" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#62b77b]/85" />
                    <div className="absolute top-0 left-4 px-2 -mt-3 bg-[var(--surface-muted)] text-[10px] font-bold tracking-widest text-[var(--muted)] uppercase">
                      Furniture ERP Workspace Control Panel
                    </div>
                  </div>
                  {/* Arrow navigation shortcut buttons */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setActive((active - 1 + slides.length) % slides.length)}
                      className="h-6 w-6 rounded bg-white/5 flex items-center justify-center text-slate-300 hover:bg-white/10 cursor-pointer"
                      aria-label="Previous slide"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setActive((active + 1) % slides.length)}
                      className="h-6 w-6 rounded bg-white/5 flex items-center justify-center text-slate-300 hover:bg-white/10 cursor-pointer"
                      aria-label="Next slide"
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Active Image container */}
                <div className="relative w-full h-[calc(100%-40px)] bg-slate-950">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={slide.image}
                      initial={{ opacity: 0, scale: 1.01 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.4 }}
                      className="absolute inset-0"
                    >
                      <Image
                        src={slide.image}
                        alt={slide.title}
                        fill
                        className="object-cover object-top"
                        sizes="(max-width: 1024px) 100vw, 55vw"
                        priority
                      />

                      {/* Floating Info Overlay (Glassmorphism) */}
                      <div className="absolute bottom-4 left-4 right-4 glass p-4 rounded-[12px] border border-white/10 text-white flex items-center justify-between bg-black/60 shadow-lg">
                        <div className="min-w-0 font-sans">
                          <div className="text-[9px] uppercase font-bold tracking-wider opacity-60">Control Console</div>
                          <div className="text-xs font-bold truncate mt-0.5">{slide.title}</div>
                          <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{slide.description}</p>
                        </div>
                        <div className="flex items-center gap-3 text-right shrink-0">
                          <div>
                            <div className="text-[9px] uppercase font-bold tracking-wider opacity-60">{slide.label}</div>
                            <div className="text-xs font-extrabold text-[#34d399] mt-0.5">{slide.metric}</div>
                          </div>
                          <div className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded animate-pulse">
                            {slide.trend}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Digital Twin Showcase */}
      <section id="twin" className="border-b border-[var(--border)] py-24 bg-[var(--background)]">
        <div className="mx-auto max-w-[1440px] px-5 lg:px-8 grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5 space-y-6">
            <span className="text-sm font-bold uppercase tracking-wider text-[var(--primary)]">Flagship Capability</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
              See your entire business as a living digital system.
            </h2>
            <p className="text-[var(--muted)] leading-relaxed">
              Trace orders seamlessly from procurement, raw stock delivery (wood, screws, fabric), assembly queues, final balancing tests, to outbound shipment logs. Every node is responsive, interactive, and connected.
            </p>
            <div className="space-y-4 pt-2">
              {[
                "Trace inventory velocity and shortages beforehand.",
                "Simulate demand fluctuations and supply route disruptions.",
                "Review active plant workloads and machine utilization live."
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 text-sm font-bold text-[var(--foreground)]">
                  <CheckCircle2 className="h-4.5 w-4.5 text-[var(--success)] shrink-0" />
                  {item}
                </div>
              ))}
            </div>
            <div className="pt-2">
              <Link href={showLoggedIn ? (user?.home || "/dashboard") : "/login"} className="inline-flex items-center gap-2 rounded-[8px] bg-[var(--primary)] px-5 py-3 font-bold text-white hover:bg-[var(--primary-strong)] transition">
                Open Digital Twin <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Interactive twin visuals */}
          <div className="lg:col-span-7 relative p-6 rounded-[16px] border border-[var(--border)] bg-[var(--surface)] shadow-lg overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--border)] mb-6">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-xs font-bold tracking-tight">Active Plant Flow Graph</span>
              </div>
              <span className="text-[10px] font-mono text-[var(--muted)]">Status: Healthy (98.2%)</span>
            </div>

            {/* Simulation of a real digital twin graph */}
            <div className="relative min-h-[300px] border border-[var(--border)] bg-[var(--surface-muted)] rounded-[12px] p-6 flex flex-col justify-between">

              {/* Nodes stack */}
              <div className="grid grid-cols-3 gap-6 relative z-10">
                <div className="p-3 rounded-[10px] border border-emerald-500/20 bg-emerald-500/5 text-center">
                  <div className="text-[10px] font-bold uppercase text-[var(--muted)]">Stock In</div>
                  <div className="text-sm font-extrabold text-[var(--foreground)] mt-1">32k Units</div>
                  <div className="text-[9px] text-emerald-500 mt-0.5">Optimal levels</div>
                </div>
                <div className="p-3 rounded-[10px] border border-purple-500/20 bg-purple-500/5 text-center">
                  <div className="text-[10px] font-bold uppercase text-[var(--muted)]">Wood Workshop</div>
                  <div className="text-sm font-extrabold text-[var(--foreground)] mt-1">87% Load</div>
                  <div className="text-[9px] text-purple-400 mt-0.5">High efficiency</div>
                </div>
                <div className="p-3 rounded-[10px] border border-blue-500/20 bg-blue-500/5 text-center">
                  <div className="text-[10px] font-bold uppercase text-[var(--muted)]">Shipping</div>
                  <div className="text-sm font-extrabold text-[var(--foreground)] mt-1">99% Dispatched</div>
                  <div className="text-[9px] text-blue-400 mt-0.5">On time</div>
                </div>
              </div>

              {/* Central connection map */}
              <div className="my-6 border-y border-[var(--border)] py-4 text-center">
                <div className="text-xs text-[var(--muted)] font-semibold">
                  Simulation path: <strong className="text-[var(--primary)]">Demand-pull cycles</strong>
                </div>
                <div className="mt-2 flex justify-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse delay-75" />
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse delay-150" />
                </div>
              </div>

              {/* Metric readouts */}
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-[var(--muted)]">Data feeds linked:</span>
                <span className="text-[var(--primary)] flex items-center gap-1">
                  <Activity className="h-3.5 w-3.5 animate-pulse" /> 1,240 events / sec
                </span>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* 5. Manufacturing Showcase */}
      <section className="border-b border-[var(--border)] py-24 bg-[var(--surface)]">
        <div className="mx-auto max-w-[1440px] px-5 lg:px-8 grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 relative aspect-[16/10] w-full rounded-[16px] border border-[var(--border)] bg-[var(--surface-muted)] overflow-hidden shadow-md lg:order-2">
            <Image src="/product/manufacturing.png?v=2" alt="Manufacturing Command Center" fill className="object-cover object-top" />
          </div>

          <div className="lg:col-span-6 space-y-6 lg:order-1">
            <span className="text-sm font-bold uppercase tracking-wider text-[var(--primary)]">Operations Excellence</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
              Coordinate work centers, routings, and yields.
            </h2>
            <p className="text-[var(--muted)] leading-relaxed">
              Define detailed Bill of Materials (BoM) trees (e.g. Wooden Table = 4 Legs + 1 Top + 12 Screws), link machining operations to work centers, schedule personnel workloads, and evaluate line bottlenecks dynamically.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-[12px] bg-[var(--surface-muted)] border border-[var(--border)]">
                <div className="text-xs text-[var(--muted)]">OEE Efficiency</div>
                <div className="text-2xl font-extrabold text-[var(--primary)] mt-1">87.6%</div>
                <div className="text-[10px] text-[var(--success)] mt-0.5">+4.1% MoM</div>
              </div>
              <div className="p-4 rounded-[12px] bg-[var(--surface-muted)] border border-[var(--border)]">
                <div className="text-xs text-[var(--muted)]">Avg Changeover</div>
                <div className="text-2xl font-extrabold text-[var(--primary)] mt-1">14 Mins</div>
                <div className="text-[10px] text-[var(--success)] mt-0.5">Target achieved</div>
              </div>
            </div>
            <div className="pt-2">
              <Link href={showLoggedIn ? "/manufacturing/command-center" : "/login"} className="inline-flex items-center gap-1.5 text-sm font-bold text-[var(--primary)] hover:underline">
                Explore Manufacturing Module <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Inventory Showcase */}
      <section className="border-b border-[var(--border)] py-24 bg-[var(--background)]">
        <div className="mx-auto max-w-[1440px] px-5 lg:px-8 grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 relative aspect-[16/10] w-full rounded-[16px] border border-[var(--border)] bg-[var(--surface-muted)] overflow-hidden shadow-md">
            <Image src="/product/inventory.png?v=2" alt="Inventory Intelligence Dashboard" fill className="object-cover object-top" />
          </div>

          <div className="lg:col-span-6 space-y-6">
            <span className="text-sm font-bold uppercase tracking-wider text-[var(--primary)]">Warehouse & Valuation</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
              A real-time stock ledger, not a set of records.
            </h2>
            <p className="text-[var(--muted)] leading-relaxed">
              Achieve precise trace capability of stock movements. Balance service levels dynamically, evaluate raw component reserves against incoming supplier deliveries, and run audit-safe cycle counts.
            </p>
            <div className="grid grid-cols-3 gap-4 pt-2">
              <div>
                <div className="text-lg font-extrabold text-[var(--foreground)]">4.2x</div>
                <div className="text-xs text-[var(--muted)]">Turns / year</div>
              </div>
              <div>
                <div className="text-lg font-extrabold text-[var(--foreground)]">98.2%</div>
                <div className="text-xs text-[var(--muted)]">Fulfillment yield</div>
              </div>
              <div>
                <div className="text-lg font-extrabold text-[var(--foreground)]">0%</div>
                <div className="text-xs text-[var(--muted)]">Shrink variance</div>
              </div>
            </div>
            <div className="pt-2">
              <Link href={showLoggedIn ? "/inventory" : "/login"} className="inline-flex items-center gap-1.5 text-sm font-bold text-[var(--primary)] hover:underline">
                View Inventory Controls <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Analytics Showcase */}
      <section id="analytics" className="border-b border-[var(--border)] py-24 bg-[var(--surface)]">
        <div className="mx-auto max-w-[1440px] px-5 lg:px-8 grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 relative aspect-[16/10] w-full rounded-[16px] border border-[var(--border)] bg-[var(--surface-muted)] overflow-hidden shadow-md lg:order-2">
            <Image src="/product/executive.png?v=2" alt="Executive Intelligence Dashboard" fill className="object-cover object-top" />
          </div>

          <div className="lg:col-span-6 space-y-6 lg:order-1">
            <span className="text-sm font-bold uppercase tracking-wider text-[var(--primary)]">Executive Intelligence</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
              Executive clarity back-linked to line tasks.
            </h2>
            <p className="text-[var(--muted)] leading-relaxed">
              Consolidate revenue projections, supplier risk scores, work order cycle times, and customer fulfillment ratios into a single operating picture. Drill down from high-level KPIs to specific transactions.
            </p>
            <div className="space-y-3">
              {[
                "Unified revenue pipeline projections ($18.4M active)",
                "Role-aware operational metric visibility limits",
                "Consistently aligned performance indicators"
              ].map((item) => (
                <div key={item} className="flex items-center gap-2.5 text-sm font-bold text-[var(--foreground)]">
                  <CheckCircle2 className="h-4.5 w-4.5 text-[var(--success)] shrink-0" />
                  {item}
                </div>
              ))}
            </div>
            <div className="pt-2">
              <Link href={showLoggedIn ? "/dashboard" : "/login"} className="inline-flex items-center gap-1.5 text-sm font-bold text-[var(--primary)] hover:underline">
                Open Executive Analytics <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 8. ERP Workflow Visualization */}
      <section id="workflow" className="border-b border-[var(--border)] py-24 bg-[var(--background)]">
        <div className="mx-auto max-w-[1440px] px-5 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-sm font-bold uppercase tracking-wider text-[var(--primary)]">Order to Delivery</span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold tracking-tight">The Lifecycle of an Operation</h2>
            <p className="mt-4 text-[var(--muted)] leading-relaxed">
              Click any step in the pipeline below to see how ORBIS handles data and triggers actions.
            </p>
          </div>

          {/* Interactive Steps Pipeline */}
          <div className="mt-14 grid md:grid-cols-6 gap-3">
            {workflows.map((wf, index) => {
              const isActive = index === activeWorkflow;
              return (
                <button
                  key={wf.step}
                  onClick={() => setActiveWorkflow(index)}
                  className={`text-left p-4.5 rounded-[12px] border transition relative flex flex-col justify-between aspect-square md:aspect-auto md:min-h-[160px] ${isActive
                      ? "border-[var(--primary)] bg-[var(--surface)] shadow-md ring-2 ring-[var(--primary)]/10"
                      : "border-[var(--border)] bg-[var(--surface-muted)] hover:bg-[var(--surface)]"
                    }`}
                >
                  <div>
                    <div className="flex items-center justify-between text-xs font-bold text-[var(--muted)]">
                      <span>{wf.step}</span>
                      <span className="text-[10px] uppercase">{wf.department}</span>
                    </div>
                    <div className="text-sm font-extrabold text-[var(--foreground)] mt-4 leading-snug">
                      {wf.title}
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-[var(--border)] pt-3 text-[10px]">
                    <span className="text-[var(--muted)]">{wf.label}</span>
                    <span className="font-bold text-[var(--primary)]">{wf.kpi}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Details pane of active workflow step */}
          <div className="mt-6 p-6 rounded-[16px] border border-[var(--border)] bg-[var(--surface)] shadow-sm">
            <div className="grid sm:grid-cols-[1fr_auto] gap-6 items-center">
              <div>
                <div className="text-[10px] uppercase font-bold text-[var(--primary)] tracking-wider">
                  Workflow Phase Details — Step {workflows[activeWorkflow].step}
                </div>
                <h3 className="text-lg font-black text-[var(--foreground)] mt-2">
                  {workflows[activeWorkflow].title}
                </h3>
                <p className="text-sm text-[var(--muted)] mt-2 leading-relaxed max-w-3xl">
                  {workflows[activeWorkflow].description}
                </p>
              </div>
              <div>
                <Link href={showLoggedIn ? (user?.home || "/dashboard") : "/login"} className="inline-flex items-center gap-1.5 rounded-[8px] bg-[var(--surface-muted)] hover:bg-[var(--surface-raised)] border border-[var(--border)] px-4 py-2.5 text-xs font-bold transition">
                  Simulate In Sandbox <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 9. Security & Access Administration */}
      <section id="access" className="border-b border-[var(--border)] py-24 bg-[var(--surface)]">
        <div className="mx-auto max-w-[1440px] px-5 lg:px-8 grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="h-10 w-10 rounded-[10px] bg-[var(--primary-soft)] flex items-center justify-center text-[var(--primary)]">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
              Enterprise Governance. Built-in Security.
            </h2>
            <p className="text-[var(--muted)] leading-relaxed">
              Restrict workspace screens automatically depending on personnel roles. From inventory coordinators to company directors, every user accesses tools optimized for their exact responsibilities while administrators retain complete command.
            </p>
            <div className="p-4 rounded-[12px] border border-[var(--border)] bg-[var(--surface-muted)]">
              <div className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Audit Trails</div>
              <p className="text-xs text-[var(--muted)] mt-2 leading-relaxed">
                Dynamic change records are automatically registered to log file events, creating clean trace entries.
              </p>
            </div>
          </div>

          {/* Graphical Mockup of Audit Trail */}
          <div className="relative aspect-[16/10] w-full rounded-[16px] border border-[var(--border)] bg-[var(--surface-muted)] overflow-hidden shadow-md">
            <Image src="/product/audit.png?v=2" alt="Audit logs security panel" fill className="object-cover object-top" />
          </div>
        </div>
      </section>

      {/* 10. Testimonials */}
      <section className="border-b border-[var(--border)] py-24 bg-[var(--background)]">
        <div className="mx-auto max-w-[1440px] px-5 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-sm font-bold uppercase tracking-wider text-[var(--primary)]">Success Stories</span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold tracking-tight">Vouched for by Industrial Operators</h2>
          </div>

          <div className="mt-14 grid md:grid-cols-3 gap-6">
            {[
              {
                quote: "This ERP gave our executive team one view of system throughput without taking control away from individual shop floor stations.",
                author: "Elena Rossi",
                role: "COO, Prime Wood Components",
                avatar: "ER"
              },
              {
                quote: "The live operations graph changed our weekly pipeline syncs from troubleshooting data into actual forward-planning.",
                author: "Marcus Lee",
                role: "VP Manufacturing, Arcwell Furniture",
                avatar: "ML"
              },
              {
                quote: "We reduced transport expedites by 18% because stock rooms and purchase engines are automatically synced.",
                author: "Anika Patel",
                role: "Supply Chain Director, Meridian Living",
                avatar: "AP"
              }
            ].map((t) => (
              <figure key={t.author} className="p-6.5 rounded-[16px] border border-[var(--border)] bg-[var(--surface)] shadow-sm flex flex-col justify-between">
                <blockquote className="text-sm leading-relaxed text-[var(--foreground)] italic">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                <figcaption className="mt-8 flex items-center gap-3.5 border-t border-[var(--border)] pt-4">
                  <div className="h-9 w-9 rounded-full bg-[var(--primary-soft)] flex items-center justify-center font-bold text-xs text-[var(--primary)]">
                    {t.avatar}
                  </div>
                  <div>
                    <strong className="text-xs font-bold text-[var(--foreground)] block">{t.author}</strong>
                    <span className="text-[10px] text-[var(--muted)] block mt-0.5">{t.role}</span>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* 11. CTA Section */}
      <section className="bg-gradient-to-tr from-[#57344f] to-[#7c5071] py-20 text-white relative overflow-hidden dark:from-[#14351f] dark:to-[#12b76a]">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white/5 rounded-full blur-[80px]" />
        <div className="mx-auto max-w-[1240px] px-5 lg:px-8 relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Connect your industrial operations today.
            </h2>
            <p className="text-white/70 mt-2 max-w-xl">
              Access the role-based Shiv Furniture Works demo sandbox. Verify BOM rollups, cycle counts, work orders, and executive views immediately.
            </p>
          </div>
          <Link className="inline-flex shrink-0 items-center gap-2 rounded-[8px] bg-white px-6 py-3.5 font-bold shadow-xl hover:bg-slate-50 transition" style={{ color: "#57344f" }} href={showLoggedIn ? (user?.home || "/dashboard") : "/login"}>
            {showLoggedIn ? "Go to Dashboard" : "Open Sandbox Workspace"} <ArrowRight className="h-4.5 w-4.5" />
          </Link>
        </div>
      </section>

      {/* 12. Footer */}
      <footer className="bg-[#100c12] py-12 text-slate-400 border-t border-slate-900">
        <div className="mx-auto max-w-[1440px] px-5 lg:px-8 grid gap-8 md:grid-cols-[1fr_auto]">
          <div>
            <Link href="/" className="text-white text-lg font-extrabold hover:text-white/80 transition cursor-pointer">
              Shiv Furniture Works
            </Link>
            <p className="mt-2 text-xs text-slate-500">The digital backbone for furniture manufacturing.</p>
          </div>
          <div className="flex flex-wrap gap-6 text-xs font-semibold text-slate-400">
            <a href="#platform" className="hover:text-white transition">Modules</a>
            <a href="#twin" className="hover:text-white transition">Digital Twin</a>
            {showLoggedIn ? (
              <Link href={user?.home || "/dashboard"} className="hover:text-white transition">Dashboard</Link>
            ) : (
              <Link href="/login" className="hover:text-white transition">Sign In</Link>
            )}
            <span className="text-slate-600">|</span>
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> System Operational
            </span>
          </div>
        </div>
      </footer>

    </main>
  );
}
