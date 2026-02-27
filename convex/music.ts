import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { checkAdmin } from "./auth";

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
    args: { token: v.optional(v.string()) },
    handler: async (ctx, args) => {
        if (!(await checkAdmin(ctx, args.token))) {
            throw new Error("Unauthorized");
        }
        return await ctx.storage.generateUploadUrl();
    },
});

export const updateStorageId = mutation({
    args: {
        token: v.optional(v.string()),
        id: v.id("musicTracks"),
        storageId: v.id("_storage"),
    },
    handler: async (ctx, args) => {
        if (!(await checkAdmin(ctx, args.token))) {
            throw new Error("Unauthorized");
        }
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

export const getById = query({
    args: { id: v.id("musicTracks") },
    handler: async (ctx, args) => {
        const track = await ctx.db.get(args.id);
        if (!track) return null;

        return {
            ...track,
            url: track.storageId
                ? await ctx.storage.getUrl(track.storageId)
                : track.url,
        };
    },
});

export const update = mutation({
    args: {
        token: v.optional(v.string()),
        id: v.id("musicTracks"),
        name: v.optional(v.string()),
        artist: v.optional(v.string()),
        duration: v.optional(v.number()),
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

export const rename = mutation({
    args: {
        token: v.optional(v.string()),
        id: v.id("musicTracks"),
        name: v.string(),
    },
    handler: async (ctx, args) => {
        if (!(await checkAdmin(ctx, args.token))) {
            throw new Error("Unauthorized");
        }
        await ctx.db.patch(args.id, { name: args.name });
    },
});

export const create = mutation({
    args: {
        token: v.optional(v.string()),
        name: v.string(),
        artist: v.string(),
        duration: v.number(),
        url: v.optional(v.string()),
        storageId: v.optional(v.id("_storage")),
        isPremium: v.optional(v.boolean()),
        price: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        if (!(await checkAdmin(ctx, args.token))) {
            throw new Error("Unauthorized");
        }
        const { token, ...data } = args;
        return await ctx.db.insert("musicTracks", data);
    },
});

export const remove = mutation({
    args: { id: v.id("musicTracks"), token: v.optional(v.string()) },
    handler: async (ctx, args) => {
        if (!(await checkAdmin(ctx, args.token))) {
            throw new Error("Unauthorized");
        }
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

        // Handle Default Fallback
        if (track?.isDefault) {
            // Find the most recently created asset that isn't this one
            const nextBest = await ctx.db.query("musicTracks")
                .order("desc")
                .first();
            // Since we can't filter out args.id easily in convex before .first(), let's collect a few and pick
            const candidates = await ctx.db.query("musicTracks").order("desc").take(2);
            const fallback = candidates.find(c => c._id !== args.id);
            if (fallback) {
                await ctx.db.patch(fallback._id, { isDefault: true });
            }
        }

        if (track?.storageId) {
            await ctx.storage.delete(track.storageId);
        }
        await ctx.db.delete(args.id);
    },
});
