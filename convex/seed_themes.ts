import { mutation } from "./_generated/server";
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
    { id: "confetti", name: "Confetti", emojis: ["🎊", "🎉", "✨", "🎀"], type: "falling" },
    { id: "hearts", name: "Hearts", emojis: ["❤️", "💕", "💗", "💖", "💘"], type: "floating" },
    { id: "stars", name: "Stars", emojis: ["⭐", "🌟", "💛", "✦"], type: "burst" },
    { id: "sparkles", name: "Sparkles", emojis: ["✨", "⭐", "💫", "🌟"], type: "burst" },
    { id: "balloons", name: "Balloons", emojis: ["🎈", "🎈", "🎈", "🎁"], type: "rising" },
    { id: "flowers", name: "Flowers", emojis: ["🌸", "🌺", "💮", "🏵️"], type: "drift" },
    { id: "snow", name: "Snow", emojis: ["❄️", "❅", "❆", "✦"], type: "fall" },
    { id: "bubbles", name: "Bubbles", emojis: ["🫧", "🫧", "🫧"], type: "rising" },
    { id: "butterflies", name: "Butterflies", emojis: ["🦋", "🦋", "🌿", "🍃"], type: "rising" },
];

// ─── Events 2026 ───────────────────────────────────────────────────

const EVENTS_2026 = [
    { name: "New Year's Day", slug: "new-years-day-2026", month: 1, day: 1, baseColor: "#0d1b2a", glowColor: "#4fc3f7", type: "short" },
    { name: "MLK Day", slug: "mlk-day-2026", month: 1, day: 19, baseColor: "#1a0020", glowColor: "#d4830a", type: "short" },
    { name: "Valentine's Day", slug: "valentines-day-2026", month: 2, day: 14, baseColor: "#1a0010", glowColor: "#ff2d55", type: "short" },
    { name: "Black History Month", slug: "black-history-month-2026", month: 2, day: 1, baseColor: "#0a0a00", glowColor: "#cc0000", type: "month" },
    { name: "International Women's Day", slug: "womens-day-2026", month: 3, day: 8, baseColor: "#1a0020", glowColor: "#c840e0", type: "short" },
    { name: "St. Patrick's Day", slug: "st-patricks-day-2026", month: 3, day: 17, baseColor: "#001200", glowColor: "#00a550", type: "short" },
    { name: "Eid al-Fitr", slug: "eid-al-fitr-2026", month: 3, day: 30, baseColor: "#001a10", glowColor: "#00c896", type: "short" },
    { name: "Easter", slug: "easter-2026", month: 4, day: 5, baseColor: "#0f1a00", glowColor: "#a8e063", type: "major" },
    { name: "Earth Day", slug: "earth-day-2026", month: 4, day: 22, baseColor: "#001510", glowColor: "#00e5a0", type: "short" },
    { name: "Mother's Day", slug: "mothers-day-2026", month: 5, day: 10, baseColor: "#1a0015", glowColor: "#ff6eb4", type: "major" },
    { name: "Graduation Season", slug: "graduation-2026", month: 5, day: 15, baseColor: "#0a0a00", glowColor: "#f5c518", type: "season" },
    { name: "Memorial Day", slug: "memorial-day-2026", month: 5, day: 25, baseColor: "#00001a", glowColor: "#4169e1", type: "short" },
    { name: "Pride Month", slug: "pride-month-2026", month: 6, day: 1, baseColor: "#1a0030", glowColor: "#ff6b6b", type: "month" },
    { name: "Father's Day", slug: "fathers-day-2026", month: 6, day: 21, baseColor: "#0a1520", glowColor: "#1e90ff", type: "major" },
    { name: "Independence Day", slug: "independence-day-2026", month: 7, day: 4, baseColor: "#0a0010", glowColor: "#ff4136", type: "short" },
    { name: "Summer Vacation", slug: "summer-vacation-2026", month: 7, day: 1, baseColor: "#001530", glowColor: "#00b4d8", type: "month" },
    { name: "Back to School", slug: "back-to-school-2026", month: 8, day: 1, baseColor: "#0a1000", glowColor: "#ffa500", type: "season" },
    { name: "Youth Day", slug: "youth-day-2026", month: 8, day: 12, baseColor: "#000a1a", glowColor: "#7c3aed", type: "short" },
    { name: "Labor Day", slug: "labor-day-2026", month: 9, day: 7, baseColor: "#100a00", glowColor: "#e07b00", type: "short" },
    { name: "World Gratitude Day", slug: "gratitude-day-2026", month: 9, day: 21, baseColor: "#001a15", glowColor: "#2dd4bf", type: "short" },
    { name: "Nigeria Independence", slug: "nigeria-independence-2026", month: 10, day: 1, baseColor: "#001800", glowColor: "#00a550", type: "short" },
    { name: "Breast Cancer Awareness", slug: "breast-cancer-awareness-2026", month: 10, day: 1, baseColor: "#1a0020", glowColor: "#ff69b4", type: "month" },
    { name: "Halloween", slug: "halloween-2026", month: 10, day: 31, baseColor: "#050005", glowColor: "#ff6a00", type: "short" },
    { name: "Thanksgiving", slug: "thanksgiving-2026", month: 11, day: 26, baseColor: "#150800", glowColor: "#d4670a", type: "major" },
    { name: "Black Friday", slug: "black-friday-2026", month: 11, day: 27, baseColor: "#000000", glowColor: "#f5c518", type: "season" },
    { name: "Detty December", slug: "detty-december-2026", month: 12, day: 1, baseColor: "#1a0030", glowColor: "#ff00aa", type: "season" },
    { name: "Hanukkah", slug: "hanukkah-2026", month: 12, day: 14, baseColor: "#00001f", glowColor: "#4169e1", type: "short" },
    { name: "Christmas", slug: "christmas-2026", month: 12, day: 25, baseColor: "#001a00", glowColor: "#ff2020", type: "major" },
    { name: "New Year's Eve", slug: "new-years-eve-2026", month: 12, day: 31, baseColor: "#05050f", glowColor: "#d4af37", type: "major" },
];

