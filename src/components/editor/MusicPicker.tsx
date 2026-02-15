import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { musicTracks } from "@/data/music-tracks";
import { Music, Check } from "lucide-react";

interface MusicPickerProps {
  selectedId?: string;
  onSelect: (trackId: string | undefined) => void;
}

export function MusicPicker({ selectedId, onSelect }: MusicPickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className={`flex flex-col items-center gap-1 transition-colors ${selectedId ? "text-white" : "text-white/70 hover:text-white"}`}>
          <Music className="h-5 w-5" />
          <span className="text-[10px]">Music</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2" side="top">
        <div className="space-y-0.5 max-h-52 overflow-y-auto">
          <button
            onClick={() => onSelect(undefined)}
            className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
              !selectedId ? "bg-primary text-primary-foreground" : "hover:bg-accent"
            }`}
          >
            No music
          </button>
          {musicTracks.map((track) => (
            <button
              key={track.id}
              onClick={() => onSelect(track.id)}
              className={`w-full text-left px-3 py-2 rounded text-sm transition-colors flex items-center justify-between ${
                selectedId === track.id ? "bg-primary text-primary-foreground" : "hover:bg-accent"
              }`}
            >
              <div>
                <span className="font-medium">{track.name}</span>
                <br />
                <span className="text-xs opacity-70">{track.artist}</span>
              </div>
              {selectedId === track.id && <Check className="h-4 w-4" />}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
