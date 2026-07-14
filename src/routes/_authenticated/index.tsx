import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/AppHeader";
import { type CompanyTheme } from "@/lib/companies";
import { ArrowRight, FileText, Receipt, Truck, ShieldCheck } from "lucide-react";
import heroVideo from "@/assets/PolytheneMfcVideo.mp4.asset.json";
import srBg from "@/assets/SRPolymersBG.png.asset.json";
import shivaBg from "@/assets/ShivaSaiBG.png.asset.json";
import suryaBg from "@/assets/SuryaTejaBG.png.asset.json";

export const Route = createFileRoute("/_authenticated/")({
  component: Landing,
});

interface Company {
  id: string;
  slug: string;
  name: string;
  theme_color: CompanyTheme;
}

const BG_BY_SLUG: Record<string, string> = {
  "sr-polymers": srBg.url,
  "shiva-sai-polymers": shivaBg.url,
  "suryateja-poly-films": suryaBg.url,
};

function Landing() {
  const { data: companies, isLoading } = useQuery({
    queryKey: ["companies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("id, slug, name, theme_color")
        .order("name");
      if (error) throw error;
      return data as Company[];
    },
  });

  return (
    <div className="min-h-screen">
      <AppHeader />

      {/* Hero */}
      <section className="relative isolate overflow-hidden">
        <video
          autoPlay loop muted playsInline preload="auto"
          className="absolute inset-0 -z-20 h-full w-full object-cover"
          aria-hidden
        >
          <source src={heroVideo.url} type="video/mp4" />
        </video>
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-slate-950/85 via-slate-900/70 to-blue-950/80" aria-hidden />

        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:py-32">
          <div className="max-w-3xl text-white">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] backdrop-blur">
              <ShieldCheck className="h-3.5 w-3.5" /> Manufacturing · Digital · Reliable
            </p>
            <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-6xl">
              Polymer Document<br />Management System
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-white/80 sm:text-lg">
              A single control center for polymer manufacturing paperwork — issue, track and audit every dispatch, challan and invoice with confidence.
            </p>
            <ul className="mt-6 grid gap-2 text-sm text-white/90 sm:grid-cols-3">
              <HeroBullet icon={<FileText className="h-4 w-4" />}>Manage Delivery Challans</HeroBullet>
              <HeroBullet icon={<Receipt className="h-4 w-4" />}>Manage Tax Invoices</HeroBullet>
              <HeroBullet icon={<Truck className="h-4 w-4" />}>Track Manufacturing Dispatches</HeroBullet>
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#workspaces"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 shadow-lg transition hover:-translate-y-0.5 hover:shadow-2xl"
              >
                Enter Workspace <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href="#workspaces"
                className="inline-flex items-center rounded-xl border border-white/30 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
              >
                View companies
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Company cards */}
      <section id="workspaces" className="relative">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Workspaces</p>
              <h2 className="mt-1 text-2xl font-bold sm:text-3xl">Select a company</h2>
            </div>
            <p className="hidden max-w-md text-sm text-muted-foreground sm:block">
              Each workspace houses its own delivery challans, tax invoices and dispatch history.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {isLoading &&
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="glass h-64 animate-pulse rounded-2xl" />
              ))}
            {companies?.map((c) => (
              <CompanyCard key={c.id} company={c} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function HeroBullet({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 py-2 backdrop-blur">
      <span className="grid h-6 w-6 place-items-center rounded-md bg-white/15">{icon}</span>
      <span>{children}</span>
    </li>
  );
}

function CompanyCard({ company }: { company: Company }) {
  const bg = BG_BY_SLUG[company.slug];
  return (
    <Link
      to="/company/$slug"
      params={{ slug: company.slug }}
      className="group relative block h-72 overflow-hidden rounded-2xl shadow-lg ring-1 ring-black/10 transition hover:-translate-y-1 hover:shadow-2xl"
    >
      {bg ? (
        <img
          src={bg}
          alt=""
          className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-950" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20" />
      <div className="relative flex h-full flex-col justify-between p-6 text-white">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest backdrop-blur">
            Workspace
          </span>
          <ArrowRight className="h-5 w-5 opacity-80 transition group-hover:translate-x-1" />
        </div>
        <div>
          <h3 className="text-2xl font-black leading-tight drop-shadow">{company.name}</h3>
          <p className="mt-1 text-xs text-white/80">Delivery Challans · Tax Invoices · Dispatch</p>
          <div className="mt-4 flex gap-2 text-xs">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 font-medium backdrop-blur">
              <FileText className="h-3 w-3" /> Challan
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 font-medium backdrop-blur">
              <Receipt className="h-3 w-3" /> Invoice
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
