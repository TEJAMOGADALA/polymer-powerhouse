import { useEffect, useMemo, useState } from "react";
import "./DocumentPage.css";
import { CompanyHeader } from "./CompanyHeader";
import type { CompanyProfile } from "@/lib/company-profiles";
import { amountInWords } from "@/lib/amount-in-words";

export interface InvoiceRow {
  desc: string;
  hsn: string;
  qty: string;
  rate: string;
}

export type TaxRate = "0" | "2.5" | "5" | "9" | "18";

export interface InvoiceData {
  docNumber: string;
  date: string;
  buyerName: string;
  buyerGstin: string;
  buyerState: string;
  buyerCode: string;
  reverseCharge: string;
  supplyState: string;
  supplyCode: string;
  dateOfSupply: string;
  modeOfTransport: string;
  placeOfSupply: string;
  vehicleNo: string;
  rows: InvoiceRow[];
  amountInWords: string;
  cgstRate: TaxRate;
  sgstRate: TaxRate;
  igstRate: TaxRate;
  gstReverse: string;
}

const ROW_COUNT = 10;

export function emptyInvoiceData(): InvoiceData {
  return {
    docNumber: "",
    date: new Date().toISOString().slice(0, 10),
    buyerName: "",
    buyerGstin: "",
    buyerState: "",
    buyerCode: "",
    reverseCharge: "N",
    supplyState: "",
    supplyCode: "",
    dateOfSupply: "",
    modeOfTransport: "",
    placeOfSupply: "",
    vehicleNo: "",
    rows: Array.from({ length: ROW_COUNT }, () => ({
      desc: "",
      hsn: "",
      qty: "",
      rate: "",
    })),
    amountInWords: "",
    cgstRate: "9",
    sgstRate: "9",
    igstRate: "0",
    gstReverse: "",
  };
}

const fmt = (n: number) => n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

interface Props {
  profile: CompanyProfile;
  value: InvoiceData;
  onChange?: (v: InvoiceData) => void;
  readOnly?: boolean;
  cancelled?: boolean;
}

