
-- 1. Fix documents table RLS: restrict to owner or admin
DROP POLICY IF EXISTS "Authenticated users can view documents" ON public.documents;
DROP POLICY IF EXISTS "Authenticated users can update documents" ON public.documents;
DROP POLICY IF EXISTS "Authenticated users can delete documents" ON public.documents;

CREATE POLICY "Owners or admins can view documents"
  ON public.documents FOR SELECT TO authenticated
  USING (auth.uid() = created_by OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Owners or admins can update documents"
  ON public.documents FOR UPDATE TO authenticated
  USING (auth.uid() = created_by OR public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (auth.uid() = created_by OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Owners or admins can delete documents"
  ON public.documents FOR DELETE TO authenticated
  USING (auth.uid() = created_by OR public.has_role(auth.uid(), 'admin'::app_role));

-- 2. Fix companies table: restrict SELECT to admins
DROP POLICY IF EXISTS "Signed-in users read companies" ON public.companies;

CREATE POLICY "Admins read companies"
  ON public.companies FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 3. Fix storage.objects policies for 'documents' bucket: owner or admin
DROP POLICY IF EXISTS "Auth users can read document PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Auth users can update document PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Auth users can delete document PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Auth users can upload document PDFs" ON storage.objects;

CREATE POLICY "Owners or admins read document PDFs"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'documents'
    AND (owner = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role))
  );

CREATE POLICY "Owners or admins update document PDFs"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'documents'
    AND (owner = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role))
  );

CREATE POLICY "Owners or admins delete document PDFs"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'documents'
    AND (owner = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role))
  );

CREATE POLICY "Authenticated users upload document PDFs"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'documents'
    AND owner = auth.uid()
  );

-- 4. Revoke EXECUTE on SECURITY DEFINER functions from anon/authenticated/public
REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.auto_approve_documents() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;

-- has_role is referenced from RLS policies; SECURITY DEFINER functions execute
-- with owner privileges when referenced internally, so no grants needed for RLS.
-- auto_approve_documents will now only be callable by service_role/postgres.
