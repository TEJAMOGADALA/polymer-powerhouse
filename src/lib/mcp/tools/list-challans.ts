import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, requireAuth } from "../supabase";

export default defineTool({
  name: "list_challans",
  title: "List delivery challans",
  description: "List delivery challans you created, optionally filtered by company slug or status.",
  inputSchema: {
    company_slug: z.string().optional().describe("Filter by company slug."),
    status: z.enum(["draft", "generated", "approved", "cancelled"]).optional(),
    limit: z.number().int().min(1).max(200).optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ company_slug, status, limit }, ctx) => {
    const err = requireAuth(ctx);
    if (err) return err;
    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("delivery_challans")
      .select("id, document_number, document_date, customer_name, total, status, company_id, vehicle_number, transport_mode")
      .order("document_date", { ascending: false })
      .limit(limit ?? 50);
    if (status) query = query.eq("status", status);
    if (company_slug) {
      const { data: company } = await supabase
        .from("companies_public")
        .select("id")
        .eq("slug", company_slug)
        .maybeSingle();
      if (!company) {
        return { content: [{ type: "text", text: `No company with slug '${company_slug}'` }], isError: true };
      }
      query = query.eq("company_id", company.id);
    }
    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { challans: data ?? [] },
    };
  },
});
