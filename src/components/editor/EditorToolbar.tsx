import type { StoryPage, FontSize, SlideTransition } from "@/data/types";
import { StickerPicker } from "./StickerPicker";
import { FontPicker } from "./FontPicker";
import { TextAlignPicker } from "./TextAlignPicker";
import { TransitionPicker } from "./TransitionPicker";
import { MusicPicker } from "./MusicPicker";
import { BackgroundPicker } from "./BackgroundPicker";

interface EditorToolbarProps {
  page: StoryPage;
  musicTrackId?: string;
  onPageUpdate: (updates: Partial<StoryPage>) => void;
  onMusicChange: (trackId: string | undefined) => void;
  onStickerAdd: (emoji: string) => void;
}

export function EditorToolbar({ page, musicTrackId, onPageUpdate, onMusicChange, onStickerAdd }: EditorToolbarProps) {
  return (
    <div className="flex items-center justify-around px-4 py-2">
      <StickerPicker onSelect={onStickerAdd} />
      <FontPicker
        fontFamily={page.fontFamily}
        fontSize={page.fontSize}
        onFontChange={(f) => onPageUpdate({ fontFamily: f })}
        onSizeChange={(s: FontSize) => onPageUpdate({ fontSize: s })}
      />
      <TextAlignPicker
        value={page.textAlign}
        onChange={(a) => onPageUpdate({ textAlign: a })}
      />
      <TransitionPicker
        value={page.transition}
        onChange={(t: SlideTransition) => onPageUpdate({ transition: t })}
      />
      <MusicPicker
        selectedId={musicTrackId}
        onSelect={onMusicChange}
      />
      <BackgroundPicker
        gradientStart={page.bgGradientStart}
        gradientEnd={page.bgGradientEnd}
        textColor={page.textColor}
        onStartChange={(c) => onPageUpdate({ bgGradientStart: c })}
        onEndChange={(c) => onPageUpdate({ bgGradientEnd: c })}
        onTextColorChange={(c) => onPageUpdate({ textColor: c })}
      />
    </div>
  );
}
