import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { checkAdmin } from "./auth";

export const list = query({
    handler: async (ctx) => {
        return await ctx.db.query("globalThemes").order("desc").collect();
    },
});

export const create = mutation({
    args: {
        token: v.optional(v.string()),
        name: v.string(),
        baseColor: v.string(),
        glowColor: v.string(),
        type: v.union(v.literal("light"), v.literal("dark")),
    },
    handler: async (ctx, args) => {
        if (!(await checkAdmin(ctx, args.token))) {
            throw new Error("Unauthorized");
        }
        const { token, ...data } = args;
        return await ctx.db.insert("globalThemes", {
            ...data,
            createdAt: Date.now(),
        });
    },
});

export const update = mutation({
    args: {
        token: v.optional(v.string()),
        id: v.id("globalThemes"),
        name: v.optional(v.string()),
        baseColor: v.optional(v.string()),
        glowColor: v.optional(v.string()),
        type: v.optional(v.union(v.literal("light"), v.literal("dark"))),
        isPremium: v.optional(v.boolean()),
        price: v.optional(v.number()),
    },

    handler: async (ctx, args) => {
        if (!(await checkAdmin(ctx, args.token))) {
            throw new Error("Unauthorized");
        }
        const { id, token, ...data } = args;
        // Filter out undefined values so patch only updates provided fields
        const updates = Object.fromEntries(Object.entries(data).filter(([_, v]) => v !== undefined));
        if (Object.keys(updates).length > 0) {
            await ctx.db.patch(id, updates);
        }
    },
});

export const remove = mutation({
    args: { id: v.id("globalThemes"), token: v.optional(v.string()) },
    handler: async (ctx, args) => {
        if (!(await checkAdmin(ctx, args.token))) {
            throw new Error("Unauthorized");
        }
        // Safe Delete: Check if used in any events
        const events = await ctx.db.query("events").collect();
        const isUsed = events.some(e => e.theme.allowedThemeIds?.includes(args.id));

        if (isUsed) {
            throw new Error("Cannot delete theme: It is currently whitelisted for one or more events.");
        }

        // Handle Default Fallback
        const theme = await ctx.db.get(args.id);
        if (theme?.isDefault) {
            const candidates = await ctx.db.query("globalThemes").order("desc").take(2);
            const fallback = candidates.find(c => c._id !== args.id);
            if (fallback) {
                await ctx.db.patch(fallback._id, { isDefault: true });
            }
        }

        await ctx.db.delete(args.id);
    },
});
