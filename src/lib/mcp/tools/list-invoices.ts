import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, requireAuth } from "../supabase";

export default defineTool({
  name: "list_invoices",
  title: "List invoices",
  description:
    "List tax invoices, optionally filtered by company slug or status. Reads the same 'documents' table the dashboard uses so counts always match.",
  inputSchema: {
    company_slug: z
      .string()
      .optional()
      .describe("Filter by company slug: 'sr-polymers', 'shiva-sai-polymers', or 'suryateja-poly-films'."),
    status: z.enum(["approved", "cancelled"]).optional().describe("Filter by document status."),
    limit: z.number().int().min(1).max(200).optional().describe("Max rows (default 50)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ company_slug, status, limit }, ctx) => {
    const err = requireAuth(ctx);
    if (err) return err;
    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("documents")
      .select("id, document_number, customer_name, status, company_slug, company_name, created_at, pdf_path")
      .eq("document_type", "invoice")
      .order("created_at", { ascending: false })
      .limit(limit ?? 50);
    if (status) query = query.eq("status", status);
    if (company_slug) query = query.eq("company_slug", company_slug);
    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { invoices: data ?? [], count: data?.length ?? 0 },
    };
  },
});
