-- Remove the permissive base-table policy from the previous migration.
DROP POLICY IF EXISTS "Authenticated can read basic company info" ON public.companies;

-- Recreate the view WITHOUT security_invoker so it runs with the view owner's
-- privileges, exposing only the safe columns regardless of base-table RLS.
DROP VIEW IF EXISTS public.companies_public;
CREATE VIEW public.companies_public AS
SELECT id, slug, name, theme_color
FROM public.companies;

GRANT SELECT ON public.companies_public TO authenticated;
