import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowLeft,
    Image as ImageIcon,
    Type,
    Palette,
    Play,
    Send,
    X,
    Plus,
    Trash2,
    ChevronLeft,
    ChevronRight,
    Music,
    Star as StarIcon,
    AlignLeft,
    AlignCenter,
    AlignRight,
    Check,
} from "lucide-react";
import { useEventTheme } from "@/contexts/ThemeContext";
import { getTemplatesByEvent, getAllMusic } from "@/data/data-service";
import type { Template, StoryPage, EventTheme, MusicTrack } from "@/data/types";
import { cn } from "@/lib/utils";
import { PaymentModal } from "@/components/PaymentModal";

// ---------------------------------------------------------------------------
// Constants & Types
// ---------------------------------------------------------------------------
const COLOR_THEMES = [
    { name: "default", primary: "#FF4081", secondary: "#FF8C7A" },
    { name: "purple", primary: "#9C27B0", secondary: "#E1BEE7" },
    { name: "blue", primary: "#2196F3", secondary: "#90CAF9" },
    { name: "green", primary: "#4CAF50", secondary: "#A5D6A7" },
    { name: "orange", primary: "#FF9800", secondary: "#FFCC80" },
    { name: "teal", primary: "#009688", secondary: "#80CBC4" },
];

const FONT_OPTIONS = [
    { name: "Elegant", value: "Playfair Display" },
    { name: "Modern", value: "Montserrat" },
    { name: "Playful", value: "Pacifico" },
    { name: "Bold", value: "Bebas Neue" },
];

const ALIGN_OPTIONS = [
    { id: "left", icon: <AlignLeft className="w-4 h-4" /> },
    { id: "center", icon: <AlignCenter className="w-4 h-4" /> },
    { id: "right", icon: <AlignRight className="w-4 h-4" /> },
];

const STICKER_OPTIONS = ["❤️", "✨", "🎉", "🔥", "🌸", "👑", "🎂", "🎈"];

const createInitialPage = (theme: EventTheme): StoryPage => ({
    id: `page-${Math.random().toString(36).slice(2, 9)}`,
    text: "",
    fontFamily: "Playfair Display",
    fontSize: "medium",
    textAlign: "center",
    textColor: "#FFFFFF",
    bgGradientStart: theme.bgGradientStart,
    bgGradientEnd: theme.bgGradientEnd,
    transition: "fade",
    stickers: [],
});

