import type { CompanyProfile } from "@/lib/company-profiles";

/** Header block used at the top of both challans and invoices. */
export function CompanyHeader({
  profile,
  showPan = false,
  showTriplicate = false,
  rightMeta,
}: {
  profile: CompanyProfile;
  showPan?: boolean;
  showTriplicate?: boolean;
  rightMeta?: React.ReactNode;
}) {
  return (
    <div style={{ borderBottom: "2px solid #0a1e5c" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: showTriplicate ? "1fr auto auto" : "1fr auto",
          alignItems: "start",
          padding: "4px 8px",
          fontSize: 12,
          fontWeight: 600,
          gap: 12,
        }}
      >
        <div style={{ lineHeight: 1.25 }}>
          <div>GSTIN : {profile.gstin}</div>
          {showPan && profile.pan && <div>PAN NO : {profile.pan}</div>}
        </div>
        <div style={{ textAlign: "right", lineHeight: 1.25 }}>
          <div>Cell : {profile.cell[0]}</div>
          {profile.cell[1] && <div style={{ marginTop: 1 }}>{profile.cell[1]}</div>}
        </div>
        {showTriplicate && (
          <div
            style={{
              borderLeft: "1.5px solid #0a1e5c",
              paddingLeft: 8,
              fontSize: 11,
              lineHeight: 1.3,
              minWidth: 140,
            }}
          >
            <div>Original for Buyer</div>
            <div>Duplicate for Transporter</div>
            <div>Triplicate for Supplier</div>
          </div>
        )}
      </div>

      <div
        className="doc-title"
        style={{ fontSize: 32, padding: "2px 0", lineHeight: 1 }}
      >
        {profile.name}
      </div>

      <div style={{ padding: "2px 8px 6px", fontSize: 11.5, textAlign: "center" }}>
        {profile.addressLayout === "twoLine" ? (
          <>
            <div style={{ borderTop: "1px solid #0a1e5c", padding: "3px 0" }}>
              <strong>FACTORY :</strong> {profile.factory}
            </div>
            <div style={{ borderTop: "1px solid #0a1e5c", padding: "3px 0" }}>
              <strong>OFFICE :</strong> {profile.office}
            </div>
          </>
        ) : (
          <div style={{ padding: "3px 0" }}>{profile.address}</div>
        )}
      </div>
      {rightMeta}
    </div>
  );
}
