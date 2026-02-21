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
        fontFamily: v.string(), // Added
        isCustom: v.boolean(),
        storageId: v.optional(v.id("_storage")),
        isPremium: v.optional(v.boolean()), // Added
        price: v.optional(v.number()), // Added
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("globalFonts")
            .filter((q) => q.eq(q.field("name"), args.name))
            .first();
        if (existing) return existing._id;

        return await ctx.db.insert("globalFonts", {
            name: args.name,
            fontFamily: args.fontFamily,
            isCustom: args.isCustom,
            storageId: args.storageId,
            isPremium: args.isPremium,
            price: args.price,
            createdAt: Date.now(),
        });
    },
});

export const updateStorageId = mutation({
    args: {
        id: v.id("globalFonts"),
        storageId: v.id("_storage"),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.id, { storageId: args.storageId });
    },
});

export const update = mutation({
    args: {
        id: v.id("globalFonts"),
        name: v.optional(v.string()),
        fontFamily: v.optional(v.string()),
        isPremium: v.optional(v.boolean()),
        price: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const { id, ...data } = args;
        const updates = Object.fromEntries(Object.entries(data).filter(([_, v]) => v !== undefined));
        if (Object.keys(updates).length > 0) {
            await ctx.db.patch(id, updates);
        }
    },
});

export const remove = mutation({
    args: { id: v.id("globalFonts") },
    handler: async (ctx, args) => {
        // Safe Delete: Check if used in any events
        const events = await ctx.db.query("events").collect();
        const isUsed = events.some(e => e.theme.allowedFontIds?.includes(args.id));

        if (isUsed) {
            throw new Error("Cannot delete font: It is currently whitelisted for one or more events.");
        }

        await ctx.db.delete(args.id);
    },
});
