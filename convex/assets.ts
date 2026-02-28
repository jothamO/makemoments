import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { checkAdmin } from "./auth";

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
        token: v.optional(v.string()),
        id: v.string(),
        table: v.string(),
    },
    handler: async (ctx, args) => {
        if (!(await checkAdmin(ctx, args.token))) {
            throw new Error("Unauthorized");
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (!VALID_TABLES.includes(args.table as any)) {
            throw new Error(`Invalid table name: ${args.table}`);
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const tableName = args.table as any;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
