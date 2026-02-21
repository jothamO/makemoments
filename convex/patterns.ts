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
        emojis: v.array(v.string()),
        type: v.union(
            v.literal("falling"),
            v.literal("rising"),
            v.literal("static"),
            v.literal("burst"),
            v.literal("drift")
        ),
        isPremium: v.optional(v.boolean()),
        price: v.optional(v.number()),
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
            emojis: args.emojis,
            type: args.type,
            isPremium: args.isPremium,
            price: args.price,
            createdAt: Date.now(),
        });
    },
});

export const update = mutation({
    args: {
        id: v.id("globalPatterns"),
        patternId: v.optional(v.string()),
        name: v.optional(v.string()),
        emojis: v.optional(v.array(v.string())),
        type: v.optional(v.union(
            v.literal("falling"),
            v.literal("rising"),
            v.literal("static"),
            v.literal("burst"),
            v.literal("drift")
        )),
        isPremium: v.optional(v.boolean()),
        price: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const { id, patternId, ...rest } = args;
        const updates: Record<string, any> = {};
        if (patternId !== undefined) updates.id = patternId;
        Object.entries(rest).forEach(([k, v]) => { if (v !== undefined) updates[k] = v; });
        if (Object.keys(updates).length > 0) {
            await ctx.db.patch(id, updates);
        }
    },
});

export const remove = mutation({
    args: { id: v.id("globalPatterns") },
    handler: async (ctx, args) => {
        // Safe Delete: Check if used in any events
        const events = await ctx.db.query("events").collect();
        const pattern = await ctx.db.get(args.id);
        const isUsed = events.some(e => e.theme.patternIds?.includes(pattern?.id || ""));

        if (isUsed) {
            throw new Error("Cannot delete pattern: It is currently assigned to one or more events.");
        }

        await ctx.db.delete(args.id);
    },
});
