
CREATE TYPE public.document_type AS ENUM ('challan', 'invoice');
CREATE TYPE public.document_status AS ENUM ('generated', 'approved', 'cancelled');

CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_slug TEXT NOT NULL,
  company_name TEXT NOT NULL,
  document_type public.document_type NOT NULL,
  document_number TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  pdf_path TEXT,
  status public.document_status NOT NULL DEFAULT 'generated',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approval_due_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '24 hours'),
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_slug, document_type, document_number)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.documents TO authenticated;
GRANT ALL ON public.documents TO service_role;

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view documents"
  ON public.documents FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert documents"
  ON public.documents FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Authenticated users can update documents"
  ON public.documents FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete documents"
  ON public.documents FOR DELETE TO authenticated USING (true);

CREATE TRIGGER documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_documents_company_type ON public.documents(company_slug, document_type, created_at DESC);
CREATE INDEX idx_documents_status ON public.documents(status);

CREATE OR REPLACE FUNCTION public.auto_approve_documents()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.documents
  SET status = 'approved'
  WHERE status = 'generated'
    AND approval_due_at <= now()
    AND cancelled_at IS NULL;
$$;

GRANT EXECUTE ON FUNCTION public.auto_approve_documents() TO authenticated;

-- Storage bucket policies (bucket created via storage tool)
CREATE POLICY "Auth users can read document PDFs"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'documents');
CREATE POLICY "Auth users can upload document PDFs"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'documents');
CREATE POLICY "Auth users can update document PDFs"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'documents');
CREATE POLICY "Auth users can delete document PDFs"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'documents');
