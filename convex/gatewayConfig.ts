import { query, mutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { checkAdmin } from "./auth";

// Get global gateway configuration (returns first record or defaults)
export const get = query({
    handler: async (ctx) => {
        const config = await ctx.db.query("gatewayConfig").first();
        const base = config ?? {
            paystackEnabled: true,
            stripeEnabled: true,
            paystackTestMode: false,
            stripeTestMode: false,
            eventOverrides: [],
            updatedAt: Date.now(),
        };

        // Mask secret keys
        return {
            ...base,
            paystackSecretKey: (base as Record<string, unknown>).paystackSecretKey ? "••••••••" : "",
            stripeSecretKey: (base as Record<string, unknown>).stripeSecretKey ? "••••••••" : "",
        };
    },
});

// Internal version that returns actual keys for backend use
export const getInternal = internalQuery({
    handler: async (ctx) => {
        return await ctx.db.query("gatewayConfig").first();
    },
});

// Update global gateway configuration (upserts the single config record)
export const upsert = mutation({
    args: {
        token: v.optional(v.string()),
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
        if (!(await checkAdmin(ctx, args.token))) {
            throw new Error("Unauthorized");
        }
        const { token, ...dataArgs } = args;
        const existing = await ctx.db.query("gatewayConfig").first();

        const data = {
            ...dataArgs,
            updatedAt: Date.now(),
        };

        if (existing) {
            // If incoming keys are masked, don't overwrite the real ones
            if (data.paystackSecretKey === "••••••••") {
                data.paystackSecretKey = existing.paystackSecretKey;
            }
            if (data.stripeSecretKey === "••••••••") {
                data.stripeSecretKey = existing.stripeSecretKey;
            }
            await ctx.db.patch(existing._id, data);
            return existing._id;
        }

        return await ctx.db.insert("gatewayConfig", data);
    },
});
