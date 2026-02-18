import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    events: defineTable({
        name: v.string(),
        slug: v.string(),
        date: v.number(),
        launchDate: v.number(),
        endDate: v.number(),
        status: v.union(v.literal("upcoming"), v.literal("active"), v.literal("ended")),
        theme: v.object({
            primary: v.string(),
            secondary: v.string(),
            accent: v.string(),
            bgGradientStart: v.string(),
            bgGradientEnd: v.string(),
            textDark: v.string(),
            textLight: v.string(),
            headlineFont: v.string(),
            bodyFont: v.string(),
            backgroundPattern: v.string(), // ID key like 'hearts'
            backgroundPatternColor: v.optional(v.string()),
            backgroundPatternOpacity: v.optional(v.number()),
            headline: v.string(),
            subheadline: v.string(),
            headline_2: v.optional(v.string()),
            subheadline_2: v.optional(v.string()),
            headline_3: v.optional(v.string()),
            subheadline_3: v.optional(v.string()),
            ctaText: v.string(),
            urgencyText: v.string(),
            characterIds: v.optional(v.array(v.id("globalCharacters"))),
            characters: v.optional(v.array(v.string())), // Deprecated: Support existing data
            musicTrackIds: v.optional(v.array(v.id("musicTracks"))),
            patternIds: v.optional(v.array(v.string())), // Store local pattern IDs for now
            allowedThemeIds: v.optional(v.array(v.id("globalThemes"))), // Filtered list of themes for the editor
            allowedFontIds: v.optional(v.array(v.id("globalFonts"))), // Filtered list of fonts for the editor
            // Force schema update
        }),
        createdAt: v.number(),
    }).index("by_slug", ["slug"]),

    templates: defineTable({
        eventId: v.id("events"),
        name: v.string(),
        thumbnail: v.string(),
        outputType: v.union(v.literal("image"), v.literal("video")),
        mediaSlots: v.array(v.object({
            id: v.string(),
            label: v.string(),
            type: v.union(v.literal("photo"), v.literal("video")),
            position: v.object({
                x: v.number(),
                y: v.number(),
                width: v.number(),
                height: v.number(),
            }),
            required: v.boolean(),
        })),
        textSlots: v.array(v.object({
            id: v.string(),
            label: v.string(),
            placeholder: v.string(),
            maxLength: v.number(),
            position: v.object({
                x: v.number(),
                y: v.number(),
                width: v.number(),
                height: v.number(),
            }),
            style: v.object({
                fontSize: v.number(),
                fontFamily: v.string(),
                color: v.string(),
            }),
        })),
        layers: v.array(v.string()),
        popularity: v.number(),
        createdAt: v.number(),
        defaultPages: v.optional(v.array(v.any())),
    }).index("by_event", ["eventId"]),

    musicTracks: defineTable({
        name: v.string(),
        artist: v.string(),
        duration: v.number(),
        url: v.optional(v.string()), // For static assets
        storageId: v.optional(v.id("_storage")), // For uploaded files
    }),

    celebrations: defineTable({
        templateId: v.id("templates"),
        eventId: v.id("events"),
        slug: v.string(),
        email: v.string(),
        pages: v.array(v.any()), // StoryPage[]
        musicTrackId: v.optional(v.id("musicTracks")),
        removeWatermark: v.boolean(),
        hasMusic: v.boolean(),
        customLink: v.boolean(),
        hdDownload: v.boolean(),
        totalPaid: v.number(),
        paymentStatus: v.union(v.literal("pending"), v.literal("paid"), v.literal("failed")),
        views: v.number(),
        createdAt: v.number(),
    }).index("by_slug", ["slug"]),

    globalThemes: defineTable({
        name: v.string(),
        primary: v.string(),
        secondary: v.string(),
        accent: v.string(),
        bgGradientStart: v.string(),
        bgGradientEnd: v.string(),
        textDark: v.string(),
        textLight: v.string(),
        createdAt: v.number(),
    }),

    globalFonts: defineTable({
        name: v.string(),
        isCustom: v.boolean(),
        storageId: v.optional(v.id("_storage")),
        createdAt: v.number(),
    }),

    globalPatterns: defineTable({
        id: v.string(), // e.g. "floral"
        name: v.string(), // e.g. "Floral"
        emoji: v.string(),
        type: v.union(v.literal("falling"), v.literal("rising"), v.literal("floating"), v.literal("static")),
        createdAt: v.number(),
    }),

    globalCharacters: defineTable({
        name: v.string(),
        storageId: v.optional(v.id("_storage")),
        url: v.optional(v.string()), // Fallback for seeds
        createdAt: v.number(),
    }),
});
