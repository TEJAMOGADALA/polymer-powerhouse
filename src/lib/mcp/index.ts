import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listCompanies from "./tools/list-companies";
import listInvoices from "./tools/list-invoices";
import listChallans from "./tools/list-challans";
import getDocument from "./tools/get-document";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "polymer-dms-mcp",
  title: "Polymer DMS",
  version: "0.1.0",
  instructions:
    "Access the Polymer Document Management System. Use `list_companies` to discover companies, `list_invoices` / `list_challans` to browse documents you created, and `get_document` to fetch full details for an invoice or delivery challan.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listCompanies, listInvoices, listChallans, getDocument],
});
