import { query, mutation, internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

import { createPasswordHash, checkAdmin } from "./auth";
import { checkRateLimit } from "./rateLimit";

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
        // Auth additions
        createAccount: v.optional(v.boolean()),
        username: v.optional(v.string()),
        password: v.optional(v.string()),
        token: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        // Apply Rate Limit: 5 attempts per minute per email
        await checkRateLimit(ctx, {
            identifier: args.email,
            action: "payment_init",
            limit: 5,
            windowMs: 60 * 1000,
        });

        const { createAccount, username, password, token, ...celebrationData } = args;

        let userId: string | undefined;

        const isAdmin = await checkAdmin(ctx, token);

        if (createAccount && password) {
            // Check if user already exists
            const existing = await ctx.db
                .query("users")
                .withIndex("by_email", q => q.eq("email", args.email))
                .first();

            if (existing) {
                userId = existing._id;
                // If they chose to create account but it exists, we might want to update it
                // but for now let's just link it.
            } else {
                const { hash, salt } = await createPasswordHash(password);
                userId = await ctx.db.insert("users", {
                    email: args.email,
                    username: username,
                    passwordHash: hash,
                    salt: salt,
                    role: "user",
                    isSubscriber: true,
                    createdAt: Date.now(),
                });
            }
        } else {
            // Try to link to existing user if logged in (token check would be better but token is on client)
            // For now we check if a user with this email exists regardless of login
            const existing = await ctx.db
                .query("users")
                .withIndex("by_email", q => q.eq("email", args.email))
                .first();
            if (existing) userId = existing._id;
        }

        const celebrationId = await ctx.db.insert("celebrations", {
            ...celebrationData,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            userId: userId as any,
            paymentStatus: isAdmin ? "paid" : "pending",
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
