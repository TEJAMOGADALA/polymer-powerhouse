import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { ChallanTemplate, emptyChallanData, type ChallanData } from "@/components/documents/ChallanTemplate";
import { DocumentActionBar } from "@/components/documents/DocumentActions";
import { getProfile } from "@/lib/company-profiles";

export const Route = createFileRoute("/_authenticated/company/$slug/challan/new")({
  component: NewChallan,
});

function NewChallan() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const profile = useMemo(() => getProfile(slug), [slug]);
  const [data, setData] = useState<ChallanData>(() => emptyChallanData());
  const ref = useRef<HTMLDivElement | null>(null);

  if (!profile) {
    navigate({ to: "/" });
    return null;
  }
  const customerName = data.mAddress.split("\n")[0]?.trim() ?? "";

  return (
    <div className="min-h-screen pb-6">
      <AppHeader title={`${profile.name} · New Challan`} dashboardHref={`/company/${slug}/dashboard`} />
      <div className="mx-auto max-w-[900px] px-2 py-6 sm:px-4">
        <div className="overflow-x-auto">
          <div ref={ref}>
            <ChallanTemplate profile={profile} value={data} onChange={setData} />
          </div>
        </div>
      </div>
      <DocumentActionBar
        profile={profile}
        type="challan"
        docNumber={data.docNumber}
        customerName={customerName}
        payload={data as unknown as Record<string, unknown>}
        targetRef={ref}
      />
    </div>
  );
}
