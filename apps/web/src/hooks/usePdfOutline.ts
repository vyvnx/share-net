import { useEffect, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { resolveOutline, type OutlineItem } from "../lib/outline";

/** load and page-resolve the pdf's outline (table of contents / bookmarks). */
export function usePdfOutline(doc: PDFDocumentProxy | null): OutlineItem[] {
  const [items, setItems] = useState<OutlineItem[]>([]);

  useEffect(() => {
    if (!doc) {
      setItems([]);
      return;
    }
    let cancelled = false;
    resolveOutline(doc)
      .then((resolved) => {
        if (!cancelled) {
          setItems(resolved);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setItems([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [doc]);

  return items;
}
