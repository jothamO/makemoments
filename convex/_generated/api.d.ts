/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as celebrations from "../celebrations.js";
import type * as characters from "../characters.js";
import type * as events from "../events.js";
import type * as fonts from "../fonts.js";
import type * as init from "../init.js";
import type * as music from "../music.js";
import type * as patterns from "../patterns.js";
import type * as seedPatterns from "../seedPatterns.js";
import type * as seed_patterns from "../seed_patterns.js";
import type * as templates from "../templates.js";
import type * as themes from "../themes.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  celebrations: typeof celebrations;
  characters: typeof characters;
  events: typeof events;
  fonts: typeof fonts;
  init: typeof init;
  music: typeof music;
  patterns: typeof patterns;
  seedPatterns: typeof seedPatterns;
  seed_patterns: typeof seed_patterns;
  templates: typeof templates;
  themes: typeof themes;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
