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
        primary: v.string(),
        secondary: v.string(),
        accent: v.string(),
        bgGradientStart: v.string(),
        bgGradientEnd: v.string(),
        textDark: v.string(),
        textLight: v.string(),
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
        name: v.string(),
        primary: v.string(),
        secondary: v.string(),
        accent: v.string(),
        bgGradientStart: v.string(),
        bgGradientEnd: v.string(),
        textDark: v.string(),
        textLight: v.string(),
    },
    handler: async (ctx, args) => {
        const { id, ...data } = args;
        await ctx.db.patch(id, data);
    },
});

export const remove = mutation({
    args: { id: v.id("globalThemes") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.id);
    },
});
