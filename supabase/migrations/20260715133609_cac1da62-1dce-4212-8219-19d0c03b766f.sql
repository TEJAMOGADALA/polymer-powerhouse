-- Drop the security-definer view flagged by the linter.
DROP VIEW IF EXISTS public.companies_public;

-- Recreate as a security_invoker view (safe: it inherits caller RLS + column grants).
CREATE VIEW public.companies_public
WITH (security_invoker=on) AS
SELECT id, slug, name, theme_color
FROM public.companies;

-- Column-level privileges: authenticated can read ONLY safe columns.
REVOKE ALL ON public.companies FROM authenticated;
GRANT SELECT (id, slug, name, theme_color) ON public.companies TO authenticated;
GRANT SELECT ON public.companies_public TO authenticated;

-- RLS policy so authenticated can pass the row filter for those safe columns.
DROP POLICY IF EXISTS "Authenticated can read basic company info" ON public.companies;
CREATE POLICY "Authenticated can read basic company info"
ON public.companies
FOR SELECT
TO authenticated
USING (true);
