import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { stickerCategories } from "@/data/stickers";
import { Smile } from "lucide-react";
import { motion } from "framer-motion";
import { TAP_SCALE } from "@/lib/animation";

interface StickerPickerProps {
  onSelect: (emoji: string) => void;
}

export function StickerPicker({ onSelect }: StickerPickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <motion.button whileTap={TAP_SCALE} className="flex flex-col items-center gap-1 text-white/70 hover:text-white transition-colors">
          <Smile className="h-5 w-5" />
          <span className="text-[10px]">Stickers</span>
        </motion.button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0 bg-zinc-900/95 backdrop-blur-2xl border border-white/10 text-white shadow-2xl rounded-2xl overflow-hidden" side="top" align="start">
        <div className="space-y-3 max-h-60 overflow-y-auto">
          {stickerCategories.map((cat) => (
            <div key={cat.name}>
              <p className="text-xs font-medium text-muted-foreground mb-1.5">{cat.name}</p>
              <div className="grid grid-cols-5 gap-1">
                {cat.emojis.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => onSelect(emoji)}
                    className="text-2xl h-10 w-10 rounded-lg hover:bg-accent flex items-center justify-center transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
