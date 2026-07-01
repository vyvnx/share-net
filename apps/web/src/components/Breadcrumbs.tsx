interface Props {
  /** relative path of the current directory ("" = root). */
  path: string;
  onNavigate: (path: string) => void;
}

export function Breadcrumbs({ path, onNavigate }: Props) {
  const parts = path ? path.split("/") : [];

  return (
    <nav
      className="flex flex-nowrap items-center overflow-x-auto whitespace-nowrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      aria-label="breadcrumb"
    >
      <button
        className="cursor-pointer border-none bg-transparent px-0.5 py-1 text-accent"
        onClick={() => onNavigate("")}
      >
        ~/shared
      </button>
      {parts.map((seg, i) => {
        const target = parts.slice(0, i + 1).join("/");
        const last = i === parts.length - 1;
        return (
          <span key={target} className="inline-flex items-center">
            <span className="px-1 text-muted">/</span>
            <button
              className={`cursor-pointer border-none bg-transparent px-0.5 py-1 ${
                last ? "cursor-default text-text" : "text-accent"
              }`}
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
