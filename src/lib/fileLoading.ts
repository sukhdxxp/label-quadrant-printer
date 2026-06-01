export interface LoadedImage {
  dataUrl: string;
  naturalWidth: number;
  naturalHeight: number;
}

export const SUPPORTED_TYPES = ["image/png", "image/jpeg"];

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
  if (!SUPPORTED_TYPES.includes(file.type)) {
    throw new Error(`Unsupported file type: ${file.type || "unknown"}`);
  }
  const dataUrl = await readAsDataUrl(file);
  const { width, height } = await decodeDimensions(dataUrl);
  return { dataUrl, naturalWidth: width, naturalHeight: height };
}
