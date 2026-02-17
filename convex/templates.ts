import { query } from "./_generated/server";
import { v } from "convex/values";

export const getByEventId = query({
    args: { eventId: v.id("events") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("templates")
            .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
            .collect();
    },
});

export const getById = query({
    args: { id: v.id("templates") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.id);
    },
});

export const list = query({
    handler: async (ctx) => {
        return await ctx.db.query("templates").collect();
    },
});
