import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

async function resolveEventAssets(ctx: any, event: any) {
    const theme = event.theme || {};

    // 1. Resolve Music
    const musicTracksRaw = theme.musicTrackIds?.length > 0
        ? await Promise.all(theme.musicTrackIds.map((id: any) => ctx.db.get(id)))
        : [];
    const musicTracks = await Promise.all(
        musicTracksRaw.filter(Boolean).map(async (track: any) => ({
            ...track,
            url: track.storageId ? await ctx.storage.getUrl(track.storageId) : track.url
        }))
    );

    // 2. Resolve Characters
    const charactersRaw = theme.characterIds?.length > 0
        ? await Promise.all(theme.characterIds.map((id: any) => ctx.db.get(id)))
        : [];
    const characters = await Promise.all(
        charactersRaw.filter(Boolean).map(async (char: any) => ({
            ...char,
            url: char.storageId ? await ctx.storage.getUrl(char.storageId) : char.url
        }))
    );

    // 3. Resolve Fonts
    const fontsRaw = theme.allowedFontIds?.length > 0
        ? await Promise.all(theme.allowedFontIds.map((id: any) => ctx.db.get(id)))
        : [];
    const fonts = await Promise.all(
        fontsRaw.filter(Boolean).map(async (font: any) => ({
            ...font,
            url: font.storageId ? await ctx.storage.getUrl(font.storageId) : font.url
        }))
    );

    // 4. Resolve Patterns
    const patterns = theme.patternIds?.length > 0
        ? await ctx.db.query("globalPatterns").collect().then((all: any[]) =>
            all.filter(p => theme.patternIds.includes(p.id))
        )
        : [];

    // 5. Resolve Themes (Backdrops)
    const themes = theme.allowedThemeIds?.length > 0
        ? await Promise.all(theme.allowedThemeIds.map((id: any) => ctx.db.get(id)))
        : [];

    return {
        ...event,
        resolvedAssets: {
            musicTracks,
            characters,
            fonts,
            patterns: patterns.filter(Boolean),
            themes: themes.filter(Boolean),
        }
    };
}

export const getActive = query({
    handler: async (ctx) => {
        const now = Date.now();
        const activeEvents = await ctx.db
            .query("events")
            .filter((q) =>
                q.and(
                    q.lte(q.field("launchDate"), now),
                    q.or(
                        q.eq(q.field("kind"), "evergreen"),
                        q.gte(q.field("endDate"), now)
                    ),
                    q.eq(q.field("status"), "active")
                )
            )
            .collect();

        if (activeEvents.length === 0) return null;

        // Priority Logic: 
        // 1. Tier (1 > 2 > 3 > 4)
        // 2. Closest celebration date (for timed events)
        // 3. Most recent launchDate (for evergreens)
        const sorted = activeEvents.sort((a, b) => {
            const aTier = a.tier ?? 4;
            const bTier = b.tier ?? 4;
            if (aTier !== bTier) return aTier - bTier;

            // Same tier tie-breakers
            const aIsTimed = (a.kind ?? "one-time") !== "evergreen";
            const bIsTimed = (b.kind ?? "one-time") !== "evergreen";

            if (aIsTimed && bIsTimed) {
                // Both timed: pick the one closest to their target celebration date
                return Math.abs(a.date - now) - Math.abs(b.date - now);
            }

            // Fallback to launchDate freshness
            return b.launchDate - a.launchDate;
        });

        const winner = sorted[0];
        return await resolveEventAssets(ctx, winner);
    },
});

export const getBySlugWithAssets = query({
    args: { slug: v.string() },
    handler: async (ctx, args) => {
        const event = await ctx.db
            .query("events")
            .withIndex("by_slug", (q) => q.eq("slug", args.slug))
            .first();

        if (!event) return { status: "NOT_FOUND" };

        const now = Date.now();
        const isExpired = now > event.endDate || event.status === "ended";
        const isUpcoming = now < event.launchDate || event.status === "upcoming";

        if (isExpired) return { status: "EXPIRED", event };
        if (isUpcoming) return { status: "UPCOMING", event };

        const resolvedEvent = await resolveEventAssets(ctx, event);
        return { status: "SUCCESS", event: resolvedEvent };
    },
});

