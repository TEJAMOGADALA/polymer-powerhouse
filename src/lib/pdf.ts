import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";

/**
 * Snapshot a DOM element and produce an A4-portrait PDF Blob.
 * Renders offscreen at fixed A4 pixel width (794px) so the captured
 * layout is identical regardless of the on-screen container size or
 * device pixel ratio.
 *
 * Inputs, selects and textareas are replaced with static text nodes that
 * inherit the same computed styles so quantity `79 kg`, rate `₹50`, and
 * multi-line Packing Details render identically to the on-screen preview.
 */
export async function renderElementToPdf(el: HTMLElement): Promise<Blob> {
  const host = document.createElement("div");
  host.style.cssText = "position:fixed;left:-10000px;top:0;width:794px;background:#fff;z-index:-1;";
  const clone = el.cloneNode(true) as HTMLElement;
  clone.style.width = "794px";
  clone.style.margin = "0";
  clone.style.transform = "none";

  // Match the original element for computed style lookups
  const originalInputs = Array.from(el.querySelectorAll<HTMLInputElement>("input"));
  const cloneInputs = Array.from(clone.querySelectorAll<HTMLInputElement>("input"));
  cloneInputs.forEach((i, idx) => {
    const orig = originalInputs[idx];
    const cs = orig ? window.getComputedStyle(orig) : window.getComputedStyle(i);
    const span = document.createElement("span");
    const prefix = i.getAttribute("data-doc-prefix") ?? "";
    const suffix = i.getAttribute("data-doc-suffix") ?? "";
    let val = i.value;
    if (i.type === "date" && /^\d{4}-\d{2}-\d{2}$/.test(val)) {
      const [y, m, d] = val.split("-");
      val = `${d}-${m}-${y}`;
    }
    span.textContent = val ? `${prefix}${val}${suffix}` : "";
    span.style.cssText = cs.cssText;
    span.style.display = "inline-block";
    span.style.width = "100%";
    span.style.background = "transparent";
    span.style.borderTop = "none";
    span.style.borderLeft = "none";
    span.style.borderRight = "none";
    span.style.whiteSpace = "pre";
    i.replaceWith(span);
  });

  const originalTAs = Array.from(el.querySelectorAll<HTMLTextAreaElement>("textarea"));
  const cloneTAs = Array.from(clone.querySelectorAll<HTMLTextAreaElement>("textarea"));
  cloneTAs.forEach((t, idx) => {
    const orig = originalTAs[idx];
    const cs = orig ? window.getComputedStyle(orig) : window.getComputedStyle(t);
    const div = document.createElement("div");
    div.textContent = t.value || "";
    div.style.cssText = cs.cssText;
    div.style.whiteSpace = "pre-wrap";
    div.style.background = "transparent";
    div.style.overflow = "visible";
    div.style.height = "auto";
    div.style.minHeight = cs.minHeight || "auto";
    t.replaceWith(div);
  });

  const originalSelects = Array.from(el.querySelectorAll<HTMLSelectElement>("select"));
  const cloneSelects = Array.from(clone.querySelectorAll<HTMLSelectElement>("select"));
  cloneSelects.forEach((s, idx) => {
    const orig = originalSelects[idx];
    const cs = orig ? window.getComputedStyle(orig) : window.getComputedStyle(s);
    const span = document.createElement("span");
    span.textContent = s.options[s.selectedIndex]?.text ?? "";
    span.style.cssText = cs.cssText;
    span.style.background = "transparent";
    span.style.appearance = "none";
    span.style.border = "none";
    s.replaceWith(span);
  });

  host.appendChild(clone);
  document.body.appendChild(host);

  try {
    const canvas = await html2canvas(clone, {
      scale: 3,
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
