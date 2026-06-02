import { useEffect, useRef, type ReactNode } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

/**
 * Accessible modal built on the native <dialog> element: focus trap, Escape to
 * close, and inert background come for free. Clicking the backdrop closes it.
 */
export default function Dialog({ open, onClose, title, children }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    else if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        // The backdrop area registers as a click on the <dialog> itself.
        if (e.target === ref.current) onClose();
      }}
      className="ui-dialog m-auto w-[min(92vw,30rem)] rounded-lg border border-border bg-surface p-0 text-ink shadow-popover backdrop:bg-ink/35"
    >
      <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-4">
        <h2 className="text-[1.0625rem] font-semibold tracking-[-0.005em] text-ink">
          {title}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="grid size-7 shrink-0 place-items-center rounded-md text-ink-secondary transition-colors duration-150 ease-out-quart hover:bg-sunken hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M6 6l12 12M18 6 6 18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>
      <div className="px-5 py-4">{children}</div>
    </dialog>
  );
}
