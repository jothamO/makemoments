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
        const categoryMap = new Map();
        for (const item of args.categoryPrices) {
            categoryMap.set(item.category, item.prices);
        }

        for (const item of args.assetPremiumStatus) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const id = item.id as any;
            const targetPrice = item.isPremium
                ? (categoryMap.get(item.type === 'character' ? 'characters' :
                    item.type === 'font' ? 'fonts' :
                        item.type === 'music' ? 'music' :
                            item.type === 'pattern' ? 'patterns' : 'themes') || { ngn: 0, usd: 0 })
                : { ngn: 0, usd: 0 };

            if (item.type === 'theme') {
                await ctx.db.patch(id, { isPremium: item.isPremium, price: targetPrice });
            }
            if (item.type === 'font') {
                await ctx.db.patch(id, { isPremium: item.isPremium, price: targetPrice });
            }
            if (item.type === 'music') {
                await ctx.db.patch(id, { isPremium: item.isPremium, price: targetPrice });
            }
            if (item.type === 'pattern') {
                const existing = await ctx.db.query("globalPatterns").filter(q => q.eq(q.field("id"), item.id)).first();
                if (existing) await ctx.db.patch(existing._id, { isPremium: item.isPremium, price: targetPrice });
            }
            if (item.type === 'character') {
                const existing = await ctx.db.get(id);
                if (existing) await ctx.db.patch(existing._id, { isPremium: item.isPremium, price: targetPrice });
            }
        }
    }
});
