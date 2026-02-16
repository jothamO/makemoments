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
import { StoryPreviewPlayer } from "@/components/editor/StoryPreviewPlayer";

// ---------------------------------------------------------------------------
// Constants & Types
// ---------------------------------------------------------------------------
const COLOR_THEMES = [
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

const FONT_OPTIONS = [
    { name: "Default", value: "Poppins" },
    { name: "Elegant", value: "Playfair Display" },
    { name: "Handwritten", value: "Dancing Script" },
    { name: "Playful", value: "Pacifico" },
    { name: "Modern", value: "Montserrat" },
    { name: "Romantic", value: "Playfair Display" },
    { name: "Dancing", value: "Dancing Script" },
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
            <main className="flex-1 relative flex items-center justify-center p-6">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentPageIndex}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
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

                            {/* Character Count Above Separator */}
                            <div className="flex justify-end pr-1 mb-1">
                                <span className="text-[10px] font-medium text-gray-500/60 tabular-nums uppercase tracking-widest">
                                    {currentPage.text.length} / 200
                                </span>
                            </div>

                            {/* Separator Line */}
                            <div className="w-full h-[1px] bg-gray-500/20" />
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
            <div className="flex items-center justify-center py-3 gap-2">
                {pages.map((_, i) => (
                    <button
                        key={i}
                        onClick={() => setCurrentPageIndex(i)}
                        className={cn(
                            "rounded-full transition-all duration-300",
                            i === currentPageIndex ? "w-3 h-3 bg-black" : "w-2.5 h-2.5 bg-gray-400/50"
                        )}
                    />
                ))}
                <button
                    onClick={addPage}
                    className="w-5 h-5 rounded-full border-2 border-dashed border-gray-400/50 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:border-gray-500 transition-colors"
                >
                    <Plus className="w-3 h-3" />
                </button>
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
                            className={cn(
                                "absolute bottom-full mb-4 bg-zinc-900/95 backdrop-blur-2xl rounded-3xl shadow-2xl z-50 border border-white/10",
                                activePicker === "theme" ? "p-4 min-w-[300px]" : "p-2"
                            )}
                        >
                            {activePicker === "theme" && (
                                <>
                                    <p className="text-[10px] uppercase tracking-widest text-white/40 font-semibold mb-3 px-2">Theme</p>
                                    <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                                        {COLOR_THEMES.map(ct => (
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
                                    {FONT_OPTIONS.map(font => (
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

                            <button onClick={() => setActivePicker(null)} className="absolute top-3 right-3 p-1.5 text-white/30 hover:text-white rounded-lg transition-colors">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="flex items-center gap-3">
                    <ToolbarIcon icon={<Palette className="w-5 h-5" />} onClick={() => setActivePicker(activePicker === "theme" ? null : "theme")} active={activePicker === "theme"} />
                    <ToolbarIcon icon={<span className="font-serif text-lg italic">F</span>} onClick={() => setActivePicker(activePicker === "font" ? null : "font")} active={activePicker === "font"} />
                    <ToolbarIcon icon={ALIGN_OPTIONS.find(o => o.id === currentPage.textAlign)?.icon || <AlignCenter className="w-5 h-5" />} onClick={() => setActivePicker(activePicker === "align" ? null : "align")} active={activePicker === "align"} />
                    <ToolbarIcon icon={<Music className="w-5 h-5" />} onClick={() => setActivePicker(activePicker === "music" ? null : "music")} active={activePicker === "music"} />
                    <ToolbarIcon icon={<StarIcon className="w-5 h-5" />} onClick={() => setActivePicker(activePicker === "stickers" ? null : "stickers")} active={activePicker === "stickers"} />
                </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex gap-3 px-4 pb-8 pt-4 safe-area-bottom">
                <button
                    onClick={() => setIsPreviewOpen(true)}
                    className={cn(
                        "flex-1 py-4 rounded-2xl flex items-center justify-center gap-2 font-semibold transition-all shadow-xl active:scale-95",
                        hasContent
                            ? "bg-zinc-800 text-white hover:bg-zinc-900"
                            : "bg-white/10 backdrop-blur-md border border-white/10 text-white/40 shadow-none"
                    )}
                >
                    <Play className="w-5 h-5 fill-current" />
                    Preview
                </button>
                <button
                    onClick={() => setIsPaymentOpen(true)}
                    className={cn(
                        "flex-1 py-4 rounded-2xl flex items-center justify-center gap-2 font-semibold transition-all shadow-xl active:scale-95",
                        hasContent
                            ? "bg-zinc-900 text-white hover:bg-black"
                            : "bg-white/10 backdrop-blur-md border border-white/10 text-white/40 shadow-none"
                    )}
                >
                    <Send className="w-5 h-5" />
                    Publish
                </button>
            </div>

            {/* MODALS */}
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
                "w-10 h-10 rounded-xl flex items-center justify-center transition-all transform active:scale-90",
                active ? "bg-gray-900 text-white" : "bg-gray-800/90 text-white/80 hover:bg-gray-900 hover:text-white"
            )}
        >
            {icon}
        </button>
    );
}
