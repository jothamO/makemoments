import { mutation } from "./_generated/server";

export const seed = mutation({
    handler: async (ctx) => {
        const fonts = [
            { name: "System UI", isCustom: false },
            { name: "Georgia", isCustom: false },
            { name: "Caveat", isCustom: false },
            { name: "Comic Neue", isCustom: false },
            { name: "Inter", isCustom: false },
            { name: "Playfair Display", isCustom: false },
            { name: "Dancing Script", isCustom: false },
            { name: "Pacifico", isCustom: false },
            { name: "Great Vibes", isCustom: false },
            { name: "Satisfy", isCustom: false },
            { name: "Tangerine", isCustom: false },
            { name: "Quicksand", isCustom: false },
            { name: "Lora", isCustom: false },
            { name: "Sacramento", isCustom: false },
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
