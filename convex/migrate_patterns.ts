import { mutation } from "./_generated/server";

export const migrate = mutation({
    handler: async (ctx) => {
        const patterns = await ctx.db.query("globalPatterns").collect();
        let updated = 0;

        for (const pattern of patterns) {
            let newType = pattern.type;
            if (pattern.type === "fall") newType = "falling";
            if (pattern.type === "rise") newType = "rising";
            if (pattern.type === "floating") newType = "drift";

            if (newType !== pattern.type) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                await ctx.db.patch(pattern._id, { type: newType as any });
                updated++;
            }
        }

        return `Migration complete. Updated ${updated} patterns.`;
    },
});
