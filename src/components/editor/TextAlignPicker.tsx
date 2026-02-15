import { AlignLeft, AlignCenter, AlignRight } from "lucide-react";

interface TextAlignPickerProps {
  value: "left" | "center" | "right";
  onChange: (align: "left" | "center" | "right") => void;
}

const options = [
  { value: "left" as const, icon: AlignLeft },
  { value: "center" as const, icon: AlignCenter },
  { value: "right" as const, icon: AlignRight },
];

export function TextAlignPicker({ value, onChange }: TextAlignPickerProps) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex gap-0.5">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`p-1 rounded transition-colors ${
              value === opt.value ? "text-white" : "text-white/40 hover:text-white/70"
            }`}
          >
            <opt.icon className="h-4 w-4" />
          </button>
        ))}
      </div>
      <span className="text-[10px] text-white/70">Align</span>
    </div>
  );
}
