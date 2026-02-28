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


const sizes: { label: string; value: FontSize }[] = [
  { label: "S", value: "small" },
  { label: "M", value: "medium" },
  { label: "L", value: "large" },
];

interface FontPickerProps {
  fontFamily: string;
  fontSize: FontSize;
  whitelist?: string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  availableFonts?: any[];
  onFontChange: (font: string) => void;
  onSizeChange: (size: FontSize) => void;
}

export function FontPicker({ fontFamily, fontSize, whitelist, availableFonts = [], onFontChange, onSizeChange }: FontPickerProps) {
  const [open, setOpen] = useState(false);

  const fonts = (() => {
    // If whitelist exists, filter the availableFonts
    if (whitelist && whitelist.length > 0) {
      return availableFonts.filter(f => f.isDefault || whitelist.includes(f._id || f.id));
    }
    return availableFonts;
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
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {fonts.map((f: any) => (
              <motion.button
                whileTap={{ scale: 0.97 }}
                key={f.id || f.value}
                onClick={() => {
                  onFontChange(f.value);
                  setOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left",
                  fontFamily === f.value ? "bg-white/10" : "hover:bg-white/5"
                )}
              >
                <div className="w-8 h-8 rounded-md bg-white/5 flex items-center justify-center flex-shrink-0 border border-white/10">
                  <span className="text-sm font-medium" style={{ fontFamily: f.value }}>Aa</span>
                </div>
                <span className="flex-1 text-[13px] font-medium text-white/80 truncate" style={{ fontFamily: f.value }}>
                  {f.isDefault ? "Default" : f.name}
                </span>
                {fontFamily === f.value && (
                  <motion.div layoutId="font-indicator" className="w-1.5 h-1.5 rounded-full bg-white shadow-glow" />
                )}
              </motion.button>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
