import { useState, useEffect } from "react";
import "./DocumentPage.css";
import { CompanyHeader } from "./CompanyHeader";
import type { CompanyProfile } from "@/lib/company-profiles";

export interface ChallanData {
  docNumber: string;
  date: string;
  mAddress: string; // M/s multi-line
  gstin: string;
  rows: { desc: string; qty: string }[];
}

export function emptyChallanData(): ChallanData {
  return {
    docNumber: "",
    date: new Date().toISOString().slice(0, 10),
    mAddress: "",
    gstin: "",
    rows: Array.from({ length: 14 }, () => ({ desc: "", qty: "" })),
  };
}

interface Props {
  profile: CompanyProfile;
  value: ChallanData;
  onChange?: (v: ChallanData) => void;
  readOnly?: boolean;
  cancelled?: boolean;
}

export function ChallanTemplate({ profile, value, onChange, readOnly, cancelled }: Props) {
  const [data, setData] = useState<ChallanData>(value);
  useEffect(() => setData(value), [value]);
  function update(next: ChallanData) {
    setData(next);
    onChange?.(next);
  }
  function updateRow(i: number, key: "desc" | "qty", v: string) {
    const rows = data.rows.slice();
    rows[i] = { ...rows[i], [key]: v };
    update({ ...data, rows });
  }

  return (
    <div id="doc-print" className={`doc-page ${readOnly ? "doc-readonly" : ""}`}>
      <div className="doc-frame">
        <CompanyHeader profile={profile} />

        {/* Meta block: M/s + Delivery Challan badge */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.4fr 1fr",
            borderBottom: "2px solid #0a1e5c",
            fontSize: 13,
          }}
        >
          <div style={{ padding: "8px 10px", borderRight: "1.5px solid #0a1e5c" }}>
            <div style={{ display: "flex", gap: 6, alignItems: "start" }}>
              <span style={{ fontWeight: 700 }}>M/s</span>
              <textarea
                className="doc-textarea"
                rows={3}
                value={data.mAddress}
                onChange={(e) => update({ ...data, mAddress: e.target.value })}
                readOnly={readOnly}
                style={{ borderBottom: "1px dotted #0a1e5c", minHeight: 54 }}
              />
            </div>
            <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
              <span style={{ fontWeight: 700 }}>GSTIN</span>
              <input
                className="doc-input"
                value={data.gstin}
                onChange={(e) => update({ ...data, gstin: e.target.value })}
                readOnly={readOnly}
                style={{ borderBottom: "1px dotted #0a1e5c" }}
              />
            </div>
          </div>
          <div style={{ padding: "8px 10px", position: "relative" }}>
            <div style={{ textAlign: "center" }}>
              <span className="doc-badge" style={{ fontSize: 13 }}>
                DELIVERY CHALLAN
              </span>
            </div>
            <div style={{ display: "flex", gap: 6, marginTop: 12, alignItems: "center" }}>
              <span style={{ fontWeight: 700 }}>D.C No.</span>
              <input
                className="doc-input"
                value={data.docNumber}
                onChange={(e) => update({ ...data, docNumber: e.target.value })}
                readOnly={readOnly}
                style={{
                  borderBottom: "1px dotted #0a1e5c",
                  fontWeight: 700,
                  color: "#b91c1c",
                  fontSize: 18,
                }}
              />
            </div>
            <div style={{ display: "flex", gap: 6, marginTop: 10, alignItems: "center" }}>
              <span style={{ fontWeight: 700 }}>Date :</span>
              <input
                type="date"
                className="doc-input"
                value={data.date}
                onChange={(e) => update({ ...data, date: e.target.value })}
                readOnly={readOnly}
                style={{ borderBottom: "1px dotted #0a1e5c" }}
              />
            </div>
          </div>
        </div>

        {/* Line items */}
        <table className="doc-table" style={{ fontSize: 13 }}>
          <thead>
            <tr>
              <th style={{ width: 60 }}>Sl.No.</th>
              <th>DESCRIPTION</th>
              <th style={{ width: 140 }}>QUANTITY</th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((r, i) => (
              <tr key={i}>
                <td style={{ textAlign: "center", height: 34 }}>{i + 1}</td>
                <td>
                  <input
                    className="doc-input"
                    value={r.desc}
                    onChange={(e) => updateRow(i, "desc", e.target.value)}
                    readOnly={readOnly}
                  />
                </td>
                <td>
                  <input
                    className="doc-input"
                    value={r.qty}
                    onChange={(e) => updateRow(i, "qty", e.target.value)}
                    readOnly={readOnly}
                    style={{ textAlign: "center" }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Footer */}
        <div style={{ marginTop: "auto", fontSize: 12 }}>
          <div style={{ textAlign: "right", marginTop: 12, fontWeight: 700 }}>
            For {profile.name}
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "18px 4px 6px",
              borderTop: "1px solid #0a1e5c",
              marginTop: 12,
            }}
          >
            <div>
              Received the above goods in good condition
              <br />
              Subject to Visakhapatnam Jurisdiction only
            </div>
            <div style={{ fontWeight: 700 }}>Authorised Signature</div>
          </div>
        </div>
      </div>

      {cancelled && (
        <div className="doc-watermark">
          <span>CANCELLED</span>
        </div>
      )}
    </div>
  );
}
