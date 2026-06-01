interface Props {
  value: number;
  onChange: (mm: number) => void;
}

export default function MarginControl({ value, onChange }: Props) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      Safety margin (mm)
      <input
        type="number"
        step={0.5}
        min={0}
        max={20}
        value={value}
        onChange={(e) => {
          const v = parseFloat(e.target.value);
          onChange(Number.isNaN(v) ? 0 : Math.max(0, Math.min(20, v)));
        }}
        className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
      />
      <span className="mt-1 block text-xs font-normal text-slate-500">
        Inset applied inside every cell. Default 2 mm.
      </span>
    </label>
  );
}
