import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const TABLES = [
    "events",
    "musicTracks",
    "globalThemes",
    "globalFonts",
    "globalPatterns",
    "globalCharacters",
    "globalPricing",
    "mailConfig",
    "mailTemplates",
    "exchangeRates",
    "templates",
    "users",
    "eventNotifications"
];

export const exportAll = query({
    handler: async (ctx) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data: Record<string, any[]> = {};
        for (const table of TABLES) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            data[table] = await ctx.db.query(table as any).collect();
        }
        return data;
    },
});

export const importAll = mutation({
    args: {
        data: v.any(), // Record<string, any[]>
    },
    handler: async (ctx, args) => {
        const { data } = args;

        for (const table of TABLES) {
            // 1. Clear existing data in production for this table
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const existing = await ctx.db.query(table as any).collect();
            for (const doc of existing) {
                await ctx.db.delete(doc._id);
            }

            // 2. Insert new data
            const records = data[table] || [];
            for (const record of records) {
                const { _id, _creationTime, ...fields } = record;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                await ctx.db.insert(table as any, fields);
            }
        }

        return "Mirror Complete!";
    },
});
