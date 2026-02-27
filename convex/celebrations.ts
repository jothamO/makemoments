import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { checkAdmin } from "./auth";

// --- Strict Validators (Shared with Schema) ---

const ImageTransformValidator = v.object({
    x: v.number(),
    y: v.number(),
    xp: v.optional(v.number()),
    yp: v.optional(v.number()),
    width: v.number(),
    rotation: v.number(),
});

const PhotoValidator = v.object({
    id: v.string(),
    url: v.string(),
    transform: ImageTransformValidator,
});

const StoryPageValidator = v.object({
    id: v.string(),
    photos: v.optional(v.array(PhotoValidator)),
    text: v.string(),
    fontFamily: v.string(),
    fontSize: v.union(v.literal("small"), v.literal("medium"), v.literal("large")),
    textAlign: v.union(v.literal("left"), v.literal("center"), v.literal("right")),
    textColor: v.string(),
    themeId: v.optional(v.string()),
    baseColor: v.optional(v.string()), // Legacy: bgGradientStart/End
    bgGradientStart: v.optional(v.string()),
    bgGradientEnd: v.optional(v.string()),
    glowColor: v.optional(v.string()),
    transition: v.union(v.literal("fade"), v.literal("slide"), v.literal("zoom"), v.literal("flip")),
    backgroundPattern: v.optional(v.string()),
    stickers: v.array(v.object({
        emoji: v.string(),
        x: v.number(),
        y: v.number(),
    })),
    type: v.optional(v.union(v.literal("light"), v.literal("dark"))),
});

export const create = mutation({
    args: {
        eventId: v.id("events"),
        slug: v.string(),
        email: v.string(),
        pages: v.array(StoryPageValidator),
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
    args: { token: v.optional(v.string()) },
    handler: async (ctx, args) => {
        if (!(await checkAdmin(ctx, args.token))) {
            throw new Error("Unauthorized");
        }
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
                eventName: event?.name || "Unknown Event",
            });
        }
        return results;
    },
});

export const updateStatus = mutation({
    args: {
        token: v.optional(v.string()),
        id: v.id("celebrations"),
        status: v.union(v.literal("pending"), v.literal("paid"), v.literal("failed"))
    },
    handler: async (ctx, args) => {
        if (!(await checkAdmin(ctx, args.token))) {
            throw new Error("Unauthorized");
        }
        await ctx.db.patch(args.id, { paymentStatus: args.status });
    },
});
