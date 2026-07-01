import { useEffect, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { loadPdf } from "../lib/pdf";

interface State {
  doc: PDFDocumentProxy | null;
  numPages: number;
  loading: boolean;
  error: string | null;
}

/** load a pdf document for `url`, tearing it down on url change / unmount. */
export function usePdfDocument(url: string): State {
  const [state, setState] = useState<State>({
    doc: null,
    numPages: 0,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    setState({ doc: null, numPages: 0, loading: true, error: null });
    const task = loadPdf(url);
    task.promise.then(
      (doc) => {
        if (cancelled) {
          return;
        }
        setState({ doc, numPages: doc.numPages, loading: false, error: null });
      },
      (err: unknown) => {
        if (cancelled) {
          return;
        }
        setState({
          doc: null,
          numPages: 0,
          loading: false,
          error: err instanceof Error ? err.message : "failed to open pdf",
        });
      },
    );
    return () => {
      cancelled = true;
      // destroying the loading task also tears down the document + worker transport.
      task.destroy();
    };
  }, [url]);

  return state;
}
