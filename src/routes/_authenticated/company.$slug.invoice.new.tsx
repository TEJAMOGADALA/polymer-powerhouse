import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { InvoiceTemplate, emptyInvoiceData, type InvoiceData } from "@/components/documents/InvoiceTemplate";
import { DocumentActionBar } from "@/components/documents/DocumentActions";
import { getProfile } from "@/lib/company-profiles";

export const Route = createFileRoute("/_authenticated/company/$slug/invoice/new")({
  component: NewInvoice,
});

function NewInvoice() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const profile = useMemo(() => getProfile(slug), [slug]);
  const [data, setData] = useState<InvoiceData>(() => emptyInvoiceData());
  const ref = useRef<HTMLDivElement | null>(null);

  if (!profile) {
    navigate({ to: "/" });
    return null;
  }

  return (
    <div className="min-h-screen pb-6">
      <AppHeader title={`${profile.name} · New Invoice`} logoUrl={profile.logoUrl} dashboardHref={`/company/${slug}/dashboard`} />
      <div className="mx-auto max-w-[900px] px-2 py-6 sm:px-4">
        <div className="overflow-x-auto">
          <div ref={ref}>
            <InvoiceTemplate profile={profile} value={data} onChange={setData} />
          </div>
        </div>
      </div>
      <DocumentActionBar
        profile={profile}
        type="invoice"
        docNumber={data.docNumber}
        customerName={data.buyerName}
        payload={data as unknown as Record<string, unknown>}
        targetRef={ref}
      />
    </div>
  );
}
