import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useRef } from "react";
import { AppHeader } from "@/components/AppHeader";
import { getProfile } from "@/lib/company-profiles";
import { getDocument } from "@/lib/documents";
import { ChallanTemplate, type ChallanData } from "@/components/documents/ChallanTemplate";
import { InvoiceTemplate, type InvoiceData } from "@/components/documents/InvoiceTemplate";
import { DocumentActionBar } from "@/components/documents/DocumentActions";

export const Route = createFileRoute("/_authenticated/company/$slug/document/$id")({
  component: ViewDocument,
});

function ViewDocument() {
  const { slug, id } = Route.useParams();
  const navigate = useNavigate();
  const profile = useMemo(() => getProfile(slug), [slug]);
  const qc = useQueryClient();
  const ref = useRef<HTMLDivElement | null>(null);

  const { data: doc, isLoading, refetch } = useQuery({
    queryKey: ["document", id],
    queryFn: () => getDocument(id),
  });

  if (!profile) {
    navigate({ to: "/" });
    return null;
  }
  if (isLoading || !doc) {
    return (
      <div className="min-h-screen">
        <AppHeader title={`${profile.name}`} dashboardHref={`/company/${slug}/dashboard`} />
        <div className="mx-auto max-w-2xl px-4 py-10 text-center text-muted-foreground">Loading…</div>
      </div>
    );
  }

  const cancelled = doc.status === "cancelled";
  const isChallan = doc.document_type === "challan";
  const payload = doc.payload as unknown;

  return (
    <div className="min-h-screen pb-6">
      <AppHeader
        title={`${profile.name} · ${isChallan ? "Challan" : "Invoice"} #${doc.document_number}`}
        dashboardHref={`/company/${slug}/dashboard`}
      />
      <div className="mx-auto max-w-[900px] px-2 py-6 sm:px-4">
        <div className="overflow-x-auto">
          <div ref={ref}>
            {isChallan ? (
              <ChallanTemplate
                profile={profile}
                value={payload as ChallanData}
                readOnly
                cancelled={cancelled}
              />
            ) : (
              <InvoiceTemplate
                profile={profile}
                value={payload as InvoiceData}
                readOnly
                cancelled={cancelled}
              />
            )}
          </div>
        </div>
      </div>
      <DocumentActionBar
        profile={profile}
        type={doc.document_type}
        docNumber={doc.document_number}
        customerName={doc.customer_name}
        payload={doc.payload as Record<string, unknown>}
        existing={doc}
        targetRef={ref}
        onCancelled={() => {
          refetch();
          qc.invalidateQueries({ queryKey: ["documents", slug] });
        }}
      />
    </div>
  );
}
