import { useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Download, Printer, Save, XCircle, ArrowLeft } from "lucide-react";
import {
  cancelDocument,
  checkDocNumberUnique,
  downloadPdfBlob,
  getSignedPdfUrl,
  saveNewDocument,
  type DocType,
  type DocumentRow,
} from "@/lib/documents";
import { downloadBlob, printBlob, renderElementToPdf } from "@/lib/pdf";
import type { CompanyProfile } from "@/lib/company-profiles";

interface Props {
  profile: CompanyProfile;
  type: DocType;
  docNumber: string;
  customerName: string;
  payload: Record<string, unknown>;
  existing?: DocumentRow | null;
  targetRef: React.RefObject<HTMLElement | null>;
  onSaved?: (row: DocumentRow) => void;
  onCancelled?: () => void;
}

export function DocumentActionBar({
  profile,
  type,
  docNumber,
  customerName,
  payload,
  existing,
  targetRef,
  onSaved,
  onCancelled,
}: Props) {
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const savedRef = useRef(false);

  const isCancellable =
    existing?.status === "approved" && Date.now() < new Date(existing.created_at).getTime() + 24 * 60 * 60 * 1000;
  async function generateBlob(): Promise<Blob> {
    if (!targetRef.current) throw new Error("Document not mounted");
    return renderElementToPdf(targetRef.current);
  }

  async function saveNew(): Promise<{ blob: Blob; row: DocumentRow }> {
    if (savedRef.current) throw new Error("Already saved");
    if (!docNumber.trim()) throw new Error("Document number is required.");
    if (!/^\d+$/.test(docNumber.trim())) throw new Error("Document number must be numeric.");
    if (!customerName.trim()) throw new Error("Customer / Buyer name is required.");
    const unique = await checkDocNumberUnique(profile.slug, type, docNumber.trim());
    if (!unique)
      throw new Error(
        `${type === "invoice" ? "Invoice" : "Challan"} No. ${docNumber} already exists for ${profile.name}.`,
      );
    const blob = await generateBlob();
    const row = await saveNewDocument({
      profile,
      type,
      docNumber: docNumber.trim(),
      customerName: customerName.trim(),
      payload,
      pdfBlob: blob,
    });
    savedRef.current = true;
    onSaved?.(row);
    return { blob, row };
  }

  // SAVE & PRINT: save → download PDF → open print dialog
  async function saveAndPrint() {
    if (busy) return;
    setBusy(true);
    try {
      const { blob, row } = await saveNew();
      downloadBlob(blob, `${type}-${docNumber}-${profile.slug}.pdf`);
      await printBlob(blob);
      toast.success("Saved, downloaded and sent to printer.");
      navigate({ to: "/company/$slug/document/$id", params: { slug: profile.slug, id: row.id } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed.");
    } finally {
      setBusy(false);
    }
  }

  // PRINT: save → open print dialog (no local download)
  async function saveAndPrintOnly() {
    if (busy) return;
    setBusy(true);
    try {
      if (existing?.pdf_path) {
        const blob = await downloadPdfBlob(existing.pdf_path);
        await printBlob(blob);
      } else {
        const { blob, row } = await saveNew();
        await printBlob(blob);
        toast.success("Saved and sent to printer.");
        navigate({ to: "/company/$slug/document/$id", params: { slug: profile.slug, id: row.id } });
        return;
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Print failed.");
    } finally {
      setBusy(false);
    }
  }

  async function downloadExisting() {
    if (!existing?.pdf_path) return;
    setBusy(true);
    try {
      const blob = await downloadPdfBlob(existing.pdf_path);
      downloadBlob(blob, `${existing.document_type}-${existing.document_number}-${existing.company_slug}.pdf`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Download failed.");
    } finally {
      setBusy(false);
    }
  }

  async function openExisting() {
    if (!existing?.pdf_path) return;
    try {
      const url = await getSignedPdfUrl(existing.pdf_path, 300);
      window.open(url, "_blank");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to open.");
    }
  }

  async function doCancel() {
    if (!existing || !isCancellable) return;
    if (!confirm("Cancel this document? A CANCELLED watermark will be added to the PDF.")) return;
    setBusy(true);
    try {
      const blob = await generateBlob();
      await cancelDocument(existing.id, blob);
      toast.success("Document cancelled.");
      onCancelled?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Cancel failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="sticky bottom-0 z-30 border-t border-border/60 bg-background/80 py-3 backdrop-blur">
      <div className="mx-auto flex max-w-[900px] flex-wrap items-center justify-between gap-2 px-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate({ to: "/company/$slug/dashboard", params: { slug: profile.slug } })}
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" /> Dashboard
        </Button>
        <div className="flex flex-wrap gap-2">
          {!existing ? (
            <>
              <Button onClick={saveAndPrint} disabled={busy}>
                <Save className="mr-1.5 h-4 w-4" /> Save &amp; Print
              </Button>
              <Button variant="outline" onClick={saveAndPrintOnly} disabled={busy}>
                <Printer className="mr-1.5 h-4 w-4" /> Print
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={openExisting} disabled={busy}>
                View PDF
              </Button>
              <Button variant="outline" onClick={downloadExisting} disabled={busy}>
                <Download className="mr-1.5 h-4 w-4" /> Download
              </Button>
              <Button variant="outline" onClick={saveAndPrintOnly} disabled={busy}>
                <Printer className="mr-1.5 h-4 w-4" /> Print
              </Button>
              {isCancellable && (
                <Button variant="destructive" onClick={doCancel} disabled={busy}>
                  <XCircle className="mr-1.5 h-4 w-4" /> Cancel
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
