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
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("musicTracks", args);
    },
});

export const remove = mutation({
    args: { id: v.id("musicTracks") },
    handler: async (ctx, args) => {
        const track = await ctx.db.get(args.id);
        if (track?.storageId) {
            await ctx.storage.delete(track.storageId);
        }
        await ctx.db.delete(args.id);
    },
});
