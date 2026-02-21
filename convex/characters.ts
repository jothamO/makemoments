import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
    handler: async (ctx) => {
        const characters = await ctx.db.query("globalCharacters").collect();
        return Promise.all(
            characters.map(async (char) => ({
                ...char,
                url: char.storageId
                    ? await ctx.storage.getUrl(char.storageId)
                    : char.url,
            }))
        );
    },
});

export const create = mutation({
    args: {
        name: v.string(),
        storageId: v.optional(v.id("_storage")),
        url: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("globalCharacters", {
            name: args.name,
            storageId: args.storageId,
            url: args.url,
            createdAt: Date.now(),
        });
    },
});

export const update = mutation({
    args: {
        id: v.id("globalCharacters"),
        name: v.optional(v.string()),
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
    args: {
        id: v.id("globalCharacters"),
    },
    handler: async (ctx, args) => {
        // Safe Delete: Check if used in any events
        const events = await ctx.db.query("events").collect();
        const isUsed = events.some(e => e.theme.characterIds?.includes(args.id));

        if (isUsed) {
            throw new Error("Cannot delete character: It is currently assigned to one or more events.");
        }

        const char = await ctx.db.get(args.id);
        if (char?.storageId) {
            await ctx.storage.delete(char.storageId);
        }
        await ctx.db.delete(args.id);
    },
});

export const generateUploadUrl = mutation({
    handler: async (ctx) => {
        return await ctx.storage.generateUploadUrl();
    },
});
