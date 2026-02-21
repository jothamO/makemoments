import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const list = query({
    handler: async (ctx) => {
        const tracks = await ctx.db.query("musicTracks").collect();
        // For tracks with a storageId, generate a temporary URL
        return Promise.all(
            tracks.map(async (track) => ({
                ...track,
                url: track.storageId
                    ? await ctx.storage.getUrl(track.storageId)
                    : track.url, // Fallback to static URL
            }))
        );
    },
});

export const generateUploadUrl = mutation({
    handler: async (ctx) => {
        return await ctx.storage.generateUploadUrl();
    },
});

export const updateStorageId = mutation({
    args: {
        id: v.id("musicTracks"),
        storageId: v.id("_storage"),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.id, { storageId: args.storageId });
    },
});

export const getByEvent = query({
    args: { eventId: v.id("events") },
    handler: async (ctx, args) => {
        const event = await ctx.db.get(args.eventId);
        if (!event || !event.theme.musicTrackIds) return [];

        const tracks = await Promise.all(
            event.theme.musicTrackIds.map((id) => ctx.db.get(id))
        );

        return Promise.all(
            tracks.filter((t): t is NonNullable<typeof t> => !!t).map(async (track) => ({
                ...track,
                url: track.storageId
                    ? await ctx.storage.getUrl(track.storageId)
                    : track.url,
            }))
        );
    },
});

export const update = mutation({
    args: {
        id: v.id("musicTracks"),
        name: v.optional(v.string()),
        artist: v.optional(v.string()),
        duration: v.optional(v.number()),
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

export const rename = mutation({
    args: {
        id: v.id("musicTracks"),
        name: v.string(),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.id, { name: args.name });
    },
});

export const create = mutation({
    args: {
        name: v.string(),
        artist: v.string(),
        duration: v.number(),
        url: v.optional(v.string()),
        storageId: v.optional(v.id("_storage")),
        isPremium: v.optional(v.boolean()),
        price: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("musicTracks", args);
    },
});

export const remove = mutation({
    args: { id: v.id("musicTracks") },
    handler: async (ctx, args) => {
        // Safe Delete: Check if used in any events
        const events = await ctx.db.query("events").collect();
        const isUsedInEvent = events.some(e => e.theme.musicTrackIds?.includes(args.id));

        if (isUsedInEvent) {
            throw new Error("Cannot delete music: It is currently used in one or more events.");
        }

        // Safe Delete: Check if used in any celebrations (stories)
        const celebrations = await ctx.db.query("celebrations")
            .filter(q => q.eq(q.field("musicTrackId"), args.id))
            .first();

        if (celebrations) {
            throw new Error("Cannot delete music: It is associated with a published story.");
        }

        const track = await ctx.db.get(args.id);
        if (track?.storageId) {
            await ctx.storage.delete(track.storageId);
        }
        await ctx.db.delete(args.id);
    },
});
