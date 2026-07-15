import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, requireAuth } from "../supabase";

export default defineTool({
  name: "get_document",
  title: "Get document details",
  description: "Fetch full details (line items, totals, customer info) for an invoice or delivery challan by document number.",
  inputSchema: {
    document_type: z.enum(["invoice", "challan"]).describe("Which document kind to look up."),
    document_number: z.string().min(1).describe("The visible document number, e.g. 'INV/2026/001'."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ document_type, document_number }, ctx) => {
    const err = requireAuth(ctx);
    if (err) return err;
    const supabase = supabaseForUser(ctx);
    const table = document_type === "invoice" ? "invoices" : "delivery_challans";
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .eq("document_number", document_number)
      .maybeSingle();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!data) return { content: [{ type: "text", text: `No ${document_type} found with number '${document_number}'` }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { document: data },
    };
  },
});