export const getLibrary = query({
    handler: async (ctx) => {
        const now = Date.now();
        const activeEvents = await ctx.db
            .query("events")
            .filter((q) =>
                q.and(
                    q.lte(q.field("launchDate"), now),
                    q.gte(q.field("endDate"), now),
                    q.eq(q.field("status"), "active")
                )
            )
            .collect();

        const upcomingEvents = await ctx.db
            .query("events")
            .filter((q) =>
                q.and(
                    q.gt(q.field("launchDate"), now),
                    q.eq(q.field("status"), "upcoming")
                )
            )
            .collect();

        // 1. Determine the Hero (Spotlight) to exclude it from library
        const sortedActive = [...activeEvents].sort((a, b) => {
            const aTier = a.tier ?? 4;
            const bTier = b.tier ?? 4;
            if (aTier !== bTier) return aTier - bTier;
            const aIsTimed = (a.kind ?? "one-time") !== "evergreen";
            const bIsTimed = (b.kind ?? "one-time") !== "evergreen";
            if (aIsTimed && bIsTimed) return Math.abs(a.date - now) - Math.abs(b.date - now);
            return b.launchDate - a.launchDate;
        });
        const heroId = sortedActive[0]?._id;

        const libraryEvents = activeEvents.filter(e => e._id !== heroId);

        // Grouping logic (Limit 3 per section)
        const popularNow = libraryEvents
            .filter(e => (e.kind ?? "one-time") === "recurring" || (e.kind ?? "one-time") === "one-time")
            .slice(0, 3);

        const evergreen = activeEvents
            .filter(e => (e.kind ?? "one-time") === "evergreen" && e._id !== heroId)
            .slice(0, 3);

        const comingSoon = upcomingEvents.slice(0, 3);

        // Resolve assets for all library items
        const resolveBatch = async (items: any[]) =>
            Promise.all(items.map(item => resolveEventAssets(ctx, item)));

        return {
            popularNow: await resolveBatch(popularNow),
            evergreen: await resolveBatch(evergreen),
            comingSoon: await resolveBatch(comingSoon),
        };
    },
});

export const handleRecurringEvents = mutation({
    handler: async (ctx) => {
        const now = Date.now();
        const expiredRecurring = await ctx.db
            .query("events")
            .filter((q) =>
                q.and(
                    q.lt(q.field("endDate"), now),
                    q.eq(q.field("kind"), "recurring"),
                    q.eq(q.field("status"), "active")
                )
            )
            .collect();

        for (const event of expiredRecurring) {
            const ONE_YEAR = 1000 * 60 * 60 * 24 * 365;
            await ctx.db.patch(event._id, {
                date: event.date + ONE_YEAR,
                launchDate: event.launchDate + ONE_YEAR,
                endDate: event.endDate + ONE_YEAR,
                status: "upcoming",
            });
        }
    },
});


export const getAll = query({
    handler: async (ctx) => {
        return await ctx.db.query("events").collect();
    },
});

export const getById = query({
    args: { id: v.id("events") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.id);
    },
});

export const create = mutation({
    args: {
        name: v.string(),
        slug: v.string(),
        date: v.number(),
        launchDate: v.number(),
        endDate: v.number(),
        status: v.union(v.literal("upcoming"), v.literal("active"), v.literal("ended")),
        tier: v.optional(v.union(v.literal(1), v.literal(2), v.literal(3), v.literal(4))),
        kind: v.optional(v.union(v.literal("recurring"), v.literal("one-time"), v.literal("evergreen"))),
        theme: v.any(),
        updatedAt: v.optional(v.float64()),
    },
    handler: async (ctx, args) => {
        const eventId = await ctx.db.insert("events", {
            ...args,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        // Create the "Standard Slide" template automatically for every new event
        await ctx.db.insert("templates", {
            eventId,
            name: "Standard Slide",
            thumbnail: "/placeholder.svg",
            outputType: "image",
            mediaSlots: [
                { id: "ms-1", label: "Front Photo", type: "photo", position: { x: 10, y: 10, width: 80, height: 50 }, required: true },
            ],
            textSlots: [
                { id: "ts-1", label: "Headline", placeholder: "Happy Celebration!", maxLength: 40, position: { x: 10, y: 65, width: 80, height: 10 }, style: { fontSize: 32, fontFamily: "Inter", color: "#FFFFFF" } },
            ],
            layers: [],
            popularity: 0,
            createdAt: Date.now(),
        });

        return eventId;
    },
});

export const update = mutation({
    args: {
        id: v.id("events"),
        name: v.optional(v.string()),
        slug: v.optional(v.string()),
        date: v.optional(v.number()),
        launchDate: v.optional(v.number()),
        endDate: v.optional(v.number()),
        status: v.optional(v.union(v.literal("upcoming"), v.literal("active"), v.literal("ended"))),
        tier: v.optional(v.union(v.literal(1), v.literal(2), v.literal(3), v.literal(4))),
        kind: v.optional(v.union(v.literal("recurring"), v.literal("one-time"), v.literal("evergreen"))),
        theme: v.optional(v.any()),
    },
    handler: async (ctx, args) => {
        const { id, ...rest } = args;

        const existing = await ctx.db.get(id);
        if (!existing) throw new Error("Event not found");

        const isNowActive = args.status === "active" && existing.status === "upcoming";

        await ctx.db.patch(id, {
            ...rest,
            updatedAt: Date.now(),
        });

        if (isNowActive) {
            await ctx.scheduler.runAfter(0, api.mail.sendEventLaunchNotification, {
                eventId: id,
            });
        }
    },
});

export const remove = mutation({
    args: { id: v.id("events") },
    handler: async (ctx, args) => {
        // Also remove templates associated with this event
        const templates = await ctx.db.query("templates")
            .withIndex("by_event", q => q.eq("eventId", args.id))
            .collect();
        for (const t of templates) {
            await ctx.db.delete(t._id);
        }
        await ctx.db.delete(args.id);
    },
});
