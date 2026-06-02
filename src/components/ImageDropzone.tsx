import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";

interface Props {
  onFileSelected: (file: File) => void;
  /** Larger drop target for the dedicated upload step. */
  large?: boolean;
}

export default function ImageDropzone({ onFileSelected, large }: Props) {
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
          "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed text-center transition",
          large ? "px-8 py-16" : "px-4 py-6",
          isDragActive
            ? "border-blue-500 bg-blue-50"
            : "border-slate-300 bg-slate-50 hover:border-slate-400 hover:bg-slate-100",
        ].join(" ")}
      >
        <input {...getInputProps()} />
        {large && (
          <svg
            className="mb-3 h-10 w-10 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z"
            />
          </svg>
        )}
        <p
          className={[
            "font-medium text-slate-700",
            large ? "text-base" : "text-sm",
          ].join(" ")}
        >
          {isDragActive ? "Drop the file…" : "Drop file or click to upload"}
        </p>
        <p className="mt-1 text-xs text-slate-500">PDF, PNG, JPG, WEBP…</p>
      </div>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
