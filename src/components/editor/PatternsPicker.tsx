import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sparkles } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { motion } from "framer-motion";
import { TAP_SCALE } from "@/lib/animation";
import { getContrastColor } from "@/lib/utils";

interface PatternsPickerProps {
    currentPattern?: string;
    activeColor?: string;
    whitelist?: string[];
    availablePatterns?: any[];
    onSelect: (patternId: string) => void;
}

export function PatternsPicker({ currentPattern, activeColor, whitelist, availablePatterns = [], onSelect }: PatternsPickerProps) {
    const [open, setOpen] = useState(false);

    const patterns = (() => {
        if (whitelist && whitelist.length > 0) {
            return availablePatterns.filter(p => whitelist.includes(p.id));
        }
        return availablePatterns;
    })();

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <motion.button
                    whileTap={TAP_SCALE}
                    className="w-11 h-11 flex items-center justify-center rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white/80 hover:text-white transition-all border border-transparent"
                    style={currentPattern && currentPattern !== 'minimal' && activeColor ? {
                        backgroundColor: activeColor,
                        color: getContrastColor(activeColor)
                    } : {}}
                >
                    <Sparkles className="h-5 w-5" />
                </motion.button>
            </PopoverTrigger>
            <PopoverContent
                className="w-[268px] p-0 bg-zinc-900/95 backdrop-blur-2xl border border-white/10 text-white shadow-2xl rounded-2xl overflow-hidden"
                sideOffset={12}
                align="start"
                alignOffset={-216}
            >
                <div className="p-3 border-b border-white/5 bg-white/5">
                    <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-widest text-center">Select Pattern</h3>
                </div>
                <ScrollArea className="h-[320px]">
                    <div className="p-2 space-y-1">
                        {/* None Option */}
                        <button
                            onClick={() => {
                                onSelect('minimal');
                                setOpen(false);
                            }}
                            className={cn(
                                "w-full flex items-center gap-3 p-3 rounded-xl transition-all group",
                                (!currentPattern || currentPattern === 'minimal') ? "bg-white/15 ring-1 ring-white/10" : "hover:bg-white/5"
                            )}
                        >
                            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0 border border-white/10">
                                <span className="text-white/20 text-lg">✕</span>
                            </div>
                            <span className="text-sm font-semibold text-white/70 group-hover:text-white transition-colors">No Pattern</span>
                            {(!currentPattern || currentPattern === 'minimal') && (
                                <motion.div layoutId="pattern-indicator" className="ml-auto w-1.5 h-1.5 rounded-full bg-white shadow-glow" />
                            )}
                        </button>

                        {patterns.map((p) => (
                            <button
                                key={p.id}
                                onClick={() => {
                                    onSelect(p.id);
                                    setOpen(false);
                                }}
                                className={cn(
                                    "w-full flex items-center gap-3 p-3 rounded-xl transition-all group",
                                    currentPattern === p.id ? "bg-white/15 ring-1 ring-white/10" : "hover:bg-white/5"
                                )}
                            >
                                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 border border-white/10 shadow-sm transition-transform group-hover:scale-110">
                                    <span className="text-xl">{p.emoji || "✨"}</span>
                                </div>
                                <span className="text-sm font-medium">{p.name}</span>
                                {currentPattern === p.id && (
                                    <motion.div layoutId="pattern-indicator" className="ml-auto w-1.5 h-1.5 rounded-full bg-white shadow-glow" />
                                )}
                            </button>
                        ))}
                    </div>
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
}
