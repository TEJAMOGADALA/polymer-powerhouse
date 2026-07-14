This is a large, multi-area request. I'll ship it in ordered phases so each turn stays reviewable. Please confirm the scope/order and I'll execute end-to-end.

## Phase A — Auth hardening (small, ship first)
- Remove signup UI, `Create account` link, and the `onSignup` / `supabase.auth.signUp` calls from `src/routes/auth.tsx` (keep Forgot Password + OTP reset).
- Add a subtle full-screen polymer/manufacturing background image behind the existing card with a soft overlay; keep layout, spacing, and mobile behavior intact.
- Use `PolytheneMfcVideo.mp4` (uploaded) as an optional muted/loop/playsInline background with graceful fallback to the static image.

## Phase B — Landing hero + branded company cards
- New hero above the company grid on `/` with the looping muted MP4 background (poster fallback), heading "Polymer Document Management System", bullets (Challans / Invoices / Dispatches), and an `Enter Workspace` CTA that scrolls to the cards.
- Company cards use the uploaded backgrounds (`SRPolymersBG.png`, `ShivaSaiBG.png`, `SuryaTejaBG.png`) via Lovable Assets, with dark gradient overlay + white text.

## Phase C — PDF rendering parity + label alignment
- `renderElementToPdf` (src/lib/pdf.ts): keep number/rate/packing formatting identical to the on-screen template — render `79 kg`, `₹50`, and preserve multiline Packing Details (whitespace: pre-wrap) in the offscreen clone.
- Fix State/Code line in `InvoiceTemplate.tsx` so `State : AP    Code : 123` sits on one line (label + value inline).

## Phase D — Dashboard polish
- Replace "Dashboard" title block with `Company Name` + subtitle `Document Control Center`, add `← Back to Companies` breadcrumb.
- KPI cards: Total Challans, Total Invoices, Cancelled, Today's, Monthly Revenue (sum of invoice grand totals for current month).
- Global document search (Challan #, Invoice #, Customer, GSTIN).
- Recent Activity panel (last 10 rows: created/printed/cancelled/deleted from `documents` timestamps + status).
- Export CSV / Export Excel buttons for the currently filtered list (SheetJS for xlsx).

## Phase E — Per-company branding assets (logo / signature / stamp)
- New Supabase table `company_branding` (one row per company slug) + private storage bucket `branding` with signed-URL reads.
- Settings sheet on the company workspace to upload/replace logo, signature, stamp.
- Challan + Invoice templates auto-consume these assets (logo in header, signature + stamp in the footer signature block); PDF export uses the same nodes so parity holds.

## Notes / assumptions
- I'll keep the existing auth flow and route architecture untouched beyond signup removal.
- "Monthly Revenue" = sum of invoice `grand_total` for the current month, per company.
- Excel export uses `xlsx` (SheetJS) since it's the standard lightweight option.
- No redesign of Challan/Invoice document body — only the label-alignment fix + branding slots.

Reply "go" (or tell me which phases to drop/reorder) and I'll start executing Phase A immediately.