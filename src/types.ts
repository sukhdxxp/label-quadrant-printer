export type Quadrant = 1 | 2 | 3 | 4;
export type FitMode = "contain"; // V1: contain only
export type Rotation = 0 | 90 | 180 | 270;

export interface LabelImage {
  id: string; // uuid
  quadrant: Quadrant;
  file: File; // original
  dataUrl: string; // preview rendering
  naturalWidth: number; // px
  naturalHeight: number; // px
  fit: FitMode;
  rotation: Rotation;
  offsetX: number; // mm fine-tune
  offsetY: number; // mm fine-tune
}

export interface SheetState {
  images: LabelImage[]; // 0–4, one per quadrant max
  disabledQuadrants: Quadrant[]; // already-peeled cells, skipped in PDF
  safetyMargin: number; // mm, default 2
}

/** Result of the placement algorithm, all values in millimetres. */
export interface Placement {
  /** Top-left of the axis-aligned footprint (bounding box of the rotated image), page coords. */
  x: number;
  y: number;
  /** Footprint size (the rotated image's bounding box). */
  w: number;
  h: number;
  rotation: Rotation;
  /** Un-rotated content size (what the image fills before rotation is applied). */
  contentW: number;
  contentH: number;
}
