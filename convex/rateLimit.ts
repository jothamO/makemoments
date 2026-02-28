import { GenericMutationCtx } from "convex/server";

/**
 * Checks if an action by a specific identifier is within rate limits.
 * 
 * @param ctx - The Convex mutation context
 * @param options - identifier, action name, max count, and window duration in MS
 * @throws Error if the rate limit is exceeded
 */
export async function checkRateLimit(
    ctx: GenericMutationCtx<any>, // eslint-disable-line @typescript-eslint/no-explicit-any
    options: {
        identifier: string;
        action: string;
        limit: number;
        windowMs: number;
    }
) {
    const { identifier, action, limit, windowMs } = options;
    const now = Date.now();

    const record = await ctx.db
        .query("rateLimits")
        .withIndex("by_identifier_action", (q) =>
            q.eq("identifier", identifier).eq("action", action)
        )
        .first();

    if (record) {
        if (now < record.resetAt) {
            if (record.count >= limit) {
                // Return a generic error to prevent leaking specific timing info for brute force
                throw new Error("Too many requests. Please try again later.");
            }

            // Increment count within existing window
            await ctx.db.patch(record._id, {
                count: record.count + 1,
            });
        } else {
            // Window expired, reset
            await ctx.db.patch(record._id, {
                count: 1,
                resetAt: now + windowMs,
            });
        }
    } else {
        // First record for this identifier/action
        await ctx.db.insert("rateLimits", {
            identifier,
            action,
            count: 1,
            resetAt: now + windowMs,
        });
    }
}
