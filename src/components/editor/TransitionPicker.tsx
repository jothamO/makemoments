import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { SlideTransition } from "@/data/types";
import { Layers } from "lucide-react";
import { motion } from "framer-motion";
import { TAP_SCALE } from "@/lib/animation";

const transitions: { value: SlideTransition; label: string; desc: string }[] = [
  { value: "fade", label: "Fade", desc: "Smooth opacity" },
  { value: "slide", label: "Slide", desc: "Horizontal slide" },
  { value: "zoom", label: "Zoom", desc: "Scale + fade" },
  { value: "flip", label: "Flip", desc: "3D card flip" },
];

interface TransitionPickerProps {
  value: SlideTransition;
  onChange: (t: SlideTransition) => void;
}

export function TransitionPicker({ value, onChange }: TransitionPickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <motion.button whileTap={TAP_SCALE} className="flex flex-col items-center gap-1 text-white/70 hover:text-white transition-colors">
          <Layers className="h-5 w-5" />
          <span className="text-[10px]">Effect</span>
        </motion.button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-0 bg-zinc-900/95 backdrop-blur-2xl border border-white/10 text-white shadow-2xl rounded-2xl overflow-hidden" side="top">
        <div className="space-y-0.5">
          {transitions.map((t) => (
            <button
              key={t.value}
              onClick={() => onChange(t.value)}
              className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${value === t.value ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                }`}
            >
              <span className="font-medium">{t.label}</span>
              <span className="text-xs text-muted-foreground ml-2">{t.desc}</span>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
