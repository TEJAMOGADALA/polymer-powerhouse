import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/AppHeader";
import { themeGradient, type CompanyTheme } from "@/lib/companies";
import { FileText, Receipt, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/_authenticated/company/$slug")({
  component: CompanyPage,
});

function CompanyPage() {
  const { slug } = Route.useParams();
  const { data: company, isLoading } = useQuery({
    queryKey: ["company", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("id, slug, name, theme_color")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      if (!data) throw notFound();
      return data;
    },
  });

  const theme = ((company?.theme_color as CompanyTheme) ?? "blue");

  return (
    <div className="min-h-screen">
      <AppHeader title={company?.name} dashboardHref={`/company/${slug}/dashboard`} />
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <Link to="/" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> All companies
        </Link>

        <div className={`glass overflow-hidden rounded-2xl`}>
          <div className={`h-28 bg-gradient-to-br ${themeGradient[theme]}`} />
          <div className="p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Company Workspace
            </p>
            <h1 className="mt-1 text-2xl font-black sm:text-3xl">
              {isLoading ? "Loading…" : company?.name}
            </h1>
          </div>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          <ModuleCard
            title="Delivery Challan"
            desc="Create, print, and track delivery challans."
            icon={<FileText className="h-6 w-6" />}
            to="/company/$slug/challan/new"
            slug={slug}
            theme={theme}
          />
          <ModuleCard
            title="Tax Invoice"
            desc="Generate GST invoices with full workflow."
            icon={<Receipt className="h-6 w-6" />}
            to="/company/$slug/invoice/new"
            slug={slug}
            theme={theme}
          />
        </div>

        <div className="mt-10 glass rounded-2xl p-6 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Tip</p>
          <p className="mt-1">
            All generated documents live under the Dashboard, with a 24-hour cancellation window.
          </p>
        </div>
      </div>
    </div>
  );
}

function ModuleCard({
  title, desc, icon, to, slug, theme,
}: {
  title: string; desc: string; icon: React.ReactNode; to: "/company/$slug/challan/new" | "/company/$slug/invoice/new"; slug: string; theme: CompanyTheme;
}) {
  return (
    <Link
      to={to}
      params={{ slug }}
      className="glass group block rounded-2xl p-6 transition hover:-translate-y-0.5 hover:shadow-xl"
    >
      <div className={`inline-grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br ${themeGradient[theme]} text-white shadow-lg`}>
        {icon}
      </div>
      <h3 className="mt-4 text-lg font-bold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
      <p className="mt-4 text-xs font-semibold text-primary group-hover:underline">Open module →</p>
    </Link>
  );
}
