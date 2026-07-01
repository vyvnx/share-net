import { useEffect } from "react";
import { Link } from "react-router-dom";
import { api, type FileEntry } from "../api/client";
import { isPreviewable } from "../lib/format";

interface Props {
  entry: FileEntry;
  /** full relative path of the file. */
  path: string;
  onClose: () => void;
}

export function PreviewModal({ entry, path, onClose }: Props) {
  const kind = isPreviewable(entry.name);
  const src = api.rawUrl(path);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-stretch justify-center bg-[rgba(5,6,6,0.88)] md:p-8"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="flex h-full w-full flex-col bg-surface md:max-h-[900px] md:w-[min(1000px,100%)] md:overflow-hidden md:rounded-box md:border md:border-border"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-border px-3.5 pb-2.5 pt-[max(10px,env(safe-area-inset-top))] md:pt-2.5">
          <span
            className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap"
            title={entry.name}
          >
            {entry.name}
          </span>
          <span className="flex flex-shrink-0 items-center gap-2.5">
            {kind === "pdf" && (
              <Link className="btn-ghost" to={`/read?path=${encodeURIComponent(path)}`}>
                read
              </Link>
            )}
            <a className="btn-ghost" href={api.downloadUrl(path)} download={entry.name}>
              download
            </a>
            <button className="icon-btn" onClick={onClose} aria-label="close preview">
              ×
            </button>
          </span>
        </div>
        <div className="flex min-h-0 flex-1 items-center justify-center bg-bg pb-[env(safe-area-inset-bottom)] md:pb-0">
          {kind === "pdf" && (
            <iframe className="h-full w-full border-none bg-white" src={src} title={entry.name} />
          )}
          {kind === "image" && (
            <img className="max-h-full max-w-full object-contain" src={src} alt={entry.name} />
          )}
          {!kind && <div className="px-4 py-7 text-center text-muted">no preview available</div>}
        </div>
      </div>
    </div>
  );
}
