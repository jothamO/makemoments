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

export const remove = mutation({
    args: {
        id: v.id("globalCharacters"),
    },
    handler: async (ctx, args) => {
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
