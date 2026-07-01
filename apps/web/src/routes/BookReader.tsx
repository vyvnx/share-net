import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../api/client";
import { usePdfDocument } from "../hooks/usePdfDocument";
import { usePdfOutline } from "../hooks/usePdfOutline";
import { PdfPage } from "../components/PdfPage";
import { clampPage, fitWidthScale, swipeDir, tapZone, zoomStep } from "../lib/reader";

type Mode = "fit-width" | "locked";

// how long after the last page change before persisting it.
const SAVE_DEBOUNCE_MS = 500;

export function BookReader() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const path = params.get("path") ?? "";
  const filename = path.split("/").pop() || path;

  const url = api.rawUrl(path);
  const { doc, numPages, loading, error } = usePdfDocument(url);
  const outline = usePdfOutline(doc);

  const [page, setPage] = useState(1);
  const [showToc, setShowToc] = useState(false);
  const [mode, setMode] = useState<Mode>("fit-width");
  const [userZoom, setUserZoom] = useState(1);
  const [lockedScale, setLockedScale] = useState(1);
  const [intrinsicWidth, setIntrinsicWidth] = useState(0);
  const [viewportWidth, setViewportWidth] = useState(0);
  const [restored, setRestored] = useState(false);

  const viewportRef = useRef<HTMLDivElement>(null);
  const downRef = useRef<{ x: number; y: number } | null>(null);
  // latest page, for the unmount/pagehide flush which can't depend on render.
  const pageRef = useRef(page);
  pageRef.current = page;
  const restoredRef = useRef(restored);
  restoredRef.current = restored;

  const effectiveScale =
    mode === "locked" ? lockedScale : fitWidthScale(intrinsicWidth, viewportWidth) * userZoom;

  // measure the viewport so fit-to-width can track resizes / rotation.
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) {
      return;
    }
    setViewportWidth(el.clientWidth);
    const ro = new ResizeObserver(() => setViewportWidth(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // restore the saved page once we know the page count.
  useEffect(() => {
    if (numPages < 1 || restored) {
      return;
    }
    let active = true;
    api
      .getProgress(path)
      .then((saved) => {
        if (!active) {
          return;
        }
        setPage(clampPage(saved ?? 1, numPages));
        setRestored(true);
      })
      .catch(() => {
        if (active) {
          setRestored(true);
        }
      });
    return () => {
      active = false;
    };
  }, [numPages, path, restored]);

  // persist the page (debounced) once progress has been restored.
  useEffect(() => {
    if (!restored) {
      return;
    }
    const id = window.setTimeout(() => {
      api.setProgress(path, page).catch(() => {
        // best-effort; a later change will retry.
      });
    }, SAVE_DEBOUNCE_MS);
    return () => window.clearTimeout(id);
  }, [page, path, restored]);

  // flush on tab hide / unmount so we don't lose the very last turn.
  useEffect(() => {
    function flush() {
      if (!restoredRef.current) {
        return;
      }
      api.setProgress(path, pageRef.current).catch(() => {});
    }
    window.addEventListener("pagehide", flush);
    return () => {
      window.removeEventListener("pagehide", flush);
      flush();
    };
  }, [path]);

  const go = useCallback(
    (dir: number) => {
      setPage((p) => clampPage(p + dir, numPages));
    },
    [numPages],
  );

  // keyboard navigation.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft" || e.key === "PageUp") {
        go(-1);
      } else if (e.key === "ArrowRight" || e.key === "PageDown") {
        go(1);
      } else if (e.key === "Escape") {
        navigate(-1);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, navigate]);

  function onPointerDown(e: React.PointerEvent) {
    downRef.current = { x: e.clientX, y: e.clientY };
  }

  function onPointerUp(e: React.PointerEvent) {
    const start = downRef.current;
    downRef.current = null;
    if (!start) {
      return;
    }
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;

    // a deliberate horizontal swipe turns the page (right = back, left = forward).
    const swipe = swipeDir(dx, dy);
    if (swipe === "prev") {
      go(-1);
      return;
    }
    if (swipe === "next") {
      go(1);
      return;
    }

    // otherwise fall back to an edge tap.
    const movedPx = Math.hypot(dx, dy);
    const rect = viewportRef.current?.getBoundingClientRect();
    const width = rect?.width ?? viewportWidth;
    const upX = e.clientX - (rect?.left ?? 0);
    const zone = tapZone(upX, width, movedPx);
    if (zone === "prev") {
      go(-1);
    } else if (zone === "next") {
      go(1);
    }
  }

  function zoomOut() {
    if (mode === "locked") {
      setLockedScale((s) => zoomStep(s, -1));
    } else {
      setUserZoom((z) => z / 1.2);
    }
  }

  function zoomIn() {
    if (mode === "locked") {
      setLockedScale((s) => zoomStep(s, 1));
    } else {
      setUserZoom((z) => z * 1.2);
    }
  }

  function fit() {
    setUserZoom(1);
    setMode("fit-width");
  }

  function toggleLock() {
    if (mode === "locked") {
      setMode("fit-width");
    } else {
      // freeze the current on-screen scale and reuse it for every page.
      setLockedScale(effectiveScale);
      setMode("locked");
    }
  }

  function toggleFullscreen() {
    try {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        document.documentElement.requestFullscreen();
      }
    } catch {
      // fullscreen may be blocked; ignore.
    }
  }

  function jump() {
    const input = window.prompt(`go to page (1-${numPages})`, String(page));
    if (input == null) {
      return;
    }
    const n = Number(input);
    if (Number.isFinite(n)) {
      setPage(clampPage(Math.floor(n), numPages));
    }
  }

  function jumpTo(target: number) {
    setPage(clampPage(target, numPages));
    setShowToc(false);
  }

  return (
    <div className="fixed inset-0 z-[60] flex h-dvh flex-col bg-bg">
      <div className="flex items-center gap-1 overflow-x-auto border-b border-border bg-surface px-2.5 pb-2 pt-[max(8px,env(safe-area-inset-top))] [scrollbar-width:none] md:pt-2 [&::-webkit-scrollbar]:hidden">
        <button className="icon-btn" onClick={() => navigate(-1)} aria-label="back" title="back">
          ‹
        </button>
        {outline.length > 0 && (
          <button
            className={`icon-btn ${showToc ? "is-active" : ""}`}
            onClick={() => setShowToc((v) => !v)}
            aria-label="contents"
            aria-pressed={showToc}
            title="contents"
          >
            ☰
          </button>
        )}
        <span
          className="min-w-0 flex-[0_1_auto] overflow-hidden text-ellipsis whitespace-nowrap text-text"
          title={filename}
        >
          {filename}
        </span>
        <span className="min-w-2 flex-[1_1_auto]" />
        <button
          className="h-11 flex-shrink-0 cursor-pointer whitespace-nowrap rounded-box border border-border bg-transparent px-2.5 text-muted transition-colors hover:border-accent-dim hover:text-accent md:h-[38px]"
          onClick={jump}
          title="go to page"
        >
          {page} / {numPages || "…"}
        </button>

        {/* the tool group: a fixed bottom action bar on mobile, inline on desktop. */}
        <div className="fixed inset-x-0 bottom-0 z-[61] flex items-center justify-around gap-1 border-t border-border bg-surface px-2 pt-1 pb-[max(4px,env(safe-area-inset-bottom))] md:static md:z-auto md:justify-start md:border-t-0 md:bg-transparent md:p-0">
          <button className="icon-btn" onClick={zoomOut} aria-label="zoom out" title="zoom out">
            −
          </button>
          <button className="icon-btn" onClick={zoomIn} aria-label="zoom in" title="zoom in">
            +
          </button>
          <button className="icon-btn" onClick={fit} aria-label="fit width" title="fit width">
            ⊏⊐
          </button>
          <button
            className={`icon-btn ${mode === "locked" ? "is-active" : ""}`}
            onClick={toggleLock}
            aria-label="lock zoom"
            aria-pressed={mode === "locked"}
            title={mode === "locked" ? "unlock zoom" : "lock zoom"}
          >
            {mode === "locked" ? "🔒" : "🔓"}
          </button>
          <button
            className="icon-btn"
            onClick={toggleFullscreen}
            aria-label="fullscreen"
            title="fullscreen"
          >
            ⤢
          </button>
          <a
            className="icon-btn"
            href={api.downloadUrl(path)}
            download={filename}
            aria-label={`download ${filename}`}
            title="download"
          >
            ⤓
          </a>
        </div>
      </div>

      <div className="relative flex min-h-0 flex-1">
        {showToc && outline.length > 0 && (
          <>
            <div
              className="absolute inset-0 z-[2] bg-[rgba(5,6,6,0.55)]"
              onClick={() => setShowToc(false)}
            />
            <nav
              className="absolute bottom-0 left-0 top-0 z-[3] flex w-[min(340px,86vw)] flex-col border-r border-border bg-surface shadow-[0_0_24px_rgba(0,0,0,0.5)]"
              aria-label="contents"
            >
              <div className="flex items-center justify-between border-b border-border py-2 pl-3.5 pr-2 tracking-[0.04em] text-muted">
                <span>contents</span>
                <button
                  className="icon-btn"
                  onClick={() => setShowToc(false)}
                  aria-label="close contents"
                >
                  ×
                </button>
              </div>
              <ul className="m-0 list-none overflow-y-auto p-0 py-1.5">
                {outline.map((item, i) => (
                  <li key={i}>
                    <button
                      className={`flex w-full cursor-pointer items-baseline gap-2.5 border-none bg-transparent px-3 py-2 text-left text-text transition-colors enabled:hover:bg-surface-2 enabled:hover:text-accent disabled:cursor-default disabled:text-muted ${
                        item.page === page ? "text-accent" : ""
                      }`}
                      style={{ paddingInlineStart: `${12 + item.depth * 14}px` }}
                      disabled={item.page == null}
                      onClick={() => item.page != null && jumpTo(item.page)}
                    >
                      <span className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
                        {item.title}
                      </span>
                      {item.page != null && (
                        <span className="flex-shrink-0 text-[13px] text-muted">{item.page}</span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          </>
        )}

        <div
          className="relative flex min-h-0 flex-1 items-start justify-center overflow-auto bg-bg pb-[calc(56px+env(safe-area-inset-bottom))] [touch-action:pan-x_pan-y] md:pb-0"
          ref={viewportRef}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
        >
          {loading && <div className="m-auto px-4 py-7 text-center text-muted">loading…</div>}
          {error && <div className="m-auto px-4 py-7 text-center text-error">{error}</div>}
          {doc && !error && (
            <PdfPage
              doc={doc}
              page={page}
              scale={effectiveScale}
              onIntrinsicWidth={setIntrinsicWidth}
            />
          )}
          {/* visual tap-zone hints; pointer events bubble to the viewport handlers above. */}
          <div className="absolute bottom-0 left-0 top-0 z-[1] w-[35%] cursor-w-resize" aria-hidden="true" />
          <div className="absolute bottom-0 right-0 top-0 z-[1] w-[35%] cursor-e-resize" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}
