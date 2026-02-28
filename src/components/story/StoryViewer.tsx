import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence, animate } from "framer-motion";
import type { StoryPage, SlideTransition, MusicTrack } from "@/data/types";
import { Link } from "react-router-dom";
import { hexToRgba, cn, getBrandRadialGradient } from "@/lib/utils";
import { BackgroundPattern } from "@/components/BackgroundPattern";
import { CONTENT_TRANSITION } from "@/lib/animation";

const transitionVariants: Record<SlideTransition, { initial: Record<string, number | string>; animate: Record<string, number | string>; exit: Record<string, number | string> }> = {
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  slide: {
    initial: { x: "100%", opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: "-100%", opacity: 0 },
  },
  zoom: {
    initial: { scale: 0.8, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.8, opacity: 0 },
  },
  flip: {
    initial: { rotateY: 90, opacity: 0 },
    animate: { rotateY: 0, opacity: 1 },
    exit: { rotateY: -90, opacity: 0 },
  },
};

// Dynamic font size helper — identical to StoryPreviewPlayer & StoryCanvas
const getFontSize = (length: number) => {
  if (length <= 30) return 'text-5xl sm:text-6xl';
  if (length <= 60) return 'text-4xl sm:text-5xl';
  if (length <= 100) return 'text-3xl sm:text-4xl';
  if (length <= 150) return 'text-2xl sm:text-3xl';
  return 'text-xl sm:text-2xl';
};

interface StoryViewerProps {
  pages: StoryPage[];
  showWatermark?: boolean;
  glowColor?: string;
  autoPlay?: boolean;
  autoPlayInterval?: number;
  onClose?: () => void;
  showShareOnLast?: boolean;
  shareContent?: React.ReactNode;
  eventSlug?: string;
  musicTrack?: MusicTrack;
}

