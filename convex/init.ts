import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const seed = mutation({
    handler: async (ctx) => {
        const now = Date.now();

        // 1. Seed Music Tracks (If Empty)
        const existingMusic = await ctx.db.query("musicTracks").collect();
        const musicIds = [];
        if (existingMusic.length === 0) {
            const tracks = [
                { name: "Love Story", artist: "Nastelbom", url: "/music/nastelbom-love-466198.mp3", duration: 83 },
                { name: "Romantic Valentine", artist: "Hitslab", url: "/music/hitslab-love-romantic-valentines-day-481478.mp3", duration: 71 },
                { name: "Peacock Love", artist: "Peacock Music", url: "/music/peacockmusic-romantic-love-valentines-day-481847.mp3", duration: 131 },
                { name: "Deep Love", artist: "Nikita Kondrashev", url: "/music/nikitakondrashev-love-437013.mp3", duration: 116 },
                { name: "Fairy Tale", artist: "Good B Music", url: "/music/good_b_music-cinematic-fairy-tale-story-main-8697.mp3", duration: 127 },
                { name: "The Mountain", artist: "The Mountain", url: "/music/the_mountain-love-481753.mp3", duration: 139 },
            ];
            for (const track of tracks) {
                const id = await ctx.db.insert("musicTracks", { ...track, isPremium: false, price: 0 });
                musicIds.push(id);
            }
        } else {
            musicIds.push(...existingMusic.map(m => m._id));
        }

        // 2. Seed Global Characters (Incremental)
        const charactersArr = Array.from({ length: 16 }, (_, i) => ({
            name: `Char ${i + 1}`,
            url: `/characters/intl womens day/char${i}.png`
        }));
        const charIds = [];
        for (const char of charactersArr) {
            const existing = await ctx.db.query("globalCharacters").withIndex("by_url", q => q.eq("url", char.url)).first();
            if (existing) {
                charIds.push(existing._id);
            } else {
                const id = await ctx.db.insert("globalCharacters", { ...char, createdAt: now });
                charIds.push(id);
            }
        }

        // 3. Seed International Women's Day Event (Incremental Sync)
        const existingEvent = await ctx.db.query("events").withIndex("by_slug", q => q.eq("slug", "womens-day")).first();
        const eventData = {
            name: "International Women's Day",
            slug: "womens-day",
            date: new Date("2026-03-08").getTime(),
            launchDate: new Date("2026-02-20").getTime(),
            endDate: new Date("2026-03-15").getTime(),
            status: "active" as const,
            tier: 1 as const,
            kind: "recurring" as const,
            theme: {
                headline: "Celebrate Her Strength",
                subheadline: "Create a beautiful personalized card for the incredible women in your life",
                ctaText: "Create Your Card",
                urgencyText: "🌸 Women's Day is March 8th",
                characterIds: charIds,
                musicTrackIds: musicIds,
                allowedFontIds: [],
                patternIds: ["floral", "hearts"],
                baseColor: "#FF4081",
                glowColor: "#FF8C7A",
                type: "dark" as const
            },
            createdAt: now,
        };

        if (!existingEvent) {
            await ctx.db.insert("events", eventData);
        } else {
            // Always refresh theme and whitelists to ensure sync with seed data
            await ctx.db.patch(existingEvent._id, {
                theme: {
                    ...eventData.theme, // Use seed defaults as base
                    ...existingEvent.theme, // Preserve manual overrides if any? Actually, seed should probably win for these fields
                    characterIds: charIds, // Always force latest IDs
                    musicTrackIds: musicIds, // Always force latest IDs
                    patternIds: eventData.theme.patternIds, // Force seed patterns
                }
            });
        }

        // 4. Seed Global Themes (If Empty)
        const existingThemes = await ctx.db.query("globalThemes").collect();
        if (existingThemes.length === 0) {
            const globalThemes = [
                { name: "Mint", primary: "#E2F0E9", secondary: "#C5E3D5", accent: "#2D3436", bgGradientStart: "#E2F0E9", bgGradientEnd: "#C5E3D5", textDark: "#18181B", textLight: "#FFFFFF" },
                { name: "Sky", primary: "#E0F2FE", secondary: "#BAE6FD", accent: "#0369A1", bgGradientStart: "#E0F2FE", bgGradientEnd: "#BAE6FD", textDark: "#082F49", textLight: "#FFFFFF" },
                { name: "Peach", primary: "#FFEDD5", secondary: "#FED7AA", accent: "#C2410C", bgGradientStart: "#FFEDD5", bgGradientEnd: "#FED7AA", textDark: "#431407", textLight: "#FFFFFF" },
                { name: "Banana", primary: "#FEF9C3", secondary: "#FEF08A", accent: "#A16207", bgGradientStart: "#FEF9C3", bgGradientEnd: "#FEF08A", textDark: "#422006", textLight: "#FFFFFF" },
                { name: "Coral", primary: "#FEE2E2", secondary: "#FECACA", accent: "#B91C1C", bgGradientStart: "#FEE2E2", bgGradientEnd: "#FECACA", textDark: "#450A0A", textLight: "#FFFFFF" },
                { name: "Purple", primary: "#F5F3FF", secondary: "#EDE9FE", accent: "#7C3AED", bgGradientStart: "#F5F3FF", bgGradientEnd: "#EDE9FE", textDark: "#2E1065", textLight: "#FFFFFF" },
                { name: "Pink", primary: "#FCE7F3", secondary: "#FBCFE8", accent: "#DB2777", bgGradientStart: "#FCE7F3", bgGradientEnd: "#FBCFE8", textDark: "#500724", textLight: "#FFFFFF" },
                { name: "Wine", primary: "#FDF2F8", secondary: "#F9A8D4", accent: "#BE185D", bgGradientStart: "#FDF2F8", bgGradientEnd: "#F9A8D4", textDark: "#500724", textLight: "#FFFFFF" },
                { name: "Forest", primary: "#F0FDF4", secondary: "#DCFCE7", accent: "#15803D", bgGradientStart: "#F0FDF4", bgGradientEnd: "#DCFCE7", textDark: "#052E16", textLight: "#FFFFFF" },
                { name: "Gold", primary: "#FEFCE8", secondary: "#FEF9C3", accent: "#A16207", bgGradientStart: "#FEFCE8", bgGradientEnd: "#FEF9C3", textDark: "#422006", textLight: "#FFFFFF" },
                { name: "Rose", primary: "#FFF1F2", secondary: "#FFE4E6", accent: "#BE123C", bgGradientStart: "#FFF1F2", bgGradientEnd: "#FFE4E6", textDark: "#4C0519", textLight: "#FFFFFF" },
                { name: "Lavender", primary: "#F5F3FF", secondary: "#EDE9FE", accent: "#6D28D9", bgGradientStart: "#F5F3FF", bgGradientEnd: "#EDE9FE", textDark: "#2E1065", textLight: "#FFFFFF" },
                { name: "Lemon", primary: "#FEFCE8", secondary: "#FEF9C3", accent: "#A16207", bgGradientStart: "#FEFCE8", bgGradientEnd: "#FEF9C3", textDark: "#422006", textLight: "#FFFFFF" },
                { name: "Slate", primary: "#F8FAFC", secondary: "#F1F5F9", accent: "#334155", bgGradientStart: "#F8FAFC", bgGradientEnd: "#F1F5F9", textDark: "#0F172A", textLight: "#FFFFFF" },
                { name: "Sunset", primary: "#FFF7ED", secondary: "#FFEDD5", accent: "#C2410C", bgGradientStart: "#FFF7ED", bgGradientEnd: "#FFEDD5", textDark: "#431407", textLight: "#FFFFFF" },
                { name: "Teal", primary: "#F0FDF8", secondary: "#CCFBF1", accent: "#0F766E", bgGradientStart: "#F0FDF8", bgGradientEnd: "#CCFBF1", textDark: "#042F2E", textLight: "#FFFFFF" },
                { name: "Midnight", primary: "#EEF2FF", secondary: "#E0E7FF", accent: "#4338CA", bgGradientStart: "#EEF2FF", bgGradientEnd: "#E0E7FF", textDark: "#1E1B4B", textLight: "#FFFFFF" },
                { name: "Ocean", primary: "#F0F9FF", secondary: "#E0F2FE", accent: "#0369A1", bgGradientStart: "#F0F9FF", bgGradientEnd: "#E0F2FE", textDark: "#082F49", textLight: "#FFFFFF" },
                { name: "Noir", primary: "#FAFAFA", secondary: "#F4F4F5", accent: "#18181B", bgGradientStart: "#FAFAFA", bgGradientEnd: "#F4F4F5", textDark: "#09090B", textLight: "#FFFFFF" },
                { name: "Violet", primary: "#FAF5FF", secondary: "#F3E8FF", accent: "#7E22CE", bgGradientStart: "#FAF5FF", bgGradientEnd: "#F3E8FF", textDark: "#2E1065", textLight: "#FFFFFF" },
            ];
            for (const theme of globalThemes) {
                await ctx.db.insert("globalThemes", {
                    name: theme.name,
                    type: (theme as any).type || "light",
                    baseColor: (theme as any).baseColor || theme.primary,
                    glowColor: (theme as any).glowColor || theme.secondary,
                    createdAt: now
                });
            }
        }

        // 5. Seed Global Fonts (If Empty)
        const existingFonts = await ctx.db.query("globalFonts").collect();
        if (existingFonts.length === 0) {
            const globalFonts = [
                { name: "Playfair Display", fontFamily: "'Playfair Display', serif", isCustom: false },
                { name: "Montserrat", fontFamily: "'Montserrat', sans-serif", isCustom: false },
                { name: "Inter", fontFamily: "'Inter', sans-serif", isCustom: false },
                { name: "Roboto", fontFamily: "'Roboto', sans-serif", isCustom: false },
                { name: "Bebas Neue", fontFamily: "'Bebas Neue', cursice", isCustom: false },
                { name: "Lora", fontFamily: "'Lora', serif", isCustom: false },
                { name: "Pacifico", fontFamily: "'Pacifico', cursive", isCustom: false },
                { name: "Dancing Script", fontFamily: "'Dancing Script', cursive", isCustom: false },
            ];
            for (const font of globalFonts) {
                await ctx.db.insert("globalFonts", { ...font, createdAt: now });
            }
        }

        // 6. Seed Global Patterns (If Empty)
        const existingPatterns = await ctx.db.query("globalPatterns").collect();
        if (existingPatterns.length === 0) {
            const globalPatterns = [
                { id: "floral", name: "Floral", emojis: ["🌸"], type: "drift" as const },
                { id: "hearts", name: "Hearts", emojis: ["💖"], type: "rising" as const },
                { id: "stars", name: "Stars", emojis: ["✨"], type: "static" as const },
                { id: "celebration", name: "Celebration", emojis: ["🎉"], type: "falling" as const },
                { id: "geometric", name: "Geometric", emojis: ["💠"], type: "static" as const },
                { id: "fire", name: "Fire", emojis: ["🔥"], type: "burst" as const },
                { id: "crowns", name: "Crowns", emojis: ["👑"], type: "static" as const },
                { id: "balloons", name: "Balloons", emojis: ["🎈"], type: "rising" as const },
            ];
            for (const pattern of globalPatterns) {
                await ctx.db.insert("globalPatterns", { ...pattern, createdAt: now });
            }
        }

        // 7. Seed Global Pricing Matrix (Upsert by Category)
        const pricingCategories = [
            { category: "base", prices: { ngn: 1000, usd: 0.99 } },
            { category: "themes", prices: { ngn: 500, usd: 0.49 } },
            { category: "fonts", prices: { ngn: 500, usd: 0.49 } },
            { category: "music", prices: { ngn: 500, usd: 0.49 } },
            { category: "patterns", prices: { ngn: 500, usd: 0.49 } },
            { category: "characters", prices: { ngn: 500, usd: 0.49 } },
        ];

        for (const pc of pricingCategories) {
            const existing = await ctx.db.query("globalPricing").withIndex("by_category", q => q.eq("category", pc.category)).first();
            if (existing) {
                await ctx.db.patch(existing._id, { prices: pc.prices });
            } else {
                await ctx.db.insert("globalPricing", pc);
            }
        }
    },
});
