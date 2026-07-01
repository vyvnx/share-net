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
    <div className="newfolder">
      <button
        className="newfolder-btn"
        onClick={() => setOpen((v) => !v)}
        aria-label="new folder"
        aria-expanded={open}
      >
        <span className="newfolder-btn__icon">+</span>
        <span className="newfolder-btn__label">new folder</span>
      </button>

      {open && (
        <>
          <div className="newfolder__backdrop" onClick={close} />
          <div className="newfolder__pop" role="dialog" aria-label="new folder">
            <div className="newfolder__row">
              <span className="newfolder__prompt">›</span>
              <input
                className="newfolder__input"
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
            {error && <div className="newfolder__error">{error}</div>}
            <div className="newfolder__actions">
              <button className="newfolder__btn" onClick={close} disabled={busy}>
                cancel
              </button>
              <button
                className="newfolder__btn newfolder__btn--primary"
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
