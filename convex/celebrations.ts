import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
    args: {
        eventId: v.id("events"),
        slug: v.string(),
        email: v.string(),
        pages: v.array(v.any()), // StoryPage[]
        musicTrackId: v.optional(v.id("musicTracks")),
        removeWatermark: v.boolean(),
        hasMusic: v.boolean(),
        customLink: v.boolean(),
        customSlug: v.optional(v.string()),
        hdDownload: v.boolean(),
        totalPaid: v.number(),
        currency: v.optional(v.string()),
        gateway: v.optional(v.string()),
        paymentStatus: v.union(v.literal("pending"), v.literal("paid"), v.literal("failed")),
        userId: v.optional(v.string()),
        expiresAt: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("celebrations", {
            ...args,
            views: 0,
            createdAt: Date.now(),
        });
    },
});

export const updateViews = mutation({
    args: { id: v.id("celebrations") },
    handler: async (ctx, args) => {
        const celebration = await ctx.db.get(args.id);
        if (celebration) {
            await ctx.db.patch(args.id, { views: celebration.views + 1 });
        }
    },
});

export const list = query({
    handler: async (ctx) => {
        return await ctx.db.query("celebrations").collect();
    },
});

export const getBySlug = query({
    args: { slug: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("celebrations")
            .filter((q) => q.eq(q.field("slug"), args.slug))
            .first();
    },
});

export const incrementViews = mutation({
    args: { slug: v.string() },
    handler: async (ctx, args) => {
        const celebration = await ctx.db
            .query("celebrations")
            .filter((q) => q.eq(q.field("slug"), args.slug))
            .first();
        if (celebration) {
            await ctx.db.patch(celebration._id, { views: (celebration.views || 0) + 1 });
        }
    },
});

export const listByUser = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        const celebrations = await ctx.db
            .query("celebrations")
            .filter((q) => q.eq(q.field("userId"), args.userId))
            .order("desc")
            .collect();

        const results = [];
        for (const c of celebrations) {
            const event = await ctx.db.get(c.eventId);
            results.push({
                ...c,
                eventSlug: event?.slug || "unknown",
                eventName: event?.title || "Unknown Event",
            });
        }
        return results;
    },
});
