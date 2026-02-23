import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { motion, AnimatePresence, Reorder } from "framer-motion";
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
import { ImageTransformEditor } from "@/components/editor/ImageTransformEditor";
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
import { useCurrency } from "@/contexts/CurrencyContext";

// ---------------------------------------------------------------------------

const createInitialPage = (primary: string, secondary: string, glowColor?: string, type: "light" | "dark" = "light", initialFont: string = "system-ui"): StoryPage => ({
    id: `page-${Math.random().toString(36).slice(2, 9)}`,
    text: "",
    fontFamily: initialFont,
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

    const location = useLocation();

    // Normalize activeEvent for legacy components
    const activeEvent = eventResponse?.event;
    const resolvedAssets = activeEvent?.resolvedAssets;

    // Computed Assets from Resolved Data
    const availableThemes: Partial<EventTheme>[] = (resolvedAssets?.themes || []) as Partial<EventTheme>[];
    const availableMusic: MusicTrack[] = (resolvedAssets?.musicTracks || []) as MusicTrack[];
    const availableFonts = (() => {
        if (!resolvedAssets?.fonts || resolvedAssets.fonts.length === 0) return [];
        return resolvedAssets.fonts.map((f: any) => ({
            id: f._id || f.id,
            name: f.name,
            value: f.name,
            isCustom: f.isCustom as boolean | undefined,
            isDefault: f.isDefault as boolean | undefined,
            storageId: f.storageId as string | undefined,
            url: (f as any).url as string | undefined,
        } as { id: string; name: string; value: string; isCustom?: boolean; isDefault?: boolean; storageId?: string; url?: string }));
    })();

    // State
    const [pages, setPages] = useState<StoryPage[]>([]);
    const [currentPageIndex, setCurrentPageIndex] = useState(0);
    const [selectedMusicId, setSelectedMusicId] = useState<string | undefined>();
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);
    const [characterPickerOpen, setCharacterPickerOpen] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [selectedElement, setSelectedElement] = useState<"image" | "text" | null>(null);
    const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);

    const { isNigeria } = useCurrency();

    // Pricing
    const globalPricing = useQuery(api.pricing.list) || [];
    const multiImagePrice = globalPricing.find(p => p.category === 'multiImage')?.prices?.[isNigeria ? "ngn" : "usd"] || (isNigeria ? 500 : 0.49);

    // Refs
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const canvasAreaRef = useRef<HTMLDivElement>(null);
    const hasAppliedDefaultBackdrop = useRef(false);

    // Derived: active track for audio playback (must be before effects that use it)
    const activeMusicTrack = (resolvedAssets?.musicTracks || []).find((t: any) => (t._id || t.id) === selectedMusicId);

    // Contexts
    const { event, theme: legacyTheme } = useEventTheme();
    const currentTheme = activeEvent?.theme || legacyTheme;

    // Load fonts dynamically
    useEffect(() => {
        if (!availableFonts) return;

        // 1. Google Fonts
        const googleFonts = availableFonts.filter(f => !(f as any).isCustom);
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
        return (resolvedAssets?.characters || []).map((c: any) => c.url);
    })();

    // List only dynamic patterns from DB
    const availablePatterns = (() => {
        const dynamicPatterns = (resolvedAssets?.patterns as any[])?.map((p: any) => ({
            id: p.id,
            emoji: p.emojis?.[0] || "✨",
            name: p.name,
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
            // @ts-ignore - react-router-dom location state types are generic
            const state = location.state;
            const prefillPages = state?.prefillPages;
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

            // Find the default font to use as the initial font
            const defaultFontObj = availableFonts.find(f => f.isDefault);
            const initialFont = defaultFontObj?.value || "system-ui";

            setPages([createInitialPage(initialPrimary, initialSecondary, initialGlow, initialType, initialFont)]);
        }
    }, [pages.length, activeEvent, availableThemes, availableFonts, location.state]);

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

        // @ts-ignore
        const state = location.state;
        if (state?.fromTemplate) {
            console.log("Replacing history state without fromTemplate flag to prevent reload loop.");
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [pages.length, availableThemes, location, navigate]);


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
                // @ts-ignore
                const state = location.state;
                if (state?.fromTemplate) {
                    toast({
                        title: "Music error",
                        description: "Failed to load music track. It might be unavailable.",
                        variant: "destructive"
                    });
                }
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

    const bringPhotoToFront = useCallback((index: number) => {
        const page = pages[currentPageIndex];
        if (!page) return;

        const photos = page.photos && page.photos.length > 0
            ? [...page.photos]
            : (page.photoUrl ? [{
                id: "id-legacy",
                url: page.photoUrl,
                transform: page.imageTransform || { x: 0, y: 0, width: 128, rotation: 0 }
            }] : []);

        if (index < 0 || index >= photos.length) return;

        const [photo] = photos.splice(index, 1);
        photos.push(photo);

        updateCurrentPage({
            photos,
            // Clear legacy fields once we migrate to the new array
            photoUrl: undefined,
            imageTransform: undefined
        });

        // The photo is now at the last position
        setSelectedPhotoIndex(photos.length - 1);
        setSelectedElement("image");
    }, [pages, currentPageIndex, updateCurrentPage]);

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
    // task.md
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
            <main
                ref={canvasAreaRef}
                className="flex-1 px-10 relative overflow-hidden"
                onClick={() => {
                    console.log("Background clicked - deselecting");
                    setSelectedElement(null);
                    setSelectedPhotoIndex(null);
                }}
            >
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentPageIndex}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="absolute inset-0 flex flex-col items-center justify-center p-10"
                    >
                        {/* Photo Slot — Hidden/Ghost for layout spacing but Photos move to Absolute Inset */}
                        <div
                            className="flex justify-center mb-4 min-h-[160px] w-full relative z-10"
                        >
                            {(() => {
                                const photosCount = (currentPage.photos?.length || 0) + (currentPage.photoUrl ? 1 : 0);
                                return (
                                    <>
                                        {/* Add/Unlock Button */}
                                        {photosCount < 3 && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setCharacterPickerOpen(true);
                                                }}
                                                className={cn(
                                                    "w-32 h-32 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all overflow-hidden z-20 text-center px-2",
                                                    currentPage.type === 'dark'
                                                        ? "border-white/20 hover:border-white/40 text-white/40 hover:text-white/60"
                                                        : "border-zinc-900/20 hover:border-zinc-900/40 text-zinc-400 hover:text-zinc-600",
                                                    photosCount > 0 && "opacity-40 hover:opacity-100"
                                                )}
                                            >
                                                <ImageIcon className="w-8 h-8" />
                                                <span className="text-sm font-medium leading-tight">
                                                    {photosCount === 1 ? "Unlock 3 Characters" : "Add Photo"}
                                                </span>
                                            </button>
                                        )}
                                    </>
                                );
                            })()}
                        </div>

                        {/* Photos Layer - Now Absolute Inset to match StoryCanvas */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20 overflow-hidden">
                            {(() => {
                                const photos = currentPage.photos && currentPage.photos.length > 0
                                    ? currentPage.photos
                                    : (currentPage.photoUrl ? [{
                                        id: "id-legacy",
                                        url: currentPage.photoUrl,
                                        transform: currentPage.imageTransform || { x: 0, y: 0, width: 128, rotation: 0 }
                                    }] : []);

                                return photos.map((photo, idx) => (
                                    <div
                                        key={photo.id || idx}
                                        className="absolute inset-0 flex items-center justify-center pointer-events-none"
                                    >
                                        <ImageTransformEditor
                                            url={photo.url}
                                            transform={photo.transform}
                                            containerRef={canvasAreaRef} // Keep containerRef for now, ImageTransformEditor might still need it for calculations
                                            isSelected={selectedElement === "image" && selectedPhotoIndex === idx}
                                            onSelect={() => bringPhotoToFront(idx)}
                                            onUpdate={(newTransform) => {
                                                const updatedPhotos = [...photos];
                                                updatedPhotos[idx] = { ...photo, transform: newTransform };
                                                updateCurrentPage({
                                                    photos: updatedPhotos,
                                                    photoUrl: undefined,
                                                    imageTransform: undefined
                                                });
                                            }}
                                            onRemove={() => {
                                                const updatedPhotos = photos.filter((_, i) => i !== idx);
                                                updateCurrentPage({
                                                    photos: updatedPhotos.length > 0 ? updatedPhotos : undefined,
                                                    photoUrl: undefined,
                                                    imageTransform: undefined
                                                });
                                                setSelectedPhotoIndex(null);
                                                setSelectedElement(null);
                                            }}
                                        />
                                    </div>
                                ));
                            })()}
                        </div>

                        {/* Text Editor */}
                        <div className="w-full relative z-20 px-0">
                            {(() => {
                                const getFontSize = (length: number) => {
                                    if (length <= 30) return 'text-5xl sm:text-6xl';
                                    if (length <= 60) return 'text-4xl sm:text-5xl';
                                    if (length <= 100) return 'text-3xl sm:text-4xl';
                                    if (length <= 150) return 'text-2xl sm:text-3xl';
                                    return 'text-xl sm:text-2xl';
                                };

                                return (
                                    <textarea
                                        value={currentPage.text}
                                        onChange={(e) => {
                                            updateCurrentPage({ text: e.target.value.slice(0, 200) });
                                            e.target.style.height = 'auto';
                                            e.target.style.height = `${Math.max(60, Math.min(e.target.scrollHeight, 300))}px`;
                                        }}
                                        onFocus={(e) => {
                                            e.target.style.height = 'auto';
                                            e.target.style.height = `${Math.max(60, Math.min(e.target.scrollHeight, 300))}px`;
                                        }}
                                        placeholder="Tap to write..."
                                        className={cn(
                                            "bg-transparent font-medium leading-tight resize-none focus:outline-none w-full overflow-hidden",
                                            getFontSize(currentPage.text.length),
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
                                    />
                                );
                            })()}

                            {/* Progress Bar + Character Count */}
                            <div className="mt-3 flex items-center gap-2 w-full">
                                <div className={cn(
                                    "flex-1 h-0.5 rounded-full overflow-hidden",
                                    currentPage.type === 'dark' ? "bg-white/10" : "bg-zinc-900/10"
                                )}>
                                    <motion.div
                                        className={cn(
                                            "h-full rounded-full",
                                            (currentPage.text?.length || 0) / 200 > 0.9 ? 'bg-red-400' :
                                                (currentPage.text?.length || 0) / 200 > 0.7 ? 'bg-amber-400' :
                                                    currentPage.type === 'dark' ? 'bg-white/30' : 'bg-zinc-900/30'
                                        )}
                                        animate={{ width: `${Math.min((currentPage.text?.length || 0) / 200 * 100, 100)}%` }}
                                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                    />
                                </div>
                                <span className={cn(
                                    "text-xs font-mono shrink-0",
                                    (currentPage.text?.length || 0) / 200 > 0.9 ? 'text-red-400' :
                                        currentPage.type === 'dark' ? 'text-white/30' : 'text-zinc-500'
                                )}>
                                    {currentPage.text?.length || 0}/200
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
                        </div>
                    </motion.div>
                </AnimatePresence>

                {/* Right-Edge Page Navigation */}
                {pages.length > 1 && currentPageIndex < pages.length - 1 && (
                    <button
                        onClick={nextPage}
                        className={cn(
                            "absolute right-0 top-1/2 -translate-y-1/2 z-30 w-12 h-24 flex items-center justify-center transition-colors",
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
                            "absolute left-0 top-1/2 -translate-y-1/2 z-30 w-12 h-24 flex items-center justify-center transition-colors",
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
                    availablePatterns={availablePatterns}
                    availableFonts={availableFonts}
                    availableThemes={availableThemes}
                    availableMusic={availableMusic}
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
                onSelect={(url) => {
                    const photos = currentPage.photos && currentPage.photos.length > 0
                        ? [...currentPage.photos]
                        : (currentPage.photoUrl ? [{
                            id: "id-legacy",
                            url: currentPage.photoUrl,
                            transform: currentPage.imageTransform || { x: 0, y: 0, width: 128, rotation: 0 }
                        }] : []);

                    if (photos.length >= 3) return;

                    // Offset slightly if there are already photos
                    const offset = photos.length * 20;
                    const newPhoto = {
                        id: "img-" + Date.now(),
                        url,
                        transform: { x: offset, y: -100 + offset, width: 128, rotation: 0 }
                    };

                    photos.push(newPhoto);

                    updateCurrentPage({
                        photos,
                        photoUrl: undefined,
                        imageTransform: undefined
                    });

                    setSelectedPhotoIndex(photos.length - 1);
                    setSelectedElement("image");
                    setCharacterPickerOpen(false);
                }}
                selectedUrl={(() => {
                    if (selectedPhotoIndex !== null && currentPage.photos) {
                        return currentPage.photos[selectedPhotoIndex]?.url;
                    }
                    return currentPage.photoUrl;
                })()}
                photoCount={(() => {
                    const ps = currentPage.photos && currentPage.photos.length > 0
                        ? currentPage.photos
                        : (currentPage.photoUrl ? [1] : []);
                    return ps.length;
                })()}
                multiImagePrice={multiImagePrice}
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
