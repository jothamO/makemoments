import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowLeft,
    Image as ImageIcon,
    Type,
    Palette,
    Play,
    X,
    Plus,
    Trash2,
    ChevronLeft,
    ChevronRight,
    Music,
    Sparkles,
    AlignLeft,
    AlignCenter,
    AlignRight,
    Check,
    Heart,
} from "lucide-react";
import { useEventTheme } from "@/contexts/ThemeContext";
import { getTemplatesByEvent } from "@/data/data-service";
import type { Template, StoryPage, EventTheme, MusicTrack } from "@/data/types";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { PaymentModal } from "@/components/PaymentModal";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { StoryPreviewPlayer } from "@/components/editor/StoryPreviewPlayer";
import { CharacterPicker } from "@/components/CharacterPicker";
import { BackgroundPattern } from "@/components/BackgroundPattern";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

// ---------------------------------------------------------------------------
// Constants & Types
// ---------------------------------------------------------------------------

// Fallback legacy themes
const LEGACY_COLOR_THEMES = [
    { name: "Mint", primary: "#E2F0E9", secondary: "#C5E3D5" },
    { name: "Sky", primary: "#E0F2FE", secondary: "#BAE6FD" },
    { name: "Peach", primary: "#FFEDD5", secondary: "#FED7AA" },
    { name: "Banana", primary: "#FEF9C3", secondary: "#FEF08A" },
    { name: "Coral", primary: "#FEE2E2", secondary: "#FECACA" },
    { name: "Purple", primary: "#F5F3FF", secondary: "#EDE9FE" },
    { name: "Pink", primary: "#FCE7F3", secondary: "#FBCFE8" },
    { name: "Wine", primary: "#FDF2F8", secondary: "#F9A8D4" },
    { name: "Forest", primary: "#F0FDF4", secondary: "#DCFCE7" },
    { name: "Gold", primary: "#FEFCE8", secondary: "#FEF9C3" },
    { name: "Rose", primary: "#FFF1F2", secondary: "#FFE4E6" },
    { name: "Lavender", primary: "#F5F3FF", secondary: "#EDE9FE" },
    { name: "Lemon", primary: "#FEFCE8", secondary: "#FEF9C3" },
    { name: "Slate", primary: "#F8FAFC", secondary: "#F1F5F9" },
    { name: "Sunset", primary: "#FFF7ED", secondary: "#FFEDD5" },
    { name: "Teal", primary: "#F0FDFA", secondary: "#CCFBF1" },
    { name: "Midnight", primary: "#EEF2FF", secondary: "#E0E7FF" },
    { name: "Ocean", primary: "#F0F9FF", secondary: "#E0F2FE" },
    { name: "Noir", primary: "#FAFAFA", secondary: "#F4F4F5" },
    { name: "Violet", primary: "#FAF5FF", secondary: "#F3E8FF" },
];

const DEFAULT_FONTS = [
    { name: "Serif (Lora)", value: "Lora" },
    { name: "Elegant (Playfair)", value: "Playfair Display" },
    { name: "Modern (Montserrat)", value: "Montserrat" },
    { name: "Bold (Bebas Neue)", value: "Bebas Neue" },
    { name: "Handwritten (Dancing Script)", value: "Dancing Script" },
    { name: "Playful (Pacifico)", value: "Pacifico" },
    { name: "Classic (Inter)", value: "Inter" },
];

const ALIGN_OPTIONS = [
    { id: "left", icon: <AlignLeft className="w-4 h-4" /> },
    { id: "center", icon: <AlignCenter className="w-4 h-4" /> },
    { id: "right", icon: <AlignRight className="w-4 h-4" /> },
];

const SLIDE_EFFECT_OPTIONS = [
    { id: "floral", emoji: "🌸", label: "Floral", type: "falling" },
    { id: "hearts", emoji: "💖", label: "Hearts", type: "rising" },
    { id: "stars", emoji: "✨", label: "Stars", type: "floating" },
    { id: "celebration", emoji: "🎉", label: "Celebration", type: "falling" },
    { id: "geometric", emoji: "💠", label: "Geometric", type: "static" },
    { id: "fire", emoji: "🔥", label: "Fire", type: "rising" },
    { id: "crowns", emoji: "👑", label: "Crowns", type: "falling" },
    { id: "balloons", emoji: "🎈", label: "Balloons", type: "rising" },
];

