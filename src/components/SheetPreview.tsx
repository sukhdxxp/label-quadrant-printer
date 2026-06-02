import { useMemo, type ReactElement } from "react";
import type { Quadrant, SheetState } from "../types";
import {
  CELL_H_MM,
  CELL_W_MM,
  PAGE_H_MM,
  PAGE_W_MM,
  placeInQuadrant,
} from "../lib/placement";

interface Props {
  state: SheetState;
  selectedQuadrant: Quadrant;
  showRuler: boolean;
  onSelectQuadrant: (q: Quadrant) => void;
}

/* Colors resolve from the @theme CSS variables via the `style` prop (CSS
 * accepts var() and oklch(); SVG presentation attributes do not). */
const C = {
  surface: "var(--color-surface)",
  borderStrong: "var(--color-border-strong)",
  inkTertiary: "var(--color-ink-tertiary)",
  accent: "var(--color-accent)",
  accentWeak: "var(--color-accent-weak)",
  danger: "var(--color-danger)",
};

const ORIGIN: Record<Quadrant, { x: number; y: number }> = {
  1: { x: 0, y: 0 },
  2: { x: CELL_W_MM, y: 0 },
  3: { x: 0, y: CELL_H_MM },
  4: { x: CELL_W_MM, y: CELL_H_MM },
};

export default function SheetPreview({
  state,
  selectedQuadrant,
  showRuler,
  onSelectQuadrant,
}: Props) {
  const placements = useMemo(
    () =>
      state.images.map((img) => ({
        img,
        placement: placeInQuadrant(img, state.safetyMargin),
        disabled: state.disabledQuadrants.includes(img.quadrant),
      })),
    [state.images, state.safetyMargin, state.disabledQuadrants],
  );

  const selected = ORIGIN[selectedQuadrant];

  const rulerTicks = useMemo(() => {
    if (!showRuler) return null;
    const ticks: ReactElement[] = [];
    for (let x = 0; x <= PAGE_W_MM; x += 10) {
      ticks.push(
        <line
          key={`tx-${x}`}
          x1={x}
          y1={0}
          x2={x}
          y2={x % 50 === 0 ? 4 : 2.5}
          style={{ stroke: C.inkTertiary }}
          strokeWidth={0.2}
        />,
      );
    }
    for (let y = 0; y <= PAGE_H_MM; y += 10) {
      ticks.push(
        <line
          key={`ty-${y}`}
          x1={0}
          y1={y}
          x2={y % 50 === 0 ? 4 : 2.5}
          y2={y}
          style={{ stroke: C.inkTertiary }}
          strokeWidth={0.2}
        />,
      );
    }
    return ticks;
  }, [showRuler]);

  const rulerLabels = useMemo(() => {
    if (!showRuler) return null;
    const labels: ReactElement[] = [];
    for (let x = 50; x < PAGE_W_MM; x += 50) {
      labels.push(
        <text
          key={`lx-${x}`}
          x={x + 1.2}
          y={4.4}
          style={{ fill: C.inkTertiary, fontFamily: "var(--font-mono)" }}
          fontSize={3.2}
        >
          {x}
        </text>,
      );
    }
    for (let y = 50; y < PAGE_H_MM; y += 50) {
      labels.push(
        <text
          key={`ly-${y}`}
          x={1.2}
          y={y - 1.2}
          style={{ fill: C.inkTertiary, fontFamily: "var(--font-mono)" }}
          fontSize={3.2}
        >
          {y}
        </text>,
      );
    }
    return labels;
  }, [showRuler]);

  return (
    <svg
      viewBox={`0 0 ${PAGE_W_MM} ${PAGE_H_MM}`}
      className="block size-full"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="A4 sheet preview"
    >
      <defs>
        <pattern
          id="hatch"
          width={3}
          height={3}
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <line
            x1={0}
            y1={0}
            x2={0}
            y2={3}
            style={{ stroke: C.danger }}
            strokeWidth={0.5}
          />
        </pattern>
      </defs>

      {/* page background + border */}
      <rect
        x={0}
        y={0}
        width={PAGE_W_MM}
        height={PAGE_H_MM}
        style={{ fill: C.surface, stroke: C.borderStrong }}
        strokeWidth={0.4}
      />

      {/* selected-cell wash (drawn under images) */}
      <rect
        x={selected.x}
        y={selected.y}
        width={CELL_W_MM}
        height={CELL_H_MM}
        style={{ fill: C.accentWeak }}
      />

      {/* placed images */}
      {placements.map(({ img, placement, disabled }) => {
        const cx = placement.x + placement.w / 2;
        const cy = placement.y + placement.h / 2;
        return (
          <image
            key={img.id}
            href={img.dataUrl}
            x={cx - placement.contentW / 2}
            y={cy - placement.contentH / 2}
            width={placement.contentW}
            height={placement.contentH}
            preserveAspectRatio="none"
            opacity={disabled ? 0.22 : 1}
            transform={`rotate(${-placement.rotation} ${cx} ${cy})`}
          />
        );
      })}

      {/* disabled quadrant hatch overlays */}
      {state.disabledQuadrants.map((q) => (
        <rect
          key={`dis-${q}`}
          x={ORIGIN[q].x}
          y={ORIGIN[q].y}
          width={CELL_W_MM}
          height={CELL_H_MM}
          fill="url(#hatch)"
          opacity={0.45}
        />
      ))}

      {/* dotted die-cut lines */}
      <line
        x1={CELL_W_MM}
        y1={0}
        x2={CELL_W_MM}
        y2={PAGE_H_MM}
        style={{ stroke: C.inkTertiary }}
        strokeWidth={0.3}
        strokeDasharray="2 2"
      />
      <line
        x1={0}
        y1={CELL_H_MM}
        x2={PAGE_W_MM}
        y2={CELL_H_MM}
        style={{ stroke: C.inkTertiary }}
        strokeWidth={0.3}
        strokeDasharray="2 2"
      />

      {/* optional ruler ticks + labels */}
      {rulerTicks}
      {rulerLabels}

      {/* selected-cell inner outline (on top) */}
      <rect
        x={selected.x + 0.5}
        y={selected.y + 0.5}
        width={CELL_W_MM - 1}
        height={CELL_H_MM - 1}
        fill="none"
        style={{ stroke: C.accent }}
        strokeWidth={1}
        pointerEvents="none"
      />

      {/* Pointer-only click targets to select a quadrant straight from the
          sheet. Kept non-focusable (no focus ring on these large cells); the
          sidebar selector is the keyboard-accessible control. */}
      {(Object.keys(ORIGIN) as unknown as Quadrant[]).map((key) => {
        const q = Number(key) as Quadrant;
        return (
          <rect
            key={`hit-${q}`}
            x={ORIGIN[q].x}
            y={ORIGIN[q].y}
            width={CELL_W_MM}
            height={CELL_H_MM}
            fill="transparent"
            className="cursor-pointer"
            onClick={() => onSelectQuadrant(q)}
          >
            <title>Select quadrant {q}</title>
          </rect>
        );
      })}
    </svg>
  );
}
