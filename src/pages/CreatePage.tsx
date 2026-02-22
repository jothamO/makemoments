import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { BACKGROUND_PATTERNS } from "@/lib/backgroundPatterns";
import { musicTracks as fallbackMusicTracks } from "@/data/music-tracks";
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
    Check,
    Heart,
    Loader2,
} from "lucide-react";
import { EditorToolbar } from "@/components/editor/EditorToolbar";
import { useEventTheme } from "@/contexts/ThemeContext";
import type { StoryPage, EventTheme, MusicTrack } from "@/data/types";
import { cn, hexToRgba } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { PaymentModal } from "@/components/PaymentModal";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { StoryPreviewPlayer } from "@/components/editor/StoryPreviewPlayer";
import { CharacterPicker } from "@/components/CharacterPicker";
import { BackgroundPattern } from "@/components/BackgroundPattern";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { getWiseAssMessage } from "@/lib/statusUtils";

// ---------------------------------------------------------------------------
// Constants & Types
// ---------------------------------------------------------------------------

const DEFAULT_FONTS = [
    { name: "Serif (Lora)", value: "Lora" },
    { name: "Elegant (Playfair)", value: "Playfair Display" },
    { name: "Modern (Montserrat)", value: "Montserrat" },
    { name: "Bold (Bebas Neue)", value: "Bebas Neue" },
    { name: "Handwritten (Dancing Script)", value: "Dancing Script" },
    { name: "Playful (Pacifico)", value: "Pacifico" },
    { name: "Classic (Inter)", value: "Inter" },
];

const createInitialPage = (primary: string, secondary: string, glowColor?: string, type: "light" | "dark" = "light"): StoryPage => ({
    id: `page-${Math.random().toString(36).slice(2, 9)}`,
    text: "",
    fontFamily: "Lora",
    fontSize: "medium",
    textAlign: "center",
    textColor: type === 'dark' ? "#FFFFFF" : "#18181B",
    bgGradientStart: primary,
    bgGradientEnd: secondary,
    glowColor: glowColor,
    transition: "fade",
    stickers: [],
    type: type,
});

