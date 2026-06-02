import { useCallback, useState } from "react";
import Cropper from "react-easy-crop";
import "react-easy-crop/react-easy-crop.css";
import { CELL_W_MM, CELL_H_MM } from "../lib/placement";
import { cropImage, type CropArea, type EditedImage } from "../lib/imageEditing";
import type { EditorSource } from "../lib/fileLoading";
import type { Rotation } from "../types";
import { Button } from "./ui";

const CELL_ASPECT = CELL_W_MM / CELL_H_MM;
// Below 1x the image shrinks inside the frame, so an image whose aspect ratio
// doesn't match the cell can be fit whole (with transparent padding around it).
const MIN_ZOOM = 0.3;
const MAX_ZOOM = 4;

interface Props {
  source: EditorSource;
  onConfirm: (edited: EditedImage) => void;
  onCancel: () => void;
}

export default function CropRotateModal({
  source,
  onConfirm,
  onCancel,
}: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState<Rotation>(0);
  const [locked, setLocked] = useState(true);
  const [area, setArea] = useState<CropArea | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onCropComplete = useCallback((_: unknown, areaPixels: CropArea) => {
    setArea(areaPixels);
  }, []);

  const rotate = () => setRotation((r) => (((r + 90) % 360) as Rotation));

  const confirm = async () => {
    if (!area) return;
    setBusy(true);
    setError(null);
    try {
      const edited = await cropImage(source, area, rotation);
      onConfirm(edited);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not crop image.");
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 items-center justify-center overflow-y-auto p-4 sm:p-6">
      <div className="view-enter flex max-h-full w-full max-w-3xl flex-col rounded-lg border border-border bg-surface shadow-popover">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-[1.125rem] font-semibold tracking-[-0.005em] text-ink">
            Crop &amp; rotate
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-ink-secondary">
            Drag to position, scroll or pinch to zoom. Rotation is baked into the
            label.
          </p>
        </div>

        <div className="flex min-h-0 flex-col gap-4 p-5">
          <div className="relative aspect-[4/3] min-h-[240px] w-full overflow-hidden rounded-md bg-ink">
            <Cropper
              image={source.dataUrl}
              crop={crop}
              zoom={zoom}
              minZoom={MIN_ZOOM}
              maxZoom={MAX_ZOOM}
              rotation={rotation}
              aspect={locked ? CELL_ASPECT : undefined}
              restrictPosition={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          </div>

          {/* Zoom slider */}
          <div className="flex items-center gap-3">
            <span className="w-10 text-xs font-medium tracking-[0.01em] text-ink-secondary">
              Zoom
            </span>
            <ZoomButton
              label="Zoom out"
              onClick={() =>
                setZoom((z) => Math.max(MIN_ZOOM, +(z - 0.1).toFixed(2)))
              }
            >
              <Minus />
            </ZoomButton>
            <input
              type="range"
              min={MIN_ZOOM}
              max={MAX_ZOOM}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="h-1 flex-1 cursor-pointer accent-accent"
              aria-label="Zoom"
            />
            <ZoomButton
              label="Zoom in"
              onClick={() =>
                setZoom((z) => Math.min(MAX_ZOOM, +(z + 0.1).toFixed(2)))
              }
            >
              <Plus />
            </ZoomButton>
            <span className="w-11 text-right font-mono text-[0.8125rem] tabular-nums text-ink-secondary">
              {zoom.toFixed(1)}×
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Aspect lock segmented control */}
            <div
              role="group"
              aria-label="Crop aspect"
              className="inline-flex gap-0.5 rounded-md bg-sunken p-0.5"
            >
              <SegItem active={locked} onClick={() => setLocked(true)}>
                Lock to label
              </SegItem>
              <SegItem active={!locked} onClick={() => setLocked(false)}>
                Free
              </SegItem>
            </div>

            <Button variant="secondary" size="sm" onClick={rotate}>
              Rotate 90°
            </Button>

            <span className="ml-auto font-mono text-[0.8125rem] tabular-nums text-ink-secondary">
              {rotation}°
            </span>
          </div>

          {error && <p className="text-xs text-danger">{error}</p>}
        </div>

        <div className="flex justify-end gap-2 border-t border-border px-5 py-4">
          <Button variant="ghost" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={confirm}
            disabled={busy || !area}
          >
            {busy ? "Processing…" : "Use this crop"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function ZoomButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="grid size-7 shrink-0 place-items-center rounded-md border border-border-strong bg-surface text-ink-secondary transition-colors duration-150 ease-out-quart hover:bg-sunken hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      {children}
    </button>
  );
}

function SegItem({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={[
        "rounded-[6px] px-3 py-1.5 text-xs font-medium tracking-[0.01em] transition-colors duration-150 ease-out-quart focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent",
        active
          ? "bg-surface text-ink shadow-raised"
          : "text-ink-secondary hover:text-ink",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function Minus() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function Plus() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 5v14M5 12h14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
