import type { StoryPage, FontSize } from "@/data/types";
import { FontPicker } from "./FontPicker";
import { TextAlignPicker } from "./TextAlignPicker";
import { MusicPicker } from "./MusicPicker";
import { BackdropPicker } from "./BackdropPicker";
import { PatternsPicker } from "./PatternsPicker";
import { cn } from "@/lib/utils";
import type { EventTheme } from "@/data/types";

interface EditorToolbarProps {
  page: StoryPage;
  musicTrackId?: string;
  isPlaying?: boolean;
  onTogglePlay?: () => void;
  activeColor?: string;
  allowedThemeIds?: string[];
  allowedFontIds?: string[];
  allowedMusicIds?: string[];
  allowedPatternIds?: string[];
  onPageUpdate: (updates: Partial<StoryPage>) => void;
  onMusicChange: (trackId: string | undefined) => void;
  onBackdropSelect: (theme: Partial<EventTheme>) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  availablePatterns?: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  availableFonts?: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  availableThemes?: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  availableMusic?: any[];
  className?: string;
}

export function EditorToolbar({
  page,
  musicTrackId,
  isPlaying,
  onTogglePlay,
  activeColor,
  allowedThemeIds,
  allowedFontIds,
  allowedMusicIds,
  allowedPatternIds,
  onPageUpdate,
  onMusicChange,
  onBackdropSelect,
  availablePatterns = [],
  availableFonts = [],
  availableThemes = [],
  availableMusic = [],
  className
}: EditorToolbarProps) {
  return (
    <div className={cn("fixed bottom-10 left-0 right-0 flex justify-center z-50 pointer-events-none", className)}>
      <div className="w-[268px] bg-white/5 backdrop-blur-3xl rounded-2xl p-2 flex items-center justify-between pointer-events-auto border border-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)]">

        <BackdropPicker
          onSelect={onBackdropSelect}
          currentThemeId={page.themeId}
          whitelist={allowedThemeIds}
          availableThemes={availableThemes} />

        {/* 2. Font */}
        <FontPicker
          fontFamily={page.fontFamily}
          fontSize={page.fontSize}
          whitelist={allowedFontIds}
          availableFonts={availableFonts}
          onFontChange={(f) => onPageUpdate({ fontFamily: f })}
          onSizeChange={(s: FontSize) => onPageUpdate({ fontSize: s })}
        />

        {/* 3. Align */}
        <TextAlignPicker
          value={page.textAlign}
          onChange={(a) => onPageUpdate({ textAlign: a })}
        />

        {/* 4. Music */}
        <MusicPicker
          selectedId={musicTrackId}
          isPlaying={isPlaying}
          onTogglePlay={onTogglePlay || (() => { })}
          activeColor={activeColor}
          whitelist={allowedMusicIds}
          availableMusic={availableMusic}
          onSelect={onMusicChange}
        />

        {/* 5. Patterns */}
        <PatternsPicker
          currentPattern={page.backgroundPattern}
          activeColor={activeColor}
          whitelist={allowedPatternIds}
          availablePatterns={availablePatterns}
          onSelect={(id) => onPageUpdate({ backgroundPattern: id })}
        />

      </div>
    </div>
  );
}

