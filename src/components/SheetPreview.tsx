import { useMemo } from "react";
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
}

export default function SheetPreview({
  state,
  selectedQuadrant,
  showRuler,
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

  const selected = {
    1: { x: 0, y: 0 },
    2: { x: CELL_W_MM, y: 0 },
    3: { x: 0, y: CELL_H_MM },
    4: { x: CELL_W_MM, y: CELL_H_MM },
  }[selectedQuadrant];

  const rulerTicks = useMemo(() => {
    if (!showRuler) return null;
    const ticks: JSX.Element[] = [];
    for (let x = 0; x <= PAGE_W_MM; x += 10) {
      ticks.push(
        <line
          key={`tx-${x}`}
          x1={x}
          y1={0}
          x2={x}
          y2={x % 50 === 0 ? 4 : 2.5}
          stroke="#94a3b8"
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
          stroke="#94a3b8"
          strokeWidth={0.2}
        />,
      );
    }
    return ticks;
  }, [showRuler]);

  return (
    <svg
      viewBox={`0 0 ${PAGE_W_MM} ${PAGE_H_MM}`}
      className="block h-full w-full"
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
          <line x1={0} y1={0} x2={0} y2={3} stroke="#ef4444" strokeWidth={0.5} />
        </pattern>
      </defs>

      {/* page background + border */}
      <rect
        x={0}
        y={0}
        width={PAGE_W_MM}
        height={PAGE_H_MM}
        fill="#ffffff"
        stroke="#cbd5e1"
        strokeWidth={0.3}
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
            opacity={disabled ? 0.25 : 1}
            transform={`rotate(${-placement.rotation} ${cx} ${cy})`}
          />
        );
      })}

      {/* disabled quadrant hatch overlays */}
      {state.disabledQuadrants.map((q) => {
        const origin = {
          1: { x: 0, y: 0 },
          2: { x: CELL_W_MM, y: 0 },
          3: { x: 0, y: CELL_H_MM },
          4: { x: CELL_W_MM, y: CELL_H_MM },
        }[q];
        return (
          <rect
            key={`dis-${q}`}
            x={origin.x}
            y={origin.y}
            width={CELL_W_MM}
            height={CELL_H_MM}
            fill="url(#hatch)"
            opacity={0.4}
          />
        );
      })}

      {/* dotted die-cut lines */}
      <line
        x1={CELL_W_MM}
        y1={0}
        x2={CELL_W_MM}
        y2={PAGE_H_MM}
        stroke="#64748b"
        strokeWidth={0.3}
        strokeDasharray="2 2"
      />
      <line
        x1={0}
        y1={CELL_H_MM}
        x2={PAGE_W_MM}
        y2={CELL_H_MM}
        stroke="#64748b"
        strokeWidth={0.3}
        strokeDasharray="2 2"
      />

      {/* optional ruler ticks */}
      {rulerTicks}

      {/* highlighted ring on the selected quadrant */}
      <rect
        x={selected.x + 0.75}
        y={selected.y + 0.75}
        width={CELL_W_MM - 1.5}
        height={CELL_H_MM - 1.5}
        fill="none"
        stroke="#2563eb"
        strokeWidth={1}
        strokeDasharray="4 2"
        pointerEvents="none"
      />
    </svg>
  );
}
