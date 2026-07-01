import { useState } from "react";

interface Props {
  onCreate: (name: string) => Promise<void>;
}

export function NewFolderButton({ onCreate }: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function close() {
    setOpen(false);
    setName("");
    setError(null);
    setBusy(false);
  }

  async function submit() {
    const trimmed = name.trim();
    if (!trimmed || busy) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onCreate(trimmed);
      close();
    } catch (e) {
      // keep the popover open so the name can be fixed (e.g. "already exists").
      setError(e instanceof Error ? e.message : "could not create folder");
      setBusy(false);
    }
  }

  return (
    <div className="relative inline-flex">
      <button
        className="btn-ghost gap-2"
        onClick={() => setOpen((v) => !v)}
        aria-label="new folder"
        aria-expanded={open}
      >
        <span className="text-lg leading-none md:text-[15px]">+</span>
        <span className="hidden md:inline">new folder</span>
      </button>

      {open && (
        <>
          {/* transparent layer that closes the popover on an outside click. */}
          <div className="fixed inset-0 z-20" onClick={close} />
          <div
            className="absolute right-0 top-[calc(100%+6px)] z-[21] w-[min(280px,calc(100vw-32px))] rounded-box border border-border-strong bg-surface p-2.5 shadow-[0_10px_28px_rgba(0,0,0,0.5)]"
            role="dialog"
            aria-label="new folder"
          >
            <div className="flex items-center gap-2 rounded-box border border-border bg-bg px-2 focus-within:border-accent-dim">
              <span className="text-accent">›</span>
              <input
                className="h-11 min-w-0 flex-1 border-none bg-transparent font-mono text-text outline-none placeholder:text-muted md:h-[34px]"
                autoFocus
                value={name}
                placeholder="name or a/b/c"
                disabled={busy}
                onChange={(e) => {
                  setName(e.target.value);
                  setError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    submit();
                  } else if (e.key === "Escape") {
                    close();
                  }
                }}
              />
            </div>
            {error && <div className="mt-2 text-xs text-error">{error}</div>}
            <div className="mt-2.5 flex justify-end gap-2">
              <button
                className="h-11 cursor-pointer rounded-box border border-border bg-surface-2 px-3 text-sm text-muted transition-colors enabled:hover:border-border-strong enabled:hover:text-text disabled:opacity-60 md:h-8"
                onClick={close}
                disabled={busy}
              >
                cancel
              </button>
              <button
                className="h-11 cursor-pointer rounded-box border border-accent-dim bg-accent-dim px-3 text-sm text-text transition-[filter] enabled:hover:brightness-[1.3] disabled:cursor-default disabled:opacity-60 md:h-8"
                onClick={submit}
                disabled={busy || !name.trim()}
              >
                {busy ? "…" : "create"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
