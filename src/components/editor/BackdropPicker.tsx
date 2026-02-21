import { useQuery } from "convex/react";
import { useState } from "react";
import { api } from "../../../convex/_generated/api";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Paintbrush } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn, hexToRgba } from "@/lib/utils";
import { motion } from "framer-motion";
import { TAP_SCALE } from "@/lib/animation";
import type { EventTheme } from "@/data/types";

interface ThemePickerProps {
    onSelect: (theme: Partial<EventTheme>) => void;
    currentPrimary?: string;
    whitelist?: string[];
}

export function BackdropPicker({ onSelect, currentPrimary, whitelist }: ThemePickerProps) {
    const [open, setOpen] = useState(false);
    const allThemes = useQuery(api.themes.list);
    const themes = whitelist && whitelist.length > 0
        ? allThemes?.filter(t => whitelist.includes(t._id))
        : allThemes;

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <motion.button whileTap={TAP_SCALE} className="w-11 h-11 flex items-center justify-center rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white/80 hover:text-white transition-all">
                    <Paintbrush className="h-5 w-5" />
                </motion.button>
            </PopoverTrigger>
            <PopoverContent
                className="w-[268px] p-0 bg-zinc-900/95 backdrop-blur-2xl border border-white/10 text-white shadow-2xl rounded-2xl overflow-hidden"
                sideOffset={12}
                align="start"
                alignOffset={-8}
            >
                <div className="p-3 border-b border-white/5 bg-white/5">
                    <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-widest text-center">Select Backdrop</h3>
                </div>
                <ScrollArea className="h-[380px]">
                    <div className="p-3 grid grid-cols-2 gap-2">
                        {themes?.map((theme) => (
                            <button
                                key={theme._id}
                                onClick={() => {
                                    onSelect(theme);
                                    setOpen(false);
                                }}
                                className={cn(
                                    "flex flex-col items-center gap-3 p-3 rounded-xl transition-all transform active:scale-[0.96] group relative",
                                    currentPrimary === (theme.baseColor || theme.primary)
                                        ? "bg-white/15 ring-1 ring-white/20"
                                        : "bg-white/5 hover:bg-white/10"
                                )}
                            >
                                <div
                                    className="w-16 h-16 rounded-full border border-white/10 shadow-lg relative overflow-hidden"
                                    style={{
                                        backgroundColor: theme.baseColor || theme.primary,
                                    }}
                                >
                                    {/* Premium Gradient Overlay matching admin look but slightly optimized for editor visibility */}
                                    <div
                                        className="absolute inset-0 opacity-40"
                                        style={{
                                            backgroundImage: `radial-gradient(circle at 50% 0%, ${theme.glowColor || "#ffffff"}, transparent 70%)`
                                        }}
                                    />
                                </div>
                                <span className="text-[11px] font-semibold text-white/70 group-hover:text-white transition-colors truncate w-full text-center tracking-tight">
                                    {theme.name}
                                </span>
                                {currentPrimary === (theme.baseColor || theme.primary) && (
                                    <motion.div layoutId="backdrop-indicator" className="absolute top-2 right-2 w-2 h-2 rounded-full bg-white shadow-glow animate-pulse" />
                                )}
                            </button>
                        ))}
                    </div>
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
}
