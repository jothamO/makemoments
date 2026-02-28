
import { api } from "./_generated/api";
import { mutation } from "./_generated/server";

export const seedPatterns = mutation({
    handler: async (ctx) => {
        const existing = await ctx.db.query("globalPatterns").collect();

        // Default patterns to ensure exist
        const defaults = [
            { id: "sparkles", name: "Sparkles", emoji: "✨", type: "falling" },
            { id: "hearts", name: "Hearts", emoji: "💖,💗", type: "floating" },
            { id: "balloons", name: "Balloons", emoji: "🎈,✨", type: "rising" },
            { id: "halloween", name: "Halloween", emoji: "🎃,👻", type: "floating" },
        ];

        for (const p of defaults) {
            const exists = existing.find(e => e.id === p.id);
            if (!exists) {
                await ctx.db.insert("globalPatterns", {
                    id: p.id,
                    name: p.name,
                    emoji: p.emoji,
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    type: p.type as any,
                    createdAt: Date.now(),
                });
                console.log(`Created pattern: ${p.id}`);
            } else {
                // Optional: Update existing if we want to enforce defaults
                // await ctx.db.patch(exists._id, { type: p.type as any, emoji: p.emoji });
                console.log(`Pattern exists: ${p.id}`);
            }
        }
    },
});
