import path from "node:path";

/**
 * resolve `rel` under `root`, guaranteeing the result stays within `root`.
 *
 * blocks null bytes, absolute paths, and `..` traversal. in-tree symlinks (such
 * as the `books` symlink inside `shared/`) are deliberately followed at file-access
 * time: they are trusted local content placed by the owner. the lexical
 * containment check below — not realpath — is what enforces the security boundary,
 * which is why a symlink pointing outside the tree still resolves to a path string
 * that lives under `root`.
 */
export function safePath(root: string, rel: string): string {
  if (rel.includes("\0")) {
    throw new Error("invalid path");
  }
  const rootResolved = path.resolve(root);
  const resolved = path.resolve(rootResolved, rel);
  if (resolved !== rootResolved && !resolved.startsWith(rootResolved + path.sep)) {
    throw new Error("path traversal");
  }
  return resolved;
}

/** clean a user-supplied relative path for display/echo: posix, no leading/trailing slash. */
export function cleanRel(rel: string): string {
  const norm = path.posix.normalize("/" + rel.replace(/\\/g, "/"));
  return norm.replace(/^\/+/, "").replace(/\/+$/, "");
}
