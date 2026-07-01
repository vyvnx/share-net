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
    <div className="modal" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="modal__panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal__bar">
          <span className="modal__name" title={entry.name}>
            {entry.name}
          </span>
          <span className="modal__tools">
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
        <div className="modal__body">
          {kind === "pdf" && <iframe className="modal__pdf" src={src} title={entry.name} />}
          {kind === "image" && <img className="modal__img" src={src} alt={entry.name} />}
          {!kind && <div className="filelist__status">no preview available</div>}
        </div>
      </div>
    </div>
  );
}
