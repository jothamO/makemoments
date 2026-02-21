import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence, animate } from "framer-motion";
import { X } from "lucide-react";
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

        // Advance slide after duration
        slideTimerRef.current = setTimeout(() => {
            advanceSlide(index);
        }, durationMs);
    }, [advanceSlide]);

    // ── Kick off progress whenever currentIndex changes ──────
    useEffect(() => {
        if (!open || isPaused || !pages.length) return;
        startProgressBar(currentIndex, remainingRef.current);
        return () => {
            if (activeAnimRef.current) activeAnimRef.current.stop();
            if (slideTimerRef.current) clearTimeout(slideTimerRef.current);
        };
    }, [currentIndex, open, isPaused, startProgressBar, pages.length]);

    // ── Reset everything when opened / closed ────────────────
    useEffect(() => {
        if (open) {
            setCurrentIndex(0);
            setIsPaused(false);
            remainingRef.current = SLIDE_DURATION_MS;
            // Reset all bars
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

    // ── Pause logic (instant via onTouchStart / onMouseDown) ─
    const handlePause = useCallback(() => {
        if (isPaused) return;
        setIsPaused(true);
        pauseStartRef.current = performance.now();

        if (activeAnimRef.current) activeAnimRef.current.pause();
        if (slideTimerRef.current) clearTimeout(slideTimerRef.current);
        if (audioRef.current) audioRef.current.pause();
    }, [isPaused]);

    const handleResume = useCallback(() => {
        if (!isPaused) return;
        const pausedFor = performance.now() - pauseStartRef.current;
        remainingRef.current = Math.max(0, remainingRef.current - pausedFor);
        setIsPaused(false);

        if (activeAnimRef.current) activeAnimRef.current.play();
        if (audioRef.current) audioRef.current.play().catch(() => { });

        // Re-schedule the advance timer with the remaining time
        if (slideTimerRef.current) clearTimeout(slideTimerRef.current);
        slideTimerRef.current = setTimeout(() => {
            advanceSlide(currentIndex);
        }, remainingRef.current);
    }, [isPaused, currentIndex, advanceSlide]);

    // ── Tap navigation (left / right halves) ─────────────────
    const handleTap = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const isLeftHalf = x < rect.width / 2;

        if (isLeftHalf) {
            if (currentIndex > 0) {
                // Reset current bar
                const bar = progressBarRefs.current[currentIndex];
                if (bar) bar.style.width = "0%";
                remainingRef.current = SLIDE_DURATION_MS;
                setCurrentIndex((prev) => prev - 1);
            }
        } else {
            if (currentIndex < pages.length - 1) {
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

                    {/* ── Progress Bars ───────────────────────────── */}
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

                    {/* ── Close Button ────────────────────────────── */}
                    <button
                        onClick={onClose}
                        className="absolute top-5 right-4 z-30 p-2 bg-black/30 backdrop-blur-md rounded-full text-white hover:bg-black/50 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    {/* ── Slide Content ───────────────────────────── */}
                    <div
                        className="flex-1 relative cursor-pointer select-none"
                        onClick={handleTap}
                        onMouseDown={handlePause}
                        onMouseUp={handleResume}
                        onMouseLeave={handleResume}
                        onTouchStart={handlePause}
                        onTouchEnd={handleResume}
                    >
                        <AnimatePresence initial={false} mode="wait">
                            <motion.div
                                key={currentIndex}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 1.05 }}
                                transition={CONTENT_TRANSITION}
                                className="absolute inset-0 flex items-center justify-center"
                            >
                                <div className="text-center px-8 max-w-lg">
                                    {/* Photo — enters first */}
                                    {page.photoUrl && (
                                        <motion.img
                                            src={page.photoUrl}
                                            alt=""
                                            className="w-36 h-36 mx-auto rounded-3xl mb-8 shadow-2xl object-cover"
                                            initial={{ opacity: 0, y: 12 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ ...CONTENT_TRANSITION, delay: 0.0 }}
                                        />
                                    )}
                                    {/* Headline — enters second */}
                                    <motion.h1
                                        className="text-4xl md:text-5xl font-bold leading-tight"
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

                                {/* Stickers — staggered entrance */}
                                {page.stickers.map((s, idx) => (
                                    <motion.div
                                        key={idx}
                                        className="absolute text-5xl pointer-events-none select-none"
                                        style={{ left: `${s.x}%`, top: `${s.y}%` }}
                                        initial={{ opacity: 0, scale: 0.6 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ ...CONTENT_TRANSITION, delay: 0.15 + idx * 0.05 }}
                                    >
                                        {s.emoji}
                                    </motion.div>
                                ))}
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* ── Paused Indicator ────────────────────────── */}
                    <AnimatePresence>
                        {isPaused && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none"
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
