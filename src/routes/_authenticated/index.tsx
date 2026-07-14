import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/AppHeader";
import { themeGradient, themeRing, type CompanyTheme } from "@/lib/companies";
import { ArrowRight, FileText, Receipt } from "lucide-react";

export const Route = createFileRoute("/_authenticated/")({
  component: Landing,
});

interface Company {
  id: string;
  slug: string;
  name: string;
  theme_color: CompanyTheme;
}

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
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/25 via-transparent to-transparent" />
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:py-28">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              Industrial · Digital · Reliable
            </p>
            <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">
              POLYMER DOCUMENT
              <br />
              MANAGEMENT SYSTEM
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
              Digital Delivery Challan &amp; Invoice Management for polymer manufacturing.
            </p>
          </div>

          <div className="mt-14">
            <h2 className="mb-6 text-center text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              Select Company
            </h2>
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
        </div>
      </section>
    </div>
  );
}

function CompanyCard({ company }: { company: Company }) {
  const theme = (company.theme_color ?? "blue") as CompanyTheme;
  return (
    <Link
      to="/company/$slug"
      params={{ slug: company.slug }}
      className={`group glass relative block overflow-hidden rounded-2xl p-6 ring-1 ${themeRing[theme]} transition hover:-translate-y-1 hover:shadow-2xl`}
    >
      <div
        className={`absolute inset-x-0 top-0 h-28 bg-gradient-to-br ${themeGradient[theme]} opacity-90`}
      />
      <div className="relative flex h-28 items-start justify-between">
        <div className="grid h-14 w-14 place-items-center rounded-xl bg-white/95 text-slate-900 shadow-lg">
          <FileText className="h-6 w-6" />
        </div>
        <ArrowRight className="h-5 w-5 text-white/90 transition group-hover:translate-x-1" />
      </div>
      <div className="relative mt-6">
        <h3 className="text-lg font-bold leading-tight">{company.name}</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Delivery Challans · Tax Invoices
        </p>
        <div className="mt-4 flex gap-2 text-xs">
          <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 font-medium">
            <FileText className="h-3 w-3" /> Challan
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 font-medium">
            <Receipt className="h-3 w-3" /> Invoice
          </span>
        </div>
      </div>
    </Link>
  );
}
