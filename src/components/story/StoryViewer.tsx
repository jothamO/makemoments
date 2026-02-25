import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence, useAnimate } from "framer-motion";
import { X } from "lucide-react";
import type { StoryPage, SlideTransition } from "@/data/types";
import { StoryCanvas } from "@/components/editor/StoryCanvas";
import { Link } from "react-router-dom";

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
  const [scope, animate] = useAnimate();
  const controlsRef = useRef<any>(null);

  const goNext = useCallback(() => {
    if (current < pages.length - 1) {
      setCurrent((c) => c + 1);
    }
  }, [current, pages.length]);

  const goPrev = useCallback(() => {
    if (current > 0) {
      setCurrent((c) => c - 1);
    }
  }, [current]);

  // Algorithmic Slide Engine: The visual progress bar drives the data transition
  useEffect(() => {
    if (!autoPlay || current >= pages.length) return;

    // Reset all bars visually instantly
    pages.forEach((_, i) => {
      animate(`#bar-${i}`, { width: i < current ? "100%" : "0%" }, { duration: 0 });
    });

    const pageDuration = (pages[current] as any).duration ? (pages[current] as any).duration * 1000 : autoPlayInterval;

    // Animate current bar to 100% and then automatically go next
    controlsRef.current = animate(`#bar-${current}`, { width: "100%" }, {
      duration: pageDuration / 1000,
      ease: "linear",
    });

    controlsRef.current.then(() => {
      goNext();
    }).catch(() => { });

    return () => {
      controlsRef.current?.stop();
    };
  }, [current, autoPlay, autoPlayInterval, pages, animate, goNext]);

  const page = pages[current];
  if (!page) return null;

  const variant = transitionVariants[page.transition];
  const isSyntheticCTA = (page as any)._id === "synthetic-watermark-slide";
  const isDark = page.type === 'dark' || !page.type; // default to dark if unset
  const trackColor = isDark ? "bg-white/20" : "bg-black/10";
  const fillColor = isDark ? "bg-white" : "bg-black";

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col" ref={scope}>
      {/* Progress bars — adaptive to page.type */}
      <div className="absolute top-0 left-0 right-0 flex gap-1 px-3 pt-3 pb-1 z-40">
        {pages.map((_, i) => (
          <div key={i} className={`flex-1 h-[3px] rounded-full overflow-hidden ${trackColor}`}>
            <motion.div
              id={`bar-${i}`}
              className={`h-full rounded-full ${fillColor}`}
              initial={{ width: i < current ? "100%" : "0%" }}
            />
          </div>
        ))}
      </div>

      {/* Canvas Wrapper — Full-Screen Edge-to-Edge */}
      <div className="flex-1 relative overflow-hidden" style={{ perspective: "1000px" }}>

        <div className="relative w-full h-full">
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
                <div
                  className="w-full h-full flex flex-col items-center justify-center p-8 gap-8"
                  style={{ backgroundColor: page.bgGradientStart, backgroundImage: (page as any).bgImage ? `url(${(page as any).bgImage})` : undefined, backgroundSize: 'cover', backgroundPosition: 'center' }}
                >
                  <h1
                    className="text-4xl text-center leading-tight tracking-tight font-bold"
                    style={{ color: page.textColor, fontFamily: page.fontFamily }}
                  >
                    {page.text}
                  </h1>
                  <Link to="/">
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
                <StoryCanvas page={page} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Tap zones — 50/50 split, hold-to-pause. Hidden on CTA slide so button is clickable. */}
        {!isSyntheticCTA && (
          <div className="absolute inset-0 flex z-30">
            <div
              className="w-1/2 h-full cursor-pointer"
              onClick={goPrev}
              onPointerDown={() => controlsRef.current?.pause()}
              onPointerUp={() => controlsRef.current?.play()}
              onPointerLeave={() => controlsRef.current?.play()}
              onPointerCancel={() => controlsRef.current?.play()}
            />
            <div
              className="w-1/2 h-full cursor-pointer"
              onClick={goNext}
              onPointerDown={() => controlsRef.current?.pause()}
              onPointerUp={() => controlsRef.current?.play()}
              onPointerLeave={() => controlsRef.current?.play()}
              onPointerCancel={() => controlsRef.current?.play()}
            />
          </div>
        )}
      </div>

      {/* Share buttons — suppressed on synthetic CTA slide */}
      {showShareOnLast && current === pages.length - 1 && shareContent && !isSyntheticCTA && (
        <div className="p-4 z-10">{shareContent}</div>
      )}

    </div>
  );
}
