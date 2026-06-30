interface Props {
  /** relative path of the current directory ("" = root). */
  path: string;
  onNavigate: (path: string) => void;
}

export function Breadcrumbs({ path, onNavigate }: Props) {
  const parts = path ? path.split("/") : [];

  return (
    <nav className="crumbs" aria-label="breadcrumb">
      <button className="crumbs__seg" onClick={() => onNavigate("")}>
        ~/shared
      </button>
      {parts.map((seg, i) => {
        const target = parts.slice(0, i + 1).join("/");
        const last = i === parts.length - 1;
        return (
          <span key={target} className="crumbs__group">
            <span className="crumbs__sep">/</span>
            <button
              className={`crumbs__seg ${last ? "is-current" : ""}`}
              onClick={() => onNavigate(target)}
              disabled={last}
            >
              {seg}
            </button>
          </span>
        );
      })}
    </nav>
  );
}
