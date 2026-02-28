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

export const bulkUpdate = mutation({
    args: {
        token: v.optional(v.string()),
        categoryPrices: v.array(v.object({
            category: v.string(),
            prices: v.object({ ngn: v.number(), usd: v.number() })
        })),
        assetPremiumStatus: v.array(v.object({
            type: v.union(v.literal("theme"), v.literal("font"), v.literal("music"), v.literal("pattern"), v.literal("character")),
            id: v.string(),
            isPremium: v.boolean()
        }))
    },
    handler: async (ctx, args) => {
        if (!(await checkAdmin(ctx, args.token))) {
            throw new Error("Unauthorized");
        }

        // 1. Update Category Prices
        for (const item of args.categoryPrices) {
            const existing = await ctx.db
                .query("globalPricing")
                .withIndex("by_category", (q) => q.eq("category", item.category))
                .unique();

            if (existing) {
                await ctx.db.patch(existing._id, { prices: item.prices });
            } else {
                await ctx.db.insert("globalPricing", {
                    category: item.category,
                    prices: item.prices,
                });
            }
        }

        // 2. Update Individual Assets
        for (const item of args.assetPremiumStatus) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const id = item.id as any;
            if (item.type === 'theme') await ctx.db.patch(id, { isPremium: item.isPremium });
            if (item.type === 'font') await ctx.db.patch(id, { isPremium: item.isPremium });
            if (item.type === 'music') await ctx.db.patch(id, { isPremium: item.isPremium });
            if (item.type === 'pattern') {
                const existing = await ctx.db.query("globalPatterns").filter(q => q.eq(q.field("id"), item.id)).first();
                if (existing) await ctx.db.patch(existing._id, { isPremium: item.isPremium });
            }
            if (item.type === 'character') {
                const existing = await ctx.db.query("globalCharacters").filter(q => q.eq(q.field("_id"), item.id)).first();
                if (existing) await ctx.db.patch(existing._id, { isPremium: item.isPremium });
            }
        }
    }
});