function getEventTimestamps(month: number, day: number, type: string) {
    const year = 2026;
    const date = new Date(year, month - 1, day).getTime();
    let launchDate = date;
    let endDate = date;

    if (type === "short") {
        launchDate = date - (7 * 24 * 60 * 60 * 1000);
        endDate = date + (2 * 24 * 60 * 60 * 1000);
    } else if (type === "major") {
        launchDate = date - (14 * 24 * 60 * 60 * 1000);
        endDate = date + (2 * 24 * 60 * 60 * 1000);
    } else if (type === "month" || type === "season") {
        launchDate = new Date(year, month - 1, 1).getTime();
        endDate = new Date(year, month, 0).getTime(); // Last day of month
    }

    return { date, launchDate, endDate };
}

export const seed = mutation({
    handler: async (ctx) => {
        // ------------------------------------------------------------------
        // Part 1: Clear Tables
        // ------------------------------------------------------------------
        const tables = ["events", "celebrations", "globalThemes", "globalFonts", "musicTracks", "globalPatterns", "globalCharacters", "templates"];
        for (const table of tables) {
            const docs = await ctx.db.query(table as any).collect();
            for (const doc of docs) { await ctx.db.delete(doc._id); }
        }

        // ------------------------------------------------------------------
        // Part 2: Seed Assets
        // ------------------------------------------------------------------

        // Insert Themes
        for (const t of DARK_THEMES) {
            await ctx.db.insert("globalThemes", {
                name: t.name, baseColor: t.baseColor, glowColor: t.glowColor, type: "dark", createdAt: Date.now(),
            });
        }
        for (const t of LIGHT_THEMES) {
            await ctx.db.insert("globalThemes", {
                name: t.name, baseColor: t.baseColor, glowColor: t.glowColor, type: "light", createdAt: Date.now(),
            });
        }

        // Insert Fonts
        for (const f of FONTS) {
            await ctx.db.insert("globalFonts", {
                name: f.name, fontFamily: f.fontFamily, isCustom: false, isPremium: f.isPremium, price: f.price, createdAt: Date.now(),
            });
        }

        // Insert Music
        for (const m of MUSIC_TRACKS) {
            await ctx.db.insert("musicTracks", {
                name: m.name, artist: m.artist, duration: m.duration, isPremium: m.isPremium, price: m.price, url: m.url,
            });
        }

        // Insert Patterns
        for (const p of PATTERNS) {
            await ctx.db.insert("globalPatterns", {
                id: p.id, name: p.name, emojis: p.emojis, type: p.type as any, price: 0, createdAt: Date.now(),
            });
        }

        // Insert Characters
        for (const c of CHARACTERS) {
            await ctx.db.insert("globalCharacters", {
                name: c.name, url: c.url, createdAt: Date.now(),
            });
        }

        // ------------------------------------------------------------------
        // Part 3: Seed 2026 Events
        // ------------------------------------------------------------------
        const now = Date.now(); // Current simulation time: Feb 19, 2026
        let activeEventSet = false;

        const sortedEvents = [...EVENTS_2026].sort((a, b) => {
            const dateA = new Date(2026, a.month - 1, a.day).getTime();
            const dateB = new Date(2026, b.month - 1, b.day).getTime();
            return dateA - dateB;
        });

        for (const e of sortedEvents) {
            const { date, launchDate, endDate } = getEventTimestamps(e.month, e.day, e.type);

            let status: "upcoming" | "active" | "ended" = "upcoming";

            if (!activeEventSet && (endDate > now)) {
                status = "active";
                activeEventSet = true;
            } else if (endDate < now) {
                status = "ended";
            }

            await ctx.db.insert("events", {
                name: e.name,
                slug: e.slug,
                date,
                launchDate,
                endDate,
                status,
                theme: {
                    baseColor: e.baseColor,
                    glowColor: e.glowColor,
                    type: "dark",
                    headline: "",
                    subheadline: "",
                    ctaText: "Create for free",
                    urgencyText: "Limited time offer",
                },
                createdAt: Date.now(),
            });
        }

        return `Seeding Complete! Seeded ${EVENTS_2026.length} events and all assets.`;
    },
});
