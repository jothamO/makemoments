import { query, mutation, internalAction } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

// List all exchange rates
export const list = query({
    handler: async (ctx) => {
        return await ctx.db.query("exchangeRates").collect();
    },
});

// Get rate for a specific currency pair
export const getRate = query({
    args: { fromCurrency: v.string(), toCurrency: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("exchangeRates")
            .withIndex("by_pair", (q) =>
                q.eq("fromCurrency", args.fromCurrency).eq("toCurrency", args.toCurrency)
            )
            .first();
    },
});

// Create or update an exchange rate
export const upsert = mutation({
    args: {
        fromCurrency: v.string(),
        toCurrency: v.string(),
        rate: v.number(),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("exchangeRates")
            .withIndex("by_pair", (q) =>
                q.eq("fromCurrency", args.fromCurrency).eq("toCurrency", args.toCurrency)
            )
            .first();

        if (existing) {
            await ctx.db.patch(existing._id, {
                rate: args.rate,
                updatedAt: Date.now(),
            });
            return existing._id;
        }

        return await ctx.db.insert("exchangeRates", {
            fromCurrency: args.fromCurrency,
            toCurrency: args.toCurrency,
            rate: args.rate,
            updatedAt: Date.now(),
        });
    },
});

// Delete an exchange rate
export const remove = mutation({
    args: { id: v.id("exchangeRates") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.id);
    },
});

// Currencies we care about
const SUPPORTED_TARGETS = ["NGN", "GHS", "KES", "ZAR", "XOF", "GBP", "EUR", "CAD"];

// Internal action: fetch live rates from open.er-api.com (free, no key needed)
export const fetchLiveRates = internalAction({
    handler: async (ctx) => {
        try {
            const res = await fetch("https://open.er-api.com/v6/latest/USD");
            if (!res.ok) {
                console.error(`Exchange rate API returned ${res.status}`);
                return;
            }

            const data = await res.json();
            if (data.result !== "success" || !data.rates) {
                console.error("Exchange rate API returned unexpected format", data);
                return;
            }

            // Upsert each supported currency
            for (const code of SUPPORTED_TARGETS) {
                // eslint-disable-next-line security/detect-object-injection
                const rate = data.rates[code];
                if (rate && typeof rate === "number") {
                    await ctx.runMutation(internal.exchangeRates.upsert, {
                        fromCurrency: "USD",
                        toCurrency: code,
                        rate,
                    });
                }
            }

            console.log(`✅ Exchange rates updated: ${SUPPORTED_TARGETS.join(", ")}`);
        } catch (error) {
            console.error("Failed to fetch exchange rates:", error);
        }
    },
});

