
import { api } from "./_generated/api";
import { mutation } from "./_generated/server";

export const seedPatterns = mutation({
    handler: async (ctx) => {
        const existing = await ctx.db.query("globalPatterns").collect();

        // v4 Premium Emoji Patterns
        // Matches src/lib/backgroundPatterns.ts
        const defaults = [
            { id: "fire", name: "Fire", emoji: "🔥,✨", type: "rising" },
            { id: "hearts", name: "Hearts", emoji: "❤️,💕,💗,💖,💘", type: "rising" },
            { id: "balloons", name: "Balloons", emoji: "🎈,🎁", type: "rising" },
            { id: "confetti", name: "Confetti", emoji: "🎊,🎉,✨,🎀", type: "falling" },
            { id: "sparkles", name: "Sparkles", emoji: "✨,⭐,💫,🌟", type: "falling" },
            { id: "stars", name: "Stars", emoji: "⭐,🌟,💛,✦", type: "burst" },
            { id: "halloween", name: "Halloween", emoji: "🎃,👻,💀,🕸️", type: "drift" },
            { id: "crowns", name: "Crowns", emoji: "👑,💎,✨", type: "falling" },
            { id: "flowers", name: "Flowers", emoji: "🌸,🌺,🌼,🌷", type: "falling" },
            { id: "butterflies", name: "Butterflies", emoji: "🦋,🌿,🍃", type: "rising" },
            { id: "snow", name: "Snow", emoji: "❄️,❅,❆,✦", type: "falling" },
            { id: "waves", name: "Waves", emoji: "🌊,💧,🌀", type: "drift" },
        ];

        for (const p of defaults) {
            const exists = existing.find(e => e.id === p.id);
            if (!exists) {
                await ctx.db.insert("globalPatterns", {
                    id: p.id,
                    name: p.name,
                    emojis: p.emoji.split(",").map(e => e.trim()),
                    type: p.type as any,
                    createdAt: Date.now(),
                });
                console.log(`Created pattern: ${p.id}`);
            } else {
                // FORCE UPDATE to v4 specs
                await ctx.db.patch(exists._id, {
                    type: p.type as any,
                    emojis: p.emoji.split(",").map(e => e.trim()),
                    name: p.name
                });
                console.log(`Updated legacy pattern: ${p.id}`);
            }
        }
    },
});
