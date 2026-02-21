import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

export const subscribe = mutation({
    args: {
        eventId: v.id("events"),
        email: v.optional(v.string()),
        userId: v.optional(v.id("users")),
    },
    handler: async (ctx, args) => {
        const { eventId, email, userId } = args;

        // If userId is provided, we fetch the email from the user record
        let effectiveEmail = email;
        if (userId) {
            const user = await ctx.db.get(userId);
            if (user) {
                effectiveEmail = user.email;
            }
        }

        if (!effectiveEmail) {
            throw new Error("Email is required for notification subscription.");
        }

        // Check for existing subscription to prevent duplicates
        const existing = await ctx.db
            .query("eventNotifications")
            .withIndex("by_email_event", (q) => q.eq("email", effectiveEmail!).eq("eventId", eventId))
            .first();

        if (existing) {
            if (existing.status === "unsubscribed") {
                await ctx.db.patch(existing._id, { status: "pending", updatedAt: Date.now() } as any);
            }
            return existing._id;
        }

        return await ctx.db.insert("eventNotifications", {
            eventId,
            email: effectiveEmail,
            userId,
            status: "pending",
            createdAt: Date.now(),
        });
    },
});

export const unsubscribe = mutation({
    args: {
        email: v.string(),
        eventId: v.optional(v.id("events")),
        status: v.optional(v.union(v.literal("unsubscribed"), v.literal("notified"))),
    },
    handler: async (ctx, args) => {
        const query = ctx.db
            .query("eventNotifications")
            .filter((q) => q.eq(q.field("email"), args.email));

        const notifications = await query.collect();

        for (const notification of notifications) {
            if (!args.eventId || notification.eventId === args.eventId) {
                await ctx.db.patch(notification._id, {
                    status: args.status || "unsubscribed"
                });
            }
        }
    },
});

export const getStats = query({
    handler: async (ctx) => {
        const notifications = await ctx.db.query("eventNotifications").collect();
        const events = await ctx.db.query("events").collect();

        const stats = events.map(event => {
            const eventSubs = notifications.filter(n => n.eventId === event._id);
            return {
                eventId: event._id,
                eventName: event.name,
                total: eventSubs.length,
                pending: eventSubs.filter(n => n.status === "pending").length,
                notified: eventSubs.filter(n => n.status === "notified").length,
            };
        });

        return stats.filter(s => s.total > 0);
    },
});

export const listByEvent = query({
    args: { eventId: v.id("events") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("eventNotifications")
            .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
            .collect();
    },
});

export const listByUser = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        const notifications = await ctx.db
            .query("eventNotifications")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .collect();

        const results = [];
        for (const notification of notifications) {
            const event = await ctx.db.get(notification.eventId);
            if (event) {
                results.push({
                    ...notification,
                    eventName: event.name,
                    eventSlug: event.slug,
                });
            }
        }
        return results;
    },
});
