import { mutation } from "./_generated/server";

export const seed = mutation({
    handler: async (ctx) => {
        const fonts = [
            { name: "System UI", fontFamily: "system-ui, -apple-system, sans-serif", isCustom: false },
            { name: "Georgia", fontFamily: "Georgia, serif", isCustom: false },
            { name: "Caveat", fontFamily: "Caveat, cursive", isCustom: false },
            { name: "Comic Neue", fontFamily: "'Comic Neue', cursive", isCustom: false },
            { name: "Inter", fontFamily: "Inter, sans-serif", isCustom: false },
            { name: "Playfair Display", fontFamily: "'Playfair Display', serif", isCustom: false },
            { name: "Dancing Script", fontFamily: "'Dancing Script', cursive", isCustom: false },
            { name: "Pacifico", fontFamily: "Pacifico, cursive", isCustom: false },
            { name: "Great Vibes", fontFamily: "'Great Vibes', cursive", isCustom: false },
            { name: "Satisfy", fontFamily: "Satisfy, cursive", isCustom: false },
            { name: "Tangerine", fontFamily: "Tangerine, cursive", isCustom: false },
            { name: "Quicksand", fontFamily: "Quicksand, sans-serif", isCustom: false },
            { name: "Lora", fontFamily: "Lora, serif", isCustom: false },
            { name: "Sacramento", fontFamily: "Sacramento, cursive", isCustom: false },
            { name: "Poppins", fontFamily: "Poppins, sans-serif", isCustom: false },
        ];

        for (const font of fonts) {
            const existing = await ctx.db
                .query("globalFonts")
                .filter((q) => q.eq(q.field("name"), font.name))
                .first();

            if (!existing) {
                await ctx.db.insert("globalFonts", { ...font, createdAt: Date.now() });
            }
        }
    },
});
