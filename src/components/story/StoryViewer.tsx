import { useState, useEffect, useCallback } from "react";
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

    const pageDuration = pages[current].duration ? pages[current].duration * 1000 : autoPlayInterval;

    // Animate current bar to 100% and then automatically go next
    const controls = animate(`#bar-${current}`, { width: "100%" }, {
      duration: pageDuration / 1000,
      ease: "linear",
    });

    controls.then(() => {
      goNext();
    }).catch(() => { });

    return () => {
      controls.stop();
    };
  }, [current, autoPlay, autoPlayInterval, pages, animate, goNext]);

  const page = pages[current];
  if (!page) return null;

  const variant = transitionVariants[page.transition];

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col" ref={scope}>
      {/* Progress bars */}
      <div className="flex gap-1 px-3 pt-3 pb-1 z-10">
        {pages.map((_, i) => (
          <div key={i} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
            <motion.div
              id={`bar-${i}`}
              className="h-full bg-white rounded-full"
              initial={{ width: i < current ? "100%" : "0%" }}
            />
          </div>
        ))}
      </div>

      {/* Close button omitted for immersive trap */}

      {/* Canvas Wrapper enforcing Editor WYSIWYG Parity */}
      <div className="flex-1 relative overflow-hidden flex flex-col items-center" style={{ perspective: "1000px" }}>

        {/* Top spacer matching Editor's 160px header gap */}
        <div className="w-full shrink-0 z-10" style={{ height: "160px", pointerEvents: "none" }} />

        <div className="relative w-full flex-1 flex flex-col items-start px-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={variant.initial}
              animate={variant.animate}
              exit={variant.exit}
              transition={{ duration: 0.4 }}
              className="absolute inset-x-4 inset-y-0"
            >
              {page._id === "synthetic-watermark-slide" ? (
                <div className="w-full h-full flex flex-col items-center justify-center p-8 gap-8">
                  <h1
                    className="text-4xl text-center leading-tight tracking-tight font-bold"
                    style={{ color: page.textColor, fontFamily: page.fontFamily }}
                  >
                    {page.text}
                  </h1>
                  <Link to={`/create/${eventSlug || ""}`}>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-8 py-4 rounded-full font-bold shadow-2xl flex items-center justify-center bg-white text-black"
                    >
                      Start Creating &rarr;
                    </motion.button>
                  </Link>
                </div>
              ) : (
                <StoryCanvas page={page} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom padding offset matching editor's 188px */}
        <div className="w-full shrink-0 z-10" style={{ height: "188px", pointerEvents: "none" }} />

        {/* Tap zones overlaying everything - BIASED towards progression */}
        <div className="absolute inset-0 flex z-30">
          <div className="w-1/3 h-full cursor-pointer" onClick={goPrev} />
          <div className="w-2/3 h-full cursor-pointer" onClick={goNext} />
        </div>
      </div>

      {/* Share on last page */}
      {showShareOnLast && current === pages.length - 1 && shareContent && (
        <div className="p-4 z-10">{shareContent}</div>
      )}

    </div>
  );
}