export function StoryViewer({
  pages,
  showWatermark = false,
  glowColor = "#ec4899",
  autoPlay = true,
  autoPlayInterval = 5000,
  onClose,
  showShareOnLast = false,
  shareContent,
  eventSlug,
  musicTrack,
}: StoryViewerProps) {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [textHeight, setTextHeight] = useState(0);

  const controlsRef = useRef<ReturnType<typeof animate> | null>(null);
  const slideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressBarRefs = useRef<(HTMLDivElement | null)[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const textWrapperRef = useRef<HTMLDivElement | null>(null);

  const slideStartTimeRef = useRef<number>(0);

  // Base duration is passed from pages, defaulting to autoPlayInterval internally.
  const remainingRef = useRef<number>(autoPlayInterval);

  // ── Advance to next slide ────────────────────────
  const advanceSlide = useCallback((fromIndex: number) => {
    const nextIndex = fromIndex + 1;

    // Mark the completed bar at 100%
    const completedBar = progressBarRefs.current[fromIndex];
    if (completedBar) completedBar.style.width = "100%";

    if (nextIndex < pages.length) {
      setCurrent(nextIndex);
      // Determine duration for the next slide immediately
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      remainingRef.current = (pages[nextIndex] as any).duration
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ? (pages[nextIndex] as any).duration * 1000
        : autoPlayInterval;
    }
  }, [pages.length, pages, autoPlayInterval]);

  // ── Start a progress bar fill for the given slide ────────
  const startProgressBar = useCallback((index: number, durationMs: number) => {
    // Stop any previous animation
    if (controlsRef.current) controlsRef.current.stop();
    if (slideTimerRef.current) clearTimeout(slideTimerRef.current);

    const bar = progressBarRefs.current[index];
    if (!bar) return;

    // Get current width percentage as starting point
    const currentWidth = bar.style.width ? parseFloat(bar.style.width) / 100 : 0;

    // Use Framer's animate() on a DOM ref for frame-accurate, pausable progress
    controlsRef.current = animate(currentWidth, 1, {
      duration: (durationMs / 1000) * (1 - currentWidth), // Adjust duration if resuming
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

  // ── Kick off progress whenever current changes ──────
  useEffect(() => {
    if (!autoPlay || current >= pages.length) return;
    if (isPaused) return;

    // Reset current bar to 0 ONLY if we haven't started playing it yet
    const bar = progressBarRefs.current[current];
    if (bar && !bar.style.width) bar.style.width = "0%";

    // Ensure music is playing if it should
    if (audioRef.current && audioRef.current.paused) {
      audioRef.current.play().catch((e) => console.log("Audio play blocked:", e));
    }

    startProgressBar(current, remainingRef.current);

    return () => {
      if (controlsRef.current) controlsRef.current.stop();
      if (slideTimerRef.current) clearTimeout(slideTimerRef.current);
    };
  }, [current, autoPlay, startProgressBar, pages.length, isPaused]);

  useEffect(() => {
    // Measure text block height whenever the slide changes or text updates
    if (textWrapperRef.current) {
      setTextHeight(textWrapperRef.current.getBoundingClientRect().height);
    } else {
      setTextHeight(0);
    }
  }, [current, pages]);

  // ── Pause logic ──────────────────────────────────────────
  const handlePause = useCallback(() => {
    if (isPaused) return;
    setIsPaused(true);

    const elapsed = performance.now() - slideStartTimeRef.current;
    remainingRef.current = Math.max(0, remainingRef.current - elapsed);

    if (controlsRef.current) controlsRef.current.pause();
    if (slideTimerRef.current) clearTimeout(slideTimerRef.current);
    if (audioRef.current) audioRef.current.pause();
  }, [isPaused]);

  const handleResume = useCallback(() => {
    if (!isPaused) return;
    setIsPaused(false);
    slideStartTimeRef.current = performance.now();

    if (controlsRef.current) controlsRef.current.play();
    if (audioRef.current) audioRef.current.play().catch(() => { });

    if (slideTimerRef.current) clearTimeout(slideTimerRef.current);
    slideTimerRef.current = setTimeout(() => {
      advanceSlide(current);
    }, remainingRef.current);
  }, [isPaused, current, advanceSlide]);

  const goPrev = useCallback(() => {
    if (current > 0) {
      if (controlsRef.current) controlsRef.current.stop();
      if (slideTimerRef.current) clearTimeout(slideTimerRef.current);

      const bar = progressBarRefs.current[current];
      if (bar) bar.style.width = "0%";

      const prevIndex = current - 1;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      remainingRef.current = (pages[prevIndex] as any).duration
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ? (pages[prevIndex] as any).duration * 1000
        : autoPlayInterval;

      // Restart music
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => { });
      }

      setCurrent(prevIndex);
      setIsPaused(false);
    }
  }, [current, pages, autoPlayInterval]);

  const goNext = useCallback(() => {
    if (current < pages.length - 1) {
      if (controlsRef.current) controlsRef.current.stop();
      if (slideTimerRef.current) clearTimeout(slideTimerRef.current);

      const bar = progressBarRefs.current[current];
      if (bar) bar.style.width = "100%";

      const nextIndex = current + 1;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      remainingRef.current = (pages[nextIndex] as any).duration
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ? (pages[nextIndex] as any).duration * 1000
        : autoPlayInterval;

      setCurrent(nextIndex);
      setIsPaused(false);
    }
  }, [current, pages.length, pages, autoPlayInterval]);

  const page = pages[current];
  if (!page) return null;

  const variant = transitionVariants[page.transition];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isSyntheticCTA = (page as any)._id === "synthetic-watermark-slide";
  const isDark = page.type === 'dark' || !page.type; // default to dark if unset
  const trackColor = isDark ? "bg-white/20" : "bg-black/10";
  const fillColor = isDark ? "bg-white" : "bg-black";

  // Tap handler using coordinate-based 50/50 split — identical to StoryPreviewPlayer
  const handleTap = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const isLeftHalf = x < rect.width / 2;

    if (isLeftHalf) {
      goPrev();
    } else {
      goNext();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col"
      style={{
        backgroundColor: page.baseColor,
        backgroundImage: getBrandRadialGradient(page.baseColor, page.glowColor, isDark),
        transition: "background-color 0.5s, background-image 0.5s",
      }}
    >
      {/* Background Pattern */}
      {page.backgroundPattern && (
        <BackgroundPattern patternId={page.backgroundPattern} />
      )}

      {/* Progress bars — adaptive to page.type, direct DOM refs for frame-accurate fills */}
      <div className="flex gap-1 px-3 pt-4 pb-2 z-20">
        {pages.map((_, i) => (
          <div key={i} className={`flex-1 h-[3px] rounded-full overflow-hidden ${trackColor}`}>
            <div
              ref={(el) => { progressBarRefs.current[i] = el; }}
              className={`h-full rounded-full ${fillColor}`}
              style={{ width: i < current ? "100%" : "0%" }}
            />
          </div>
        ))}
      </div>

      {/* Slide Content Area — identical structure to StoryPreviewPlayer */}
      <div
        className="flex-1 relative cursor-pointer select-none"
        onClick={handleTap}
        onMouseDown={handlePause}
        onMouseUp={handleResume}
        onMouseLeave={handleResume}
        onTouchStart={handlePause}
        onTouchEnd={handleResume}
        style={{ touchAction: 'manipulation' }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={variant.initial}
            animate={variant.animate}
            exit={variant.exit}
            transition={{ duration: 0.4 }}
            className="absolute inset-0"
          >
            {isSyntheticCTA ? (
              /* ── Synthetic CTA Slide ── */
              <div
                className="w-full h-full flex flex-col items-center justify-center p-8 gap-8"
                style={{
                  backgroundColor: page.baseColor,
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  backgroundImage: (page as any).bgImage ? `url(${(page as any).bgImage})` : undefined,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                <h1
                  className="text-4xl text-center leading-tight tracking-tight font-bold"
                  style={{ color: page.textColor, fontFamily: page.fontFamily }}
                >
                  {page.text}
                </h1>
                <Link to="/" onClick={(e) => e.stopPropagation()}>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-8 py-4 rounded-full font-bold shadow-2xl flex items-center justify-center bg-white text-black"
                  >
                    Start Creating with MakeMoments
                  </motion.button>
                </Link>
              </div>
            ) : (
              /* ── Regular Slide — Manual Layout Replicating CreatePage editor ── */
              <>
                {/* Master Layout Reference Frame — mathematically synced to CreatePage <main> dimensions (48px absolute top, 188px bottom chrome) */}
                <div className="absolute inset-x-0 top-[21px] bottom-[188px] pointer-events-none overflow-hidden">

                  {/* Text Layout Layer */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-10 pointer-events-none">
                    {/* Spacer block to maintain layout parity with Create editor */}
                    <div className="flex justify-center mb-4 min-h-[160px] w-full relative z-10" />

                    {/* Text + Progress Wrapper — matching exact CreatePage DOM structure */}
                    <div className="w-full relative z-20 px-0" ref={textWrapperRef}>
                      <motion.textarea
                        readOnly
                        value={page.text || ""}
                        className={cn(
                          "bg-transparent font-medium leading-tight resize-none focus:outline-none w-full overflow-hidden pointer-events-none",
                          getFontSize(page.text?.length || 0)
                        )}
                        style={{
                          fontFamily: page.fontFamily,
                          color: page.textColor || "#FFFFFF",
                          textAlign: (page.textAlign || "center") as React.CSSProperties["textAlign"],
                          minHeight: "60px",
                        }}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ ...CONTENT_TRANSITION, delay: 0.1 }}
                        ref={(el) => {
                          if (el) {
                            el.style.height = 'auto';
                            el.style.height = `${Math.max(60, Math.min(el.scrollHeight, 300))}px`;
                          }
                        }}
                      />

                      {/* Ghost Progress Bar for identical flex-col vertical centering */}
                      <div className="mt-3 flex items-center gap-2 w-full opacity-0 select-none">
                        <div className="flex-1 h-0.5" />
                        <span className="text-xs font-mono shrink-0">0/200</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Photos and Stickers Layer — EXACT reference frame bounds, but NO overflow-hidden so corners can bleed visually */}
                <div className="absolute inset-x-0 top-[21px] bottom-[188px] pointer-events-none">
                  {/* Photos Layer */}
                  {page.photos && page.photos.length > 0 && (
                    <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center">
                      {page.photos.map((photo, i) => {
                        // Dynamic Boundary Mathematics (Space AROUND the text)
                        // The master frame is 100vh - 48px(top) - 188px(bottom)
                        // The text wrapper is vertically centered in this frame.
                        // We calculate the available top/bottom safe heights by dividing the remaining space.

                        const safeMaxHeight = 128; // Default max
                        if (textHeight > 0) {
                          const isTopHemisphere = (photo.transform.yp || 0) < 0;

                          // The theoretical height of the master frame (vh representation)
                          // We use '100dvh' minus chrome safely via CSS calc in style below, 
                          // but mathematically we assume worst-case phone (approx 650-236 = 414px free)
                          // We'll let CSS handle the exact screen height clamping dynamically:
                          // Top Safe Zone: `calc(50dvh - 118px - ${textHeight / 2}px - 32px)` 
                          // Bottom Safe Zone: `calc(50dvh - 118px - ${textHeight / 2}px - 32px)`
                          // Where 118px is half the offset chrome (48 top + 188 bot) / 2 = 118
                        }

                        return (
                          <div
                            key={photo.id || i}
                            className="absolute inset-0 pointer-events-none"
                          >
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{
                                opacity: 1,
                                scale: 1,
                                left: photo.transform.xp !== undefined ? `calc(50% + ${photo.transform.xp}%)` : "50%",
                                top: photo.transform.yp !== undefined
                                  ? (photo.transform.yp > 5 && textHeight > 0
                                    ? `calc(max(50% + ${photo.transform.yp}%, 50% + ${textHeight / 2}px + ${(photo.transform.width || 128) / 2}px + 20px))`
                                    : `calc(50% + ${photo.transform.yp}%)`)
                                  : "50%",
                                x: photo.transform.xp !== undefined ? "-50%" : `calc(-50% + ${photo.transform.x}px)`,
                                y: photo.transform.yp !== undefined ? "-50%" : `calc(-50% + ${photo.transform.y}px)`,
                                rotate: photo.transform.rotation,
                              }}
                              transition={{
                                ...CONTENT_TRANSITION,
                                delay: 0.05 + i * 0.05,
                              }}
                              style={{
                                position: "absolute",
                                width: `min(${photo.transform.width}px, 25vw, calc(50dvh - 118px - ${textHeight / 2}px - 32px))`,
                                height: `min(${photo.transform.width}px, 25vw, calc(50dvh - 118px - ${textHeight / 2}px - 32px))`,
                              }}
                              className="pointer-events-none"
                            >
                              <img src={photo.url} alt="" className="w-full h-full object-cover pointer-events-none" />
                            </motion.div>
                          </div>
                        )
                      })}
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
              </>
            )}
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

        {/* Dynamic Watermark Pill */}
        {showWatermark && !isSyntheticCTA && (
          <Link
            to="/"
            onClick={(e) => {
              e.stopPropagation(); // prevent slide increment
            }}
            className={cn(
              "absolute bottom-6 right-4 z-50 px-3 py-1.5 rounded-full text-[10px] font-medium tracking-tight whitespace-nowrap shadow-sm backdrop-blur-md transition-all border",
              isDark
                ? "bg-white/10 text-white/90 border-white/10 hover:bg-white/20"
                : "bg-black/5 text-black/70 border-black/5 hover:bg-black/10"
            )}
          >
            Made with MakeMoments.xyz
          </Link>
        )}
      </div>

      {/* Share on last page — dynamically colored based on backdrop */}
      {showShareOnLast && current === pages.length - 1 && shareContent && (
        <div className="p-4 z-10">{shareContent}</div>
      )}

      {musicTrack?.url && (
        <audio
          ref={audioRef}
          src={musicTrack.url}
          loop={true}
        />
      )}
    </div>
  );
}
