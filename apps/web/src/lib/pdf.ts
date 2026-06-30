import * as pdfjsLib from "pdfjs-dist";
// vite bundles the worker as a hashed url asset.
import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

export { pdfjsLib };

/** start loading a pdf from a url, sending cookies (same-origin session auth). */
export function loadPdf(url: string) {
  return pdfjsLib.getDocument({ url, withCredentials: true });
}
