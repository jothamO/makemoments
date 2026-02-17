import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const list = query({
    handler: async (ctx) => {
        return await ctx.db.query("globalFonts").order("desc").collect();
    },
});

export const generateUploadUrl = mutation({
    handler: async (ctx) => {
        return await ctx.storage.generateUploadUrl();
    },
});

export const create = mutation({
    args: {
        name: v.string(),
        isCustom: v.boolean(),
        storageId: v.optional(v.id("_storage")),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("globalFonts")
            .filter((q) => q.eq(q.field("name"), args.name))
            .first();
        if (existing) return existing._id;

        return await ctx.db.insert("globalFonts", {
            name: args.name,
            isCustom: args.isCustom,
            storageId: args.storageId,
            createdAt: Date.now(),
        });
    },
});

export const remove = mutation({
    args: { id: v.id("globalFonts") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.id);
    },
});