// Helper: derive a darker accent from a hex colour for the radial glow
function hexToRgba(hex: string, alpha: number) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const createInitialPage = (primary: string, secondary: string): StoryPage => ({
    id: `page-${Math.random().toString(36).slice(2, 9)}`,
    text: "",
    fontFamily: "Lora",
    fontSize: "medium",
    textAlign: "center",
    textColor: "#18181B",
    bgGradientStart: primary,
    bgGradientEnd: secondary,
    transition: "fade",
    stickers: [],
});

// ===========================================================================
// Main CreatePage
// ===========================================================================
export default function CreatePage() {
    const navigate = useNavigate();

    // Convex data
    const activeEvent = useQuery(api.events.getActive);
    const musicTracksConvex = useQuery(api.music.list);
    const allThemes = useQuery(api.themes.list);
    const allCharacters = useQuery(api.characters.list);
    const allFonts = useQuery(api.fonts.list);
    const allPatterns = useQuery(api.patterns.list);

    // Fallback to legacy music only if Convex is loading/empty, and filter by event settings
    const musicTracks = (() => {
        if (!musicTracksConvex) return [];
        if (activeEvent?.theme?.musicTrackIds && activeEvent.theme.musicTrackIds.length > 0) {
            return musicTracksConvex.filter(t => activeEvent.theme.musicTrackIds!.includes(t._id));
        }
        return musicTracksConvex;
    })();

    // Fallback/Legacy logic (will migrate fully once Convex is verified)
    const { event, theme: legacyTheme } = useEventTheme();
    const currentTheme = activeEvent?.theme || legacyTheme;

    const templates = getTemplatesByEvent(activeEvent?._id || "evt-1");

    // Compute available editor themes
    const availableThemes = (() => {
        // If we have themes from Convex AND the event specifies allowed themes, filter them
        if (allThemes && activeEvent?.theme?.allowedThemeIds && activeEvent.theme.allowedThemeIds.length > 0) {
            const filtered = allThemes.filter(t => activeEvent.theme.allowedThemeIds!.includes(t._id));
            // If filter results in empty (edge case), fallback to all
            return filtered.length > 0 ? filtered : allThemes;
        }
        // If we have themes but no restriction, show all
        if (allThemes && allThemes.length > 0) return allThemes;
        // Fallback to hardcoded legacy list
        return LEGACY_COLOR_THEMES;
    })();

    // Compute available fonts
    const availableFonts = (() => {
        if (!allFonts) return DEFAULT_FONTS;

        // Filter by event settings if present
        let filteredFonts = allFonts;
        if (activeEvent?.theme?.allowedFontIds && activeEvent.theme.allowedFontIds.length > 0) {
            filteredFonts = allFonts.filter(f => activeEvent.theme.allowedFontIds!.includes(f._id));
        }

        if (filteredFonts.length === 0) return DEFAULT_FONTS;

        return filteredFonts.map(f => ({
            name: f.name + (f.isCustom ? "" : ""),
            value: f.name,
            isCustom: f.isCustom as boolean | undefined,
            storageId: f.storageId as string | undefined,
            url: (f as any).url as string | undefined,
        } as { name: string; value: string; isCustom?: boolean; storageId?: string; url?: string }));
    })();

    // Load fonts dynamically
    useEffect(() => {
        if (!allFonts) return;

        // 1. Google Fonts
        const googleFonts = availableFonts.filter(f => !(f as any).isCustom && !DEFAULT_FONTS.some(df => df.value === f.value));
        if (googleFonts.length > 0) {
            const linkId = 'dynamic-google-fonts';
            if (!document.getElementById(linkId)) {
                const link = document.createElement('link');
                link.id = linkId;
                link.rel = 'stylesheet';
                const families = googleFonts.map(f => f.value.replace(/ /g, '+')).join('|');
                link.href = `https://fonts.googleapis.com/css?family=${families}&display=swap`;
                document.head.appendChild(link);
            }
        }

        // 2. Custom Fonts (Convex Storage)
        const customFonts = availableFonts.filter(f => (f as any).isCustom && (f as any).storageId && (f as any).url);
        customFonts.forEach(font => {
            const styleId = `font-${(font as any).storageId}`;
            if (!document.getElementById(styleId)) {
                const style = document.createElement('style');
                style.id = styleId;
                style.textContent = `
                    @font-face {
                        font-family: '${font.value}';
                        src: url('${(font as any).url}');
                        font-weight: normal;
                        font-style: normal;
                    }
                `;
                document.head.appendChild(style);
            }
        });
    }, [availableFonts, allFonts]);

    // Compute available characters
    const availableCharacters = (() => {
        if (allCharacters && activeEvent?.theme?.characterIds && activeEvent.theme.characterIds.length > 0) {
            return allCharacters
                .filter(c => activeEvent.theme.characterIds!.includes(c._id))
                .map(c => c.url);
        }
        // Fallback to existing logic or hardcoded
        return currentTheme.characters || [];
    })();

    // Merge patterns, preferring Dynamic (DB) over Hardcoded
    const availablePatterns = (() => {
        const dynamicPatterns = allPatterns?.map(p => ({
            id: p.id,
            emoji: p.emoji,
            label: p.name,
            type: p.type,
            customEmojis: [p.emoji]
        })) || [];

        // Create a map of dynamic patterns for easy lookup
        const dynamicMap = new Map(dynamicPatterns.map(p => [p.id, p]));

        // Start with hardcoded, but if a dynamic one exists with same ID, use that instead.
        // Actually, let's just use dynamic patterns if we have them, and only add hardcoded if distinct?
        // Better: Use everything from DB. If DB is empty/loading, maybe fallback. 
        // But since we have a mix, let's merge:

        const merged = [...dynamicPatterns];

        // Add hardcoded only if NOT in dynamic (Legacy fallback)
        SLIDE_EFFECT_OPTIONS.forEach(hc => {
            if (!dynamicMap.has(hc.id)) {
                merged.push({
                    ...hc,
                    type: hc.type as "falling" | "floating" | "rising" | "static",
                    customEmojis: [hc.emoji]
                });
            }
        });

        // Filter by event settings if present
        if (activeEvent?.theme?.patternIds && activeEvent.theme.patternIds.length > 0) {
            return merged.filter(p => activeEvent.theme.patternIds!.includes(p.id));
        }

        return merged;
    })();

    // Helper to get custom emojis for a pattern ID
    const getPatternEmojis = (patternId: string) => {
        const pattern = availablePatterns.find(p => p.id === patternId);
        // If we found it in availablePatterns, use its customEmojis (which we constructed above)
        return (pattern as any)?.customEmojis;
    };

    // State
    const [pages, setPages] = useState<StoryPage[]>([]);
    const [currentPageIndex, setCurrentPageIndex] = useState(0);
    const [activePicker, setActivePicker] = useState<string | null>(null);
    const [selectedMusicId, setSelectedMusicId] = useState<string | undefined>();

    // Modals
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
    const [characterPickerOpen, setCharacterPickerOpen] = useState(false);
    // Audio handling
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);

    const { toast } = useToast();

    // Initialize first page
    useEffect(() => {
        // Only init if we haven't already
        if (pages.length === 0) {
            // Prefer the first available theme, or event theme as fallback
            const initialPrimary = availableThemes[0]?.primary || currentTheme?.primary || "#E2F0E9";
            const initialSecondary = availableThemes[0]?.secondary || currentTheme?.secondary || "#C5E3D5";

            // Default pattern from event theme
            const defaultPattern = activeEvent?.theme?.backgroundPattern;

            setPages([{
                ...createInitialPage(initialPrimary, initialSecondary),
                backgroundPattern: defaultPattern,
            }]);
        }
    }, [pages.length, availableThemes, currentTheme, activeEvent]);


    // Load template logic (Simplified for clarity - focus on themes)
    // ... kept seemingly redundant template loading for now to avoid breaking existing logic if any
    useEffect(() => {
        if (templates.length > 0 && !selectedTemplate && pages.length === 0) {
            // This block might conflict with the one above, but the one above checks pages.length === 0 too.
            // We'll trust the simpler init above for now.
        }
    }, [templates, selectedTemplate]);


    const currentPage = pages[currentPageIndex];

    // -----------------------------------------------------------------------
    // Actions
    // -----------------------------------------------------------------------
    const updateCurrentPage = useCallback((updates: Partial<StoryPage>) => {
        setPages((prev) =>
            prev.map((p, i) => (i === currentPageIndex ? { ...p, ...updates } : p))
        );
    }, [currentPageIndex]);

    const addPage = () => {
        // Use current page's theme for new page
        const newPage = createInitialPage(
            currentPage?.bgGradientStart || "#E2F0E9",
            currentPage?.bgGradientEnd || "#C5E3D5"
        );
        // Inherit pattern
        if (currentPage?.backgroundPattern) {
            newPage.backgroundPattern = currentPage.backgroundPattern;
        }
        setPages((prev) => [...prev, newPage]);
        setCurrentPageIndex(pages.length);
    };

    const deletePage = () => {
        if (pages.length <= 1) return;
        const newIndex = Math.max(0, currentPageIndex - 1);
        setPages((prev) => prev.filter((_, i) => i !== currentPageIndex));
        setCurrentPageIndex(newIndex);
    };

    const nextPage = () => setCurrentPageIndex((prev) => Math.min(prev + 1, pages.length - 1));
    const prevPage = () => setCurrentPageIndex((prev) => Math.max(prev - 1, 0));

    // -----------------------------------------------------------------------
    // Derived State / Utils
    // -----------------------------------------------------------------------
    if (!event || !currentTheme || !currentPage) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const hasContent = pages.some(p => p.photoUrl || p.text.trim().length > 0);
    const activeMusicTrack = musicTracks.find((t) => t._id === selectedMusicId);

    // -----------------------------------------------------------------------
    // Render
    // -----------------------------------------------------------------------
    return (
        <div className="fixed inset-0 flex flex-col overflow-hidden">
            {/* BACKGROUND — solid colour + radial accent glow from top */}
            <div
                className="absolute inset-0 transition-colors duration-500"
                style={{
                    backgroundColor: currentPage.bgGradientStart,
                    backgroundImage: `radial-gradient(circle at 50% 0%, ${hexToRgba(currentPage.bgGradientEnd, 0.35)}, transparent 70%)`,
                }}
            >
                {currentPage.backgroundPattern && (
                    <BackgroundPattern
                        pattern={currentPage.backgroundPattern}
                        customEmojis={getPatternEmojis(currentPage.backgroundPattern)}
                        type={(availablePatterns.find(p => p.id === currentPage.backgroundPattern) as any)?.type}
                    />
                )}
            </div>

            {/* HEADER */}
            <header className="relative z-20 flex items-center justify-between px-5 pt-5 pb-2">
                <button onClick={() => navigate(-1)} className="transition-colors text-zinc-500 hover:text-zinc-900">
                    <ArrowLeft className="w-5 h-5" />
                </button>

                <span className="text-sm font-medium text-zinc-500">
                    {currentPageIndex + 1} / {pages.length}
                </span>

                <button
                    onClick={deletePage}
                    disabled={pages.length <= 1}
                    className="hover:text-red-400 disabled:cursor-not-allowed transition-colors text-zinc-400 disabled:text-zinc-200"
                    title="Delete slide"
                >
                    <Trash2 className="w-5 h-5" />
                </button>
            </header>

            {/* CANVAS AREA */}
            <main className="flex-1 flex flex-col justify-center px-10 relative z-10">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentPageIndex}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="w-full flex flex-col items-center"
                    >
                        {/* Photo Slot */}
                        <div className="flex justify-center mb-4">
                            <button
                                onClick={() => setCharacterPickerOpen(true)}
                                className={cn(
                                    "w-32 h-32 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-colors overflow-hidden",
                                    currentPage.photoUrl
                                        ? "border-transparent"
                                        : "border-zinc-900/20 hover:border-zinc-900/40 text-zinc-400 hover:text-zinc-600"
                                )}
                            >
                                {currentPage.photoUrl ? (
                                    <img src={currentPage.photoUrl} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <>
                                        <ImageIcon className="w-8 h-8" />
                                        <span className="text-sm font-medium">Add Photo</span>
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Text Editor */}
                        <textarea
                            value={currentPage.text}
                            onChange={(e) => updateCurrentPage({ text: e.target.value.slice(0, 200) })}
                            placeholder="Tap to write..."
                            className="bg-transparent text-5xl sm:text-6xl font-medium leading-tight resize-none focus:outline-none w-full overflow-hidden text-zinc-900 placeholder-zinc-400 caret-zinc-900"
                            style={{
                                fontFamily: currentPage.fontFamily,
                                textAlign: currentPage.textAlign as React.CSSProperties["textAlign"],
                                minHeight: "60px",
                            }}
                            rows={3}
                        />

                        {/* Progress Bar + Character Count */}
                        <div className="mt-3 flex items-center gap-2 w-full">
                            <div className="flex-1 h-0.5 rounded-full overflow-hidden bg-zinc-900/10">
                                <div
                                    className="h-full rounded-full bg-zinc-900/30 transition-all duration-200"
                                    style={{ width: `${(currentPage.text.length / 200) * 100}%` }}
                                />
                            </div>
                            <span className="text-xs font-mono text-zinc-500">
                                {currentPage.text.length}/200
                            </span>
                        </div>

                        {/* Stickers on Page */}
                        {currentPage.stickers.map((s, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute text-5xl pointer-events-none select-none"
                                style={{ left: `${s.x}%`, top: `${s.y}%` }}
                            >
                                {s.emoji}
                            </motion.div>
                        ))}
                    </motion.div>
                </AnimatePresence>

                {/* Right-Edge Page Navigation */}
                {pages.length > 1 && currentPageIndex < pages.length - 1 && (
                    <button
                        onClick={nextPage}
                        className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-12 h-24 flex items-center justify-center transition-colors text-zinc-400 hover:text-zinc-700"
                    >
                        <ChevronRight className="w-6 h-6" />
                    </button>
                )}
                {pages.length > 1 && currentPageIndex > 0 && (
                    <button
                        onClick={prevPage}
                        className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-12 h-24 flex items-center justify-center transition-colors text-zinc-400 hover:text-zinc-700"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                )}
            </main>

            {/* PAGE DOTS — pill-shaped indicators */}
            <div className="relative z-20 flex items-center justify-center gap-1 py-2">
                <ul className="flex items-center gap-1.5" style={{ overflowAnchor: "none" }}>
                    {pages.map((_, i) => (
                        <li
                            key={i}
                            onClick={() => setCurrentPageIndex(i)}
                            className={cn(
                                "rounded-full transition-all cursor-pointer",
                                i === currentPageIndex
                                    ? "w-8 h-6 bg-zinc-900"
                                    : "w-4 h-6 bg-zinc-900/20 hover:bg-zinc-900/40"
                            )}
                        />
                    ))}
                </ul>
                <button
                    onClick={addPage}
                    className="w-6 h-6 rounded-full border border-dashed transition-colors flex items-center justify-center text-sm ml-1 border-zinc-900/30 text-zinc-900/30 hover:border-zinc-900/60 hover:text-zinc-900/60"
                >
                    +
                </button>
            </div>

            {/* FLOATING TOOLBAR */}
            <div className="relative z-20 space-y-3 px-5 pb-5 pt-2">
                {/* Inline Pickers (Popovers) */}
                <AnimatePresence>
                    {activePicker && (
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className={cn(
                                "absolute bottom-full mb-4 bg-zinc-900/95 backdrop-blur-2xl rounded-3xl shadow-2xl z-50 border border-white/10",
                                activePicker === "theme" ? "p-4 min-w-[300px]" : "p-2"
                            )}
                        >
                            {activePicker === "theme" && (
                                <>
                                    <p className="text-[10px] uppercase tracking-widest text-white/40 font-semibold mb-3 px-2">Theme</p>
                                    <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                                        {availableThemes.map(ct => (
                                            <button
                                                key={ct.name}
                                                onClick={() => {
                                                    updateCurrentPage({ bgGradientStart: ct.primary, bgGradientEnd: ct.secondary });
                                                    setActivePicker(null);
                                                }}
                                                className={cn(
                                                    "flex items-center gap-3 p-2 w-full rounded-xl transition-colors text-left",
                                                    currentPage.bgGradientStart === ct.primary ? "bg-white/10" : "hover:bg-white/5"
                                                )}
                                            >
                                                <div
                                                    className="w-8 h-8 rounded-lg border border-white/10 shrink-0"
                                                    style={{ background: `linear-gradient(135deg, ${ct.primary}, ${ct.secondary})` }}
                                                />
                                                <span className="text-white/80 text-xs font-medium">{ct.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}

                            {activePicker === "font" && (
                                <div className="space-y-0.5 min-w-[180px] p-1 max-h-72 overflow-y-auto">
                                    {availableFonts.map(font => (
                                        <button
                                            key={font.name}
                                            onClick={() => {
                                                updateCurrentPage({ fontFamily: font.value });
                                                setActivePicker(null);
                                            }}
                                            className={cn(
                                                "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between",
                                                currentPage.fontFamily === font.value
                                                    ? "bg-white/15 text-white"
                                                    : "text-white/70 hover:bg-white/5"
                                            )}
                                            style={{ fontFamily: font.value }}
                                        >
                                            {font.name}
                                            {currentPage.fontFamily === font.value && (
                                                <Check className="w-4 h-4 text-emerald-400" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {activePicker === "align" && (
                                <div className="flex items-center gap-1 p-1">
                                    {ALIGN_OPTIONS.map(opt => (
                                        <button
                                            key={opt.id}
                                            onClick={() => {
                                                updateCurrentPage({ textAlign: opt.id as StoryPage["textAlign"] });
                                                setActivePicker(null);
                                            }}
                                            className={cn(
                                                "p-2 text-white hover:bg-white/10 rounded-lg transition-colors",
                                                currentPage.textAlign === opt.id && "bg-white/20"
                                            )}
                                        >
                                            {opt.icon}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {activePicker === "music" && (
                                <div className="space-y-1 max-h-48 overflow-y-auto p-1 min-w-[160px]">
                                    {musicTracks.map(track => (
                                        <button
                                            key={track._id}
                                            onClick={() => {
                                                setSelectedMusicId(track._id);
                                                setActivePicker(null);
                                            }}
                                            className={cn(
                                                "w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-between",
                                                selectedMusicId === track._id ? "bg-white/20 text-white" : "text-white/60 hover:bg-white/10"
                                            )}
                                        >
                                            <div className="truncate pr-4">
                                                <div className="truncate">{track.name}</div>
                                                <div className="opacity-40 text-[10px]">{track.artist}</div>
                                            </div>
                                            {selectedMusicId === track._id && <Check className="w-3 h-3" />}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {activePicker === "slideEffects" && (
                                <div className="p-1">
                                    <button
                                        onClick={() => {
                                            updateCurrentPage({ backgroundPattern: undefined });
                                            setActivePicker(null);
                                        }}
                                        className={cn(
                                            "w-full px-3 py-2 mb-1 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors",
                                            !currentPage.backgroundPattern
                                                ? "bg-white/20 text-white"
                                                : "text-white/60 hover:bg-white/10 hover:text-white"
                                        )}
                                    >
                                        <span className="w-6 h-6 rounded-md border border-white/20 flex items-center justify-center text-xs">✕</span>
                                        No Pattern
                                    </button>
                                    <div className="grid grid-cols-4 gap-1 max-h-48 overflow-y-auto">
                                        {availablePatterns.map(opt => (
                                            <button
                                                key={opt.id}
                                                onClick={() => {
                                                    updateCurrentPage({ backgroundPattern: opt.id });
                                                    setActivePicker(null);
                                                }}
                                                className={cn(
                                                    "w-10 h-10 flex items-center justify-center text-xl rounded-lg transition-colors",
                                                    currentPage.backgroundPattern === opt.id
                                                        ? "bg-white/25 ring-1 ring-white/40"
                                                        : "hover:bg-white/10"
                                                )}
                                                title={opt.label}
                                            >
                                                {opt.emoji}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <button onClick={() => setActivePicker(null)} className="absolute top-3 right-3 p-1.5 text-white/30 hover:text-white rounded-lg transition-colors">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="flex gap-3 items-center justify-center">
                    <ToolbarIcon icon={<Palette className="w-5 h-5" />} onClick={() => setActivePicker(activePicker === "theme" ? null : "theme")} active={activePicker === "theme"} title="Change theme" />
                    <ToolbarIcon icon={<Type className="w-5 h-5" />} onClick={() => setActivePicker(activePicker === "font" ? null : "font")} active={activePicker === "font"} title="Change font" />
                    <button
                        onClick={() => setActivePicker(activePicker === "align" ? null : "align")}
                        className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                            activePicker === "align" ? "bg-zinc-700 text-white" : "bg-zinc-800 hover:bg-zinc-700 text-white"
                        )}
                        title="Align text"
                    >
                        {ALIGN_OPTIONS.find(o => o.id === currentPage.textAlign)?.icon || <AlignCenter className="w-5 h-5" />}
                    </button>
                    <ToolbarIcon icon={<Music className="w-5 h-5" />} onClick={() => setActivePicker(activePicker === "music" ? null : "music")} active={activePicker === "music"} title="Add music" />
                    <ToolbarIcon icon={<Sparkles className="w-5 h-5" />} onClick={() => setActivePicker(activePicker === "slideEffects" ? null : "slideEffects")} active={activePicker === "slideEffects"} title="Slide effects" />
                </div>

                {/* ACTION BUTTONS */}
                <div className="flex gap-3 items-center">
                    <button
                        onClick={() => setIsPreviewOpen(true)}
                        disabled={!hasContent}
                        className="flex-1 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 text-white font-medium py-3 rounded-full transition-all flex items-center justify-center gap-2"
                    >
                        <Play className="w-4 h-4" />
                        Preview
                    </button>
                    <button
                        onClick={() => setIsPaymentOpen(true)}
                        disabled={!hasContent}
                        className="flex-1 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-30 text-white font-bold py-3 rounded-full transition-all flex items-center justify-center gap-2"
                    >
                        <Heart className="w-5 h-5" />
                        Publish
                    </button>
                </div>
            </div>

            {/* MODALS */}
            <CharacterPicker
                isOpen={characterPickerOpen}
                onClose={() => setCharacterPickerOpen(false)}
                onSelect={(url) => updateCurrentPage({ photoUrl: url })}
                characters={availableCharacters}
                theme={{ primary: currentTheme.primary, secondary: currentTheme.secondary }}
            />

            <PaymentModal
                open={isPaymentOpen}
                onClose={() => setIsPaymentOpen(false)}
                event={event}
                template={{ id: "direct-tpl", name: "Custom Story", eventId: event.id, thumbnail: "", outputType: "image", mediaSlots: [], textSlots: [], layers: [], popularity: 0, createdAt: Date.now() } as Template}
                pages={pages}
                musicTrackId={selectedMusicId}
            />

            {/* STORY PREVIEW PLAYER */}
            <StoryPreviewPlayer
                pages={pages}
                open={isPreviewOpen}
                onClose={() => setIsPreviewOpen(false)}
            />

            {activeMusicTrack?.url && (
                <audio
                    ref={audioRef}
                    src={activeMusicTrack.url}
                    loop
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                />
            )}

            <style>{`
        header, main, footer { user-select: none; }
        textarea::placeholder { color: rgb(161, 161, 170); }
        textarea:focus { box-shadow: none; outline: none; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background-color: rgba(255,255,255,0.2); border-radius: 4px; }
      `}</style>
        </div>
    );
}

function ToolbarIcon({ icon, onClick, active, title }: { icon: React.ReactNode; onClick: () => void; active?: boolean; title?: string }) {
    return (
        <button
            onClick={onClick}
            title={title}
            className={cn(
                "w-11 h-11 rounded-xl backdrop-blur-sm border flex items-center justify-center transition-all",
                active
                    ? "bg-zinc-700 border-zinc-600 text-white"
                    : "bg-zinc-800 border-zinc-700 text-white/80 hover:text-white hover:bg-zinc-700"
            )}
        >
            {icon}
        </button>
    );
}
