import type { FileEntry } from "../api/client";
import { fileExt, humanSize, isPreviewable } from "../lib/format";

interface Props {
  entries: FileEntry[];
  loading: boolean;
  emptyLabel: string;
  onOpenDir: (name: string) => void;
  onPreview: (entry: FileEntry) => void;
  downloadUrl: (name: string) => string;
}

export function FileList({
  entries,
  loading,
  emptyLabel,
  onOpenDir,
  onPreview,
  downloadUrl,
}: Props) {
  if (loading) {
    return <div className="filelist__status">loading…</div>;
  }
  if (entries.length === 0) {
    return <div className="filelist__status">{emptyLabel}</div>;
  }

  return (
    <ul className="filelist">
      {entries.map((entry) => {
        const isDir = entry.type === "dir";
        const previewKind = isDir ? null : isPreviewable(entry.name);
        const ext = isDir ? "" : fileExt(entry.name);

        function activate() {
          if (isDir) {
            onOpenDir(entry.name);
          } else if (previewKind) {
            onPreview(entry);
          }
        }

        return (
          <li key={entry.name} className={`row ${isDir ? "row--dir" : ""}`}>
            <button className="row__main" onClick={activate} title={entry.name}>
              <span className="row__mode">{isDir ? "drwx" : "-rw-"}</span>
              <span className="row__name">
                {entry.name}
                {isDir ? "/" : ""}
              </span>
            </button>
            <span className="row__meta">
              {ext && <span className="row__ext">{ext}</span>}
              <span className="row__size">{isDir ? "—" : humanSize(entry.size)}</span>
              <span className="row__actions">
                {!isDir && previewKind && (
                  <button
                    className="icon-btn"
                    onClick={() => onPreview(entry)}
                    aria-label={`preview ${entry.name}`}
                    title="preview"
                  >
                    ◱
                  </button>
                )}
                {isDir ? (
                  <button
                    className="icon-btn"
                    onClick={() => onOpenDir(entry.name)}
                    aria-label={`open ${entry.name}`}
                    title="open"
                  >
                    ↵
                  </button>
                ) : (
                  <a
                    className="icon-btn"
                    href={downloadUrl(entry.name)}
                    aria-label={`download ${entry.name}`}
                    title="download"
                  >
                    ⤓
                  </a>
                )}
              </span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