export function InvoiceTemplate({ profile, value, onChange, readOnly, cancelled }: Props) {
  const [data, setData] = useState<InvoiceData>(value);
  useEffect(() => setData(value), [value]);
  const update = (patch: Partial<InvoiceData>) => {
    let next = { ...data, ...patch };
    // Mutual exclusion: IGST vs CGST+SGST
    if (patch.igstRate && patch.igstRate !== "0") {
      next = { ...next, cgstRate: "0", sgstRate: "0" };
    }
    if ((patch.cgstRate && patch.cgstRate !== "0") || (patch.sgstRate && patch.sgstRate !== "0")) {
      next = { ...next, igstRate: "0" };
    }
    setData(next);
    onChange?.(next);
  };
  const updateRow = (i: number, key: keyof InvoiceRow, v: string) => {
    const rows = data.rows.slice();
    rows[i] = { ...rows[i], [key]: v };
    update({ rows });
  };

  const inp = (val: string, on: (v: string) => void, style?: React.CSSProperties) => (
    <input
      className="doc-input"
      value={val}
      onChange={(e) => on(e.target.value)}
      readOnly={readOnly}
      style={{ borderBottom: "1px dotted #0a1e5c", ...style }}
    />
  );

  const rowAmounts = useMemo(
    () =>
      data.rows.map((r) => {
        const q = parseFloat(r.qty);
        const rt = parseFloat(r.rate);
        if (isNaN(q) || isNaN(rt)) return 0;
        return q * rt;
      }),
    [data.rows],
  );
  const subTotal = rowAmounts.reduce((a, b) => a + b, 0);
  const cgstAmt = (subTotal * parseFloat(data.cgstRate || "0")) / 100;
  const sgstAmt = (subTotal * parseFloat(data.sgstRate || "0")) / 100;
  const igstAmt = (subTotal * parseFloat(data.igstRate || "0")) / 100;
  const grandTotal = subTotal + cgstAmt + sgstAmt + igstAmt;
  const autoWords = useMemo(() => amountInWords(grandTotal), [grandTotal]);
  useEffect(() => {
    if (autoWords && autoWords !== data.amountInWords) {
      const next = { ...data, amountInWords: autoWords };
      setData(next);
      onChange?.(next);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoWords]);

  const rateOpts: TaxRate[] = ["0", "2.5", "5", "9"];
  const igstOpts: TaxRate[] = ["0", "2.5", "5", "18"];
  const rateLabel = (r: TaxRate) => (r === "0" ? "NONE" : `${r}%`);

  const TaxSelect = ({
    value: v,
    onChange: oc,
    options,
  }: {
    value: TaxRate;
    onChange: (v: TaxRate) => void;
    options: TaxRate[];
  }) => (
    <select
      value={v}
      onChange={(e) => oc(e.target.value as TaxRate)}
      disabled={readOnly}
      style={{
        background: "transparent",
        border: "1px dotted #0a1e5c",
        font: "inherit",
        color: "inherit",
        padding: "0 2px",
      }}
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {rateLabel(o)}
        </option>
      ))}
    </select>
  );

  return (
    <div id="doc-print" className={`doc-page ${readOnly ? "doc-readonly" : ""}`}>
      <div className="doc-frame" style={{ padding: "8px 10px" }}>
        <CompanyHeader
          profile={profile}
          showPan
          showTriplicate
          rightMeta={
            <div
              style={{
                fontSize: 13,
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                <span style={{ fontWeight: 700, fontSize: 16 }}>Inv.No.</span>
                <input
                  className="doc-input"
                  value={data.docNumber}
                  onChange={(e) => update({ docNumber: e.target.value.replace(/\D+/g, "") })}
                  readOnly={readOnly}
                  inputMode="numeric"
                  pattern="\d*"
                  style={{ borderBottom: "1px dotted #0a1e5c", width: 70, color: "#b91c1c", fontWeight: 700 }}
                />
              </div>
              <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                <span style={{ fontWeight: 700 }}>Date :</span>
                <input
                  type="date"
                  className="doc-input"
                  value={data.date}
                  onChange={(e) => update({ date: e.target.value })}
                  readOnly={readOnly}
                  style={{ borderBottom: "1px dotted #0a1e5c", width: 110 }}
                />
              </div>
            </div>
          }
        />

        <div className="doc-title" style={{ fontSize: 15, padding: "3px 0", borderBottom: "2px solid #0a1e5c" }}>
          TAX INVOICE
        </div>

        {/* Buyer / Supply meta — bigger buyer name area */}
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderBottom: "2px solid #0a1e5c", fontSize: 12 }}
        >
          <div style={{ padding: "6px 8px", borderRight: "1.5px solid #0a1e5c" }}>
            <div style={{ display: "flex", gap: 4, alignItems: "start" }}>
              <strong style={{ whiteSpace: "nowrap" }}>Buyer`s Name :</strong>
              <textarea
                className="doc-textarea"
                rows={3}
                value={data.buyerName}
                onChange={(e) => update({ buyerName: e.target.value })}
                readOnly={readOnly}
                style={{ borderBottom: "1px dotted #0a1e5c", minHeight: 60, width: "100%" }}
              />
            </div>
            <div style={{ marginTop: 8 }}>
              <strong>GSTIN :</strong> {inp(data.buyerGstin, (v) => update({ buyerGstin: v }), { width: "70%" })}
            </div>
            <div style={{ display: "flex", gap: 16, marginTop: 6, alignItems: "baseline", flexWrap: "nowrap" }}>
              <div style={{ flex: 1, display: "flex", alignItems: "baseline", gap: 4, whiteSpace: "nowrap" }}>
                <strong>State :</strong>
                <span style={{ flex: 1 }}>{inp(data.buyerState, (v) => update({ buyerState: v }))}</span>
              </div>
              <div style={{ flex: 1, display: "flex", alignItems: "baseline", gap: 4, whiteSpace: "nowrap" }}>
                <strong>Code :</strong>
                <span style={{ flex: 1 }}>{inp(data.buyerCode, (v) => update({ buyerCode: v }))}</span>
              </div>
            </div>
          </div>
          <div
            style={{ padding: "6px 8px", display: "grid", gridTemplateColumns: "auto 1fr", rowGap: 3, columnGap: 6 }}
          >
            <span>
              <strong>Reverse Charge :(Y/N):</strong>
            </span>
            {inp(data.reverseCharge, (v) => update({ reverseCharge: v }))}
            <span>
              <strong>State</strong> :
            </span>
            {inp(data.supplyState, (v) => update({ supplyState: v }))}
            <span>
              <strong>Code</strong> :
            </span>
            {inp(data.supplyCode, (v) => update({ supplyCode: v }))}
            <span>
              <strong>Date of Supply</strong> :
            </span>
            {inp(data.dateOfSupply, (v) => update({ dateOfSupply: v }))}
            <span>
              <strong>Mode of Transport</strong> :
            </span>
            {inp(data.modeOfTransport, (v) => update({ modeOfTransport: v }))}
            <span>
              <strong>Place of Supply</strong> :
            </span>
            {inp(data.placeOfSupply, (v) => update({ placeOfSupply: v }))}
            <span>
              <strong>Vechicle no.</strong> :
            </span>
            {inp(data.vehicleNo, (v) => update({ vehicleNo: v }))}
          </div>
        </div>

        {/* Items table */}
        <table className="doc-table" style={{ fontSize: 12 }}>
          <colgroup>
            <col style={{ width: 36 }} />
            <col />
            <col style={{ width: 90 }} />
            <col style={{ width: 100 }} />
            <col style={{ width: 90 }} />
            <col style={{ width: 110 }} />
          </colgroup>
          <thead>
            <tr>
              <th>S.No.</th>
              <th>DESCRIPTION OF GOODS</th>
              <th>HSN Code</th>
              <th>QUANTITY (KG)</th>
              <th>RATE/KG</th>
              <th>AMOUNT (Rs)</th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((r, i) => (
              <tr key={i} style={{ height: 28 }}>
                <td style={{ textAlign: "center" }}>{i + 1}</td>
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
                    value={r.hsn}
                    onChange={(e) => updateRow(i, "hsn", e.target.value)}
                    readOnly={readOnly}
                    style={{ textAlign: "center" }}
                  />
                </td>
                <td style={{ textAlign: "center" }}>
                  {readOnly ? (
                    <span>{r.qty ? `${r.qty} kg` : ""}</span>
                  ) : (
                    <input
                      className="doc-input"
                      value={r.qty}
                      onChange={(e) => updateRow(i, "qty", e.target.value.replace(/[^\d.]/g, ""))}
                      inputMode="decimal"
                      data-doc-suffix=" kg"
                      style={{ textAlign: "center" }}
                    />
                  )}
                </td>
                <td style={{ textAlign: "center" }}>
                  {readOnly ? (
                    <span>{r.rate ? `₹${r.rate}` : ""}</span>
                  ) : (
                    <input
                      className="doc-input"
                      value={r.rate}
                      onChange={(e) => updateRow(i, "rate", e.target.value.replace(/[^\d.]/g, ""))}
                      onBlur={(e) => {
                        const val = parseFloat(e.target.value);

                        if (!isNaN(val)) {
                          updateRow(i, "rate", val.toFixed(2));
                        }
                      }}
                      inputMode="decimal"
                      data-doc-prefix="₹"
                      style={{ textAlign: "center" }}
                    />
                  )}
                </td>
                <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                  {rowAmounts[i] > 0 ? `₹ ${fmt(rowAmounts[i])}` : ""}
                </td>
              </tr>
            ))}

            {/* Totals block — labels aligned under RATE/KG, values under AMOUNT */}
            {[
              ["SUB TOTAL", subTotal, null] as const,
              [`CGST @ ${data.cgstRate}%`, cgstAmt, "cgst"] as const,
              [`SGST @ ${data.sgstRate}%`, sgstAmt, "sgst"] as const,
              [`IGST @ ${data.igstRate}%`, igstAmt, "igst"] as const,
            ].map(([label, val, kind]) => (
              <tr key={label}>
                <td colSpan={4} style={{ border: "none" }} />
                <td style={{ fontWeight: 700, textAlign: "right", padding: "3px 6px" }}>
                  {kind === "cgst" ? (
                    <>
                      CGST @{" "}
                      <TaxSelect value={data.cgstRate} onChange={(v) => update({ cgstRate: v })} options={rateOpts} />
                    </>
                  ) : kind === "sgst" ? (
                    <>
                      SGST @{" "}
                      <TaxSelect value={data.sgstRate} onChange={(v) => update({ sgstRate: v })} options={rateOpts} />
                    </>
                  ) : kind === "igst" ? (
                    <>
                      IGST @{" "}
                      <TaxSelect value={data.igstRate} onChange={(v) => update({ igstRate: v })} options={igstOpts} />
                    </>
                  ) : (
                    label
                  )}
                </td>
                <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: kind ? 500 : 700 }}>
                  {val > 0 ? `₹ ${fmt(val)}` : "—"}
                </td>
              </tr>
            ))}
            <tr>
              <td colSpan={4} style={{ border: "none" }} />
              <td style={{ fontWeight: 800, textAlign: "right", background: "#f4f8ff" }}>GRAND TOTAL</td>
              <td
                style={{
                  fontWeight: 800,
                  textAlign: "right",
                  background: "#f4f8ff",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                ₹ {fmt(grandTotal)}
              </td>
            </tr>
            <tr>
              <td colSpan={4} style={{ border: "none" }} />
              <td style={{ padding: "3px 6px", textAlign: "right" }}>GST on Reverse Charge</td>
              <td>
                <input
                  className="doc-input"
                  value={data.gstReverse}
                  onChange={(e) => update({ gstReverse: e.target.value })}
                  readOnly={readOnly}
                  style={{ textAlign: "right" }}
                />
              </td>
            </tr>
          </tbody>
        </table>

        {/* Words */}
        <div style={{ fontSize: 12, padding: "6px 8px", borderBottom: "1.5px solid #0a1e5c" }}>
          <div>
            <strong>TOTAL AMOUNT (in words) :</strong>
          </div>
          <textarea
            className="doc-textarea"
            rows={2}
            value={data.amountInWords}
            onChange={(e) => update({ amountInWords: e.target.value })}
            readOnly={readOnly}
            style={{ marginTop: 4 }}
          />
        </div>

        {/* Bank + declaration */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            padding: "8px 4px",
            fontSize: 11.5,
            gap: 8,
            marginTop: "auto",
          }}
        >
          <div>
            <div style={{ textDecoration: "underline", fontWeight: 700 }}>Bank Details :</div>
            <div>{profile.bank.bank}</div>
            <div>A/c.No : {profile.bank.account}</div>
            <div>IFSC : {profile.bank.ifsc}</div>
            <div>{profile.bank.branch}</div>
            {profile.bank.city && <div>{profile.bank.city}</div>}
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontWeight: 700 }}>{profile.name}</div>
            {profile.udyam && <div>{profile.udyam}</div>}
          </div>
          <div style={{ fontSize: 11 }}>
            <strong>Declaration :</strong> We declare that the particulars given above are true and correct in every
            respect.
            <div style={{ marginTop: 24, textAlign: "right", fontWeight: 700 }}>For {profile.name}</div>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            borderTop: "1px solid #0a1e5c",
            padding: "6px 4px",
            fontSize: 11,
          }}
        >
          <div>* All disputes are subject to Visakhapatnam jurisdiction only</div>
          <div style={{ fontWeight: 700 }}>Authorised Signature</div>
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
