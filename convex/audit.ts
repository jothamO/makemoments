import { mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Passive security audit log.
 * Records client-side integrity events for monitoring.
 */
export const logSecurityEvent = mutation({
    args: {
        event: v.string(),
        metadata: v.optional(v.any()),
    },
    handler: async (ctx, args) => {
        await ctx.db.insert("securityAudits", {
            event: args.event,
            metadata: args.metadata,
            timestamp: Date.now(),
        });
    },
});
