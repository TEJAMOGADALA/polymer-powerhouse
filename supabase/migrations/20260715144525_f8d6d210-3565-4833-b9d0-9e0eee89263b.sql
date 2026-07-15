
-- Restore Data API GRANTs revoked by prior security migration.
-- Without these, PostgREST returns 403 before RLS is evaluated.
-- RLS policies remain unchanged and continue to enforce access control.

GRANT SELECT, INSERT, UPDATE, DELETE ON public.documents  TO authenticated;
GRANT ALL                              ON public.documents  TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.companies  TO authenticated;
GRANT ALL                              ON public.companies  TO service_role;

GRANT SELECT                           ON public.user_roles TO authenticated;
GRANT ALL                              ON public.user_roles TO service_role;

GRANT SELECT, INSERT, UPDATE           ON public.profiles   TO authenticated;
GRANT ALL                              ON public.profiles   TO service_role;

-- has_role() and auto_approve_documents() are called from RLS policies and
-- app code respectively; authenticated must be able to EXECUTE them.
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.auto_approve_documents()        TO authenticated;
