import { MeasurementField } from "./ui";

interface Props {
  value: number;
  onChange: (mm: number) => void;
}

export default function MarginControl({ value, onChange }: Props) {
  return (
    <MeasurementField
      label="Safety margin"
      hideLabel
      unit="mm"
      value={value}
      min={0}
      max={20}
      step={0.5}
      onChange={onChange}
      hint="Inset applied inside every cell. Default 2 mm."
    />
  );
}
