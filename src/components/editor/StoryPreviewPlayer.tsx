import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence, animate } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { StoryPage, MusicTrack } from "@/data/types";
import { hexToRgba, cn } from "@/lib/utils";
import { BackgroundPattern } from "@/components/BackgroundPattern";
import {
    EXPRESSIVE_EASE,
    CONTENT_TRANSITION,
    SLIDE_DURATION_MS,
} from "@/lib/animation";

interface StoryPreviewPlayerProps {
    pages: StoryPage[];
    open: boolean;
    onClose: () => void;
    musicTrack?: MusicTrack;
}

export function StoryPreviewPlayer({ pages, open, onClose, musicTrack }: StoryPreviewPlayerProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // ── JS-driven progress bar refs ──────────────────────────
    const progressBarRefs = useRef<(HTMLDivElement | null)[]>([]);
    const activeAnimRef = useRef<ReturnType<typeof animate> | null>(null);
    const slideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pauseStartRef = useRef<number>(0);
    const slideStartTimeRef = useRef<number>(0);
    const remainingRef = useRef<number>(SLIDE_DURATION_MS);

    // ── Advance to next slide or loop ────────────────────────
    const advanceSlide = useCallback((fromIndex: number) => {
        const nextIndex = (fromIndex + 1) % pages.length;

        // Mark the completed bar at 100%
        const completedBar = progressBarRefs.current[fromIndex];
        if (completedBar) completedBar.style.width = "100%";

        if (nextIndex === 0 && audioRef.current) {
            // Looped — restart music
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(() => { });
            // Reset all bars
            progressBarRefs.current.forEach((b) => {
                if (b) b.style.width = "0%";
            });
        }

        setCurrentIndex(nextIndex);
        remainingRef.current = SLIDE_DURATION_MS;
    }, [pages.length]);

    // ── Start a progress bar fill for the given slide ────────
    const startProgressBar = useCallback((index: number, durationMs: number) => {
        // Stop any previous animation
        if (activeAnimRef.current) {
            activeAnimRef.current.stop();
        }
        if (slideTimerRef.current) {
            clearTimeout(slideTimerRef.current);
        }

        const bar = progressBarRefs.current[index];
        if (!bar) return;

        // Get current width percentage as starting point
        const currentWidth = bar.style.width ? parseFloat(bar.style.width) / 100 : 0;

        // Use Framer's animate() on a DOM ref for frame-accurate, pausable progress
        activeAnimRef.current = animate(currentWidth, 1, {
            duration: durationMs / 1000,
            ease: "linear",
            onUpdate: (v) => {
                bar.style.width = `${v * 100}%`;
            },
        });

        remainingRef.current = durationMs;
        slideStartTimeRef.current = performance.now();

        // Advance slide after duration
        slideTimerRef.current = setTimeout(() => {
            advanceSlide(index);
        }, durationMs);
    }, [advanceSlide]);

    // ── Kick off progress whenever currentIndex changes ──────
    useEffect(() => {
        if (!open || !pages.length) return;
        if (isPaused) return;

        startProgressBar(currentIndex, remainingRef.current);
        return () => {
            if (activeAnimRef.current) activeAnimRef.current.stop();
            if (slideTimerRef.current) clearTimeout(slideTimerRef.current);
        };
    }, [currentIndex, open, startProgressBar, pages.length, isPaused]);

    // ── Reset everything when opened / closed ────────────────
    useEffect(() => {
        if (open) {
            setCurrentIndex(0);
            setIsPaused(false);
            remainingRef.current = SLIDE_DURATION_MS;
            progressBarRefs.current.forEach((b) => {
                if (b) b.style.width = "0%";
            });
            if (audioRef.current) {
                audioRef.current.currentTime = 0;
                audioRef.current.play().catch((e) => console.log("Preview audio blocked:", e));
            }
        } else {
            if (activeAnimRef.current) activeAnimRef.current.stop();
            if (slideTimerRef.current) clearTimeout(slideTimerRef.current);
            if (audioRef.current) audioRef.current.pause();
        }
    }, [open]);

    // ── Pause logic ──────────────────────────────────────────
    const handlePause = useCallback(() => {
        if (isPaused) return;
        setIsPaused(true);
        const elapsed = performance.now() - slideStartTimeRef.current;
        remainingRef.current = Math.max(0, remainingRef.current - elapsed);

        if (activeAnimRef.current) activeAnimRef.current.pause();
        if (slideTimerRef.current) clearTimeout(slideTimerRef.current);
        if (audioRef.current) audioRef.current.pause();
    }, [isPaused]);

    const handleResume = useCallback(() => {
        if (!isPaused) return;
        setIsPaused(false);
        slideStartTimeRef.current = performance.now();

        if (activeAnimRef.current) activeAnimRef.current.play();
        if (audioRef.current) audioRef.current.play().catch(() => { });

        if (slideTimerRef.current) clearTimeout(slideTimerRef.current);
        slideTimerRef.current = setTimeout(() => {
            advanceSlide(currentIndex);
        }, remainingRef.current);
    }, [isPaused, currentIndex, advanceSlide]);

    // ── Tap navigation ───────────────────────────────────────
    const handleTap = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const isLeftHalf = x < rect.width / 2;

        if (isLeftHalf) {
            if (currentIndex > 0) {
                if (activeAnimRef.current) activeAnimRef.current.stop();
                if (slideTimerRef.current) clearTimeout(slideTimerRef.current);
                const bar = progressBarRefs.current[currentIndex];
                if (bar) bar.style.width = "0%";
                remainingRef.current = SLIDE_DURATION_MS;
                setCurrentIndex((prev) => prev - 1);
            }
        } else {
            if (currentIndex < pages.length - 1) {
                if (activeAnimRef.current) activeAnimRef.current.stop();
                if (slideTimerRef.current) clearTimeout(slideTimerRef.current);
                const bar = progressBarRefs.current[currentIndex];
                if (bar) bar.style.width = "100%";
                remainingRef.current = SLIDE_DURATION_MS;
                setCurrentIndex((prev) => prev + 1);
            } else {
                onClose();
            }
        }
    };

    if (!open || pages.length === 0) return null;

    const page = pages[currentIndex];

    // Helper for dynamic font size
    const getFontSize = (length: number) => {
        if (length <= 30) return 'text-5xl sm:text-6xl';
        if (length <= 60) return 'text-4xl sm:text-5xl';
        if (length <= 100) return 'text-3xl sm:text-4xl';
        if (length <= 150) return 'text-2xl sm:text-3xl';
        return 'text-xl sm:text-2xl';
    };

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex flex-col story-viewer"
                    style={{
                        backgroundColor: page.bgGradientStart,
                        backgroundImage: `radial-gradient(circle at 50% 0%, ${hexToRgba(page.glowColor || "#ffffff", page.type === 'dark' ? 0.4 : 0.25)}, transparent 70%)`,
                        transition: "background-color 0.5s, background-image 0.5s",
                    }}
                >
                    {page.backgroundPattern && (
                        <BackgroundPattern patternId={page.backgroundPattern} />
                    )}

                    {/* ── Progress Bars ───────────────────── */}
                    <div className="flex gap-1 px-3 pt-4 pb-2 z-20">
                        {pages.map((_, i) => (
                            <div
                                key={i}
                                className={cn(
                                    "flex-1 h-[3px] rounded-full overflow-hidden",
                                    page.type === 'dark' ? "bg-white/20" : "bg-black/10"
                                )}
                            >
                                <div
                                    ref={(el) => { progressBarRefs.current[i] = el; }}
                                    className={cn(
                                        "h-full rounded-full",
                                        page.type === 'dark' ? "bg-white" : "bg-black"
                                    )}
                                    style={{
                                        width: i < currentIndex ? "100%" : "0%",
                                    }}
                                />
                            </div>
                        ))}
                    </div>

                    {/* ── Close Button ────────────────────── */}
                    <button
                        onClick={onClose}
                        className="absolute top-12 right-4 z-50 flex items-center gap-1 px-3 py-1.5 bg-black/30 backdrop-blur-md rounded-full text-white/90 hover:bg-black/50 hover:text-white transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5 -ml-1" />
                        <span className="text-sm font-medium pr-1">Back to editor</span>
                    </button>

                    {/* ── Slide Content ───────────────────── */}
                    <div
                        className="flex-1 relative cursor-pointer select-none"
                        onClick={handleTap}
                        onMouseDown={handlePause}
                        onMouseUp={handleResume}
                        onMouseLeave={handleResume}
                        onTouchStart={handlePause}
                        onTouchEnd={handleResume}
                    >
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentIndex}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 1.05 }}
                                transition={CONTENT_TRANSITION}
                                className="absolute inset-0"
                            >
                                {/* Master Layout Container — mathematically synced to CreatePage <main> dimensions (48px top chrome, 188px bottom chrome) */}
                                <div className="absolute inset-0 flex flex-col pt-[48px] pb-[188px] pointer-events-none">
                                    <div className="flex-1 relative flex flex-col items-center justify-center w-full">

                                        {/* Text Layout Layer */}
                                        <div className="absolute inset-0 flex flex-col items-center justify-center p-10 pointer-events-none">
                                            {/* Spacer block to maintain layout parity with Create editor */}
                                            <div className="flex justify-center mb-4 min-h-[160px] w-full relative z-10" />

                                            <div className="text-center w-full z-20 flex items-start justify-center min-h-[60px]">
                                                <motion.h1
                                                    className={cn(
                                                        "font-medium leading-tight",
                                                        getFontSize(page.text?.length || 0)
                                                    )}
                                                    style={{
                                                        fontFamily: page.fontFamily,
                                                        color: page.textColor || "#FFFFFF",
                                                    }}
                                                    initial={{ opacity: 0, y: 16 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ ...CONTENT_TRANSITION, delay: 0.1 }}
                                                >
                                                    {page.text || ""}
                                                </motion.h1>
                                            </div>

                                            {/* Ghost Progress Bar for identical flex-col vertical centering */}
                                            <div className="mt-3 flex items-center gap-2 w-full opacity-0 select-none">
                                                <div className="flex-1 h-0.5" />
                                                <span className="text-xs font-mono shrink-0">0/200</span>
                                            </div>
                                        </div>

                                        {/* Characters / Photos Layer */}
                                        {page.photos && page.photos.length > 0 && (
                                            <div className="absolute inset-0 z-10 overflow-hidden pointer-events-none">
                                                {page.photos.map((photo, i) => (
                                                    <div
                                                        key={photo.id || i}
                                                        className="absolute inset-0 flex items-center justify-center"
                                                    >
                                                        <motion.div
                                                            initial={{ opacity: 0, scale: 0.95 }}
                                                            animate={{
                                                                opacity: 1,
                                                                scale: 1,
                                                                x: photo.transform.x,
                                                                y: photo.transform.y,
                                                                rotate: photo.transform.rotation,
                                                            }}
                                                            transition={{
                                                                ...CONTENT_TRANSITION,
                                                                delay: 0.05 + i * 0.05,
                                                            }}
                                                            style={{
                                                                width: photo.transform.width,
                                                                height: photo.transform.width,
                                                            }}
                                                            className="pointer-events-auto"
                                                        >
                                                            <img src={photo.url} alt="" className="w-full h-full object-cover" />
                                                        </motion.div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Stickers */}
                                        {page.stickers.map((s, idx) => (
                                            <motion.div
                                                key={idx}
                                                className="absolute text-5xl pointer-events-none select-none z-20"
                                                style={{ left: `${s.x}%`, top: `${s.y}%` }}
                                                initial={{ opacity: 0, scale: 0.6 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ ...CONTENT_TRANSITION, delay: 0.15 + idx * 0.05 }}
                                            >
                                                {s.emoji}
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        </AnimatePresence>

                        {/* Pause Overlay */}
                        <AnimatePresence>
                            {isPaused && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none"
                                >
                                    <div className="w-16 h-16 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center">
                                        <div className="flex gap-1.5">
                                            <div className="w-2 h-7 bg-white rounded-sm" />
                                            <div className="w-2 h-7 bg-white rounded-sm" />
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {musicTrack?.url && (
                        <audio
                            ref={audioRef}
                            src={musicTrack.url}
                            loop={false}
                        />
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
}
