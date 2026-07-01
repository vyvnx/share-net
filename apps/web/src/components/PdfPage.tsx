import { useEffect, useRef } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";

interface Props {
  doc: PDFDocumentProxy;
  page: number;
  scale: number;
  /** reports the page's intrinsic width at scale 1, for fit-to-width math. */
  onIntrinsicWidth?: (width: number) => void;
}

export function PdfPage({ doc, page, scale, onIntrinsicWidth }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let cancelled = false;
    let renderTask: ReturnType<Awaited<ReturnType<PDFDocumentProxy["getPage"]>>["render"]> | null =
      null;

    doc.getPage(page).then((pdfPage) => {
      if (cancelled) {
        return;
      }
      const base = pdfPage.getViewport({ scale: 1 });
      onIntrinsicWidth?.(base.width);

      // render at css size × dpr so the canvas is crisp on hidpi screens.
      const dpr = window.devicePixelRatio || 1;
      const viewport = pdfPage.getViewport({ scale });
      const canvas = canvasRef.current;
      if (!canvas) {
        return;
      }
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        return;
      }
      canvas.width = Math.floor(viewport.width * dpr);
      canvas.height = Math.floor(viewport.height * dpr);
      canvas.style.width = `${Math.floor(viewport.width)}px`;
      canvas.style.height = `${Math.floor(viewport.height)}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      renderTask = pdfPage.render({ canvas, canvasContext: ctx, viewport });
      renderTask.promise.catch(() => {
        // render cancelled or failed; ignore (a newer render supersedes it).
      });
    });

    return () => {
      cancelled = true;
      renderTask?.cancel();
    };
  }, [doc, page, scale, onIntrinsicWidth]);

  return <canvas ref={canvasRef} className="reader__canvas" />;
}
