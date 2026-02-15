import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { HexColorPicker } from "react-colorful";
import { Palette } from "lucide-react";

const presetGradients = [
  { start: "#FF4081", end: "#FF8C7A" },
  { start: "#FF8C7A", end: "#FFD54F" },
  { start: "#C2185B", end: "#FF4081" },
  { start: "#7B1FA2", end: "#E040FB" },
  { start: "#1565C0", end: "#42A5F5" },
  { start: "#00897B", end: "#4DB6AC" },
  { start: "#2D1B30", end: "#4A148C" },
  { start: "#FFF3E0", end: "#FFE0B2" },
  { start: "#1a1a2e", end: "#16213e" },
  { start: "#0f0c29", end: "#302b63" },
];

interface BackgroundPickerProps {
  gradientStart: string;
  gradientEnd: string;
  textColor: string;
  onStartChange: (color: string) => void;
  onEndChange: (color: string) => void;
  onTextColorChange: (color: string) => void;
}

export function BackgroundPicker({ gradientStart, gradientEnd, textColor, onStartChange, onEndChange, onTextColorChange }: BackgroundPickerProps) {
  const [editing, setEditing] = useState<"start" | "end" | "text">("start");

  const activeColor = editing === "start" ? gradientStart : editing === "end" ? gradientEnd : textColor;
  const activeHandler = editing === "start" ? onStartChange : editing === "end" ? onEndChange : onTextColorChange;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="flex flex-col items-center gap-1 text-white/70 hover:text-white transition-colors">
          <Palette className="h-5 w-5" />
          <span className="text-[10px]">Color</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" side="top" align="end">
        <div className="space-y-3">
          {/* Presets */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Presets</p>
            <div className="grid grid-cols-5 gap-1.5">
              {presetGradients.map((g, i) => (
                <button
                  key={i}
                  onClick={() => { onStartChange(g.start); onEndChange(g.end); }}
                  className="w-10 h-10 rounded-lg border border-border hover:scale-110 transition-transform"
                  style={{ background: `linear-gradient(135deg, ${g.start}, ${g.end})` }}
                />
              ))}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1">
            {(["start", "end", "text"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setEditing(tab)}
                className={`flex-1 py-1 text-xs rounded font-medium transition-colors ${
                  editing === tab ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-accent"
                }`}
              >
                {tab === "start" ? "Start" : tab === "end" ? "End" : "Text"}
              </button>
            ))}
          </div>

          <HexColorPicker color={activeColor} onChange={activeHandler} style={{ width: "100%" }} />
        </div>
      </PopoverContent>
    </Popover>
  );
}
