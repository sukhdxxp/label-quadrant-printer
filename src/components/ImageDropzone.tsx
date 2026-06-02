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
          "flex cursor-pointer flex-col items-center justify-center rounded-lg border-[1.5px] border-dashed text-center transition-colors duration-150 ease-out-quart focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
          large ? "gap-2 px-8 py-16" : "gap-1.5 px-4 py-7",
          isDragActive
            ? "border-accent bg-accent-weak"
            : "border-border bg-surface hover:border-accent hover:bg-accent-weak",
        ].join(" ")}
      >
        <input {...getInputProps()} />
        <svg
          className={[
            "transition-colors duration-150 ease-out-quart",
            large ? "size-7" : "size-6",
            isDragActive ? "text-accent" : "text-ink-tertiary",
          ].join(" ")}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 16V4" />
          <path d="m7 9 5-5 5 5" />
          <path d="M5 16v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2" />
        </svg>
        <p
          className={[
            "font-semibold text-ink",
            large ? "text-[0.9375rem]" : "text-sm",
          ].join(" ")}
        >
          {isDragActive ? "Drop to upload" : "Drop file or click to upload"}
        </p>
        <p className="text-xs text-ink-secondary">PNG, JPG, WEBP, PDF</p>
      </div>
      {error && <p className="mt-2 text-xs text-danger">{error}</p>}
    </div>
  );
}
