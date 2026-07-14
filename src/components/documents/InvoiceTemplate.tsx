import { useState, useEffect } from "react";
import "./DocumentPage.css";
import { CompanyHeader } from "./CompanyHeader";
import type { CompanyProfile } from "@/lib/company-profiles";

export interface InvoiceRow {
  desc: string;
  hsn: string;
  qty: string;
  rate: string;
  amount: string; // rupees
  ps: string; // paise
}

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
  subTotal: string;
  cgst: string;
  sgst: string;
  igst: string;
  grandTotal: string;
  gstReverse: string;
}

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
    rows: Array.from({ length: 12 }, () => ({
      desc: "", hsn: "", qty: "", rate: "", amount: "", ps: "",
    })),
    amountInWords: "",
    subTotal: "",
    cgst: "",
    sgst: "",
    igst: "",
    grandTotal: "",
    gstReverse: "",
  };
}

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
    const next = { ...data, ...patch };
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
                position: "absolute",
                right: 30,
                top: 60,
                fontSize: 12,
                display: "flex",
                flexDirection: "column",
                gap: 4,
                background: "#fff",
                padding: "2px 6px",
              }}
            >
              <div style={{ display: "flex", gap: 4 }}>
                <span style={{ fontWeight: 700 }}>Inv.No.</span>
                <input
                  className="doc-input"
                  value={data.docNumber}
                  onChange={(e) => update({ docNumber: e.target.value })}
                  readOnly={readOnly}
                  style={{ borderBottom: "1px dotted #0a1e5c", width: 70, color: "#b91c1c", fontWeight: 700 }}
                />
              </div>
              <div style={{ display: "flex", gap: 4 }}>
                <span style={{ fontWeight: 700 }}>Date :</span>
                <input
                  type="date"
                  className="doc-input"
                  value={data.date}
                  onChange={(e) => update({ date: e.target.value })}
                  readOnly={readOnly}
                  style={{ borderBottom: "1px dotted #0a1e5c", width: 90 }}
                />
              </div>
            </div>
          }
        />

        <div
          className="doc-title"
          style={{ fontSize: 15, padding: "3px 0", borderBottom: "2px solid #0a1e5c" }}
        >
          TAX INVOICE
        </div>

        {/* Buyer / Supply meta */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderBottom: "2px solid #0a1e5c", fontSize: 12 }}>
          <div style={{ padding: "6px 8px", borderRight: "1.5px solid #0a1e5c" }}>
            <div><strong>Buyer`s Name : </strong>{inp(data.buyerName, (v) => update({ buyerName: v }), { width: "70%" })}</div>
            <div style={{ marginTop: 20 }}><strong>GSTIN :</strong> {inp(data.buyerGstin, (v) => update({ buyerGstin: v }), { width: "70%" })}</div>
            <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
              <div style={{ flex: 1 }}><strong>State :</strong> {inp(data.buyerState, (v) => update({ buyerState: v }))}</div>
              <div style={{ flex: 1 }}><strong>Code :</strong> {inp(data.buyerCode, (v) => update({ buyerCode: v }))}</div>
            </div>
          </div>
          <div style={{ padding: "6px 8px", display: "grid", gridTemplateColumns: "auto 1fr", rowGap: 3, columnGap: 6 }}>
            <span><strong>Reverse Charge :(Y/N):</strong></span>{inp(data.reverseCharge, (v) => update({ reverseCharge: v }))}
            <span><strong>State</strong> :</span>{inp(data.supplyState, (v) => update({ supplyState: v }))}
            <span><strong>Code</strong> :</span>{inp(data.supplyCode, (v) => update({ supplyCode: v }))}
            <span><strong>Date of Supply</strong> :</span>{inp(data.dateOfSupply, (v) => update({ dateOfSupply: v }))}
            <span><strong>Mode of Transport</strong> :</span>{inp(data.modeOfTransport, (v) => update({ modeOfTransport: v }))}
            <span><strong>Place of Supply</strong> :</span>{inp(data.placeOfSupply, (v) => update({ placeOfSupply: v }))}
            <span><strong>Vechicle no.</strong> :</span>{inp(data.vehicleNo, (v) => update({ vehicleNo: v }))}
          </div>
        </div>

        {/* Items table */}
        <table className="doc-table" style={{ fontSize: 12 }}>
          <thead>
            <tr>
              <th style={{ width: 40 }}>S.No.</th>
              <th>DESCRIPTION OF GOODS</th>
              <th style={{ width: 70 }}>HSN Code</th>
              <th style={{ width: 80 }}>QUANTITY (KG)</th>
              <th style={{ width: 70 }}>RATE/KG</th>
              <th style={{ width: 80 }}>AMOUNT(R)</th>
              <th style={{ width: 40 }}>PS</th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((r, i) => (
              <tr key={i} style={{ height: 30 }}>
                <td style={{ textAlign: "center" }}>{i + 1}</td>
                <td><input className="doc-input" value={r.desc} onChange={(e) => updateRow(i, "desc", e.target.value)} readOnly={readOnly} /></td>
                <td><input className="doc-input" value={r.hsn} onChange={(e) => updateRow(i, "hsn", e.target.value)} readOnly={readOnly} style={{ textAlign: "center" }} /></td>
                <td><input className="doc-input" value={r.qty} onChange={(e) => updateRow(i, "qty", e.target.value)} readOnly={readOnly} style={{ textAlign: "right" }} /></td>
                <td><input className="doc-input" value={r.rate} onChange={(e) => updateRow(i, "rate", e.target.value)} readOnly={readOnly} style={{ textAlign: "right" }} /></td>
                <td><input className="doc-input" value={r.amount} onChange={(e) => updateRow(i, "amount", e.target.value)} readOnly={readOnly} style={{ textAlign: "right" }} /></td>
                <td><input className="doc-input" value={r.ps} onChange={(e) => updateRow(i, "ps", e.target.value)} readOnly={readOnly} style={{ textAlign: "right" }} /></td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals + words */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 260px", fontSize: 12, borderTop: "0" }}>
          <div style={{ borderRight: "1.5px solid #0a1e5c", borderBottom: "1.5px solid #0a1e5c", padding: 6 }}>
            <div><strong>TOTAL AMOUNT( in words) :</strong></div>
            <textarea
              className="doc-textarea"
              rows={3}
              value={data.amountInWords}
              onChange={(e) => update({ amountInWords: e.target.value })}
              readOnly={readOnly}
              style={{ marginTop: 4 }}
            />
          </div>
          <table className="doc-table" style={{ fontSize: 12 }}>
            <tbody>
              {[
                ["SUB TOTAL", data.subTotal, (v: string) => update({ subTotal: v })],
                ["CGST @ 9%", data.cgst, (v: string) => update({ cgst: v })],
                ["SGST @ 9%", data.sgst, (v: string) => update({ sgst: v })],
                ["IGST @ 18%", data.igst, (v: string) => update({ igst: v })],
                ["GRAND TOTAL", data.grandTotal, (v: string) => update({ grandTotal: v })],
                ["GST on Reverse Charge", data.gstReverse, (v: string) => update({ gstReverse: v })],
              ].map(([label, val, on]) => (
                <tr key={label as string}>
                  <td style={{ fontWeight: 600 }}>{label}</td>
                  <td style={{ width: 100 }}>
                    <input
                      className="doc-input"
                      value={val as string}
                      onChange={(e) => (on as (v: string) => void)(e.target.value)}
                      readOnly={readOnly}
                      style={{ textAlign: "right" }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Bank + declaration */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", padding: "8px 4px", fontSize: 11.5, gap: 8, marginTop: "auto" }}>
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
            <strong>Declaration :</strong> We declare that the particulars given above are true and correct in every respect.
            <div style={{ marginTop: 24, textAlign: "right", fontWeight: 700 }}>For {profile.name}</div>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #0a1e5c", padding: "6px 4px", fontSize: 11 }}>
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
