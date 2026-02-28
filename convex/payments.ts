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

        // ── SERVER-SIDE PRICING RE-CALCULATION (Anti-Tamper) ──
        const allPricing = await ctx.db.query("globalPricing").collect();
        const getPrice = (cat: string) => {
            const p = allPricing.find(x => x.category === cat);
            return args.currency === "NGN" ? (p?.prices.ngn ?? 0) : (p?.prices.usd ?? 0);
        };

        const basePrice = getPrice("base") || (args.currency === "NGN" ? 1000 : 0.99);
        let calculatedTotal = basePrice;

        // 1. Extra Slides (>7)
        const extraSlides = Math.max(0, args.pages.length - 7);
        if (extraSlides > 0) {
            calculatedTotal += (getPrice("extraSlide") || 0) * extraSlides;
        }

        // 2. Music
        if (args.musicTrackId) {
            const track = await ctx.db.get(args.musicTrackId);
            if (track?.isPremium) {
                calculatedTotal += getPrice("music") || 0;
            }
        }

        // 3. Fonts
        const usedFonts = Array.from(new Set(args.pages.map(p => p.fontFamily)));
        const allFonts = await ctx.db.query("globalFonts").collect();
        const hasPremiumFont = allFonts.some(f => usedFonts.includes(f.fontFamily) && f.isPremium);
        if (hasPremiumFont) {
            calculatedTotal += getPrice("fonts") || 0;
        }

        // 4. Custom Link
        if (args.customLink) {
            calculatedTotal += getPrice("customLink") || 0;
        }

        // 5. Watermark / HD / Patterns / Characters
        if (args.removeWatermark) calculatedTotal += getPrice("removeWatermark") || 0;
        if (args.hdDownload) calculatedTotal += getPrice("hdDownload") || 0;

        // Patterns & Stickers (Characters)
        const usedPatterns = Array.from(new Set(args.pages.map(p => p.backgroundPattern).filter(Boolean)));
        const allPatterns = await ctx.db.query("globalPatterns").collect();
        if (allPatterns.some(p => usedPatterns.includes(p.id) && p.isPremium)) {
            calculatedTotal += getPrice("patterns") || 0;
        }

        const usedEmojis = Array.from(new Set(args.pages.flatMap(p => p.stickers.map(s => s.emoji))));
        const allChars = await ctx.db.query("globalCharacters").collect();
        if (allChars.some(c => usedEmojis.includes(c.name) && c.isPremium)) {
            calculatedTotal += getPrice("characters") || 0;
        }

        // 3 Character Unlock (Multi-image)
        if (args.pages.some(p => (p.photos?.length || 0) > 1)) {
            calculatedTotal += getPrice("multiImage") || 0;
        }

        // Override totalPaid with server-calculated value
        const finalTotal = isAdmin ? 0 : calculatedTotal;

        const celebrationId = await ctx.db.insert("celebrations", {
            ...celebrationData,
            totalPaid: finalTotal,
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
