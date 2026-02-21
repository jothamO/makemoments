import { internalMutation, internalAction } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";

export const processExpirations = internalMutation({
    handler: async (ctx) => {
        const now = Date.now();
        const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
        const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;

        // 1. Handle Expiry (Soft delete)
        const expired = await ctx.db
            .query("celebrations")
            .filter((q) =>
                q.and(
                    q.lte(q.field("expiresAt"), now),
                    q.eq(q.field("deletedAt"), undefined)
                )
            )
            .collect();

        for (const c of expired) {
            await ctx.db.patch(c._id, { deletedAt: now });
            // TODO: Optional - send "Your moment has expired" email
        }

        // 2. Warning Emails (Note: We should probably track if warning was already sent)
        // For simplicity in this first pass, we query and send. 
        // A more robust way would be adding `expiryWarningSent: "30d" | "7d" | "none"` to schema.

        // 30-day warnings
        const warn30 = await ctx.db
            .query("celebrations")
            .filter((q) =>
                q.and(
                    q.lte(q.field("expiresAt"), now + thirtyDaysInMs),
                    q.gt(q.field("expiresAt"), now + thirtyDaysInMs - (24 * 60 * 60 * 1000)),
                    q.eq(q.field("deletedAt"), undefined)
                )
            )
            .collect();

        for (const c of warn30) {
            await ctx.scheduler.runAfter(0, internal.mail.sendExpiryWarning, {
                email: c.email,
                daysLeft: 30,
                slug: c.slug
            });
        }

        // 7-day warnings
        const warn7 = await ctx.db
            .query("celebrations")
            .filter((q) =>
                q.and(
                    q.lte(q.field("expiresAt"), now + sevenDaysInMs),
                    q.gt(q.field("expiresAt"), now + sevenDaysInMs - (24 * 60 * 60 * 1000)),
                    q.eq(q.field("deletedAt"), undefined)
                )
            )
            .collect();

        for (const c of warn7) {
            await ctx.scheduler.runAfter(0, internal.mail.sendExpiryWarning, {
                email: c.email,
                daysLeft: 7,
                slug: c.slug
            });
        }
    },
});
