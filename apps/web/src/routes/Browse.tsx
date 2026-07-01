import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api, ApiError, type FileEntry } from "../api/client";
import { TopBar } from "../components/TopBar";
import { Breadcrumbs } from "../components/Breadcrumbs";
import { FileList } from "../components/FileList";
import { PreviewModal } from "../components/PreviewModal";
import { UploadButton } from "../components/UploadButton";
import { NewFolderButton } from "../components/NewFolderButton";

interface Props {
  username: string;
  onLogout: () => void;
}

function join(dir: string, name: string): string {
  return dir ? `${dir}/${name}` : name;
}

export function Browse({ username, onLogout }: Props) {
  const [params, setParams] = useSearchParams();
  const path = params.get("path") ?? "";

  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [preview, setPreview] = useState<FileEntry | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.list(path);
      setEntries(res.entries);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        onLogout();
        return;
      }
      setError(e instanceof Error ? e.message : "failed to load");
    } finally {
      setLoading(false);
    }
  }, [path, onLogout]);

  useEffect(() => {
    load();
  }, [load]);

  // reset the filter when changing directories.
  useEffect(() => {
    setQuery("");
  }, [path]);

  const navigate = (target: string) => setParams(target ? { path: target } : {});
  const openDir = (name: string) => navigate(join(path, name));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return entries;
    }
    return entries.filter((e) => e.name.toLowerCase().includes(q));
  }, [entries, query]);

  async function handleUpload(file: File) {
    await api.upload(path, file);
    await load();
  }

  // create the folder(s) and navigate into the deepest created directory.
  // errors propagate to NewFolderButton, which surfaces them inline.
  async function handleMkdir(name: string) {
    const res = await api.mkdir(path, name);
    navigate(res.path);
  }

  function handleLogout() {
    api.logout().finally(onLogout);
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <TopBar username={username} query={query} onQuery={setQuery} onLogout={handleLogout} />
      <main className="mx-auto w-full max-w-[880px] flex-1 px-[max(14px,env(safe-area-inset-left))] pb-24 pt-4 md:px-5 md:pb-10 md:pt-[22px]">
        <div className="mb-3.5 flex min-h-[38px] items-center gap-2.5">
          <Breadcrumbs path={path} onNavigate={navigate} />
          <div className="flex-1" />
          <NewFolderButton onCreate={handleMkdir} />
          <UploadButton onUpload={handleUpload} />
        </div>

        {error ? (
          <div className="px-4 py-7 text-center text-error">{error}</div>
        ) : (
          <FileList
            entries={filtered}
            loading={loading}
            emptyLabel={query ? "no matches" : "empty folder"}
            onOpenDir={openDir}
            onPreview={setPreview}
            downloadUrl={(name) => api.downloadUrl(join(path, name))}
            readUrl={(name) => `/read?path=${encodeURIComponent(join(path, name))}`}
          />
        )}
      </main>

      {preview && (
        <PreviewModal
          entry={preview}
          path={join(path, preview.name)}
          onClose={() => setPreview(null)}
        />
      )}
    </div>
  );
}
