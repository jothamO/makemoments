

# Fix Build Errors

All errors are type mismatches from the recent changes. Here are the fixes:

## 1. `convex/init.ts` line 155 — Missing `type` field on globalPatterns seed data

Each pattern object needs a `type` property (e.g. `"falling"`, `"floating"`, etc.). Add `type: "falling"` (or appropriate value) to each pattern in the seed array.

## 2. `src/pages/CreatePage.tsx` — Font type issues (lines 167-210)

The `availableFonts` mapping returns `{ name, value, isCustom, storageId, url }` but the base type is `{ name: string; value: string }`. Fix by defining a proper extended type or using type assertions consistently. The simplest fix: type the mapped result explicitly with an interface that includes `isCustom`, `storageId`, and `url` as optional fields.

## 3. `src/pages/CreatePage.tsx` line 248 — Pattern `type` is `string` not union

When building merged patterns, cast `type` to the union type: `type: p.type as "falling" | "floating" | "rising" | "static"`.

## 4. `src/pages/CreatePage.tsx` lines 363, 630 — `t.id` doesn't exist on Convex docs

Convex uses `_id` not `id`. Replace `t.id` with `t._id` on both lines.

## 5. `src/pages/Homepage.tsx` line 31 — Convex event missing `id` property

The `generateOnboardingSlides` function expects `CelebrationEvent` which has `id`. The Convex event has `_id`. Fix by mapping: pass `{ ...activeEvent, id: activeEvent._id }` or update `generateOnboardingSlides` to accept either shape.

## 6. `src/pages/Homepage.tsx` line 343 — Duplicate `headline` property

The `return validSlides.map(...)` block has `headline` defined twice (lines 338 and 343). Remove the duplicate on line 343.

## Summary

| File | Line(s) | Fix |
|------|---------|-----|
| `convex/init.ts` | 148-153 | Add `type` field to each pattern |
| `src/pages/CreatePage.tsx` | 155-173 | Add proper typing for font objects with optional `isCustom`, `storageId`, `url` |
| `src/pages/CreatePage.tsx` | 248 | Cast pattern `type` to union literal |
| `src/pages/CreatePage.tsx` | 363, 630 | Change `t.id` to `t._id` |
| `src/pages/Homepage.tsx` | 31 | Normalize Convex event to include `id` |
| `src/pages/Homepage.tsx` | 343 | Remove duplicate `headline` property |

