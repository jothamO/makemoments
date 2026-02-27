import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { checkAdmin } from "./auth";

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
        token: v.optional(v.string()),
        name: v.string(),
        storageId: v.optional(v.id("_storage")),
        url: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        if (!(await checkAdmin(ctx, args.token))) {
            throw new Error("Unauthorized");
        }
        return await ctx.db.insert("globalCharacters", {
            name: args.name,
            storageId: args.storageId,
            url: args.url,
            createdAt: Date.now(),
        });
    },
});

export const updateStorageId = mutation({
    args: {
        token: v.optional(v.string()),
        id: v.id("globalCharacters"),
        storageId: v.id("_storage"),
    },
    handler: async (ctx, args) => {
        if (!(await checkAdmin(ctx, args.token))) {
            throw new Error("Unauthorized");
        }
        await ctx.db.patch(args.id, { storageId: args.storageId });
    },
});

export const update = mutation({
    args: {
        token: v.optional(v.string()),
        id: v.id("globalCharacters"),
        name: v.optional(v.string()),
        isPremium: v.optional(v.boolean()),
        price: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        if (!(await checkAdmin(ctx, args.token))) {
            throw new Error("Unauthorized");
        }
        const { id, token, ...data } = args;
        const updates = Object.fromEntries(Object.entries(data).filter(([_, v]) => v !== undefined));
        if (Object.keys(updates).length > 0) {
            await ctx.db.patch(id, updates);
        }
    },
});

export const remove = mutation({
    args: {
        token: v.optional(v.string()),
        id: v.id("globalCharacters"),
    },
    handler: async (ctx, args) => {
        if (!(await checkAdmin(ctx, args.token))) {
            throw new Error("Unauthorized");
        }
        // Safe Delete: Check if used in any events
        const events = await ctx.db.query("events").collect();
        const isUsed = events.some(e => e.theme.characterIds?.includes(args.id));

        if (isUsed) {
            throw new Error("Cannot delete character: It is currently assigned to one or more events.");
        }

        const char = await ctx.db.get(args.id);

        // Handle Default Fallback
        if (char?.isDefault) {
            const candidates = await ctx.db.query("globalCharacters").order("desc").take(2);
            const fallback = candidates.find(c => c._id !== args.id);
            if (fallback) {
                await ctx.db.patch(fallback._id, { isDefault: true });
            }
        }

        if (char?.storageId) {
            await ctx.storage.delete(char.storageId);
        }
        await ctx.db.delete(args.id);
    },
});

export const generateUploadUrl = mutation({
    args: { token: v.optional(v.string()) },
    handler: async (ctx, args) => {
        if (!(await checkAdmin(ctx, args.token))) {
            throw new Error("Unauthorized");
        }
        return await ctx.storage.generateUploadUrl();
    },
});
