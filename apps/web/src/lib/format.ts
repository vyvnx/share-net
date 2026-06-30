const UNITS = ["B", "K", "M", "G", "T"] as const;

/** compact, terminal-style human-readable size, e.g. "26.8 M", "512 B". */
export function humanSize(bytes: number): string {
  if (bytes <= 0) {
    return "0 B";
  }
  const i = Math.min(UNITS.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  const n = bytes / 1024 ** i;
  const value = i === 0 || n >= 100 ? Math.round(n).toString() : n.toFixed(1);
  return `${value} ${UNITS[i]}`;
}

/** file extension, lowercase, without the dot. empty for dotfiles or no extension. */
export function fileExt(name: string): string {
  const dot = name.lastIndexOf(".");
  if (dot <= 0 || dot === name.length - 1) {
    return "";
  }
  return name.slice(dot + 1).toLowerCase();
}

export type PreviewKind = "pdf" | "image";

/** determine whether a filename can be previewed in the browser. */
export function isPreviewable(name: string): PreviewKind | null {
  const ext = name.toLowerCase().split(".").pop() ?? "";
  if (ext === "pdf") {
    return "pdf";
  }
  if (["png", "jpg", "jpeg", "gif", "webp", "svg", "avif", "bmp"].includes(ext)) {
    return "image";
  }
  return null;
}
