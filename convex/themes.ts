import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const list = query({
    handler: async (ctx) => {
        return await ctx.db.query("globalThemes").order("desc").collect();
    },
});

export const create = mutation({
    args: {
        name: v.string(),
        baseColor: v.string(),
        glowColor: v.string(),
        type: v.union(v.literal("light"), v.literal("dark")),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("globalThemes", {
            ...args,
            createdAt: Date.now(),
        });
    },
});

export const update = mutation({
    args: {
        id: v.id("globalThemes"),
        name: v.optional(v.string()),
        baseColor: v.optional(v.string()),
        glowColor: v.optional(v.string()),
        type: v.optional(v.union(v.literal("light"), v.literal("dark"))),
        isPremium: v.optional(v.boolean()),
        price: v.optional(v.number()),
    },

    handler: async (ctx, args) => {
        const { id, ...data } = args;
        // Filter out undefined values so patch only updates provided fields
        const updates = Object.fromEntries(Object.entries(data).filter(([_, v]) => v !== undefined));
        if (Object.keys(updates).length > 0) {
            await ctx.db.patch(id, updates);
        }
    },
});

export const remove = mutation({
    args: { id: v.id("globalThemes") },
    handler: async (ctx, args) => {
        // Safe Delete: Check if used in any events
        const events = await ctx.db.query("events").collect();
        const isUsed = events.some(e => e.theme.allowedThemeIds?.includes(args.id));

        if (isUsed) {
            throw new Error("Cannot delete theme: It is currently whitelisted for one or more events.");
        }

        await ctx.db.delete(args.id);
    },
});
