import { useState, type FormEvent } from "react";
import { api } from "../api/client";

interface Props {
  onLogin: () => void;
}

export function Login({ onLogin }: Props) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(false);
    try {
      await api.login(username, password);
      onLogin();
    } catch {
      setError(true);
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center p-6">
      <form
        className={`flex w-full max-w-[380px] flex-col gap-4 rounded-box border bg-surface px-6 py-7 ${
          error ? "animate-[shake_0.35s] border-error" : "border-border"
        }`}
        onSubmit={submit}
      >
        <div className="text-xl font-bold tracking-[0.02em]">
          share-net
          <span className="ml-px text-accent [animation:blink_1.1s_steps(1)_infinite]">▮</span>
        </div>
        <div className="h-px bg-border" />

        <label className="flex items-center gap-2 rounded-box border border-border bg-bg px-3 py-2 focus-within:border-accent-dim">
          <span className="text-accent">&gt;</span>
          <span className="w-[38px] text-muted">user</span>
          <input
            className="min-w-0 flex-1 border-none bg-transparent text-text outline-none"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoFocus
            autoComplete="username"
            spellCheck={false}
            aria-label="username"
          />
        </label>

        <label className="flex items-center gap-2 rounded-box border border-border bg-bg px-3 py-2 focus-within:border-accent-dim">
          <span className="text-accent">&gt;</span>
          <span className="w-[38px] text-muted">pass</span>
          <input
            className="min-w-0 flex-1 border-none bg-transparent text-text outline-none"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            aria-label="password"
          />
        </label>

        {error && <div className="text-sm text-error">access denied</div>}

        <button
          className="min-h-11 rounded-box border border-accent-dim bg-accent-dim p-2.5 text-text transition-[filter] enabled:hover:brightness-125 disabled:cursor-default disabled:opacity-60"
          type="submit"
          disabled={busy}
        >
          {busy ? "authenticating…" : "[ enter ↵ ]"}
        </button>
      </form>
    </div>
  );
}
