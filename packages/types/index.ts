/** shared api contract types, imported by both the server and the web app. */

export type EntryType = "file" | "dir";

export interface FileEntry {
  name: string;
  type: EntryType;
  /** size in bytes; 0 for directories. */
  size: number;
  /** last-modified time, epoch milliseconds. */
  mtime: number;
}

export interface ListResponse {
  /** normalized relative path of the listed directory ("" = root). */
  path: string;
  entries: FileEntry[];
}

export interface MeResponse {
  username: string;
}

export interface UploadResponse {
  name: string;
}

export interface MkdirRequest {
  /** folder name; may be a nested path like "a/b/c" (created recursively). */
  name: string;
}

export interface MkdirResponse {
  /** normalized relative path of the created directory. */
  path: string;
}

export interface ApiError {
  error: string;
}

export interface ProgressResponse {
  /** last-read page for a book, or null if none saved. */
  page: number | null;
}

export interface ProgressUpdate {
  page: number;
}
