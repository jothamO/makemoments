
# Fix Homepage Lag, Event-Based Routing, and Editor Improvements

## 1. Fix Hero Section Slide Transition Lag

**Problem**: The `AnimatePresence mode="wait"` with `scale` transforms on the hero slides causes visible lag during transitions. Additionally, 15 continuously-animating emoji elements in `BackgroundPattern` add GPU pressure.

**Solution**:
- Replace Framer Motion slide transitions with CSS-only opacity crossfade (no scale transforms, no `AnimatePresence` remounting)
- Use simple CSS `transition: opacity 0.5s` on slides instead of Framer Motion's `motion.div` with key-based remounting
- Reduce `BackgroundPattern` emoji count from 15 to 8 and use CSS animations instead of Framer Motion for the floating emojis
- Remove the `scale` properties from initial/animate/exit (the scale 0.98 to 1.02 causes layout recalculations)

**File**: `src/pages/Homepage.tsx`

---

## 2. Redirect /create to /{active-event-slug}/create

**Problem**: The `/create` route is static and doesn't reflect the active event.

**Solution**:
- Change `/create` route to redirect to `/{event.slug}/create` using the active event
- Add a new route `/:eventSlug/create` that renders the `CreatePage` component
- In `CreatePage`, read `eventSlug` from URL params and load that event's data (falling back to active event)
- Update the CTA link on the homepage from `/create` to `/${event.slug}/create`

**Files**: `src/App.tsx`, `src/pages/CreatePage.tsx`, `src/pages/Homepage.tsx`

---

## 3. Fix Preview/Publish Buttons Cut Off on Wider Screens

**Problem**: The action buttons container has no max-width, so on wide screens they stretch and may clip.

**Solution**:
- Add `max-w-lg mx-auto w-full` to the action buttons container (line 452) so they stay centered and bounded on wider screens
- This matches the canvas max-width for visual consistency

**File**: `src/pages/CreatePage.tsx` (line 452)

---

## 4. Default Card Color to First Theme Picker Color (Mint)

**Problem**: `createInitialPage()` uses the event theme's `bgGradientStart`/`bgGradientEnd`, applying the event's colors by default.

**Solution**:
- Change `createInitialPage()` to use `COLOR_THEMES[0]` values instead of the event theme:
  - `bgGradientStart: "#E2F0E9"` (Mint primary)
  - `bgGradientEnd: "#C5E3D5"` (Mint secondary)
- This means new pages start with the first color in the editor's theme selector

**File**: `src/pages/CreatePage.tsx` (lines 74-86)

---

## Technical Summary

| Change | File(s) | Lines |
|--------|---------|-------|
| Optimize hero transitions | Homepage.tsx | ~60-200 |
| Event-based routing | App.tsx, CreatePage.tsx, Homepage.tsx | Multiple |
| Button max-width fix | CreatePage.tsx | ~452 |
| Default to Mint theme | CreatePage.tsx | ~74-86 |
