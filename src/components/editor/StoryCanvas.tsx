import { BackgroundPattern } from "@/components/BackgroundPattern";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { StoryPage } from "@/data/types";
import { hexToRgba } from "@/lib/utils";
import { motion } from "framer-motion";

interface StoryCanvasProps {
  page: StoryPage;
  showWatermark?: boolean;
  onPhotoClick?: () => void;
  onTextChange?: (text: string) => void;
  editable?: boolean;
}

// hexToRgba moved to @/lib/utils

export function StoryCanvas({ page, showWatermark = false, onPhotoClick, onTextChange, editable = false }: StoryCanvasProps) {
  const fontSizeMap = { small: "text-base", medium: "text-2xl", large: "text-4xl" };
  const alignMap = { left: "text-left", center: "text-center", right: "text-right" };

  const allPatterns = useQuery(api.patterns.list);
  const patternDetails = allPatterns?.find(p => p.id === page.backgroundPattern);

  return (
    <div
      className="relative w-full h-full rounded-2xl overflow-hidden flex flex-col"
      style={{
        backgroundColor: page.bgGradientStart,
        backgroundImage: `radial-gradient(circle at 50% 0%, ${hexToRgba(page.glowColor || page.bgGradientEnd, page.type === 'dark' ? 0.4 : 0.25)}, transparent 70%)`
      }}
    >
      {/* Background Pattern */}
      {page.backgroundPattern && (
        <BackgroundPattern
          patternId={page.backgroundPattern}
        />
      )}
      {/* Photo area */}
      {(() => {
        const photos = page.photos || [];

        if (photos.length === 0 && editable) {
          return (
            <div
              className="absolute top-6 left-6 right-6 h-[40%] border-2 border-dashed border-white/40 rounded-xl flex items-center justify-center cursor-pointer hover:border-white/60 transition-colors"
              onClick={onPhotoClick}
            >
              <span className="text-white/60 text-sm font-medium">+ Add Photo</span>
            </div>
          );
        }

        return (
          <div className="absolute inset-0 z-20 overflow-hidden pointer-events-none">
            {photos.map((photo, i) => (
              <div
                key={(photo as any).id || i}
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
                    duration: 0.4,
                    delay: 0.05 + i * 0.05,
                    ease: [0.23, 1, 0.32, 1] // Apple-style ease out
                  }}
                  style={{
                    width: photo.transform.width,
                    height: photo.transform.width,
                  }}
                  className="pointer-events-auto cursor-pointer"
                  onClick={onPhotoClick}
                >
                  <img src={photo.url} alt="" className="w-full h-full object-cover" />
                </motion.div>
              </div>
            ))}
            {!editable && photos.length > 0 && (
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
            )}
          </div>
        );
      })()}

      {/* Stickers */}
      {page.stickers.map((sticker, i) => (
        <div
          key={i}
          className="absolute text-3xl pointer-events-none select-none z-20"
          style={{ left: `${sticker.x}%`, top: `${sticker.y}%` }}
        >
          {sticker.emoji}
        </div>
      ))}

      {/* Text area */}
      <div className={`absolute bottom-0 left-0 right-0 px-10 pb-10 ${(page.photos?.length || 0) > 0 ? "pt-16" : "top-[50%]"} flex items-end z-20`}>
        <div className={`w-full ${alignMap[page.textAlign]}`}>
          {(() => {
            const getFontSize = (length: number) => {
              if (length <= 30) return 'text-5xl sm:text-6xl';
              if (length <= 60) return 'text-4xl sm:text-5xl';
              if (length <= 100) return 'text-3xl sm:text-4xl';
              if (length <= 150) return 'text-2xl sm:text-3xl';
              return 'text-xl sm:text-2xl';
            };
            const textLength = page.text?.length || 0;

            return editable ? (
              <>
                <textarea
                  value={page.text}
                  onChange={(e) => {
                    onTextChange?.(e.target.value.slice(0, 200));
                    e.target.style.height = 'auto';
                    e.target.style.height = `${Math.max(60, Math.min(e.target.scrollHeight, 300))}px`;
                  }}
                  onFocus={(e) => {
                    e.target.style.height = 'auto';
                    e.target.style.height = `${Math.max(60, Math.min(e.target.scrollHeight, 300))}px`;
                  }}
                  placeholder="Tap to write..."
                  maxLength={200}
                  className={`w-full bg-transparent border-none outline-none resize-none placeholder:text-white/40 font-medium leading-tight overflow-hidden transition-all duration-300 ${getFontSize(textLength)} ${alignMap[page.textAlign]}`}
                  style={{
                    fontFamily: page.fontFamily,
                    color: page.textColor,
                    minHeight: "60px",
                  }}
                />
                <div className="mt-3 flex items-center gap-2 w-full">
                  <div className={`flex-1 h-0.5 rounded-full overflow-hidden ${page.type === 'dark' ? 'bg-white/10' : 'bg-zinc-900/10'}`}>
                    <motion.div
                      className={`h-full rounded-full ${textLength / 200 > 0.9 ? 'bg-red-400' :
                        textLength / 200 > 0.7 ? 'bg-amber-400' :
                          page.type === 'dark' ? 'bg-white/30' : 'bg-zinc-900/30'
                        }`}
                      animate={{ width: `${Math.min(textLength / 200 * 100, 100)}%` }}
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  </div>
                  <span className={`text-xs font-mono shrink-0 ${textLength / 200 > 0.9 ? 'text-red-400' :
                    page.type === 'dark' ? 'text-white/30' : 'text-zinc-500'
                    }`}>
                    {textLength}/200
                  </span>
                </div>
              </>
            ) : (
              page.text && (
                <p
                  className={`${getFontSize(textLength)} leading-tight drop-shadow-lg font-medium transition-all duration-300`}
                  style={{ fontFamily: page.fontFamily, color: page.textColor }}
                >
                  {page.text}
                </p>
              )
            );
          })()}
        </div>
      </div>
    </div>
  );
}
