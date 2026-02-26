import { useState } from "react";
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
    currentThemeId?: string;
    whitelist?: string[];
    availableThemes?: any[];
}

export function BackdropPicker({ onSelect, currentThemeId, whitelist, availableThemes = [] }: ThemePickerProps) {
    const [open, setOpen] = useState(false);

    // Use the resolved assets passed down from CreatePage
    const themes = whitelist && whitelist.length > 0
        ? availableThemes.filter(t => whitelist.includes(t._id || t.id))
        : availableThemes;

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <motion.button whileTap={TAP_SCALE} className="w-11 h-11 flex items-center justify-center rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white/80 hover:text-white transition-all">
                    <Paintbrush className="h-5 w-5" />
                </motion.button>
            </PopoverTrigger>
            <PopoverContent
                className="w-[340px] p-0 bg-zinc-900/95 backdrop-blur-2xl border border-white/10 text-white shadow-2xl rounded-2xl overflow-hidden"
                sideOffset={12}
                align="start"
                alignOffset={-8}
            >
                <div className="p-3 border-b border-white/5 bg-white/5">
                    <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-widest text-center">Select Backdrop</h3>
                </div>
                <ScrollArea className="h-[380px]">
                    <div className="p-3 grid grid-cols-2 gap-1.5">
                        {themes?.map((theme) => (
                            <motion.button
                                whileTap={{ scale: 0.97 }}
                                key={theme._id}
                                onClick={() => {
                                    onSelect(theme);
                                    setOpen(false);
                                }}
                                className={cn(
                                    "flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all text-left",
                                    currentThemeId === (theme._id || theme.id)
                                        ? "bg-white/10"
                                        : "hover:bg-white/5"
                                )}
                            >
                                <div
                                    className="w-7 h-7 rounded-md border border-white/10 shrink-0 relative overflow-hidden"
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
                                <span className="text-xs text-white/80 font-medium truncate">
                                    {theme.name}
                                </span>
                            </motion.button>
                        ))}
                    </div>
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
}
