import { useState } from "react";

interface Props {
  username: string;
  query: string;
  onQuery: (q: string) => void;
  onLogout: () => void;
}

export function TopBar({ username, query, onQuery, onLogout }: Props) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="topbar">
      <div className="topbar__brand">
        <span className="topbar__logo">◈</span>
        <span className="topbar__title">share-net</span>
      </div>

      <div className={`topbar__search ${searchOpen ? "is-open" : ""}`}>
        <span className="topbar__prompt">&gt;</span>
        <input
          className="topbar__input"
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder="search files"
          aria-label="search files"
          spellCheck={false}
        />
        {query && (
          <button className="icon-btn" onClick={() => onQuery("")} aria-label="clear search">
            ×
          </button>
        )}
      </div>

      <div className="topbar__actions">
        <button
          className="icon-btn topbar__only-mobile"
          onClick={() => setSearchOpen((v) => !v)}
          aria-label="toggle search"
        >
          ⌕
        </button>
        <button
          className="icon-btn topbar__only-mobile"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="menu"
        >
          ≡
        </button>

        <div className="topbar__user topbar__only-desktop">
          <span className="muted">{username}</span>
          <button className="btn-ghost" onClick={onLogout}>
            exit
          </button>
        </div>

        {menuOpen && (
          <div className="topbar__menu">
            <span className="muted">signed in as {username}</span>
            <button className="btn-ghost" onClick={onLogout}>
              exit
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
