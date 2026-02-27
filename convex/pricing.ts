import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { checkAdmin } from "./auth";

export const list = query({
    handler: async (ctx) => {
        return await ctx.db.query("globalPricing").collect();
    },
});
export const set = mutation({
    args: {
        token: v.optional(v.string()),
        category: v.string(), // "fonts", "music", "patterns", "characters", "themes", "base"
        prices: v.object({
            ngn: v.number(),
            usd: v.number(),
        }),
    },
    handler: async (ctx, args) => {
        if (!(await checkAdmin(ctx, args.token))) {
            throw new Error("Unauthorized");
        }
        const existing = await ctx.db
            .query("globalPricing")
            .withIndex("by_category", (q) => q.eq("category", args.category))
            .unique();

        if (existing) {
            await ctx.db.patch(existing._id, { prices: args.prices });
        } else {
            await ctx.db.insert("globalPricing", {
                category: args.category,
                prices: args.prices,
            });
        }
    },
});

