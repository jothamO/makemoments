/**
 * Shared animation tokens for MakeMoments.
 *
 * These constants are derived from a competitor analysis of OurHeart
 * and match Apple's "expressive" motion language.
 *
 * Usage:
 *   import { EXPRESSIVE_EASE, UI_SPRING, FAST_SPRING } from '@/lib/animation';
 *   <motion.div transition={{ duration: 0.4, ease: EXPRESSIVE_EASE }} />
 *   <motion.div transition={UI_SPRING} />
 */

/** Apple-style expressive cubic-bezier: slow start, hard accel, snaps to rest. */
export const EXPRESSIVE_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/** Spring for toolbar panels and interactive pop-ups. Feels physically pressed. */
export const UI_SPRING = { type: 'spring' as const, stiffness: 400, damping: 30 };

/** Faster spring for small, snappy UI responses (toggles, checkboxes). */
export const FAST_SPRING = { type: 'spring' as const, stiffness: 500, damping: 30 };

/** Standard content transition (slide changes, card reveals). */
export const CONTENT_TRANSITION = { duration: 0.4, ease: EXPRESSIVE_EASE };

/** Slide duration in ms (how long each story slide is shown). */
export const SLIDE_DURATION_MS = 5000;

/** WhileTap preset for buttons — gives instant tactile feedback. */
export const TAP_SCALE = { scale: 0.95 };

// ── Accessibility (E) ──────────────────────────────────────
/**
 * Re-export Framer's useReducedMotion hook.
 * Components can check this to skip/simplify animations
 * for users with vestibular disorders.
 *
 * Usage:
 *   const prefersReduced = useReducedMotion();
 *   <motion.div transition={prefersReduced ? { duration: 0 } : CONTENT_TRANSITION} />
 */
export { useReducedMotion } from "framer-motion";

// ── Low-end device detection (G) ───────────────────────────
/**
 * Returns true on budget devices (≤4 CPU cores).
 * Use to skip expensive effects like backdrop-blur.
 *
 * Usage:
 *   const skipBlur = isLowEndDevice();
 *   className={skipBlur ? "bg-zinc-900" : "bg-zinc-900/95 backdrop-blur-xl"}
 */
export function isLowEndDevice(): boolean {
    if (typeof navigator === "undefined") return false;
    return (navigator.hardwareConcurrency ?? 8) <= 4;
}
