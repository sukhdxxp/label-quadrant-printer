import type { Rotation } from "../types";

/** Pixel rectangle in the (rotated) image's coordinate space. */
export interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface EditedImage {
  /** Re-encoded PNG, fed straight into the existing placement/PDF pipeline. */
  file: File;
  dataUrl: string;
  naturalWidth: number;
  naturalHeight: number;
}

/** Bounding box of an image rotated by a 90° multiple. */
export function rotateSize(
  width: number,
  height: number,
  rotation: Rotation,
): { width: number; height: number } {
  return rotation === 90 || rotation === 270
    ? { width: height, height: width }
    : { width, height };
}

/**
 * Final output pixel dimensions for a crop+rotate bake. The crop rectangle is
 * already expressed in the rotated frame, so the output is simply its size.
 */
export function computeBakeDims(crop: CropArea): {
  width: number;
  height: number;
} {
  return { width: Math.round(crop.width), height: Math.round(crop.height) };
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not decode image"));
    img.src = src;
  });
}

/**
 * Bake a 90°-step rotation and a crop rectangle into a fresh PNG.
 *
 * `crop` comes from react-easy-crop's `croppedAreaPixels`, which is measured in
 * the rotated image's coordinate space — so we first draw the source onto a
 * rotated intermediate canvas, then copy out the crop region.
 */
export async function cropImage(
  source: { dataUrl: string; fileName: string },
  crop: CropArea,
  rotation: Rotation,
): Promise<EditedImage> {
  const image = await loadImage(source.dataUrl);

  // 1. Draw the source upright-but-rotated onto an intermediate canvas.
  const box = rotateSize(image.width, image.height, rotation);
  const rotated = document.createElement("canvas");
  rotated.width = box.width;
  rotated.height = box.height;
  const rctx = rotated.getContext("2d");
  if (!rctx) throw new Error("Could not get canvas context");
  rctx.translate(box.width / 2, box.height / 2);
  rctx.rotate((rotation * Math.PI) / 180);
  rctx.drawImage(image, -image.width / 2, -image.height / 2);

  // 2. Copy the crop region (rotated-frame coords) onto the output canvas.
  const out = document.createElement("canvas");
  const dims = computeBakeDims(crop);
  out.width = dims.width;
  out.height = dims.height;
  const octx = out.getContext("2d");
  if (!octx) throw new Error("Could not get canvas context");
  octx.drawImage(
    rotated,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    dims.width,
    dims.height,
  );

  const blob = await new Promise<Blob | null>((resolve) =>
    out.toBlob(resolve, "image/png"),
  );
  if (!blob) throw new Error("Could not encode cropped image");

  const baseName = source.fileName.replace(/\.[^.]+$/, "") || "label";
  const file = new File([blob], `${baseName}.png`, { type: "image/png" });

  return {
    file,
    dataUrl: out.toDataURL("image/png"),
    naturalWidth: out.width,
    naturalHeight: out.height,
  };
}
