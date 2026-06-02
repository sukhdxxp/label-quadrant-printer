import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";

interface Props {
  onFileSelected: (file: File) => void;
}

export default function ImageDropzone({ onFileSelected }: Props) {
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    (accepted: File[], rejected: { file: File }[]) => {
      setError(null);
      if (rejected.length > 0) {
        setError("Only PDF or image files are supported.");
        return;
      }
      const file = accepted[0];
      if (!file) return;
      onFileSelected(file);
    },
    [onFileSelected],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "image/*": [".png", ".jpg", ".jpeg", ".webp", ".gif", ".bmp"],
    },
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
          {isDragActive ? "Drop the file…" : "Drop file or click to upload"}
        </p>
        <p className="mt-1 text-xs text-slate-500">PDF, PNG, JPG…</p>
      </div>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
