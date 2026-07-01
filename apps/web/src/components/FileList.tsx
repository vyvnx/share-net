import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { FileEntry } from "../api/client";
import { fileExt, humanSize, isPreviewable } from "../lib/format";
import { ActionSheet, type SheetAction } from "./ActionSheet";

interface Props {
  entries: FileEntry[];
  loading: boolean;
  emptyLabel: string;
  onOpenDir: (name: string) => void;
  onPreview: (entry: FileEntry) => void;
  downloadUrl: (name: string) => string;
  /** book-reader route for a pdf entry, e.g. /read?path=… */
  readUrl?: (name: string) => string;
}

export function FileList({
  entries,
  loading,
  emptyLabel,
  onOpenDir,
  onPreview,
  downloadUrl,
  readUrl,
}: Props) {
  const navigate = useNavigate();
  const [sheetEntry, setSheetEntry] = useState<FileEntry | null>(null);

  if (loading) {
    return <div className="px-4 py-7 text-center text-muted">loading…</div>;
  }
  if (entries.length === 0) {
    return <div className="px-4 py-7 text-center text-muted">{emptyLabel}</div>;
  }

  // actions offered in the mobile overflow sheet for a given file.
  function sheetActions(entry: FileEntry): SheetAction[] {
    const kind = isPreviewable(entry.name);
    const actions: SheetAction[] = [];
    if (kind) {
      actions.push({ label: "preview", icon: "◱", onClick: () => onPreview(entry) });
    }
    if (kind === "pdf" && readUrl) {
      actions.push({ label: "read", icon: "▤", onClick: () => navigate(readUrl(entry.name)) });
    }
    actions.push({
      label: "download",
      icon: "⤓",
      href: downloadUrl(entry.name),
      download: entry.name,
    });
    return actions;
  }

  return (
    <>
      <ul className="m-0 list-none overflow-hidden rounded-box border border-border bg-surface p-0">
        {entries.map((entry) => {
          const isDir = entry.type === "dir";
          const previewKind = isDir ? null : isPreviewable(entry.name);
          const ext = isDir ? "" : fileExt(entry.name);

          function activate() {
            if (isDir) {
              onOpenDir(entry.name);
            } else if (previewKind) {
              onPreview(entry);
            } else {
              setSheetEntry(entry);
            }
          }

          return (
            <li
              key={entry.name}
              className="flex min-h-[52px] items-center gap-2 border-b border-border pr-2 last:border-b-0 hover:bg-surface-2"
            >
              <button
                className="flex h-full min-w-0 flex-1 items-center gap-3 border-none bg-transparent px-3 py-2.5 text-left text-text"
                onClick={activate}
                title={entry.name}
              >
                <span
                  className={`hidden flex-shrink-0 text-[13px] md:inline ${
                    isDir ? "text-accent" : "text-muted"
                  }`}
                >
                  {isDir ? "drwx" : "-rw-"}
                </span>
                <span
                  className={`overflow-hidden text-ellipsis whitespace-nowrap ${
                    isDir ? "text-accent" : ""
                  }`}
                >
                  {entry.name}
                  {isDir ? "/" : ""}
                </span>
              </button>

              <span className="flex flex-shrink-0 items-center gap-2">
                {ext && (
                  <span className="hidden flex-shrink-0 text-[11px] uppercase tracking-[0.06em] text-muted opacity-75 md:inline">
                    {ext}
                  </span>
                )}
                <span className="min-w-[56px] text-right text-[13px] text-muted">
                  {isDir ? "—" : humanSize(entry.size)}
                </span>

                {/* desktop: inline actions (unchanged behavior). */}
                <span className="hidden items-center gap-0.5 md:flex">
                  {!isDir && previewKind === "pdf" && readUrl && (
                    <Link
                      className="icon-btn"
                      to={readUrl(entry.name)}
                      aria-label={`read ${entry.name}`}
                      title="read"
                    >
                      ▤
                    </Link>
                  )}
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
                      download={entry.name}
                      aria-label={`download ${entry.name}`}
                      title="download"
                    >
                      ⤓
                    </a>
                  )}
                </span>

                {/* mobile: a drill-in hint for dirs, an overflow sheet for files. */}
                {isDir ? (
                  <span
                    className="flex w-11 items-center justify-center text-muted md:hidden"
                    aria-hidden="true"
                  >
                    ›
                  </span>
                ) : (
                  <button
                    className="icon-btn md:hidden"
                    onClick={() => setSheetEntry(entry)}
                    aria-label={`actions for ${entry.name}`}
                    title="actions"
                  >
                    ⋯
                  </button>
                )}
              </span>
            </li>
          );
        })}
      </ul>

      {sheetEntry && (
        <ActionSheet
          title={sheetEntry.name}
          actions={sheetActions(sheetEntry)}
          onClose={() => setSheetEntry(null)}
        />
      )}
    </>
  );
}
