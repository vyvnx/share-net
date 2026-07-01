import { useEffect } from "react";

export interface SheetAction {
  label: string;
  /** optional leading glyph. */
  icon?: string;
  onClick?: () => void;
  /** when set, the action renders as a link (used for downloads). */
  href?: string;
  download?: string | boolean;
}

interface Props {
  title: string;
  actions: SheetAction[];
  onClose: () => void;
}

/**
 * a mobile-style bottom sheet: slides up from the bottom, dims the backdrop,
 * and lists tappable actions. centers as a small card on desktop.
 */
export function ActionSheet({ title, actions, onClose }: Props) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const rowClass =
    "flex w-full items-center gap-3 border-none bg-transparent px-4 py-3.5 text-left text-text hover:bg-surface-2 hover:text-accent";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end bg-[rgba(5,6,6,0.6)] md:items-center md:justify-center"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="w-full rounded-t-box border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] md:w-[min(360px,92vw)] md:rounded-box md:border md:pb-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="overflow-hidden text-ellipsis whitespace-nowrap border-b border-border px-4 py-3 tracking-[0.04em] text-muted">
          {title}
        </div>
        <ul className="m-0 list-none p-0">
          {actions.map((action, i) => {
            const content = (
              <>
                {action.icon && <span className="w-4 text-center text-muted">{action.icon}</span>}
                <span>{action.label}</span>
              </>
            );
            return (
              <li key={i} className="border-b border-border last:border-b-0">
                {action.href ? (
                  <a
                    className={rowClass}
                    href={action.href}
                    download={action.download}
                    onClick={onClose}
                  >
                    {content}
                  </a>
                ) : (
                  <button
                    className={rowClass}
                    onClick={() => {
                      action.onClick?.();
                      onClose();
                    }}
                  >
                    {content}
                  </button>
                )}
              </li>
            );
          })}
          <li>
            <button
              className="flex w-full items-center justify-center border-none bg-transparent px-4 py-3.5 text-muted hover:text-accent"
              onClick={onClose}
            >
              cancel
            </button>
          </li>
        </ul>
      </div>
    </div>
  );
}
