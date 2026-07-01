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
    <header className="sticky top-0 z-20 flex items-center gap-2.5 border-b border-border bg-[rgba(11,13,12,0.9)] px-3.5 pb-2.5 pt-[max(10px,env(safe-area-inset-top))] backdrop-blur-[8px] md:gap-4 md:px-5 md:pb-3 md:pt-3">
      <div className="flex min-w-0 flex-1 items-center gap-2 md:flex-none">
        <span className="text-accent">◈</span>
        <span className="whitespace-nowrap font-bold">share-net</span>
      </div>

      <div
        className={`items-center gap-1.5 rounded-box border border-border bg-surface px-2.5 py-1 focus-within:border-accent-dim md:mx-auto md:mt-0 md:flex md:max-w-[420px] md:flex-1 md:static md:left-auto md:right-auto md:top-auto ${
          searchOpen ? "absolute left-2.5 right-2.5 top-full mt-1.5 flex" : "hidden"
        }`}
      >
        <span className="text-accent">&gt;</span>
        <input
          className="w-full border-none bg-transparent text-text outline-none placeholder:text-muted"
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

      <div className="relative flex items-center gap-1">
        <button
          className="icon-btn md:hidden"
          onClick={() => setSearchOpen((v) => !v)}
          aria-label="toggle search"
        >
          ⌕
        </button>
        <button
          className="icon-btn md:hidden"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="menu"
        >
          ≡
        </button>

        <div className="hidden items-center gap-2.5 md:flex">
          <span className="text-muted">{username}</span>
          <button className="btn-ghost" onClick={onLogout}>
            exit
          </button>
        </div>

        {menuOpen && (
          <div className="absolute right-0 top-full mt-2 flex min-w-[180px] flex-col gap-2.5 rounded-box border border-border bg-surface p-3">
            <span className="text-muted">signed in as {username}</span>
            <button className="btn-ghost" onClick={onLogout}>
              exit
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
