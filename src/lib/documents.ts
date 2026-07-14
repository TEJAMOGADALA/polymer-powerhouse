import { supabase } from "@/integrations/supabase/client";
import type { CompanyProfile } from "./company-profiles";

export type DocType = "challan" | "invoice";
export type DocStatus = "generated" | "approved" | "cancelled";

export interface DocumentRow {
  id: string;
  company_slug: string;
  company_name: string;
  document_type: DocType;
  document_number: string;
  customer_name: string;
  pdf_path: string | null;
  status: DocStatus;
  created_at: string;
  approval_due_at: string;
  cancelled_at: string | null;
  payload: Record<string, unknown>;
  created_by: string | null;
}

function pdfPath(slug: string, type: DocType, docNo: string, id: string) {
  const safe = docNo.replace(/[^\w-]+/g, "_");
  return `${slug}/${type}/${safe}-${id}.pdf`;
}

export async function checkDocNumberUnique(
  slug: string,
  type: DocType,
  docNumber: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("documents")
    .select("id")
    .eq("company_slug", slug)
    .eq("document_type", type)
    .eq("document_number", docNumber)
    .maybeSingle();
  if (error) throw error;
  return !data;
}

export async function saveNewDocument(args: {
  profile: CompanyProfile;
  type: DocType;
  docNumber: string;
  customerName: string;
  payload: Record<string, unknown>;
  pdfBlob: Blob;
}): Promise<DocumentRow> {
  const { profile, type, docNumber, customerName, payload, pdfBlob } = args;

  const { data: userData } = await supabase.auth.getUser();
  const uid = userData.user?.id;
  if (!uid) throw new Error("Not authenticated");

  // pre-insert to reserve number (unique constraint)
  const { data: inserted, error: insErr } = await supabase
    .from("documents")
    .insert({
      company_slug: profile.slug,
      company_name: profile.name,
      document_type: type,
      document_number: docNumber,
      customer_name: customerName,
      payload,
      created_by: uid,
      status: "generated",
    })
    .select()
    .single();
  if (insErr) {
    if (insErr.code === "23505") {
      throw new Error(
        `${type === "invoice" ? "Invoice" : "Challan"} number ${docNumber} already exists for this company.`,
      );
    }
    throw insErr;
  }

  const path = pdfPath(profile.slug, type, docNumber, inserted.id);
  const { error: upErr } = await supabase.storage
    .from("documents")
    .upload(path, pdfBlob, { contentType: "application/pdf", upsert: true });
  if (upErr) {
    await supabase.from("documents").delete().eq("id", inserted.id);
    throw upErr;
  }

  const { data: updated, error: updErr } = await supabase
    .from("documents")
    .update({ pdf_path: path })
    .eq("id", inserted.id)
    .select()
    .single();
  if (updErr) throw updErr;
  return updated as unknown as DocumentRow;
}

export async function cancelDocument(id: string, pdfBlob: Blob): Promise<void> {
  const { data: doc, error } = await supabase
    .from("documents")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  const row = doc as unknown as DocumentRow;
  if (row.status !== "generated") throw new Error("Document is no longer cancellable.");
  if (new Date(row.approval_due_at).getTime() <= Date.now())
    throw new Error("24-hour cancel window has expired.");
  if (!row.pdf_path) throw new Error("PDF path missing.");

  const { error: upErr } = await supabase.storage
    .from("documents")
    .upload(row.pdf_path, pdfBlob, { contentType: "application/pdf", upsert: true });
  if (upErr) throw upErr;

  const { error: updErr } = await supabase
    .from("documents")
    .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
    .eq("id", id);
  if (updErr) throw updErr;
}

export async function listDocuments(slug: string, type: DocType): Promise<DocumentRow[]> {
  // Run auto-approve first (idempotent)
  await supabase.rpc("auto_approve_documents").catch(() => {});
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("company_slug", slug)
    .eq("document_type", type)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as DocumentRow[];
}

export async function getDocument(id: string): Promise<DocumentRow> {
  await supabase.rpc("auto_approve_documents").catch(() => {});
  const { data, error } = await supabase.from("documents").select("*").eq("id", id).single();
  if (error) throw error;
  return data as unknown as DocumentRow;
}

export async function getSignedPdfUrl(path: string, expiresIn = 300): Promise<string> {
  const { data, error } = await supabase.storage
    .from("documents")
    .createSignedUrl(path, expiresIn);
  if (error) throw error;
  return data.signedUrl;
}

export async function downloadPdfBlob(path: string): Promise<Blob> {
  const { data, error } = await supabase.storage.from("documents").download(path);
  if (error) throw error;
  return data;
}
