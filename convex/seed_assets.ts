import { mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";

// ─── Themes ─────────────────────────────────────────────────────────

const DARK_THEMES = [
    { name: "Midnight Luxe", baseColor: "#0f172a", glowColor: "#38bdf8" },
    { name: "Obsidian Rose", baseColor: "#000000", glowColor: "#fb7185" },
    { name: "Deep Forest", baseColor: "#052e16", glowColor: "#4ade80" },
    { name: "Royal Velvet", baseColor: "#2e1065", glowColor: "#a78bfa" },
    { name: "Galaxy", baseColor: "#020617", glowColor: "#6366f1" },
    { name: "Crimson Night", baseColor: "#450a0a", glowColor: "#f87171" },
    { name: "Charcoal Gold", baseColor: "#1c1917", glowColor: "#fbbf24" },
    { name: "Ocean Depth", baseColor: "#0c4a6e", glowColor: "#0ea5e9" },
    { name: "Amethyst", baseColor: "#3b0764", glowColor: "#d8b4fe" },
    { name: "Slate Minimal", baseColor: "#1e293b", glowColor: "#94a3b8" },
    { name: "Eclipse", baseColor: "#09090b", glowColor: "#e4e4e7" },
    { name: "Neon Cyber", baseColor: "#171717", glowColor: "#22c55e" },
];

const LIGHT_THEMES = [
    { name: "Cotton Candy", baseColor: "#fff1f2", glowColor: "#fda4af" },
    { name: "Morning Mist", baseColor: "#f8fafc", glowColor: "#bae6fd" },
    { name: "Cream & Gold", baseColor: "#fffbeb", glowColor: "#fcd34d" },
    { name: "Mint Fresh", baseColor: "#f0fdf4", glowColor: "#86efac" },
    { name: "Lavender Soft", baseColor: "#faf5ff", glowColor: "#d8b4fe" },
    { name: "Peach Fuzz", baseColor: "#fff7ed", glowColor: "#fdba74" },
    { name: "Classic White", baseColor: "#ffffff", glowColor: "#e2e8f0" },
    { name: "Blush", baseColor: "#fdf2f8", glowColor: "#f9a8d4" },
];

// ─── Fonts ──────────────────────────────────────────────────────────

const FONTS = [
    { name: "Playfair Display", fontFamily: "'Playfair Display', serif", isPremium: false },
    { name: "Montserrat", fontFamily: "'Montserrat', sans-serif", isPremium: false },
    { name: "Dancing Script", fontFamily: "'Dancing Script', cursive", isPremium: false },
    { name: "Inter", fontFamily: "'Inter', sans-serif", isPremium: false },
    { name: "Lora", fontFamily: "'Lora', serif", isPremium: false },
    { name: "Oswald", fontFamily: "'Oswald', sans-serif", isPremium: false },
    { name: "Great Vibes", fontFamily: "'Great Vibes', cursive", isPremium: true, price: 299 },
    { name: "Cinzel", fontFamily: "'Cinzel', serif", isPremium: true, price: 199 },
    { name: "Pacifico", fontFamily: "'Pacifico', cursive", isPremium: false },
    { name: "Satisfy", fontFamily: "'Satisfy', cursive", isPremium: false },
    { name: "Quicksand", fontFamily: "'Quicksand', sans-serif", isPremium: false },
    { name: "Caveat", fontFamily: "'Caveat', cursive", isPremium: false },
];

// ─── Music ──────────────────────────────────────────────────────────

const MUSIC_TRACKS = [
    { name: "Cinematic Fairy Tale", artist: "Good B Music", duration: 180, isPremium: false, url: "/music/good_b_music-cinematic-fairy-tale-story-main-8697.mp3" },
    { name: "Romance (HitsLab)", artist: "HitsLab", duration: 150, isPremium: false, url: "/music/hitslab-love-romantic-valentines-day-481478.mp3" },
    { name: "Love (Nastelbom)", artist: "Nastelbom", duration: 210, isPremium: true, price: 499, url: "/music/nastelbom-love-466198.mp3" },
    { name: "Love (Nikita)", artist: "Nikita", duration: 160, isPremium: true, price: 499, url: "/music/nikitakondrashev-love-437013.mp3" },
    { name: "Romantic Love", artist: "Peacock Music", duration: 240, isPremium: true, price: 999, url: "/music/peacockmusic-romantic-love-valentines-day-481847.mp3" },
    { name: "The Mountain Love", artist: "The Mountain", duration: 190, isPremium: false, url: "/music/the_mountain-love-481753.mp3" },
];

// ─── Characters ─────────────────────────────────────────────────────

const CHARACTERS = Array.from({ length: 16 }, (_, i) => ({
    name: `Valentine Character ${i + 1}`,
    url: `/characters/valentines%20day/char${i}.png`,
}));

// ─── Patterns ───────────────────────────────────────────────────────

const PATTERNS = [
    { id: "confetti", name: "Confetti", emoji: "🎉", type: "falling" },
    { id: "hearts", name: "Hearts", emoji: "❤️", type: "floating" },
    { id: "stars", name: "Stars", emoji: "⭐", type: "static" },
    { id: "sparkles", name: "Sparkles", emoji: "✨", type: "burst" },
    { id: "balloons", name: "Balloons", emoji: "🎈", type: "rising" },
    { id: "flowers", name: "Flowers", emoji: "🌸", type: "drift" },
    { id: "snow", name: "Snow", emoji: "❄️", type: "fall" },
    { id: "bubbles", name: "Bubbles", emoji: "🫧", type: "rising" },
];

export const seedAll = mutation({
    handler: async (ctx) => {
        // 1. Clear existing themes to ensure a fresh start
        const existingThemes = await ctx.db.query("globalThemes").collect();
        for (const t of existingThemes) {
            await ctx.db.delete(t._id);
        }

        // 2. Insert Themes
        for (const t of DARK_THEMES) {
            const existing = await ctx.db.query("globalThemes").filter(q => q.eq(q.field("name"), t.name)).first();
            if (!existing) {
                await ctx.db.insert("globalThemes", {
                    name: t.name,
                    baseColor: t.baseColor,
                    glowColor: t.glowColor,
                    type: "dark",
                    createdAt: Date.now(),
                });
            }
        }

        for (const t of LIGHT_THEMES) {
            const existing = await ctx.db.query("globalThemes").filter(q => q.eq(q.field("name"), t.name)).first();
            if (!existing) {
                await ctx.db.insert("globalThemes", {
                    name: t.name,
                    baseColor: t.baseColor,
                    glowColor: t.glowColor,
                    type: "light",
                    createdAt: Date.now(),
                });
            }
        }

        // 3. Insert Fonts
        for (const f of FONTS) {
            const existing = await ctx.db.query("globalFonts").filter(q => q.eq(q.field("name"), f.name)).first();
            if (!existing) {
                await ctx.db.insert("globalFonts", {
                    name: f.name,
                    fontFamily: f.fontFamily,
                    isCustom: false,
                    isPremium: f.isPremium,
                    price: f.price,
                    createdAt: Date.now(),
                });
            }
        }

        // 4. Insert Music
        for (const m of MUSIC_TRACKS) {
            const existing = await ctx.db.query("musicTracks").filter(q => q.eq(q.field("name"), m.name)).first();
            if (!existing) {
                await ctx.db.insert("musicTracks", {
                    name: m.name,
                    artist: m.artist,
                    duration: m.duration,
                    isPremium: m.isPremium,
                    price: m.price,
                    url: m.url,
                });
            }
        }

        // 5. Insert Patterns
        for (const p of PATTERNS) {
            const existing = await ctx.db.query("globalPatterns").filter(q => q.eq(q.field("id"), p.id)).first();
            if (!existing) {
                await ctx.db.insert("globalPatterns", {
                    id: p.id,
                    name: p.name,
                    emoji: p.emoji,
                    type: p.type as any,
                    price: 0,
                    createdAt: Date.now(),
                });
            }
        }

        // 6. Insert Characters
        for (const c of CHARACTERS) {
            const existing = await ctx.db.query("globalCharacters").filter(q => q.eq(q.field("name"), c.name)).first();
            if (!existing) {
                await ctx.db.insert("globalCharacters", {
                    name: c.name,
                    url: c.url,
                    createdAt: Date.now(),
                });
            }
        }

        return "Seeding Complete!";
    },
});

export const migrateEvents = mutation({
    handler: async (ctx) => {
        const events = await ctx.db.query("events").collect();
        let count = 0;

        for (const event of events) {
            // Check if standard fields are missing
            const theme: any = event.theme;

            // Migration logic:
            // primary -> baseColor
            // glowColor (existing) or secondary -> glowColor
            // default type -> "light"

            const updates: any = {};
            let needsUpdate = false;

            if (!theme.baseColor) {
                updates.baseColor = theme.primary || "#ffffff";
                needsUpdate = true;
            } else {
                updates.baseColor = theme.baseColor;
            }

            if (!theme.glowColor) {
                updates.glowColor = theme.secondary || "#ffffff";
                needsUpdate = true;
            } else {
                updates.glowColor = theme.glowColor;
            }

            if (!theme.type) {
                updates.type = "light"; // Default
                needsUpdate = true;
            } else {
                updates.type = theme.type;
            }

            // Preserve other valid fields
            updates.headline = theme.headline;
            updates.subheadline = theme.subheadline;
            updates.habit = theme.habit; // legacy?
            updates.ctaText = theme.ctaText;
            updates.urgencyText = theme.urgencyText;
            updates.headline_2 = theme.headline_2;
            updates.subheadline_2 = theme.subheadline_2;
            updates.headline_3 = theme.headline_3;
            updates.subheadline_3 = theme.subheadline_3;

            // Associations
            updates.characterIds = theme.characterIds || (theme.characters ? [] : []); // Legacy 'characters' was string array?
            updates.musicTrackIds = theme.musicTrackIds || [];
            updates.allowedThemeIds = theme.allowedThemeIds || [];
            updates.allowedFontIds = theme.allowedFontIds || [];
            updates.patternIds = theme.patternIds || [];
            updates.backgroundPattern = theme.backgroundPattern;

            if (needsUpdate) {
                await ctx.db.patch(event._id, { theme: updates });
                count++;
            }
        }
        return `Migrated ${count} events.`;
    },
});
