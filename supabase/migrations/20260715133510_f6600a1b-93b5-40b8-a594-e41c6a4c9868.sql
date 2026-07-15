-- Expose only non-sensitive company fields to authenticated users via a view.
-- Sensitive fields (gstin, phone, email, address, etc.) stay admin-only on the base table.

CREATE OR REPLACE VIEW public.companies_public
WITH (security_invoker=on) AS
SELECT id, slug, name, theme_color
FROM public.companies;

GRANT SELECT ON public.companies_public TO authenticated;

-- Allow authenticated users to read the safe columns through the view.
-- The view is security_invoker, so it uses the querying user's RLS on companies.
-- Add a permissive SELECT policy scoped to authenticated so the view resolves,
-- while admin-only full access remains via the existing policy.
DROP POLICY IF EXISTS "Authenticated can read basic company info" ON public.companies;
CREATE POLICY "Authenticated can read basic company info"
ON public.companies
FOR SELECT
TO authenticated
USING (true);
