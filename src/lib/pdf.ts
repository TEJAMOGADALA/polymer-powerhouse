import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";

/**
 * Snapshot a DOM element and produce an A4-portrait PDF Blob.
 * Element should be sized to A4 (210mm × 297mm) for a clean 1:1 render.
 */
export async function renderElementToPdf(el: HTMLElement): Promise<Blob> {
  const canvas = await html2canvas(el, {
    scale: 2,
    backgroundColor: "#ffffff",
    useCORS: true,
    logging: false,
  });
  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const img = canvas.toDataURL("image/jpeg", 0.95);
  pdf.addImage(img, "JPEG", 0, 0, pageW, pageH);
  return pdf.output("blob");
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export async function printBlob(blob: Blob) {
  const url = URL.createObjectURL(blob);
  const w = window.open(url, "_blank");
  if (w) {
    w.addEventListener("load", () => {
      try {
        w.focus();
        w.print();
      } catch {
        /* ignore */
      }
    });
  }
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
