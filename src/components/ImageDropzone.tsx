import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { loadImageFile, type LoadedImage } from "../lib/fileLoading";

interface Props {
  onImageLoaded: (file: File, loaded: LoadedImage) => void;
}

export default function ImageDropzone({ onImageLoaded }: Props) {
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    async (accepted: File[], rejected: { file: File }[]) => {
      setError(null);
      if (rejected.length > 0) {
        setError("Only PNG or JPG files are supported.");
        return;
      }
      const file = accepted[0];
      if (!file) return;
      try {
        const loaded = await loadImageFile(file);
        onImageLoaded(file, loaded);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not read image.");
      }
    },
    [onImageLoaded],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/png": [".png"], "image/jpeg": [".jpg", ".jpeg"] },
    multiple: false,
  });

  return (
    <div>
      <div
        {...getRootProps()}
        className={[
          "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-6 text-center transition",
          isDragActive
            ? "border-blue-500 bg-blue-50"
            : "border-slate-300 bg-slate-50 hover:border-slate-400",
        ].join(" ")}
      >
        <input {...getInputProps()} />
        <p className="text-sm font-medium text-slate-700">
          {isDragActive ? "Drop the image…" : "Drop image or click to upload"}
        </p>
        <p className="mt-1 text-xs text-slate-500">PNG or JPG</p>
      </div>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
