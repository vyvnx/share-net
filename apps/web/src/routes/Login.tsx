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
    <div className="login">
      <form className={`login__card ${error ? "is-error" : ""}`} onSubmit={submit}>
        <div className="login__title">
          share-net<span className="cursor">▮</span>
        </div>
        <div className="login__rule" />

        <label className="prompt">
          <span className="prompt__sigil">&gt;</span>
          <span className="prompt__label">user</span>
          <input
            className="prompt__input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoFocus
            autoComplete="username"
            spellCheck={false}
            aria-label="username"
          />
        </label>

        <label className="prompt">
          <span className="prompt__sigil">&gt;</span>
          <span className="prompt__label">pass</span>
          <input
            className="prompt__input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            aria-label="password"
          />
        </label>

        {error && <div className="login__error">access denied</div>}

        <button className="login__submit" type="submit" disabled={busy}>
          {busy ? "authenticating…" : "[ enter ↵ ]"}
        </button>
      </form>
    </div>
  );
}
