import { renderPdfFirstPage } from "./pdfRender";

export interface LoadedImage {
  dataUrl: string;
  naturalWidth: number;
  naturalHeight: number;
}

/** Normalised source handed to the crop/rotate editor. */
export interface EditorSource {
  dataUrl: string;
  fileName: string;
  width: number;
  height: number;
}

export const SUPPORTED_TYPES = ["image/png", "image/jpeg"];

export const isPdf = (file: File) => file.type === "application/pdf";
export const isImage = (file: File) => file.type.startsWith("image/");

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function decodeDimensions(
  dataUrl: string,
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () =>
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => reject(new Error("Could not decode image"));
    img.src = dataUrl;
  });
}

/** Read a File into a data URL and decode its natural pixel dimensions. */
export async function loadImageFile(file: File): Promise<LoadedImage> {
  if (!isImage(file)) {
    throw new Error(`Unsupported file type: ${file.type || "unknown"}`);
  }
  const dataUrl = await readAsDataUrl(file);
  const { width, height } = await decodeDimensions(dataUrl);
  return { dataUrl, naturalWidth: width, naturalHeight: height };
}

/**
 * Turn an uploaded file (PDF or image) into a normalised source for the editor.
 * PDFs are rasterised to their first page; images are decoded as-is.
 */
export async function prepareSourceForEditor(
  file: File,
): Promise<EditorSource> {
  if (isPdf(file)) {
    const page = await renderPdfFirstPage(file);
    return {
      dataUrl: page.dataUrl,
      fileName: file.name,
      width: page.width,
      height: page.height,
    };
  }
  if (isImage(file)) {
    const loaded = await loadImageFile(file);
    return {
      dataUrl: loaded.dataUrl,
      fileName: file.name,
      width: loaded.naturalWidth,
      height: loaded.naturalHeight,
    };
  }
  throw new Error(`Unsupported file type: ${file.type || "unknown"}`);
}
