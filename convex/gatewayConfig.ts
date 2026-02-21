import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get global gateway configuration (returns first record or defaults)
export const get = query({
    handler: async (ctx) => {
        const config = await ctx.db.query("gatewayConfig").first();
        return config ?? {
            paystackEnabled: true,
            stripeEnabled: true,
            paystackTestMode: false,
            stripeTestMode: false,
            eventOverrides: [],
            updatedAt: Date.now(),
        };
    },
});

// Update global gateway configuration (upserts the single config record)
export const upsert = mutation({
    args: {
        paystackEnabled: v.boolean(),
        stripeEnabled: v.boolean(),
        paystackTestMode: v.optional(v.boolean()),
        stripeTestMode: v.optional(v.boolean()),
        paystackPublicKey: v.optional(v.string()),
        paystackSecretKey: v.optional(v.string()),
        stripePublishableKey: v.optional(v.string()),
        stripeSecretKey: v.optional(v.string()),
        eventOverrides: v.optional(v.array(v.object({
            eventId: v.id("events"),
            gateway: v.union(v.literal("paystack"), v.literal("stripe"), v.literal("auto")),
        }))),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db.query("gatewayConfig").first();

        const data = {
            ...args,
            updatedAt: Date.now(),
        };

        if (existing) {
            await ctx.db.patch(existing._id, data);
            return existing._id;
        }

        return await ctx.db.insert("gatewayConfig", data);
    },
});
