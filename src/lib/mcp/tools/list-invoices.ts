import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, requireAuth } from "../supabase";

export default defineTool({
  name: "list_invoices",
  title: "List invoices",
  description: "List tax invoices you created, optionally filtered by company slug or status. Returns invoice number, date, customer, total, and status.",
  inputSchema: {
    company_slug: z.string().optional().describe("Filter by company slug, e.g. 'shiva-sai-polymers'."),
    status: z.enum(["draft", "generated", "approved", "rejected"]).optional().describe("Filter by document status."),
    limit: z.number().int().min(1).max(200).optional().describe("Max rows to return (default 50)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ company_slug, status, limit }, ctx) => {
    const err = requireAuth(ctx);
    if (err) return err;
    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("invoices")
      .select("id, document_number, document_date, customer_name, subtotal, total, status, company_id")
      .order("document_date", { ascending: false })
      .limit(limit ?? 50);
    if (status) query = query.eq("status", status);
    if (company_slug) {
      const { data: company } = await supabase
        .from("companies_public")
        .select("id")
        .eq("slug", company_slug)
        .maybeSingle();
      if (!company?.id) {
        return { content: [{ type: "text", text: `No company with slug '${company_slug}'` }], isError: true };
      }
      query = query.eq("company_id", company.id);
    }
    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { invoices: data ?? [] },
    };
  },
});
