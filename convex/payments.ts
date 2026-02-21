import { query, mutation, internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

// Initialize a payment — creates celebration with "pending" status
export const initializePayment = mutation({
    args: {
        eventId: v.id("events"),
        slug: v.string(),
        email: v.string(),
        pages: v.array(v.any()),
        musicTrackId: v.optional(v.id("musicTracks")),
        removeWatermark: v.boolean(),
        hasMusic: v.boolean(),
        customLink: v.boolean(),
        customSlug: v.optional(v.string()),
        hdDownload: v.boolean(),
        totalPaid: v.number(),
        currency: v.optional(v.string()),
        gateway: v.optional(v.string()),
        paymentReference: v.string(),
    },
    handler: async (ctx, args) => {
        const celebrationId = await ctx.db.insert("celebrations", {
            ...args,
            paymentStatus: "pending",
            views: 0,
            expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000,
            createdAt: Date.now(),
        });
        return { celebrationId, reference: args.paymentReference };
    },
});

// Get payment status for real-time polling (client watches this)
export const getPaymentStatus = query({
    args: { celebrationId: v.id("celebrations") },
    handler: async (ctx, args) => {
        const celebration = await ctx.db.get(args.celebrationId);
        if (!celebration) return null;
        return {
            paid: celebration.paymentStatus === "paid",
            slug: celebration.slug,
            paymentStatus: celebration.paymentStatus,
        };
    },
});

// Internal: mark payment as paid (called by webhook handlers)
export const markAsPaid = internalMutation({
    args: { celebrationId: v.id("celebrations") },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.celebrationId, { paymentStatus: "paid" });
    },
});

// Internal: mark payment as failed
export const markAsFailed = internalMutation({
    args: { celebrationId: v.id("celebrations") },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.celebrationId, { paymentStatus: "failed" });
    },
});

// Find celebration by payment reference (used by webhooks)
export const getByReference = internalQuery({
    args: { reference: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db.query("celebrations")
            .filter((q) => q.eq(q.field("paymentReference"), args.reference))
            .first();
    },
});
