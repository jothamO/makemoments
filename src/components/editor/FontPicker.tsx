import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Type } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { motion } from "framer-motion";
import { TAP_SCALE } from "@/lib/animation";
import type { FontSize } from "@/data/types";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { ScrollArea } from "@/components/ui/scroll-area";

const DEFAULT_FONTS = [
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
  whitelist?: string[];
  onFontChange: (font: string) => void;
  onSizeChange: (size: FontSize) => void;
}

export function FontPicker({ fontFamily, fontSize, whitelist, onFontChange, onSizeChange }: FontPickerProps) {
  const [open, setOpen] = useState(false);
  const allDynamicFonts = useQuery(api.fonts.list);

  const fonts = (() => {
    const dynamic = allDynamicFonts?.map(f => f.name) || [];
    const merged = Array.from(new Set([...DEFAULT_FONTS, ...dynamic]));

    // If whitelist exists, we need to map names to IDs or vice versa?
    // In fonts.ts, we track by name. Whitelist contains IDs.
    if (whitelist && whitelist.length > 0 && allDynamicFonts) {
      return allDynamicFonts.filter(f => whitelist.includes(f._id)).map(f => f.name);
    }
    return merged;
  })();
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <motion.button whileTap={TAP_SCALE} className="w-11 h-11 flex items-center justify-center rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white/80 hover:text-white transition-all">
          <Type className="h-5 w-5" />
        </motion.button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[268px] p-0 bg-zinc-900/95 backdrop-blur-2xl border border-white/10 text-white shadow-2xl rounded-2xl overflow-hidden"
        sideOffset={12}
        align="start"
        alignOffset={-60}
      >
        <div className="p-3 border-b border-white/5 bg-white/5">
          <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-widest text-center">Select Font</h3>
        </div>
        <ScrollArea className="h-[350px]">
          <div className="p-2 space-y-1">
            {fonts.map((f) => (
              <button
                key={f}
                onClick={() => {
                  onFontChange(f);
                  setOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-xl transition-all group",
                  fontFamily === f ? "bg-white/15 ring-1 ring-white/10" : "hover:bg-white/5"
                )}
              >
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 border border-white/5 group-hover:bg-white/20 transition-colors">
                  <span className="text-sm font-medium" style={{ fontFamily: f }}>Aa</span>
                </div>
                <span className="flex-1 text-sm font-semibold text-white/70 group-hover:text-white transition-colors text-left" style={{ fontFamily: f }}>{f}</span>
                {fontFamily === f && (
                  <motion.div layoutId="font-indicator" className="w-1.5 h-1.5 rounded-full bg-white shadow-glow" />
                )}
              </button>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
