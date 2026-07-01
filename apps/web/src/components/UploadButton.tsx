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
        className="fixed bottom-[calc(18px+env(safe-area-inset-bottom))] right-[calc(18px+env(safe-area-inset-right))] z-[15] inline-flex h-14 w-14 items-center justify-center gap-2 rounded-full border border-border-strong bg-accent-dim text-text shadow-[0_6px_20px_rgba(0,0,0,0.45)] transition-[filter] enabled:hover:brightness-[1.3] disabled:cursor-default disabled:opacity-70 md:static md:h-[38px] md:w-auto md:rounded-box md:px-3.5 md:shadow-none"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        aria-label="upload files"
      >
        <span className="text-xl md:text-[15px]">{busy ? "…" : "↑"}</span>
        <span className="hidden md:inline">{busy ? "uploading" : "upload"}</span>
      </button>
    </>
  );
}
