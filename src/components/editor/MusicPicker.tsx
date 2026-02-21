import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { musicTracks } from "@/data/music-tracks";
import { Music, Play, Pause, ArrowLeft } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { motion } from "framer-motion";
import { TAP_SCALE } from "@/lib/animation";
import { getContrastColor } from "@/lib/utils";


import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";


interface MusicPickerProps {
  selectedId?: string;
  isPlaying?: boolean;
  onTogglePlay: () => void;
  activeColor?: string;
  whitelist?: string[];
  onSelect: (trackId: string | undefined) => void;
}

export function MusicPicker({
  selectedId,
  isPlaying,
  onTogglePlay,
  activeColor,
  whitelist,
  onSelect
}: MusicPickerProps) {
  const allTracks = useQuery(api.music.list);
  const [open, setOpen] = useState(false);

  const handlePlayClick = (trackId: string) => {
    if (selectedId === trackId) {
      onTogglePlay();
    } else {
      onSelect(trackId);
    }
  };

  const tracks = whitelist && whitelist.length > 0
    ? allTracks?.filter(t => whitelist.includes(t._id))
    : (allTracks || musicTracks);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <motion.button
          whileTap={TAP_SCALE}
          className="w-11 h-11 flex items-center justify-center rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white/80 hover:text-white transition-all border border-transparent"
          style={selectedId && activeColor ? {
            backgroundColor: activeColor,
            color: getContrastColor(activeColor)
          } : {}}
        >
          <Music className="h-5 w-5" />
        </motion.button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[268px] p-0 bg-zinc-900/95 backdrop-blur-2xl border border-white/10 text-white shadow-2xl rounded-2xl overflow-hidden"
        sideOffset={12}
        align="start"
        alignOffset={-164}
      >
        <div className="p-3 border-b border-white/5 bg-white/5">
          <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-widest text-center">Select Music</h3>
        </div>
        <ScrollArea className="h-[380px]">
          <div className="p-2 space-y-1">
            <button
              onClick={() => {
                onSelect(undefined);
                setOpen(false);
              }}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-xl transition-all group",
                !selectedId ? "bg-white/15 ring-1 ring-white/10" : "hover:bg-white/5"
              )}
            >
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0 border border-white/10">
                <ArrowLeft className="h-4 w-4 text-white/30" />
              </div>
              <span className="flex-1 text-sm font-semibold text-white/70 group-hover:text-white transition-colors text-left">No Music</span>
              {!selectedId && <motion.div layoutId="music-indicator" className="ml-auto w-1.5 h-1.5 rounded-full bg-white shadow-glow" />}
            </button>

            {tracks?.map((track) => {
              const trackId = (track as any)._id || (track as any).id;
              const isSelected = selectedId === trackId;

              return (
                <div
                  key={trackId}
                  onClick={() => {
                    onSelect(trackId);
                    setOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-xl transition-all group cursor-pointer",
                    isSelected ? "bg-white/15 ring-1 ring-white/10" : "hover:bg-white/5"
                  )}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlayClick(trackId);
                    }}
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all border border-transparent shadow-sm",
                      (isSelected && isPlaying)
                        ? "bg-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.4)]"
                        : "bg-white/10 text-rose-400 hover:bg-white/20 hover:scale-105 active:scale-95"
                    )}
                  >
                    {(isSelected && isPlaying) ? (
                      <Pause className="h-4 w-4 fill-current" />
                    ) : (
                      <Play className="h-4 w-4 fill-current ml-0.5" />
                    )}
                  </button>

                  <div className="flex-1 text-left">
                    <span className="block text-sm font-semibold text-white/90 truncate">{track.name}</span>
                    <span className="block text-[10px] text-white/30 uppercase tracking-wider mt-0.5">{track.artist || "Original Motion"}</span>
                  </div>

                  {isSelected && (
                    <motion.div layoutId="music-indicator" className="ml-auto w-1.5 h-1.5 rounded-full bg-white shadow-glow" />
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
