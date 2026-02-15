

# Redesign: OurHeart-Style Story Editor and Viewer

Replace the current two-column form-based template editor with an immersive, full-screen, multi-page story card editor inspired by OurHeart.xyz.

---

## What Changes

### 1. New Data Model: Pages Instead of Fixed Slots

The current system uses fixed `mediaSlots` and `textSlots` per template. The new system introduces a **pages** concept where each celebration is a multi-page story.

**New types to add:**

- `StoryPage` -- Each page has: an optional photo, text content (up to 200 chars), font style, text alignment, background gradient/color, and a slide transition effect
- `Celebration.pages: StoryPage[]` -- replaces the flat `userMedia` / `userText` maps
- `Celebration.musicTrackId?: string` -- selected background music track

Templates still exist as starting points (pre-configured page layouts), but the editor now operates on a `StoryPage[]` array.

---

### 2. Full-Screen Story Editor (replaces `TemplateEditor.tsx`)

A completely new immersive editor with no header/footer -- just the card canvas.

**Layout (top to bottom):**

- **Top bar**: Back arrow (left), page counter "2 / 5" (center), delete page icon (right)
- **Card canvas** (fills remaining space): Shows the current page with its gradient background, photo placeholder (dashed border "Add Photo"), and editable text area ("Tap to write...")
- **Page indicator dots**: Horizontal dots showing all pages, with a "+" button to add a new page
- **Bottom toolbar**: Icon buttons row for:
  - Stickers/emoji picker
  - Font style selector (font family + weight)
  - Text alignment (left/center/right)
  - Slide transition effect picker (fade, slide, zoom, flip)
  - Music selector (pick from preset tracks)
  - Background color/gradient picker
- **Action bar** (sticky bottom): Two buttons side by side -- "Preview" (left) and "Publish" (right, opens payment modal)

**Interactions:**
- Tap left/right sides of card to navigate between pages
- "+" button adds a blank page after current
- Delete icon removes current page (confirm if only 1 page left)
- Photo upload opens a file picker (mock with placeholder)
- Text area is directly editable inline (contentEditable or textarea overlay)
- All toolbar changes apply to the current page only

---

### 3. Story Preview Mode

When user taps "Preview", enter a full-screen Instagram Stories-style viewer:

- **Progress bars** at the top (one segment per page, auto-advances every 5 seconds)
- **Tap left side** to go back, **tap right side** to go forward
- **Slide transitions** between pages using the selected effect (Framer Motion)
- **Background music** plays if a track was selected
- **Close button** (X) top-right to exit preview and return to editor

---

### 4. Celebration Viewer Update (`CelebrationView.tsx`)

The published celebration view also becomes Instagram Stories-style:

- Full-screen experience with progress bars at top
- Tap sides to navigate between pages
- Slide transition effects as configured by creator
- Music auto-plays if purchased
- "Tap to begin a love story..." intro page (like OurHeart homepage)
- Share buttons overlay at the bottom of the last page
- "Made with MakeMoments" watermark on each page (if not removed)
- "Create Your Own" CTA on the final page

---

### 5. Payment Modal Update

The `PaymentModal` stays mostly the same but receives `pages: StoryPage[]` instead of `userMedia`/`userText`. The preview section shows a mini thumbnail of the first page.

---

### 6. Homepage and Gallery

These remain unchanged. The gallery still shows template cards. When a user picks a template, it now pre-populates the story editor with that template's default pages (converted from the old slot-based format).

---

## Technical Details

### Files to Create
- `src/pages/StoryEditor.tsx` -- The full-screen multi-page story editor (replaces TemplateEditor)
- `src/components/editor/StoryCanvas.tsx` -- Single page canvas rendering
- `src/components/editor/EditorToolbar.tsx` -- Bottom toolbar with all tools
- `src/components/editor/PageIndicator.tsx` -- Dot indicators + add button
- `src/components/editor/StickerPicker.tsx` -- Emoji/sticker picker popover
- `src/components/editor/FontPicker.tsx` -- Font family and style selector
- `src/components/editor/TransitionPicker.tsx` -- Slide effect selector
- `src/components/editor/MusicPicker.tsx` -- Music track selector
- `src/components/editor/BackgroundPicker.tsx` -- Color/gradient picker
- `src/components/editor/TextAlignPicker.tsx` -- Text alignment selector
- `src/components/story/StoryViewer.tsx` -- Reusable Instagram Stories-style viewer (used in both preview mode and celebration view)
- `src/data/music-tracks.ts` -- Preset music track data
- `src/data/stickers.ts` -- Available stickers/emoji

### Files to Modify
- `src/data/types.ts` -- Add `StoryPage`, `SlideTransition`, `MusicTrack` types; update `Celebration`
- `src/data/mock-data.ts` -- Update mock celebrations to use pages format
- `src/data/data-service.ts` -- Update `createCelebration` to handle pages
- `src/App.tsx` -- Update route to use `StoryEditor` instead of `TemplateEditor`
- `src/pages/CelebrationView.tsx` -- Replace with Stories-style viewer
- `src/components/PaymentModal.tsx` -- Accept pages array instead of flat media/text

### Files to Remove
- `src/pages/TemplateEditor.tsx` -- Replaced by StoryEditor

### Key Libraries Used (already installed)
- `framer-motion` -- Page transition animations (fade, slide, zoom, flip)
- `react-colorful` -- Background color/gradient picker
- `lucide-react` -- Toolbar icons
- Shadcn `Popover` -- Toolbar dropdowns

### StoryPage Type

```text
StoryPage {
  id: string
  photoUrl?: string
  text: string
  fontFamily: string
  fontSize: "small" | "medium" | "large"
  textAlign: "left" | "center" | "right"
  textColor: string
  bgGradientStart: string
  bgGradientEnd: string
  transition: "fade" | "slide" | "zoom" | "flip"
  stickers: { emoji: string, x: number, y: number }[]
}
```

### Transition Effects (Framer Motion variants)
- **Fade**: opacity 0 to 1
- **Slide**: translateX 100% to 0
- **Zoom**: scale 0.8 + opacity 0 to scale 1 + opacity 1
- **Flip**: rotateY 90deg to 0

