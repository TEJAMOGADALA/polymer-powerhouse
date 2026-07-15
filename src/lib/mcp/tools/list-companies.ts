import { defineTool } from "@lovable.dev/mcp-js";
import { supabaseForUser, requireAuth } from "../supabase";

export default defineTool({
  name: "list_companies",
  title: "List companies",
  description: "List all polymer companies (SR Polymers, Shiva Sai Polymers, Surya Teja Poly Films) available in the workspace.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    const err = requireAuth(ctx);
    if (err) return err;
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("companies_public")
      .select("id, slug, name, theme_color")
      .order("name");
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { companies: data ?? [] },
    };
  },
});
