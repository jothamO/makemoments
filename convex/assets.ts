import { mutation } from "./_generated/server";
import { v } from "convex/values";

// Supported tables for default assets
const VALID_TABLES = [
    "musicTracks",
    "globalThemes",
    "globalFonts",
    "globalPatterns",
    "globalCharacters"
] as const;

export const setDefaultAsset = mutation({
    args: {
        id: v.string(),
        table: v.string(),
    },
    handler: async (ctx, args) => {
        if (!VALID_TABLES.includes(args.table as any)) {
            throw new Error(`Invalid table name: ${args.table}`);
        }

        const tableName = args.table as any;
        const targetId = args.id as any;

        // Verify the asset exists
        const asset = await ctx.db.get(targetId);
        if (!asset) {
            throw new Error(`Asset not found in ${tableName}`);
        }

        // Find the currently default asset in this table
        const currentDefaults = await ctx.db
            .query(tableName)
            .filter((q) => q.eq(q.field("isDefault"), true))
            .collect();

        // Remove the default flag from the current one(s)
        for (const current of currentDefaults) {
            if (current._id !== targetId) {
                await ctx.db.patch(current._id, { isDefault: false });
            }
        }

        // Toggle the target asset
        const isCurrentlyDefault = asset.isDefault === true;
        await ctx.db.patch(targetId, { isDefault: !isCurrentlyDefault });

        return { success: true, isDefault: !isCurrentlyDefault };
    },
});
