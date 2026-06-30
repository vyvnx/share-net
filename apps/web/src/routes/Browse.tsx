import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api, ApiError, type FileEntry } from "../api/client";
import { TopBar } from "../components/TopBar";
import { Breadcrumbs } from "../components/Breadcrumbs";
import { FileList } from "../components/FileList";
import { PreviewModal } from "../components/PreviewModal";
import { UploadButton } from "../components/UploadButton";

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

  function handleLogout() {
    api.logout().finally(onLogout);
  }

  return (
    <div className="app">
      <TopBar username={username} query={query} onQuery={setQuery} onLogout={handleLogout} />
      <main className="container">
        <div className="toolbar">
          <Breadcrumbs path={path} onNavigate={navigate} />
          <div className="toolbar__spacer" />
          <UploadButton onUpload={handleUpload} />
        </div>

        {error ? (
          <div className="filelist__status filelist__status--error">{error}</div>
        ) : (
          <FileList
            entries={filtered}
            loading={loading}
            emptyLabel={query ? "no matches" : "empty folder"}
            onOpenDir={openDir}
            onPreview={setPreview}
            downloadUrl={(name) => api.downloadUrl(join(path, name))}
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
