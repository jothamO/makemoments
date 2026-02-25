import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence, animate } from "framer-motion";
import type { StoryPage, SlideTransition } from "@/data/types";
import { Link } from "react-router-dom";
import { hexToRgba, cn } from "@/lib/utils";
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
}: StoryViewerProps) {
  const [current, setCurrent] = useState(0);
  const controlsRef = useRef<ReturnType<typeof animate> | null>(null);
  const slideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressBarRefs = useRef<(HTMLDivElement | null)[]>([]);

  const goNext = useCallback(() => {
    if (current < pages.length - 1) {
      setCurrent((c) => c + 1);
    }
  }, [current, pages.length]);

  const goPrev = useCallback(() => {
    if (current > 0) {
      // Cancel pending auto-advance before navigating back
      if (controlsRef.current) controlsRef.current.stop();
      if (slideTimerRef.current) clearTimeout(slideTimerRef.current);
      setCurrent((c) => c - 1);
    }
  }, [current]);

  // Algorithmic Slide Engine — identical to StoryPreviewPlayer: standalone animate() + setTimeout
  useEffect(() => {
    if (!autoPlay || current >= pages.length) return;

    // Reset all bars via direct DOM writes
    progressBarRefs.current.forEach((bar, i) => {
      if (bar) bar.style.width = i < current ? "100%" : "0%";
    });

    const pageDuration = (pages[current] as any).duration ? (pages[current] as any).duration * 1000 : autoPlayInterval;

    const bar = progressBarRefs.current[current];
    if (bar) {
      // Get current width as starting point (normally 0 after reset)
      const currentWidth = bar.style.width ? parseFloat(bar.style.width) / 100 : 0;

      // Frame-accurate, direct-DOM fill animation via Framer's standalone animate()
      controlsRef.current = animate(currentWidth, 1, {
        duration: pageDuration / 1000,
        ease: "linear",
        onUpdate: (v) => {
          bar.style.width = `${v * 100}%`;
        },
      });
    }

    // A separate, cancellable timer drives the actual slide advance
    slideTimerRef.current = setTimeout(() => {
      goNext();
    }, pageDuration);

    return () => {
      controlsRef.current?.stop();
      if (slideTimerRef.current) clearTimeout(slideTimerRef.current);
    };

  }, [current, autoPlay, autoPlayInterval, pages, goNext]);

  const page = pages[current];
  if (!page) return null;

  const variant = transitionVariants[page.transition];
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
        backgroundColor: page.bgGradientStart,
        backgroundImage: `radial-gradient(circle at 50% 0%, ${hexToRgba(page.glowColor || page.bgGradientEnd, isDark ? 0.4 : 0.25)}, transparent 70%)`,
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
        onPointerDown={() => controlsRef.current?.pause()}
        onPointerUp={() => controlsRef.current?.play()}
        onPointerLeave={() => controlsRef.current?.play()}
        onPointerCancel={() => controlsRef.current?.play()}
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
                  backgroundColor: page.bgGradientStart,
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
                    <div className="w-full relative z-20 px-0">
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

                  {/* Photos Layer — absolute inset-0 within the reference frame */}
                  {page.photos && page.photos.length > 0 && (
                    <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center">
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
                            className="pointer-events-none"
                          >
                            <img src={photo.url} alt="" className="w-full h-full object-cover" />
                          </motion.div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Stickers — absolute inset-0 within the reference frame */}
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
      </div>

      {/* Share on last page — dynamically colored based on backdrop */}
      {showShareOnLast && current === pages.length - 1 && shareContent && (
        <div className="p-4 z-10">{shareContent}</div>
      )}

    </div>
  );
}
