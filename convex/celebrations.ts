import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
    args: {
        templateId: v.id("templates"),
        eventId: v.id("events"),
        slug: v.string(),
        email: v.string(),
        pages: v.array(v.any()), // StoryPage[]
        musicTrackId: v.optional(v.id("musicTracks")),
        removeWatermark: v.boolean(),
        hasMusic: v.boolean(),
        customLink: v.boolean(),
        hdDownload: v.boolean(),
        totalPaid: v.number(),
        paymentStatus: v.union(v.literal("pending"), v.literal("paid"), v.literal("failed")),
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
