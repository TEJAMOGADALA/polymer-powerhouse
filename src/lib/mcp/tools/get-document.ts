import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, requireAuth } from "../supabase";

export default defineTool({
  name: "get_document",
  title: "Get document details",
  description: "Fetch full details for an invoice or delivery challan by document number.",
  inputSchema: {
    document_type: z.enum(["invoice", "challan"]).describe("Which document kind to look up."),
    document_number: z.string().min(1).describe("The visible document number, e.g. 'INV/2026/001'."),
    company_slug: z.string().optional().describe("Optional company slug to disambiguate."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ document_type, document_number, company_slug }, ctx) => {
    const err = requireAuth(ctx);
    if (err) return err;
    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("documents")
      .select("*")
      .eq("document_type", document_type)
      .eq("document_number", document_number);
    if (company_slug) query = query.eq("company_slug", company_slug);
    const { data, error } = await query.maybeSingle();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!data)
      return {
        content: [{ type: "text", text: `No ${document_type} found with number '${document_number}'` }],
        isError: true,
      };
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { document: data },
    };
  },
});
