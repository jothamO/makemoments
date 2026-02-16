import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import type { StoryPage } from "@/data/types";

interface StoryPreviewPlayerProps {
    pages: StoryPage[];
    open: boolean;
    onClose: () => void;
}

const SLIDE_DURATION = 5000; // ms per slide

export function StoryPreviewPlayer({ pages, open, onClose }: StoryPreviewPlayerProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [progress, setProgress] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const animFrameRef = useRef<number | null>(null);
    const startTimeRef = useRef<number>(0);
    const pausedAtRef = useRef<number>(0);

    // Reset state when opened
    useEffect(() => {
        if (open) {
            setCurrentIndex(0);
            setProgress(0);
            setIsPaused(false);
            startTimeRef.current = performance.now();
            pausedAtRef.current = 0;
        } else {
            if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        }
    }, [open]);

    // Animation loop for progress
    const tick = useCallback(() => {
        if (!open || isPaused) return;

        const elapsed = performance.now() - startTimeRef.current;
        const fraction = Math.min(elapsed / SLIDE_DURATION, 1);
        setProgress(fraction);

        if (fraction >= 1) {
            // Advance to next slide or close
            if (currentIndex < pages.length - 1) {
                setCurrentIndex(prev => prev + 1);
                setProgress(0);
                startTimeRef.current = performance.now();
            } else {
                onClose();
                return;
            }
        }
        animFrameRef.current = requestAnimationFrame(tick);
    }, [open, isPaused, currentIndex, pages.length, onClose]);

    useEffect(() => {
        if (open && !isPaused) {
            animFrameRef.current = requestAnimationFrame(tick);
        }
        return () => {
            if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        };
    }, [open, isPaused, tick]);

    // Reset timer on slide change
    useEffect(() => {
        if (open) {
            startTimeRef.current = performance.now();
            setProgress(0);
        }
    }, [currentIndex, open]);

    // Handle tap navigation
    const handleTap = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const isLeftHalf = x < rect.width / 2;

        if (isLeftHalf) {
            // Go back
            if (currentIndex > 0) {
                setCurrentIndex(prev => prev - 1);
            }
        } else {
            // Go forward
            if (currentIndex < pages.length - 1) {
                setCurrentIndex(prev => prev + 1);
            } else {
                onClose();
            }
        }
    };

    // Pause on long press
    const handlePointerDown = () => {
        pausedAtRef.current = performance.now();
        setIsPaused(true);
    };

    const handlePointerUp = () => {
        if (isPaused) {
            // Adjust start time to account for pause duration
            const pauseDuration = performance.now() - pausedAtRef.current;
            startTimeRef.current += pauseDuration;
            setIsPaused(false);
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
                    className="fixed inset-0 z-[100] bg-black flex flex-col"
                >
                    {/* Progress Bars */}
                    <div className="flex gap-1 px-3 pt-4 pb-2 z-20">
                        {pages.map((_, i) => (
                            <div key={i} className="flex-1 h-[3px] bg-white/20 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-white rounded-full"
                                    style={{
                                        width:
                                            i < currentIndex
                                                ? "100%"
                                                : i === currentIndex
                                                    ? `${progress * 100}%`
                                                    : "0%",
                                    }}
                                />
                            </div>
                        ))}
                    </div>

                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-5 right-4 z-30 p-2 bg-black/30 backdrop-blur-md rounded-full text-white hover:bg-black/50 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    {/* Slide Content */}
                    <div
                        className="flex-1 relative cursor-pointer select-none"
                        onClick={handleTap}
                        onPointerDown={handlePointerDown}
                        onPointerUp={handlePointerUp}
                        onPointerLeave={handlePointerUp}
                    >
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentIndex}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="absolute inset-0 flex items-center justify-center"
                                style={{
                                    background: `linear-gradient(135deg, ${page.bgGradientStart}, ${page.bgGradientEnd})`,
                                }}
                            >
                                <div className="text-center px-8 max-w-lg">
                                    {page.photoUrl && (
                                        <img
                                            src={page.photoUrl}
                                            alt=""
                                            className="w-36 h-36 mx-auto rounded-3xl mb-8 shadow-2xl object-cover"
                                        />
                                    )}
                                    <h1
                                        className="text-4xl md:text-5xl font-bold leading-tight"
                                        style={{
                                            fontFamily: page.fontFamily,
                                            color: page.textColor || "#FFFFFF",
                                        }}
                                    >
                                        {page.text || ""}
                                    </h1>
                                </div>

                                {/* Stickers */}
                                {page.stickers.map((s, idx) => (
                                    <div
                                        key={idx}
                                        className="absolute text-5xl pointer-events-none select-none"
                                        style={{ left: `${s.x}%`, top: `${s.y}%` }}
                                    >
                                        {s.emoji}
                                    </div>
                                ))}
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Paused Indicator */}
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
                </motion.div>
            )}
        </AnimatePresence>
    );
}
