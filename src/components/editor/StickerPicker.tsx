import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { stickerCategories } from "@/data/stickers";
import { Smile } from "lucide-react";

interface StickerPickerProps {
  onSelect: (emoji: string) => void;
}

export function StickerPicker({ onSelect }: StickerPickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="flex flex-col items-center gap-1 text-white/70 hover:text-white transition-colors">
          <Smile className="h-5 w-5" />
          <span className="text-[10px]">Stickers</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3" side="top" align="start">
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
