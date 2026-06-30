import { useRef, useState } from "react";

interface Props {
  onUpload: (file: File) => Promise<void>;
}

export function UploadButton({ onUpload }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function handle(files: FileList | null) {
    if (!files || files.length === 0) {
      return;
    }
    setBusy(true);
    try {
      for (const file of Array.from(files)) {
        await onUpload(file);
      }
    } finally {
      setBusy(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        multiple
        hidden
        onChange={(e) => handle(e.target.files)}
      />
      <button
        className="upload-btn"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        aria-label="upload files"
      >
        <span className="upload-btn__icon">{busy ? "…" : "↑"}</span>
        <span className="upload-btn__label">{busy ? "uploading" : "upload"}</span>
      </button>
    </>
  );
}
