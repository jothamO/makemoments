import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const list = query({
    handler: async (ctx) => {
        return await ctx.db.query("globalPatterns").order("desc").collect();
    },
});

export const create = mutation({
    args: {
        id: v.string(),
        name: v.string(),
        emoji: v.string(),
        type: v.union(v.literal("falling"), v.literal("rising"), v.literal("floating"), v.literal("static")),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("globalPatterns")
            .filter((q) => q.eq(q.field("id"), args.id))
            .first();
        if (existing) return existing._id;

        return await ctx.db.insert("globalPatterns", {
            id: args.id,
            name: args.name,
            emoji: args.emoji,
            type: args.type,
            createdAt: Date.now(),
        });
    },
});

export const update = mutation({
    args: {
        id: v.id("globalPatterns"),
        name: v.string(),
        emoji: v.string(),
        type: v.union(v.literal("falling"), v.literal("rising"), v.literal("floating"), v.literal("static")),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.id, {
            name: args.name,
            emoji: args.emoji,
            type: args.type,
        });
    },
});

export const remove = mutation({
    args: { id: v.id("globalPatterns") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.id);
    },
});
