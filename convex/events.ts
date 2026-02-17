import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getActive = query({
    handler: async (ctx) => {
        const now = Date.now();
        return await ctx.db
            .query("events")
            .filter((q) =>
                q.and(
                    q.lte(q.field("launchDate"), now),
                    q.gte(q.field("endDate"), now)
                )
            )
            .first();
    },
});

export const getUpcoming = query({
    handler: async (ctx) => {
        const now = Date.now();
        return await ctx.db
            .query("events")
            .filter((q) => q.gt(q.field("launchDate"), now))
            .order("asc")
            .take(4);
    },
});

export const getBySlug = query({
    args: { slug: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("events")
            .withIndex("by_slug", (q) => q.eq("slug", args.slug))
            .first();
    },
});

export const getAll = query({
    handler: async (ctx) => {
        return await ctx.db.query("events").collect();
    },
});

export const getById = query({
    args: { id: v.id("events") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.id);
    },
});

export const create = mutation({
    args: {
        name: v.string(),
        slug: v.string(),
        date: v.number(),
        launchDate: v.number(),
        endDate: v.number(),
        status: v.union(v.literal("upcoming"), v.literal("active"), v.literal("ended")),
        theme: v.any(),
    },
    handler: async (ctx, args) => {
        const eventId = await ctx.db.insert("events", {
            ...args,
            createdAt: Date.now(),
        });

        // Create the "Standard Slide" template automatically for every new event
        await ctx.db.insert("templates", {
            eventId,
            name: "Standard Slide",
            thumbnail: "/placeholder.svg",
            outputType: "image",
            mediaSlots: [
                { id: "ms-1", label: "Front Photo", type: "photo", position: { x: 10, y: 10, width: 80, height: 50 }, required: true },
            ],
            textSlots: [
                { id: "ts-1", label: "Headline", placeholder: "Happy Celebration!", maxLength: 40, position: { x: 10, y: 65, width: 80, height: 10 }, style: { fontSize: 32, fontFamily: "Inter", color: "#FFFFFF" } },
            ],
            layers: [],
            popularity: 0,
            createdAt: Date.now(),
        });

        return eventId;
    },
});

export const update = mutation({
    args: {
        id: v.id("events"),
        name: v.optional(v.string()),
        slug: v.optional(v.string()),
        date: v.optional(v.number()),
        launchDate: v.optional(v.number()),
        endDate: v.optional(v.number()),
        status: v.optional(v.union(v.literal("upcoming"), v.literal("active"), v.literal("ended"))),
        theme: v.optional(v.any()),
    },
    handler: async (ctx, args) => {
        const { id, ...rest } = args;
        await ctx.db.patch(id, rest);
    },
});

export const remove = mutation({
    args: { id: v.id("events") },
    handler: async (ctx, args) => {
        // Also remove templates associated with this event
        const templates = await ctx.db.query("templates")
            .withIndex("by_event", q => q.eq("eventId", args.id))
            .collect();
        for (const t of templates) {
            await ctx.db.delete(t._id);
        }
        await ctx.db.delete(args.id);
    },
});
