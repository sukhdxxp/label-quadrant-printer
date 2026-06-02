import type { Quadrant } from "../types";

interface Props {
  selected: Quadrant;
  occupied: Quadrant[];
  disabled: Quadrant[];
  onSelect: (q: Quadrant) => void;
  onToggleDisabled: (q: Quadrant) => void;
}

const ORDER: Quadrant[] = [1, 2, 3, 4];

// Each cell is an outer corner of the 2x2; round it to match the container's
// inner radius so the selection outline isn't clipped square at the corner.
const CORNER: Record<Quadrant, string> = {
  1: "rounded-tl-[9px]",
  2: "rounded-tr-[9px]",
  3: "rounded-bl-[9px]",
  4: "rounded-br-[9px]",
};

export default function QuadrantSelector({
  selected,
  occupied,
  disabled,
  onSelect,
  onToggleDisabled,
}: Props) {
  return (
    <div className="flex flex-col gap-3">
      {/* 2x2 cell map, full width with a compact fixed height, hairline gutters. */}
      <div className="grid w-full grid-cols-2 gap-px overflow-hidden rounded-md border border-border-strong bg-border-strong shadow-raised">
        {ORDER.map((q) => {
          const isSelected = selected === q;
          const isOccupied = occupied.includes(q);
          const isDisabled = disabled.includes(q);
          return (
            <div
              key={q}
              role="button"
              tabIndex={0}
              onClick={() => onSelect(q)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect(q);
                }
              }}
              className={[
                "group relative flex h-[68px] cursor-pointer flex-col items-center justify-center gap-0.5 transition-colors duration-150 ease-out-quart focus-visible:z-10 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent",
                CORNER[q],
                isSelected ? "bg-accent-weak" : "bg-surface hover:bg-sunken",
              ].join(" ")}
              aria-pressed={isSelected}
              title={`Quadrant ${q}`}
            >
              {isSelected && (
                <span
                  className={`pointer-events-none absolute inset-0 border-[1.5px] border-accent ${CORNER[q]}`}
                  aria-hidden="true"
                />
              )}
              {isDisabled && (
                <span
                  className="pointer-events-none absolute inset-0"
                  style={{
                    backgroundImage:
                      "repeating-linear-gradient(45deg, oklch(0.58 0.2 25 / 0.18) 0 2px, transparent 2px 6px)",
                  }}
                  aria-hidden="true"
                />
              )}
              <span
                className={[
                  "font-mono text-xs font-medium",
                  isSelected ? "text-accent" : "text-ink",
                ].join(" ")}
              >
                Q{q}
              </span>
              <span
                className={[
                  "text-[10px] tracking-[0.02em]",
                  isDisabled
                    ? "text-danger"
                    : isOccupied
                      ? "text-ink-secondary"
                      : "text-ink-tertiary",
                ].join(" ")}
              >
                {isDisabled ? "skip" : isOccupied ? "image" : "empty"}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleDisabled(q);
                }}
                aria-label={
                  isDisabled
                    ? `Enable quadrant ${q}`
                    : `Mark quadrant ${q} as peeled (skip in PDF)`
                }
                className="absolute bottom-1 right-1 rounded-[4px] border border-border bg-surface/85 px-1.5 py-px text-[9px] font-medium text-ink-secondary opacity-0 backdrop-blur-[1px] transition-opacity duration-150 ease-out-quart hover:bg-sunken focus-visible:opacity-100 group-hover:opacity-100"
              >
                {isDisabled ? "on" : "off"}
              </button>
            </div>
          );
        })}
      </div>
      <p className="text-xs leading-relaxed text-ink-secondary">
        Pick the cell to target. Toggle a cell{" "}
        <span className="font-medium text-ink">off</span> to mark it already
        peeled; it is skipped in the PDF.
      </p>
    </div>
  );
}