// ===========================================================================
// Main CreatePage
// ===========================================================================
export default function CreatePage() {
    const { event, theme } = useEventTheme();
    const navigate = useNavigate();
    const musicTracks = getAllMusic();

    // State
    const [pages, setPages] = useState<StoryPage[]>([]);
    const [currentPageIndex, setCurrentPageIndex] = useState(0);
    const [activePicker, setActivePicker] = useState<string | null>(null);
    const [selectedMusicId, setSelectedMusicId] = useState<string | undefined>();

    // Modals
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Initialize first page
    useEffect(() => {
        if (theme && pages.length === 0) {
            setPages([createInitialPage(theme)]);
        }
    }, [theme, pages.length]);

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
        if (!theme) return;
        const newPage = createInitialPage(theme);
        setPages((prev) => [...prev, newPage]);
        setCurrentPageIndex(pages.length);
    };

    const deletePage = () => {
        if (pages.length <= 1) return;
        const newIndex = Math.max(0, currentPageIndex - 1);
        setPages((prev) => prev.filter((_, i) => i !== currentPageIndex));
        setCurrentPageIndex(newIndex);
    };

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => updateCurrentPage({ photoUrl: reader.result as string });
            reader.readAsDataURL(file);
        }
    };

    const nextPage = () => setCurrentPageIndex((prev) => Math.min(prev + 1, pages.length - 1));
    const prevPage = () => setCurrentPageIndex((prev) => Math.max(prev - 1, 0));

    // -----------------------------------------------------------------------
    // Derived State / Utils
    // -----------------------------------------------------------------------
    if (!event || !theme || !currentPage) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const hasContent = pages.some(p => p.photoUrl || p.text.trim().length > 0);
    const btnColorClass = hasContent ? "bg-black text-white" : "bg-gray-400/50 text-white/50";

    // -----------------------------------------------------------------------
    // Render
    // -----------------------------------------------------------------------
    return (
        <div
            className="fixed inset-0 flex flex-col overflow-hidden transition-colors duration-500"
            style={{
                background: `linear-gradient(135deg, ${currentPage.bgGradientStart}, ${currentPage.bgGradientEnd})`,
            }}
        >
            {/* HEADER */}
            <header className="flex items-center justify-between px-6 py-4 z-40">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-700/60 hover:text-gray-900 transition-colors">
                    <ArrowLeft className="w-6 h-6" />
                </button>

                <div className="text-sm font-medium text-gray-500/80">
                    {currentPageIndex + 1} / {pages.length}
                </div>

                <button
                    onClick={deletePage}
                    disabled={pages.length <= 1}
                    className={cn(
                        "p-2 -mr-2 transition-all",
                        pages.length > 1 ? "text-gray-700/60 hover:text-red-500" : "opacity-0 pointer-events-none"
                    )}
                >
                    <Trash2 className="w-5 h-5" />
                </button>
            </header>

            {/* CANVAS AREA */}
            <main className="flex-1 relative flex items-center justify-center p-6 bg-black/5">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentPageIndex}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="w-full max-w-lg aspect-[4/5] flex flex-col items-center justify-center text-center px-4"
                    >
                        {/* Photo Slot */}
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className={cn(
                                "w-28 h-28 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all hover:scale-105 active:scale-95 mb-8 overflow-hidden",
                                currentPage.photoUrl ? "border-transparent" : "border-gray-500/30 bg-white/5"
                            )}
                        >
                            {currentPage.photoUrl ? (
                                <img src={currentPage.photoUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <>
                                    <ImageIcon className="w-8 h-8 text-gray-400 mb-1" />
                                    <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Add Photo</span>
                                </>
                            )}
                        </div>
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoUpload} />

                        {/* Text Editor */}
                        <div className="w-full px-4 relative">
                            <textarea
                                value={currentPage.text}
                                onChange={(e) => updateCurrentPage({ text: e.target.value.slice(0, 200) })}
                                placeholder="Tap to write..."
                                className="w-full bg-transparent border-none outline-none resize-none text-center text-4xl md:text-5xl font-semibold placeholder:text-gray-400/60 leading-tight"
                                style={{
                                    fontFamily: currentPage.fontFamily,
                                    color: currentPage.textColor,
                                    minHeight: "120px"
                                }}
                                rows={3}
                            />

                            {/* Separator Line */}
                            <div className="w-full h-[1px] bg-gray-500/20 mt-4 relative">
                                <span className="absolute right-0 -top-6 text-[10px] font-bold text-gray-400 tracking-widest uppercase">
                                    {currentPage.text.length} / 200
                                </span>
                            </div>
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

                {/* Navigation Arrows (All devices) */}
                {currentPageIndex > 0 && (
                    <button
                        onClick={prevPage}
                        className="absolute left-2 top-1/2 -translate-y-1/2 p-4 text-white/40 hover:text-white transition-colors"
                    >
                        <ChevronLeft className="w-8 h-8" />
                    </button>
                )}
                {currentPageIndex < pages.length - 1 && (
                    <button
                        onClick={nextPage}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-4 text-white/40 hover:text-white transition-colors"
                    >
                        <ChevronRight className="w-8 h-8" />
                    </button>
                )}
            </main>

            {/* PAGE DOTS & NAVIGATION */}
            <div className="flex items-center justify-center pb-4 py-2">
                <div className="flex items-center gap-1.5 px-3 py-2 bg-black/10 backdrop-blur-md rounded-full shadow-inner">
                    {pages.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setCurrentPageIndex(i)}
                            className={cn(
                                "w-2.5 h-2.5 rounded-full transition-all duration-300",
                                i === currentPageIndex ? "bg-black w-6" : "bg-gray-400/60"
                            )}
                        />
                    ))}
                    <button
                        onClick={addPage}
                        className="w-5 h-5 flex items-center justify-center text-gray-500 hover:text-black transition-colors ml-1"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* FLOATING TOOLBAR */}
            <div className="relative h-20 flex items-center justify-center mb-4 px-6">
                {/* Inline Pickers (Popovers) */}
                <AnimatePresence>
                    {activePicker && (
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute bottom-full mb-4 bg-black/95 backdrop-blur-xl p-2 rounded-2xl flex items-center gap-2 shadow-2xl z-50 border border-white/10"
                        >
                            {activePicker === "theme" && COLOR_THEMES.map(ct => (
                                <button
                                    key={ct.name}
                                    onClick={() => {
                                        updateCurrentPage({ bgGradientStart: ct.primary, bgGradientEnd: ct.secondary });
                                        setActivePicker(null);
                                    }}
                                    className="w-8 h-8 rounded-full border border-white/20 transition-transform active:scale-90"
                                    style={{ background: `linear-gradient(135deg, ${ct.primary}, ${ct.secondary})` }}
                                />
                            ))}

                            {activePicker === "font" && FONT_OPTIONS.map(font => (
                                <button
                                    key={font.name}
                                    onClick={() => {
                                        updateCurrentPage({ fontFamily: font.value });
                                        setActivePicker(null);
                                    }}
                                    className="px-3 py-1.5 text-white whitespace-nowrap text-xs font-semibold hover:bg-white/10 rounded-lg transition-colors"
                                    style={{ fontFamily: font.value }}
                                >
                                    {font.name}
                                </button>
                            ))}

                            {activePicker === "align" && ALIGN_OPTIONS.map(opt => (
                                <button
                                    key={opt.id}
                                    onClick={() => {
                                        updateCurrentPage({ textAlign: opt.id as any });
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

                            {activePicker === "music" && (
                                <div className="space-y-1 max-h-48 overflow-y-auto p-1 min-w-[160px]">
                                    {musicTracks.map(track => (
                                        <button
                                            key={track.id}
                                            onClick={() => {
                                                setSelectedMusicId(track.id);
                                                setActivePicker(null);
                                            }}
                                            className={cn(
                                                "w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-between",
                                                selectedMusicId === track.id ? "bg-white/20 text-white" : "text-white/60 hover:bg-white/10"
                                            )}
                                        >
                                            <div className="truncate pr-4">
                                                <div className="truncate">{track.name}</div>
                                                <div className="opacity-40 text-[10px]">{track.artist}</div>
                                            </div>
                                            {selectedMusicId === track.id && <Check className="w-3 h-3" />}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {activePicker === "stickers" && (
                                <div className="grid grid-cols-4 gap-1 p-1">
                                    {STICKER_OPTIONS.map(emoji => (
                                        <button
                                            key={emoji}
                                            onClick={() => {
                                                const newSticker = { emoji, x: 20 + Math.random() * 60, y: 10 + Math.random() * 20 };
                                                updateCurrentPage({ stickers: [...currentPage.stickers, newSticker] });
                                                setActivePicker(null);
                                            }}
                                            className="w-10 h-10 flex items-center justify-center text-xl hover:bg-white/10 rounded-lg transition-colors"
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                            )}

                            <button onClick={() => setActivePicker(null)} className="p-2 ml-2 text-white/40 hover:text-white border-l border-white/10">
                                <X className="w-4 h-4" />
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="bg-black/95 backdrop-blur-2xl px-6 py-3 rounded-2xl flex items-center gap-8 shadow-2xl border border-white/10">
                    <ToolbarIcon icon={<Palette className="w-5 h-5" />} onClick={() => setActivePicker(activePicker === "theme" ? null : "theme")} active={activePicker === "theme"} />
                    <ToolbarIcon icon={<span className="font-serif text-lg">F</span>} onClick={() => setActivePicker(activePicker === "font" ? null : "font")} active={activePicker === "font"} />
                    <ToolbarIcon icon={ALIGN_OPTIONS.find(o => o.id === currentPage.textAlign)?.icon || <AlignCenter className="w-5 h-5" />} onClick={() => setActivePicker(activePicker === "align" ? null : "align")} active={activePicker === "align"} />
                    <ToolbarIcon icon={<Music className="w-5 h-5" />} onClick={() => setActivePicker(activePicker === "music" ? null : "music")} active={activePicker === "music"} />
                    <ToolbarIcon icon={<StarIcon className="w-5 h-5" />} onClick={() => setActivePicker(activePicker === "stickers" ? null : "stickers")} active={activePicker === "stickers"} />
                </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="grid grid-cols-2 gap-3 px-6 pb-8">
                <button
                    onClick={() => setIsPreviewOpen(true)}
                    className={cn(
                        "flex items-center justify-center gap-2 py-4 rounded-3xl font-bold transition-all duration-500",
                        btnColorClass
                    )}
                >
                    <Play className="w-4 h-4 fill-current" /> Preview
                </button>
                <button
                    onClick={() => setIsPaymentOpen(true)}
                    className={cn(
                        "flex items-center justify-center gap-2 py-4 rounded-3xl font-bold transition-all duration-500 shadow-lg",
                        btnColorClass
                    )}
                >
                    <Send className="w-4 h-4 fill-current" /> Publish
                </button>
            </div>

            {/* MODALS */}
            <PaymentModal
                open={isPaymentOpen}
                onClose={() => setIsPaymentOpen(false)}
                event={event}
                template={{ id: "direct-tpl", name: "Custom Story" } as any}
                pages={pages}
                musicTrackId={selectedMusicId}
            />

            {/* FULLSCREEN PREVIEW OVERLAY */}
            <AnimatePresence>
                {isPreviewOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black"
                    >
                        <button
                            onClick={() => setIsPreviewOpen(false)}
                            className="absolute top-6 right-6 z-[110] p-2 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-black/60 transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        <div className="w-full h-full flex items-center justify-center">
                            <p className="text-white/40 font-medium">Previewing your story...</p>
                            {/* Simplified preview loop or just one page for now */}
                            <div
                                className="absolute inset-0 flex items-center justify-center"
                                style={{ background: `linear-gradient(135deg, ${currentPage.bgGradientStart}, ${currentPage.bgGradientEnd})` }}
                            >
                                <div className="text-center">
                                    {currentPage.photoUrl && <img src={currentPage.photoUrl} className="w-40 h-40 mx-auto rounded-3xl mb-8 shadow-2xl" />}
                                    <h1 className="text-5xl font-bold px-12" style={{ fontFamily: currentPage.fontFamily, color: currentPage.textColor }}>
                                        {currentPage.text || "Your message here"}
                                    </h1>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style>{`
        header, main, footer { user-select: none; }
        textarea::placeholder { color: rgba(156, 163, 175, 0.4); }
        textarea:focus { box-shadow: none; }
      `}</style>
        </div>
    );
}

function ToolbarIcon({ icon, onClick, active }: { icon: React.ReactNode; onClick: () => void; active?: boolean }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "text-white/60 hover:text-white transition-all transform active:scale-90",
                active && "text-white"
            )}
        >
            {icon}
        </button>
    );
}
