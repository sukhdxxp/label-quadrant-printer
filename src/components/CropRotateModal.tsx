import { useCallback, useEffect, useRef, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import "react-easy-crop/react-easy-crop.css";
import { CELL_W_MM, CELL_H_MM } from "../lib/placement";
import { cropImage, type CropArea, type EditedImage } from "../lib/imageEditing";
import { detectLabelBox, type NormalizedBox } from "../lib/labelDetect";
import type { EditorSource } from "../lib/fileLoading";
import type { Rotation } from "../types";
import { Button } from "./ui";

type DetectState =
  | { status: "detecting" }
  | { status: "applied" }
  | { status: "found"; box: NormalizedBox } // detected but not applied (user was editing)
  | { status: "none" }
  | { status: "idle" };

/** react-easy-crop reads the initial crop area as percentages of the image. */
function boxToPercent(box: NormalizedBox): Area {
  return {
    x: box.x * 100,
    y: box.y * 100,
    width: box.width * 100,
    height: box.height * 100,
  };
}

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

  // Auto label detection. The detected box pre-fills the crop frame via a
  // Cropper remount keyed by `initialArea`; it snaps automatically only if the
  // user hasn't started adjusting yet.
  const [detect, setDetect] = useState<DetectState>({ status: "idle" });
  const [initialArea, setInitialArea] = useState<Area | undefined>(undefined);
  const [cropperKey, setCropperKey] = useState(0);
  const touched = useRef(false);

  const applyBox = useCallback((box: NormalizedBox) => {
    // The detected box is in the unrotated frame, so reset rotation and unlock
    // the aspect to honour the label's exact shape.
    setRotation(0);
    setLocked(false);
    setInitialArea(boxToPercent(box));
    setCropperKey((k) => k + 1);
    setDetect({ status: "applied" });
  }, []);

  useEffect(() => {
    const ac = new AbortController();
    touched.current = false;
    setDetect({ status: "detecting" });
    detectLabelBox(source.dataUrl, ac.signal).then((box) => {
      if (ac.signal.aborted) return;
      if (!box) {
        setDetect({ status: "none" });
      } else if (touched.current) {
        setDetect({ status: "found", box }); // let the user opt in via button
      } else {
        applyBox(box);
      }
    });
    return () => ac.abort();
  }, [source.dataUrl, applyBox]);

  const markTouched = useCallback(() => {
    touched.current = true;
  }, []);

  const onCropComplete = useCallback((_: unknown, areaPixels: CropArea) => {
    setArea(areaPixels);
  }, []);

  const rotate = () => {
    markTouched();
    setRotation((r) => (((r + 90) % 360) as Rotation));
  };

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
              key={cropperKey}
              image={source.dataUrl}
              crop={crop}
              zoom={zoom}
              minZoom={MIN_ZOOM}
              maxZoom={MAX_ZOOM}
              rotation={rotation}
              aspect={locked ? CELL_ASPECT : undefined}
              initialCroppedAreaPercentages={initialArea}
              restrictPosition={false}
              onInteractionStart={markTouched}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          </div>

          <DetectStatus
            detect={detect}
            onApply={(box) => applyBox(box)}
            onRetry={() => {
              touched.current = false;
              setDetect({ status: "detecting" });
              detectLabelBox(source.dataUrl).then((box) =>
                box ? applyBox(box) : setDetect({ status: "none" }),
              );
            }}
          />

          {/* Zoom slider */}
          <div className="flex items-center gap-3">
            <span className="w-10 text-xs font-medium tracking-[0.01em] text-ink-secondary">
              Zoom
            </span>
            <ZoomButton
              label="Zoom out"
              onClick={() => {
                markTouched();
                setZoom((z) => Math.max(MIN_ZOOM, +(z - 0.1).toFixed(2)));
              }}
            >
              <Minus />
            </ZoomButton>
            <input
              type="range"
              min={MIN_ZOOM}
              max={MAX_ZOOM}
              step={0.01}
              value={zoom}
              onChange={(e) => {
                markTouched();
                setZoom(Number(e.target.value));
              }}
              className="h-1 flex-1 cursor-pointer accent-accent"
              aria-label="Zoom"
            />
            <ZoomButton
              label="Zoom in"
              onClick={() => {
                markTouched();
                setZoom((z) => Math.min(MAX_ZOOM, +(z + 0.1).toFixed(2)));
              }}
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
              <SegItem
                active={locked}
                onClick={() => {
                  markTouched();
                  setLocked(true);
                }}
              >
                Lock to label
              </SegItem>
              <SegItem
                active={!locked}
                onClick={() => {
                  markTouched();
                  setLocked(false);
                }}
              >
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

function DetectStatus({
  detect,
  onApply,
  onRetry,
}: {
  detect: DetectState;
  onApply: (box: NormalizedBox) => void;
  onRetry: () => void;
}) {
  if (detect.status === "idle") return null;

  return (
    <div className="flex min-h-[1.5rem] flex-wrap items-center gap-2 text-xs">
      {detect.status === "detecting" && (
        <span className="inline-flex items-center gap-1.5 text-ink-secondary">
          <Spinner />
          Detecting label…
        </span>
      )}

      {detect.status === "applied" && (
        <span className="inline-flex items-center gap-1.5 text-success">
          <Check />
          Snapped to detected label — adjust if needed.
        </span>
      )}

      {detect.status === "found" && (
        <>
          <span className="text-ink-secondary">Label detected.</span>
          <button
            type="button"
            onClick={() => onApply(detect.box)}
            className="font-medium text-accent underline-offset-2 hover:underline"
          >
            Use detected crop
          </button>
        </>
      )}

      {detect.status === "none" && (
        <>
          <span className="text-ink-secondary">
            No label detected — crop manually.
          </span>
          <button
            type="button"
            onClick={onRetry}
            className="font-medium text-accent underline-offset-2 hover:underline"
          >
            Try again
          </button>
        </>
      )}
    </div>
  );
}

function Spinner() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="animate-spin"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.25" />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function Check() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 13l4 4L19 7"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
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
