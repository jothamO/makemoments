import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Type } from "lucide-react";
import type { FontSize } from "@/data/types";

const fonts = [
  "Playfair Display",
  "Montserrat",
  "Dancing Script",
  "Lora",
  "Poppins",
  "Pacifico",
  "Raleway",
  "Merriweather",
];

const sizes: { label: string; value: FontSize }[] = [
  { label: "S", value: "small" },
  { label: "M", value: "medium" },
  { label: "L", value: "large" },
];

interface FontPickerProps {
  fontFamily: string;
  fontSize: FontSize;
  onFontChange: (font: string) => void;
  onSizeChange: (size: FontSize) => void;
}

export function FontPicker({ fontFamily, fontSize, onFontChange, onSizeChange }: FontPickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="flex flex-col items-center gap-1 text-white/70 hover:text-white transition-colors">
          <Type className="h-5 w-5" />
          <span className="text-[10px]">Font</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-3" side="top">
        <div className="space-y-3">
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Size</p>
            <div className="flex gap-1">
              {sizes.map((s) => (
                <button
                  key={s.value}
                  onClick={() => onSizeChange(s.value)}
                  className={`flex-1 py-1.5 rounded text-sm font-medium transition-colors ${
                    fontSize === s.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted hover:bg-accent"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Family</p>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {fonts.map((f) => (
                <button
                  key={f}
                  onClick={() => onFontChange(f)}
                  className={`w-full text-left px-2 py-1.5 rounded text-sm transition-colors ${
                    fontFamily === f ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                  }`}
                  style={{ fontFamily: f }}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