export default function CreatePage() {
    const navigate = useNavigate();
    const { eventSlug } = useParams();
    const eventResponse = useQuery(api.events.getBySlugWithAssets, eventSlug ? { slug: eventSlug } : "skip");
    const { toast } = useToast();

    // Normalize activeEvent for legacy components
    const activeEvent = eventResponse?.event;
    const resolvedAssets = activeEvent?.resolvedAssets;

    // Computed Assets from Resolved Data
    const musicTracks = (resolvedAssets?.musicTracks && resolvedAssets.musicTracks.length > 0)
        ? resolvedAssets.musicTracks
        : fallbackMusicTracks;
    const availableThemes = resolvedAssets?.themes || [];

    const availableFonts = (() => {
        if (!resolvedAssets?.fonts || resolvedAssets.fonts.length === 0) return DEFAULT_FONTS;
        return resolvedAssets.fonts.map((f: any) => ({
            name: f.name,
            value: f.name,
            isCustom: f.isCustom as boolean | undefined,
            storageId: f.storageId as string | undefined,
            url: (f as any).url as string | undefined,
        } as { name: string; value: string; isCustom?: boolean; storageId?: string; url?: string }));
    })();

    // State
    const [pages, setPages] = useState<StoryPage[]>([]);
    const [currentPageIndex, setCurrentPageIndex] = useState(0);
    const [selectedMusicId, setSelectedMusicId] = useState<string | undefined>();
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);
    const [characterPickerOpen, setCharacterPickerOpen] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);

    // Refs
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const hasAppliedDefaultBackdrop = useRef(false);

    // Derived: active track for audio playback (must be before effects that use it)
    // We look in both lists to ensure we find the track even if it's a fallback or DB provided
    const activeMusicTrack = [
        ...(resolvedAssets?.musicTracks || []),
        ...fallbackMusicTracks
    ].find((t: any) => (t._id || t.id) === selectedMusicId);

    // Contexts
    const { event, theme: legacyTheme } = useEventTheme();
    const currentTheme = activeEvent?.theme || legacyTheme;

    // Load fonts dynamically
    useEffect(() => {
        if (!availableFonts) return;

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
    }, [availableFonts]);

    // Compute available characters
    const availableCharacters = (() => {
        if (resolvedAssets?.characters && activeEvent?.theme?.characterIds && activeEvent.theme.characterIds.length > 0) {
            return (resolvedAssets.characters as any[])
                .filter(c => activeEvent.theme.characterIds!.includes(c._id))
                .map(c => c.url);
        }
        // Fallback to existing logic or hardcoded
        return currentTheme?.characters || [];
    })();

    // List only dynamic patterns from DB
    const availablePatterns = (() => {
        const dynamicPatterns = (resolvedAssets?.patterns as any[])?.map((p: any) => ({
            id: p.id,
            emoji: p.emojis?.[0] || "✨",
            label: p.name,
            type: p.type,
            customEmojis: p.emojis || ["✨"]
        })) || [];

        // Filter by event settings if present
        if (activeEvent?.theme?.patternIds && activeEvent.theme.patternIds.length > 0) {
            return dynamicPatterns.filter(p => activeEvent.theme.patternIds!.includes(p.id));
        }

        return dynamicPatterns;
    })();

    // Helper to get custom emojis for a pattern ID
    const getPatternEmojis = (patternId: string) => {
        const pattern = availablePatterns?.find(p => p.id === patternId);
        // If we found it in availablePatterns, use its customEmojis (which we constructed above)
        return (pattern as any)?.customEmojis;
    };

    // Initialize first page
    useEffect(() => {
        if (pages.length === 0 && activeEvent !== undefined) {
            const prefillPages = location.state?.prefillPages;
            if (prefillPages) {
                setPages(prefillPages);
                return;
            }

            const firstGlobal = availableThemes[0] as any;
            const eventTheme = activeEvent?.theme as any;

            const initialPrimary = firstGlobal?.baseColor || firstGlobal?.primary || eventTheme?.baseColor || eventTheme?.primary || "#FFFFFF";
            const initialSecondary = firstGlobal?.glowColor || firstGlobal?.secondary || eventTheme?.glowColor || eventTheme?.secondary || "#F4F4F5";
            const initialGlow = firstGlobal?.glowColor || eventTheme?.glowColor || "#ffffff";
            const initialType = firstGlobal?.type || eventTheme?.type || "light";

            setPages([createInitialPage(initialPrimary, initialSecondary, initialGlow, initialType)]);
        }
    }, [pages.length, activeEvent, availableThemes, location.state]);

    // Apply the first event backdrop as the default once assets load
    useEffect(() => {
        if (hasAppliedDefaultBackdrop.current) return;
        if (pages.length === 0 || availableThemes.length === 0) return;

        const firstTheme = availableThemes[0] as any;
        if (!firstTheme) return;

        hasAppliedDefaultBackdrop.current = true;

        const type = firstTheme.type || "light";
        setPages((prev) =>
            prev.map((p) => ({
                ...p,
                bgGradientStart: firstTheme.baseColor || firstTheme.primary || p.bgGradientStart,
                bgGradientEnd: firstTheme.glowColor || firstTheme.secondary || p.bgGradientEnd,
                glowColor: firstTheme.glowColor || firstTheme.themeGlow || p.glowColor,
                textColor: firstTheme.textLight || (type === "dark" ? "#FFFFFF" : "#18181B"),
                type: type,
            }))
        );
    }, [pages.length, availableThemes]);


    // Imperatively manage audio: load new source, then play
    const lastLoadedUrl = useRef<string | null>(null);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const trackUrl = activeMusicTrack?.url;

        // Diagnostic log (optional, but helpful for debugging)
        if (selectedMusicId) {
            console.log("Audio Sync:", { selectedMusicId, trackUrl, isPlaying });
        }

        if (!isPlaying || !trackUrl) {
            audio.pause();
            return;
        }

        const playSafe = () => {
            audio.play().catch(e => {
                if (e.name !== 'AbortError') {
                    console.error("Playback failed:", e);
                    toast({
                        title: "Audio blocked",
                        description: "Click anywhere on the page to enable music playback.",
                    });
                }
            });
        };

        // If the URL changed, load the new source first
        if (trackUrl !== lastLoadedUrl.current) {
            lastLoadedUrl.current = trackUrl;
            audio.src = trackUrl;
            audio.load();

            const onReady = () => {
                playSafe();
                audio.removeEventListener("canplaythrough", onReady);
            };
            audio.addEventListener("canplaythrough", onReady);

            audio.onerror = () => {
                console.error("Audio Load Error:", trackUrl);
                toast({
                    title: "Music error",
                    description: "Failed to load music track. It might be unavailable.",
                    variant: "destructive"
                });
            };

            return () => {
                audio.removeEventListener("canplaythrough", onReady);
            };
        }

        // Same source, just ensure it's playing
        if (audio.paused) {
            playSafe();
        }
    }, [isPlaying, activeMusicTrack?.url, selectedMusicId]);

    // -----------------------------------------------------------------------
    // Actions
    // -----------------------------------------------------------------------
    const updateCurrentPage = useCallback((updates: Partial<StoryPage>) => {
        setPages((prev) =>
            prev.map((p, i) => (i === currentPageIndex ? { ...p, ...updates } : p))
        );
    }, [currentPageIndex]);

    const handleBackdropSelect = (theme: Partial<EventTheme>) => {
        const type = theme.type || "light";
        const updates = {
            bgGradientStart: (theme as any).baseColor || theme.primary,
            bgGradientEnd: (theme as any).glowColor || theme.secondary,
            glowColor: (theme as any).glowColor || theme.themeGlow || theme.glowColor,
            textColor: (theme as any).textLight || (type === "dark" ? "#FFFFFF" : "#18181B"),
            type: type
        };

        setPages((prev) =>
            prev.map((p) => ({
                ...p,
                ...updates
            }))
        );
    };

    const handleReorder = (newPages: StoryPage[]) => {
        // Track the current page ID to maintain focus
        const currentPageId = pages[currentPageIndex]?.id;
        setPages(newPages);

        // Find the new index of the slide we were just editing
        if (currentPageId) {
            const newIndex = newPages.findIndex(p => p.id === currentPageId);
            if (newIndex !== -1) {
                setCurrentPageIndex(newIndex);
            }
        }
    };

    // Loading State
    if (eventResponse === undefined) {
        return (
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
                <Loader2 className="w-8 h-8 text-white/20 animate-spin" />
            </div>
        );
    }

    // "Wise-Ass" Expired / Not Found State
    if (eventResponse.status === "EXPIRED" || eventResponse.status === "NOT_FOUND" || eventResponse.status === "UPCOMING") {
        const wiseAss = activeEvent ? getWiseAssMessage(activeEvent) : null;

        const headline = eventResponse.status === "NOT_FOUND"
            ? "Event Not Found"
            : (wiseAss?.headline || "Sorry, Wise-Ass.😝");

        const subheadline = eventResponse.status === "NOT_FOUND"
            ? "We couldn't find the celebration you're looking for."
            : (wiseAss?.subheadline || "This celebration is no longer accepting new creations. You missed the magic timing!");

        return (
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6 overflow-hidden relative">
                {activeEvent?.theme?.baseColor && (
                    <div
                        className="absolute inset-0 opacity-20"
                        style={{ background: `radial-gradient(circle at center, ${activeEvent.theme.glowColor || activeEvent.theme.baseColor}, transparent 70%)` }}
                    />
                )}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/5 via-transparent to-transparent opacity-50" />
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className="max-w-md w-full bg-zinc-900/50 backdrop-blur-2xl border border-white/10 rounded-[32px] p-8 text-center relative z-10 shadow-2xl"
                >
                    <div className="w-20 h-20 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        {eventResponse.status === "NOT_FOUND" ? (
                            <X className="w-10 h-10 text-white/40" />
                        ) : (
                            <span className="text-4xl">{activeEvent?.theme?.headline?.split(' ')?.[0] || "😝"}</span>
                        )}
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2 leading-tight">
                        {headline}
                    </h1>
                    <p className="text-zinc-400 mb-8 px-4">
                        {subheadline}
                    </p>
                    <button
                        onClick={() => navigate('/')}
                        className="w-full bg-white text-zinc-900 font-bold py-4 rounded-2xl hover:bg-zinc-100 transition-all shadow-lg active:scale-95"
                    >
                        Head Back Home
                    </button>
                </motion.div>
            </div>
        );
    }

    /*
    ### Premium UI & Patterns Fixes
    1.  **Centered Popovers**: Open each toolbar item (Backdrop, Font, Music, Patterns). Verify they are centered above the button and have no "arrow" (Floating Island style).
    2.  **Backdrop 2-Column Grid**: Open the Backdrop picker. Verify it is now a 2-column grid instead of a single list.
    3.  **Patterns List**: Open the Patterns picker (formerly Slide Effects). Verify it is now a single-column list.
    4.  **Glassmorphism**: Ensure all popovers have a deep blur (`backdrop-blur-2xl` or `3xl`) and look premium against the background.
    5.  **Hover States**: Check that the new "ring" selection indicator and hover backgrounds feel smooth and responsive.
    */
    const currentPage = pages[currentPageIndex];

    const addPage = () => {
        if (!currentPage) return;
        const newPage = createInitialPage(
            currentPage.bgGradientStart || "#E2F0E9",
            currentPage.bgGradientEnd || "#C5E3D5",
            currentPage.glowColor,
            currentPage.type || "light"
        );
        newPage.textColor = currentPage.textColor;
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
                    backgroundImage: `radial-gradient(circle at 50% 0%, ${hexToRgba(currentPage.glowColor || currentPage.bgGradientEnd, currentPage.type === 'dark' ? 0.4 : 0.25)}, transparent 70%)`,
                }}
            >
                {currentPage.backgroundPattern && (
                    <BackgroundPattern
                        patternId={currentPage.backgroundPattern}
                    />
                )}
            </div>

            {/* HEADER */}
            <header className="relative z-20 flex items-center justify-between px-5 pt-5 pb-2">
                <button
                    onClick={() => navigate(-1)}
                    className={cn(
                        "transition-colors",
                        currentPage.type === 'dark' ? "text-white/60 hover:text-white" : "text-zinc-500 hover:text-zinc-900"
                    )}
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>

                <span className={cn(
                    "text-sm font-medium",
                    currentPage.type === 'dark' ? "text-white/60" : "text-zinc-500"
                )}>
                    {currentPageIndex + 1} / {pages.length}
                </span>

                <button
                    onClick={deletePage}
                    disabled={pages.length <= 1}
                    className={cn(
                        "transition-colors disabled:cursor-not-allowed",
                        currentPage.type === 'dark'
                            ? "text-white/40 hover:text-red-400 disabled:text-white/10"
                            : "text-zinc-400 hover:text-red-400 disabled:text-zinc-200"
                    )}
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
                                        : (currentPage.type === 'dark'
                                            ? "border-white/20 hover:border-white/40 text-white/40 hover:text-white/60"
                                            : "border-zinc-900/20 hover:border-zinc-900/40 text-zinc-400 hover:text-zinc-600")
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
                            className={cn(
                                "bg-transparent text-5xl sm:text-6xl font-medium leading-tight resize-none focus:outline-none w-full overflow-hidden transition-colors duration-500",
                                currentPage.type === 'dark'
                                    ? "placeholder-white/30 caret-white"
                                    : "placeholder-zinc-400 caret-zinc-900"
                            )}
                            style={{
                                fontFamily: currentPage.fontFamily,
                                textAlign: currentPage.textAlign as React.CSSProperties["textAlign"],
                                minHeight: "60px",
                                color: currentPage.textColor,
                            }}
                            rows={3}
                        />

                        {/* Progress Bar + Character Count */}
                        <div className="mt-3 flex items-center gap-2 w-full">
                            <div className={cn(
                                "flex-1 h-0.5 rounded-full overflow-hidden",
                                currentPage.type === 'dark' ? "bg-white/10" : "bg-zinc-900/10"
                            )}>
                                <div
                                    className={cn(
                                        "h-full rounded-full transition-all duration-200",
                                        currentPage.type === 'dark' ? "bg-white/30" : "bg-zinc-900/30"
                                    )}
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
                        className={cn(
                            "absolute right-0 top-1/2 -translate-y-1/2 z-20 w-12 h-24 flex items-center justify-center transition-colors",
                            currentPage.type === 'dark'
                                ? "text-white/40 hover:text-white"
                                : "text-zinc-400 hover:text-zinc-700"
                        )}
                    >
                        <ChevronRight className="w-6 h-6" />
                    </button>
                )}
                {pages.length > 1 && currentPageIndex > 0 && (
                    <button
                        onClick={prevPage}
                        className={cn(
                            "absolute left-0 top-1/2 -translate-y-1/2 z-20 w-12 h-24 flex items-center justify-center transition-colors",
                            currentPage.type === 'dark'
                                ? "text-white/40 hover:text-white"
                                : "text-zinc-400 hover:text-zinc-700"
                        )}
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                )}
            </main>

            {/* PAGE DOTS — draggable reorder indicators */}
            <div className="relative z-20 flex items-center justify-center gap-1 py-2">
                <Reorder.Group
                    axis="x"
                    values={pages}
                    onReorder={handleReorder}
                    className="flex items-center gap-1.5"
                >
                    {pages.map((p, i) => (
                        <Reorder.Item
                            key={p.id}
                            value={p}
                            onClick={() => setCurrentPageIndex(i)}
                            className={cn(
                                "rounded-full transition-all cursor-grab active:cursor-grabbing",
                                i === currentPageIndex
                                    ? (currentPage.type === 'dark' ? "w-8 h-6 bg-white" : "w-8 h-6 bg-zinc-900")
                                    : (currentPage.type === 'dark'
                                        ? "w-4 h-6 bg-white/20 hover:bg-white/40"
                                        : "w-4 h-6 bg-zinc-900/20 hover:bg-zinc-900/40")
                            )}
                        />
                    ))}
                </Reorder.Group>
                <button
                    onClick={addPage}
                    className={cn(
                        "w-6 h-6 rounded-full border border-dashed transition-colors flex items-center justify-center text-sm ml-1",
                        currentPage.type === 'dark'
                            ? "border-white/30 text-white/30 hover:border-white/60 hover:text-white/60"
                            : "border-zinc-900/30 text-zinc-900/30 hover:border-zinc-900/60 hover:text-zinc-900/60"
                    )}
                >
                    +
                </button>
            </div>

            {/* FLOATING TOOLBAR */}
            <div className="relative z-20 space-y-3 px-5 pb-5 pt-2">
                <EditorToolbar
                    page={currentPage}
                    musicTrackId={selectedMusicId}
                    isPlaying={isPlaying}
                    onTogglePlay={() => setIsPlaying(!isPlaying)}
                    activeColor={currentTheme.glowColor || currentTheme.primary}
                    allowedThemeIds={activeEvent?.theme?.allowedThemeIds}
                    allowedFontIds={activeEvent?.theme?.allowedFontIds}
                    allowedMusicIds={activeEvent?.theme?.musicTrackIds}
                    allowedPatternIds={activeEvent?.theme?.patternIds}
                    onPageUpdate={updateCurrentPage}
                    onMusicChange={(id) => {
                        setSelectedMusicId(id);
                        if (id) setIsPlaying(true);
                    }}
                    onBackdropSelect={handleBackdropSelect}
                    className="relative bottom-auto left-auto right-auto mb-2"
                />

                <div className="flex gap-3 items-center">
                    <button
                        onClick={() => {
                            setIsPlaying(false);
                            setIsPreviewOpen(true);
                        }}
                        disabled={!hasContent}
                        className={cn(
                            "flex-1 font-medium py-3 rounded-full transition-all flex items-center justify-center gap-2 disabled:opacity-30",
                            currentPage.type === 'dark'
                                ? "bg-white/10 hover:bg-white/20 text-white border border-white/10"
                                : "bg-zinc-800 hover:bg-zinc-700 text-white"
                        )}
                    >
                        <Play className="w-4 h-4" />
                        Preview
                    </button>
                    <button
                        onClick={() => setIsPaymentOpen(true)}
                        disabled={!hasContent}
                        className={cn(
                            "flex-1 font-bold py-3 rounded-full transition-all flex items-center justify-center gap-2 disabled:opacity-30 shadow-lg",
                            currentPage.type === 'dark'
                                ? "bg-white text-zinc-900 hover:bg-zinc-100"
                                : "bg-zinc-900 text-white hover:bg-zinc-800"
                        )}
                    >
                        <Heart className="w-5 h-5" />
                        Publish
                    </button>
                </div>
            </div>

            <CharacterPicker
                isOpen={characterPickerOpen}
                onClose={() => setCharacterPickerOpen(false)}
                onSelect={(url) => updateCurrentPage({ photoUrl: url })}
                selectedUrl={currentPage.photoUrl}
                characters={availableCharacters}
                theme={{ primary: currentTheme.primary, secondary: currentTheme.secondary }}
            />

            <PaymentModal
                open={isPaymentOpen}
                onClose={() => setIsPaymentOpen(false)}
                event={activeEvent ? { ...event, theme: { ...event.theme, ...activeEvent.theme } } : event}
                pages={pages}
                musicTrackId={selectedMusicId}
            />

            <StoryPreviewPlayer
                pages={pages}
                open={isPreviewOpen}
                onClose={() => {
                    setIsPreviewOpen(false);
                    // Optionally resume playing if it was playing before
                }}
                musicTrack={activeMusicTrack}
            />

            <audio
                ref={audioRef}
                loop
                onPause={() => setIsPlaying(false)}
            />

            <style>{`
                header, main, footer { user-select: none; }
                textarea:focus { box-shadow: none; outline: none; }
                ::-webkit-scrollbar { width: 4px; }
                ::-webkit-scrollbar-thumb { background-color: rgba(255,255,255,0.2); border-radius: 4px; }
            `}</style>
        </div>
    );
}
