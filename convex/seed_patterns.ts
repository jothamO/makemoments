import { mutation } from "./_generated/server";

export const seedPatterns = mutation({
    handler: async (ctx) => {
        const patterns = [
            { id: "fire", name: "Fire", emoji: "🔥,🧡,💥", type: "rising" },
            { id: "crowns", name: "Crowns", emoji: "👑,💎,👸", type: "falling" },
            { id: "balloons", name: "Balloons", emoji: "🎈,🪁,🔮", type: "rising" },
            { id: "hearts", name: "Hearts", emoji: "💖,💗,💓,💝", type: "rising" },
            { id: "floral", name: "Floral", emoji: "🌸,🌺,🌹,🌷", type: "falling" },
            { id: "stars", name: "Stars", emoji: "⭐,🌟,✨", type: "drift" },
            { id: "celebration", name: "Celebration", emoji: "🎉,🎊,🎈", type: "falling" },
            { id: "geometric", name: "Geometric", emoji: "💠,🔶,🔷", type: "static" },
            { id: "halloween", name: "Halloween", emoji: "👻,🎃,🕸️", type: "drift" },
            // Fix legacy data
            { id: "ghost", name: "Ghost", emoji: "👻", type: "drift" },
            { id: "pumpkin", name: "Pumpkin", emoji: "🎃", type: "drift" },
        ];

        for (const p of patterns) {
            const existing = await ctx.db
                .query("globalPatterns")
                .filter((q) => q.eq(q.field("id"), p.id))
                .first();

            if (!existing) {
                await ctx.db.insert("globalPatterns", {
                    id: p.id,
                    name: p.name,
                    emojis: p.emoji.split(",").map(e => e.trim()),
                    type: p.type as any,
                    createdAt: Date.now(),
                });
            } else {
                // Update existing to ensure type/emoji are fresh
                await ctx.db.patch(existing._id, {
                    emojis: p.emoji.split(",").map(e => e.trim()),
                    type: p.type as any,
                });
            }
        }
        return "Patterns seeded";
    },
});
