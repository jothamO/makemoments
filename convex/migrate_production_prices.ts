import { v } from "convex/values";
import { mutation } from "./_generated/server";

export const migrateAllPrices = mutation({
    args: {
        token: v.optional(v.string()),
    },
    handler: async (ctx) => {
        // 1. Get current base pricing from globalPricing
        const globalPricing = await ctx.db.query("globalPricing").collect();
        const priceMap: Record<string, { ngn: number; usd: number }> = {};
        globalPricing.forEach(p => {
            priceMap[p.category] = p.prices;
        });

        // Default prices if globalPricing is empty for some reason
        const defaults = { ngn: 1500, usd: 0.99 };

        const tables = [
            { name: "musicTracks", category: "music" },
            { name: "globalThemes", category: "themes" },
            { name: "globalFonts", category: "fonts" },
            { name: "globalPatterns", category: "patterns" },
            { name: "globalCharacters", category: "characters" },
        ] as const;

        let totalUpdated = 0;
        let logs: string[] = [];

        for (const table of tables) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const items = await ctx.db.query(table.name as any).collect();
            let tableUpdated = 0;

            for (const item of items) {
                const currentPrice = item.price;
                const isPremium = item.isPremium === true;

                // Check if price is invalid (number or missing)
                const isInvalid = typeof currentPrice === 'number' || !currentPrice || typeof currentPrice.ngn !== 'number';

                if (isInvalid) {
                    const targetPrice = isPremium
                        ? (priceMap[table.category] || defaults)
                        : { ngn: 0, usd: 0 };

                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    await ctx.db.patch(item._id, { price: targetPrice } as any);
                    tableUpdated++;
                }
            }
            logs.push(`${table.name}: Updated ${tableUpdated}/${items.length}`);
            totalUpdated += tableUpdated;
        }

        return {
            status: "Success",
            message: `Updated ${totalUpdated} total documents across ${tables.length} tables.`,
            details: logs
        };
    },
});
