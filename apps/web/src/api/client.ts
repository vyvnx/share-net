import type {
  FileEntry,
  ListResponse,
  MeResponse,
  ProgressResponse,
  UploadResponse,
} from "@share-net/types";

// re-export the shared types so components import them from one place.
export type { FileEntry, ListResponse, MeResponse, ProgressResponse, UploadResponse };

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request(url: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(url, { credentials: "same-origin", ...init });
  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = (await res.json()) as { error?: string };
      if (body.error) {
        message = body.error;
      }
    } catch {
      // non-json error body; keep statusText
    }
    throw new ApiError(message, res.status);
  }
  return res;
}

const qp = (path: string): string => `path=${encodeURIComponent(path)}`;

export const api = {
  async me(): Promise<MeResponse> {
    return (await request("/api/me")).json();
  },

  async login(username: string, password: string): Promise<MeResponse> {
    return (
      await request("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      })
    ).json();
  },

  async logout(): Promise<void> {
    await request("/api/logout", { method: "POST" });
  },

  async list(path: string): Promise<ListResponse> {
    return (await request(`/api/files?${qp(path)}`)).json();
  },

  downloadUrl(path: string): string {
    return `/api/download?${qp(path)}`;
  },

  rawUrl(path: string): string {
    return `/api/raw?${qp(path)}`;
  },

  async getProgress(path: string): Promise<number | null> {
    const res = (await (await request(`/api/progress?${qp(path)}`)).json()) as ProgressResponse;
    return res.page;
  },

  async setProgress(path: string, page: number): Promise<void> {
    await request(`/api/progress?${qp(path)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ page }),
    });
  },

  async upload(dir: string, file: File): Promise<UploadResponse> {
    const form = new FormData();
    form.append("file", file);
    return (
      await request(`/api/upload?${qp(dir)}`, {
        method: "POST",
        body: form,
      })
    ).json();
  },
};
