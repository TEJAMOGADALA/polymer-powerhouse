import { defineTool } from "@lovable.dev/mcp-js";
import { COMPANY_PROFILES } from "@/lib/company-profiles";

export default defineTool({
  name: "list_companies",
  title: "List companies",
  description: "List the polymer companies available in the workspace with their slugs (used for filtering).",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async () => {
    const companies = Object.values(COMPANY_PROFILES).map((c) => ({
      slug: c.slug,
      name: c.name,
      gstin: c.gstin,
    }));
    return {
      content: [{ type: "text", text: JSON.stringify(companies, null, 2) }],
      structuredContent: { companies },
    };
  },
});
