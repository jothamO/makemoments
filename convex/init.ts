import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const seed = mutation({
    handler: async (ctx) => {
        // 1. Clear existing data (optional, but good for idempotent seed)
        const now = Date.now();
        const existingEvents = await ctx.db.query("events").collect();
        for (const event of existingEvents) {
            await ctx.db.delete(event._id);
        }
        const existingTemplates = await ctx.db.query("templates").collect();
        for (const template of existingTemplates) {
            await ctx.db.delete(template._id);
        }
        const existingMusic = await ctx.db.query("musicTracks").collect();
        for (const track of existingMusic) {
            await ctx.db.delete(track._id);
        }

        const existingGlobalCharacters = await ctx.db.query("globalCharacters").collect();
        for (const char of existingGlobalCharacters) {
            await ctx.db.delete(char._id);
        }

        // 2. Insert Music Tracks
        const musicIds = [];
        const tracks = [
            { name: "Love Story", artist: "Nastelbom", url: "/music/nastelbom-love-466198.mp3", duration: 83 },
            { name: "Romantic Valentine", artist: "Hitslab", url: "/music/hitslab-love-romantic-valentines-day-481478.mp3", duration: 71 },
            { name: "Peacock Love", artist: "Peacock Music", url: "/music/peacockmusic-romantic-love-valentines-day-481847.mp3", duration: 131 },
            { name: "Deep Love", artist: "Nikita Kondrashev", url: "/music/nikitakondrashev-love-437013.mp3", duration: 116 },
            { name: "Fairy Tale", artist: "Good B Music", url: "/music/good_b_music-cinematic-fairy-tale-story-main-8697.mp3", duration: 127 },
            { name: "The Mountain", artist: "The Mountain", url: "/music/the_mountain-love-481753.mp3", duration: 139 },
        ];
        for (const track of tracks) {
            const id = await ctx.db.insert("musicTracks", track);
            musicIds.push(id);
        }

        // 3. Insert Global Characters
        const charIds = [];
        const charactersArr = [
            { name: "Char 1", url: "/characters/intl womens day/char0.png" },
            { name: "Char 2", url: "/characters/intl womens day/char1.png" },
            { name: "Char 3", url: "/characters/intl womens day/char2.png" },
            { name: "Char 4", url: "/characters/intl womens day/char3.png" },
            { name: "Char 5", url: "/characters/intl womens day/char4.png" },
            { name: "Char 6", url: "/characters/intl womens day/char5.png" },
        ];
        for (const char of charactersArr) {
            const id = await ctx.db.insert("globalCharacters", { ...char, createdAt: now });
            charIds.push(id);
        }

        // 4. Insert Events
        const event1Id = await ctx.db.insert("events", {
            name: "International Women's Day",
            slug: "womens-day",
            date: new Date("2026-03-08").getTime(),
            launchDate: new Date("2026-02-20").getTime(),
            endDate: new Date("2026-03-15").getTime(),
            status: "active",
            theme: {
                primary: "#FF4081",
                secondary: "#FF8C7A",
                accent: "#FFD54F",
                bgGradientStart: "#FF4081",
                bgGradientEnd: "#FF8C7A",
                textDark: "#2D1B30",
                textLight: "#FFFFFF",
                headlineFont: "Playfair Display",
                bodyFont: "Montserrat",
                backgroundPattern: "floral",
                headline: "Celebrate Her Strength",
                subheadline: "Create a beautiful personalized card for the incredible women in your life",
                ctaText: "Create Your Card",
                urgencyText: "🌸 Women's Day is March 8th",
                characterIds: charIds,
                musicTrackIds: musicIds,
                patternIds: ["floral", "hearts"],
            },
            createdAt: now,
        });

        // 5. Insert Templates (One Standard Template for the event)
        await ctx.db.insert("templates", {
            eventId: event1Id,
            name: "Standard Poster",
            thumbnail: "/placeholder.svg",
            outputType: "image",
            mediaSlots: [
                { id: "ms-1", label: "Main Photo", type: "photo", position: { x: 10, y: 10, width: 80, height: 50 }, required: true },
            ],
            textSlots: [
                { id: "ts-1", label: "Headline", placeholder: "Happy Celebration!", maxLength: 40, position: { x: 10, y: 65, width: 80, height: 10 }, style: { fontSize: 32, fontFamily: "Playfair Display", color: "#FFFFFF" } },
            ],
            layers: [],
            popularity: 342,
            createdAt: now,
        });

        // 5. Seed Global Assets
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
            await ctx.db.insert("globalThemes", { ...theme, createdAt: now });
        }

        const globalFonts = [
            { name: "Playfair Display", isCustom: false },
            { name: "Montserrat", isCustom: false },
            { name: "Inter", isCustom: false },
            { name: "Roboto", isCustom: false },
            { name: "Bebas Neue", isCustom: false },
            { name: "Lora", isCustom: false },
            { name: "Pacifico", isCustom: false },
            { name: "Dancing Script", isCustom: false },
        ];
        for (const font of globalFonts) {
            await ctx.db.insert("globalFonts", { ...font, createdAt: now });
        }

        const globalPatterns = [
            { id: "floral", name: "Floral", emoji: "🌸" },
            { id: "hearts", name: "Hearts", emoji: "💖" },
            { id: "stars", name: "Stars", emoji: "✨" },
            { id: "celebration", name: "Celebration", emoji: "🎉" },
            { id: "geometric", name: "Geometric", emoji: "💠" },
            { id: "fire", name: "Fire", emoji: "🔥" },
            { id: "crowns", name: "Crowns", emoji: "👑" },
            { id: "balloons", name: "Balloons", emoji: "🎈" },
        ];
        for (const pattern of globalPatterns) {
            await ctx.db.insert("globalPatterns", { ...pattern, createdAt: now });
        }
    },
});
