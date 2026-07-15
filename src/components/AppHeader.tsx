import { Link, useNavigate } from "@tanstack/react-router";
import { LayoutDashboard, LogOut, Factory } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";

interface Props {
  dashboardHref?: string;
  title?: string;
  logoUrl?: string;
}

export function AppHeader({ dashboardHref, title, logoUrl }: Props) {
  const navigate = useNavigate();
  const qc = useQueryClient();

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <Link to="/" className="flex min-w-0 items-center gap-3">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt=""
              className="h-10 w-10 shrink-0 object-contain"
              style={{ objectFit: "contain" }}
            />
          ) : (
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Factory className="h-4 w-4" />
            </div>
          )}
          <span className="truncate text-sm font-semibold sm:text-base">
            {title ?? "Polymer DMS"}
          </span>
        </Link>

        <div className="ml-auto flex items-center gap-2">
          {dashboardHref && (
            <Button asChild variant="outline" size="sm">
              <a href={dashboardHref}>
                <LayoutDashboard className="mr-1.5 h-4 w-4" />
                Dashboard
              </a>
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={signOut}>
            <LogOut className="mr-1.5 h-4 w-4" />
            Sign out
          </Button>
        </div>
      </div>
    </header>
  );
}
