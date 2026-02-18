import { BackgroundPattern } from "@/components/BackgroundPattern";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { StoryPage } from "@/data/types";

interface StoryCanvasProps {
  page: StoryPage;
  showWatermark?: boolean;
  onPhotoClick?: () => void;
  onTextChange?: (text: string) => void;
  editable?: boolean;
}

export function StoryCanvas({ page, showWatermark = false, onPhotoClick, onTextChange, editable = false }: StoryCanvasProps) {
  const fontSizeMap = { small: "text-base", medium: "text-2xl", large: "text-4xl" };
  const alignMap = { left: "text-left", center: "text-center", right: "text-right" };

  const allPatterns = useQuery(api.patterns.list);
  const patternDetails = allPatterns?.find(p => p.id === page.backgroundPattern);

  return (
    <div
      className="relative w-full h-full rounded-2xl overflow-hidden flex flex-col"
      style={{
        background: `linear-gradient(160deg, ${page.bgGradientStart}, ${page.bgGradientEnd})`,
      }}
    >
      {/* Background Pattern */}
      {page.backgroundPattern && (
        <BackgroundPattern
          pattern={page.backgroundPattern}
          type={patternDetails?.type}
          customEmojis={patternDetails?.emoji ? patternDetails?.emoji.split(",") : undefined}
        />
      )}
      {/* Photo area */}
      {page.photoUrl ? (
        <div
          className="absolute inset-0 cursor-pointer"
          onClick={onPhotoClick}
        >
          <img src={page.photoUrl} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        </div>
      ) : editable ? (
        <div
          className="absolute top-6 left-6 right-6 h-[40%] border-2 border-dashed border-white/40 rounded-xl flex items-center justify-center cursor-pointer hover:border-white/60 transition-colors"
          onClick={onPhotoClick}
        >
          <span className="text-white/60 text-sm font-medium">+ Add Photo</span>
        </div>
      ) : null}

      {/* Stickers */}
      {page.stickers.map((sticker, i) => (
        <div
          key={i}
          className="absolute text-3xl pointer-events-none select-none"
          style={{ left: `${sticker.x}%`, top: `${sticker.y}%` }}
        >
          {sticker.emoji}
        </div>
      ))}

      {/* Text area */}
      <div className={`absolute bottom-0 left-0 right-0 p-6 ${page.photoUrl ? "pt-16" : "top-[50%]"} flex items-end`}>
        <div className={`w-full ${alignMap[page.textAlign]}`}>
          {editable ? (
            <textarea
              value={page.text}
              onChange={(e) => onTextChange?.(e.target.value.slice(0, 200))}
              placeholder="Tap to write..."
              maxLength={200}
              className={`w-full bg-transparent border-none outline-none resize-none placeholder:text-white/40 ${fontSizeMap[page.fontSize]} ${alignMap[page.textAlign]} leading-snug`}
              style={{
                fontFamily: page.fontFamily,
                color: page.textColor,
                minHeight: "3em",
              }}
              rows={3}
            />
          ) : (
            page.text && (
              <p
                className={`${fontSizeMap[page.fontSize]} leading-snug drop-shadow-lg`}
                style={{ fontFamily: page.fontFamily, color: page.textColor }}
              >
                {page.text}
              </p>
            )
          )}
        </div>
      </div>

      {/* Watermark */}
      {showWatermark && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-white/15 text-2xl font-bold rotate-[-30deg] select-none">
            MakeMoments
          </span>
        </div>
      )}
    </div>
  );
}
