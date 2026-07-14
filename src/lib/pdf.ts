import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";

/**
 * Snapshot a DOM element and produce an A4-portrait PDF Blob.
 * Renders offscreen at fixed A4 pixel width (794px) so the captured
 * layout is identical regardless of the on-screen container size or
 * device pixel ratio.
 */
export async function renderElementToPdf(el: HTMLElement): Promise<Blob> {
  // Clone into a fixed-size offscreen host so nothing on-screen (zoom,
  // focus, horizontal scroll wrapper) can influence the capture.
  const host = document.createElement("div");
  host.style.cssText =
    "position:fixed;left:-10000px;top:0;width:794px;background:#fff;z-index:-1;";
  const clone = el.cloneNode(true) as HTMLElement;
  clone.style.width = "794px";
  clone.style.margin = "0";
  clone.style.transform = "none";
  // Force readonly rendering: replace inputs/textarea with static text so
  // caret/placeholder/focus styling never bleed into the PDF.
  clone.querySelectorAll<HTMLInputElement>("input").forEach((i) => {
    const span = document.createElement("span");
    span.textContent = i.value || "";
    span.style.cssText = window.getComputedStyle(i).cssText;
    span.style.display = "inline-block";
    span.style.width = "100%";
    span.style.background = "transparent";
    i.replaceWith(span);
  });
  clone.querySelectorAll<HTMLTextAreaElement>("textarea").forEach((t) => {
    const div = document.createElement("div");
    div.textContent = t.value || "";
    div.style.cssText = window.getComputedStyle(t).cssText;
    div.style.whiteSpace = "pre-wrap";
    div.style.background = "transparent";
    t.replaceWith(div);
  });
  clone.querySelectorAll<HTMLSelectElement>("select").forEach((s) => {
    const span = document.createElement("span");
    span.textContent = s.options[s.selectedIndex]?.text ?? "";
    span.style.cssText = window.getComputedStyle(s).cssText;
    span.style.background = "transparent";
    span.style.appearance = "none";
    s.replaceWith(span);
  });
  host.appendChild(clone);
  document.body.appendChild(host);

  try {
    const canvas = await html2canvas(clone, {
      scale: 2,
      backgroundColor: "#ffffff",
      useCORS: true,
      logging: false,
      width: 794,
      windowWidth: 794,
    });
    const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const img = canvas.toDataURL("image/jpeg", 0.95);
    // Preserve aspect: canvas is 794 * scale wide; A4 aspect is 794:1123.
    const imgHmm = (canvas.height * pageW) / canvas.width;
    pdf.addImage(img, "JPEG", 0, 0, pageW, Math.min(imgHmm, pageH));
    return pdf.output("blob");
  } finally {
    host.remove();
  }
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
