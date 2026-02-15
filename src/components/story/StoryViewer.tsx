import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import type { StoryPage, SlideTransition } from "@/data/types";
import { StoryCanvas } from "@/components/editor/StoryCanvas";

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
  autoPlay?: boolean;
  autoPlayInterval?: number;
  onClose?: () => void;
  showShareOnLast?: boolean;
  shareContent?: React.ReactNode;
}

export function StoryViewer({
  pages,
  showWatermark = false,
  autoPlay = true,
  autoPlayInterval = 5000,
  onClose,
  showShareOnLast = false,
  shareContent,
}: StoryViewerProps) {
  const [current, setCurrent] = useState(0);
  const [progress, setProgress] = useState(0);

  const goNext = useCallback(() => {
    if (current < pages.length - 1) {
      setCurrent((c) => c + 1);
      setProgress(0);
    }
  }, [current, pages.length]);

  const goPrev = useCallback(() => {
    if (current > 0) {
      setCurrent((c) => c - 1);
      setProgress(0);
    }
  }, [current]);

  // Auto-advance timer
  useEffect(() => {
    if (!autoPlay) return;
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          goNext();
          return 0;
        }
        return p + 100 / (autoPlayInterval / 100);
      });
    }, 100);
    return () => clearInterval(interval);
  }, [autoPlay, autoPlayInterval, goNext]);

  const page = pages[current];
  if (!page) return null;

  const variant = transitionVariants[page.transition];

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Progress bars */}
      <div className="flex gap-1 px-3 pt-3 pb-1 z-10">
        {pages.map((_, i) => (
          <div key={i} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-100"
              style={{
                width: i < current ? "100%" : i === current ? `${progress}%` : "0%",
              }}
            />
          </div>
        ))}
      </div>

      {/* Close button */}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-black/40 flex items-center justify-center text-white hover:bg-black/60 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      )}

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden" style={{ perspective: "1000px" }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={variant.initial}
            animate={variant.animate}
            exit={variant.exit}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 p-4"
          >
            <StoryCanvas page={page} showWatermark={showWatermark} />
          </motion.div>
        </AnimatePresence>

        {/* Tap zones */}
        <div className="absolute inset-0 flex z-10">
          <div className="w-1/3 h-full cursor-pointer" onClick={goPrev} />
          <div className="w-1/3 h-full" />
          <div className="w-1/3 h-full cursor-pointer" onClick={goNext} />
        </div>
      </div>

      {/* Share on last page */}
      {showShareOnLast && current === pages.length - 1 && shareContent && (
        <div className="p-4 z-10">{shareContent}</div>
      )}
    </div>
  );
}
