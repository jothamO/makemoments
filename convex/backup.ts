import { query } from "./_generated/server";

export const exportAll = query({
    handler: async (ctx) => {
        const tables = [
            "events",
            "musicTracks",
            "celebrations",
            "globalThemes",
            "globalFonts",
            "globalPatterns",
            "globalCharacters",
            "globalPricing",
        ];

        const data: Record<string, any[]> = {};
        for (const table of tables) {
            data[table] = await ctx.db.query(table as any).collect();
        }
        return data;
    },
});
