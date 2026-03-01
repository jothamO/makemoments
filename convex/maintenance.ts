import { mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Surgical Data Migration: Deep Clean Prices
 * 
 * Ensures every document in critical asset tables has a price object 
 * { ngn: number, usd: number } instead of a raw number.
 * 
 * Target tables: globalFonts, globalCharacters, musicTracks, globalThemes, globalPatterns
 */
export const deepCleanPrices = mutation({
    args: {
        token: v.optional(v.string()), // Security token for manual execution
    },
    handler: async (ctx, args) => {
        // Simple security check for production manual execution
        if (process.env.CONVEX_DEPLOYMENT?.includes("prod") && !args.token) {
            throw new Error("Security token required for production migration");
        }

        const tables = ["globalFonts", "globalCharacters", "musicTracks", "globalThemes", "globalPatterns"] as const;

        const results: Record<string, { updated: number; skipped: number }> = {};

        for (const table of tables) {
            const docs = await ctx.db.query(table).collect();
            let updated = 0;
            let skipped = 0;

            for (const doc of docs) {
                const currentPrice = (doc as any).price;

                // Case 1: Price is a number (The legacy issue)
                if (typeof currentPrice === "number") {
                    await ctx.db.patch(doc._id as any, {
                        price: { ngn: currentPrice, usd: currentPrice }
                    });
                    updated++;
                }
                // Case 2: Price is missing
                else if (currentPrice === undefined || currentPrice === null) {
                    await ctx.db.patch(doc._id as any, {
                        price: { ngn: 0, usd: 0 }
                    });
                    updated++;
                }
                // Case 3: Already an object (or otherwise fine)
                else {
                    skipped++;
                }
            }
            results[table] = { updated, skipped };
        }

        return {
            status: "success",
            summary: results
        };
    },
});
