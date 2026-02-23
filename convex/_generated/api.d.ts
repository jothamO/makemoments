/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as assets from "../assets.js";
import type * as auth from "../auth.js";
import type * as backup from "../backup.js";
import type * as celebrationExpiry from "../celebrationExpiry.js";
import type * as celebrations from "../celebrations.js";
import type * as characters from "../characters.js";
import type * as crons from "../crons.js";
import type * as email from "../email.js";
import type * as events from "../events.js";
import type * as exchangeRates from "../exchangeRates.js";
import type * as fonts from "../fonts.js";
import type * as gatewayConfig from "../gatewayConfig.js";
import type * as http from "../http.js";
import type * as init from "../init.js";
import type * as mail from "../mail.js";
import type * as migrate_patterns from "../migrate_patterns.js";
import type * as mirror from "../mirror.js";
import type * as music from "../music.js";
import type * as notifications from "../notifications.js";
import type * as patterns from "../patterns.js";
import type * as payments from "../payments.js";
import type * as pricing from "../pricing.js";
import type * as seedPatterns from "../seedPatterns.js";
import type * as seedPatternsV4 from "../seedPatternsV4.js";
import type * as seed_assets from "../seed_assets.js";
import type * as seed_fonts from "../seed_fonts.js";
import type * as seed_patterns from "../seed_patterns.js";
import type * as seed_themes from "../seed_themes.js";
import type * as themes from "../themes.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  assets: typeof assets;
  auth: typeof auth;
  backup: typeof backup;
  celebrationExpiry: typeof celebrationExpiry;
  celebrations: typeof celebrations;
  characters: typeof characters;
  crons: typeof crons;
  email: typeof email;
  events: typeof events;
  exchangeRates: typeof exchangeRates;
  fonts: typeof fonts;
  gatewayConfig: typeof gatewayConfig;
  http: typeof http;
  init: typeof init;
  mail: typeof mail;
  migrate_patterns: typeof migrate_patterns;
  mirror: typeof mirror;
  music: typeof music;
  notifications: typeof notifications;
  patterns: typeof patterns;
  payments: typeof payments;
  pricing: typeof pricing;
  seedPatterns: typeof seedPatterns;
  seedPatternsV4: typeof seedPatternsV4;
  seed_assets: typeof seed_assets;
  seed_fonts: typeof seed_fonts;
  seed_patterns: typeof seed_patterns;
  seed_themes: typeof seed_themes;
  themes: typeof themes;
  users: typeof users;
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
