import { useEffect, useMemo, useState } from "react";
import "./DocumentPage.css";
import { CompanyHeader } from "./CompanyHeader";
import type { CompanyProfile } from "@/lib/company-profiles";

export interface ChallanRow {
  desc: string;
  /** Multi-line raw packing input, e.g. "30x50\n20x25". */
  packing: string;
  /** Legacy: kept for older saved docs. Not used when packing is set. */
  qty?: string;
}

export interface ChallanData {
  docNumber: string;
  date: string;
  mAddress: string;
  gstin: string;
  rows: ChallanRow[];
}

const ROW_COUNT = 10;

export function emptyChallanData(): ChallanData {
  return {
    docNumber: "",
    date: new Date().toISOString().slice(0, 10),
    mAddress: "",
    gstin: "",
    rows: Array.from({ length: ROW_COUNT }, () => ({ desc: "", packing: "", qty: "" })),
  };
}

/** Convert "30x50" → "30 x 50 kg"; passes through other text unchanged. */
function normalizePackingLine(raw: string): string {
  const m = raw.trim().match(/^(\d+(?:\.\d+)?)\s*[x×*]\s*(\d+(?:\.\d+)?)\s*(kg)?\s*$/i);
  if (!m) return raw.trim();
  return `${m[1]} x ${m[2]} kg`;
}

function computeLineQty(line: string): number | null {
  const m = line.match(/^(\d+(?:\.\d+)?)\s*[x×*]\s*(\d+(?:\.\d+)?)/i);
  if (!m) return null;
  return parseFloat(m[1]) * parseFloat(m[2]);
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
  function updateRow(i: number, key: keyof ChallanRow, v: string) {
    const rows = data.rows.slice();
    rows[i] = { ...rows[i], [key]: v };
    update({ ...data, rows });
  }
  function normalizeRowOnBlur(i: number) {
    const raw = data.rows[i].packing ?? "";
    const norm = raw
      .split("\n")
      .map((l) => (l.trim() ? normalizePackingLine(l) : ""))
      .join("\n");
    if (norm !== raw) updateRow(i, "packing", norm);
  }

  const perRow = useMemo(
    () =>
      data.rows.map((r) => {
        const lines = (r.packing || "").split("\n");
        const qtyLines = lines.map((l) => (l.trim() ? computeLineQty(l) : null));
        const bagLines = lines.map((l) => {
          const m = l.trim().match(/^(\d+(?:\.\d+)?)\s*[x×*]/i);
          return m ? parseFloat(m[1]) : null;
        });
        const total = qtyLines.reduce<number>((a, v) => a + (typeof v === "number" ? v : 0), 0);
        const bags = bagLines.reduce<number>((a, v) => a + (typeof v === "number" ? v : 0), 0);
        return { lines, qtyLines, bagLines, total, bags };
      }),
    [data.rows],
  );

  const grandTotal = perRow.reduce((a, r) => a + r.total, 0);
  const grandBags = perRow.reduce((a, r) => a + r.bags, 0);

  return (
    <div id="doc-print" className={`doc-page ${readOnly ? "doc-readonly" : ""}`}>
      <div className="doc-frame">
        <CompanyHeader profile={profile} />

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
                onChange={(e) => update({ ...data, docNumber: e.target.value.replace(/\D+/g, "") })}
                readOnly={readOnly}
                inputMode="numeric"
                pattern="\d*"
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
          <colgroup>
            <col style={{ width: 42 }} />
            <col />
            <col style={{ width: 150 }} />
            <col style={{ width: 110 }} />
          </colgroup>
          <thead>
            <tr>
              <th>Sl.No.</th>
              <th>DESCRIPTION</th>
              <th>PACKING DETAILS</th>
              <th>QUANTITY</th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((r, i) => {
              const info = perRow[i];
              return (
                <tr key={i}>
                  <td style={{ textAlign: "center", verticalAlign: "middle" }}>{i + 1}</td>
                  <td>
                    <input
                      className="doc-input"
                      value={r.desc}
                      onChange={(e) => updateRow(i, "desc", e.target.value)}
                      readOnly={readOnly}
                    />
                  </td>
                  <td style={{ padding: 2 }}>
                    <textarea
                      className="doc-textarea"
                      rows={Math.max(2, info.lines.length)}
                      value={r.packing}
                      onChange={(e) => updateRow(i, "packing", e.target.value)}
                      onBlur={() => normalizeRowOnBlur(i)}
                      readOnly={readOnly}
                      style={{ minHeight: 32 }}
                    />
                  </td>
                  <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                    {info.qtyLines.some((v) => v !== null) ? (
                      <>
                        {info.qtyLines.map((v, k) => (
                          <div key={k} style={{ minHeight: 18 }}>
                            {v !== null ? `${v} kg` : "\u00a0"}
                          </div>
                        ))}
                      </>
                    ) : (
                      <input
                        className="doc-input"
                        value={r.qty ?? ""}
                        onChange={(e) => updateRow(i, "qty", e.target.value)}
                        readOnly={readOnly}
                        style={{ textAlign: "right" }}
                      />
                    )}
                  </td>
                </tr>
              );
            })}
            <tr>
              <td colSpan={3} style={{ textAlign: "right", fontWeight: 700 }}>
                GRAND TOTAL
              </td>
              <td style={{ textAlign: "right", fontWeight: 700 }}>{grandTotal > 0 ? `${grandTotal} kg` : ""}</td>
            </tr>
          </tbody>
        </table>

        <div style={{ marginTop: "auto", fontSize: 12 }}>
          <div style={{ textAlign: "right", marginTop: 12, fontWeight: 700 }}>For {profile.name}</div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "18px 4px 6px",
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
