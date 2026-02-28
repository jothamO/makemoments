import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// --- Strict Validators (2026 Security Best Practices) ---

const ImageTransformValidator = v.object({
    x: v.number(),
    y: v.number(),
    xp: v.optional(v.number()),
    yp: v.optional(v.number()),
    width: v.number(),
    rotation: v.number(),
});

const PhotoValidator = v.object({
    id: v.string(),
    url: v.string(),
    transform: ImageTransformValidator,
});

const StoryPageValidator = v.object({
    id: v.string(),
    photos: v.optional(v.array(PhotoValidator)),
    text: v.string(),
    fontFamily: v.string(),
    fontSize: v.union(v.literal("small"), v.literal("medium"), v.literal("large")),
    textAlign: v.union(v.literal("left"), v.literal("center"), v.literal("right")),
    textColor: v.string(),
    themeId: v.optional(v.string()), // Can be globalTheme ID or custom
    baseColor: v.optional(v.string()), // Legacy: bgGradientStart/End
    bgGradientStart: v.optional(v.string()),
    bgGradientEnd: v.optional(v.string()),
    glowColor: v.optional(v.string()),
    transition: v.union(v.literal("fade"), v.literal("slide"), v.literal("zoom"), v.literal("flip")),
    backgroundPattern: v.optional(v.string()),
    stickers: v.array(v.object({
        emoji: v.string(),
        x: v.number(),
        y: v.number(),
    })),
    type: v.optional(v.union(v.literal("light"), v.literal("dark"))),
});

const MediaSlotValidator = v.object({
    id: v.string(),
    label: v.string(),
    type: v.string(),
    position: v.object({
        x: v.number(),
        y: v.number(),
        width: v.number(),
        height: v.number(),
    }),
    required: v.boolean(),
});

const TextSlotValidator = v.object({
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
});

// Schema Version: 1.2 - Strict Object Validation
export default defineSchema({
    events: defineTable({
        name: v.string(),
        slug: v.string(),
        date: v.float64(),
        launchDate: v.float64(),
        endDate: v.float64(),
        status: v.union(v.literal("upcoming"), v.literal("active"), v.literal("ended")),
        tier: v.optional(v.union(v.literal(1), v.literal(2), v.literal(3), v.literal(4))),
        kind: v.optional(v.union(v.literal("recurring"), v.literal("one-time"), v.literal("evergreen"))),
        theme: v.object({
            // Simplified Theme Model (Gap Analysis compliant)
            baseColor: v.string(), // Hex/RGB for flat background
            glowColor: v.string(), // Hex/RGB for radial halo
            type: v.union(v.literal("light"), v.literal("dark")), // Determination for text color

            // Content
            headline: v.string(),
            subheadline: v.string(),
            headline_2: v.optional(v.string()),
            subheadline_2: v.optional(v.string()),
            headline_3: v.optional(v.string()),
            subheadline_3: v.optional(v.string()),
            ctaText: v.string(),
            urgencyText: v.string(),

            textLight: v.optional(v.string()),
            headlineFont: v.optional(v.string()),
            bodyFont: v.optional(v.string()),
            characterIds: v.optional(v.array(v.id("globalCharacters"))),
            musicTrackIds: v.optional(v.array(v.id("musicTracks"))),
            allowedThemeIds: v.optional(v.array(v.id("globalThemes"))),
            allowedFontIds: v.optional(v.array(v.id("globalFonts"))),

            // Overrides
            textMode: v.optional(v.union(v.literal("auto"), v.literal("light"), v.literal("dark"))),
            textColor: v.optional(v.string()),

            // Dynamic Status Messages (editor)
            upcomingHeadline: v.optional(v.string()),
            upcomingSubheadline: v.optional(v.string()),
            expiredHeadline: v.optional(v.string()),
            expiredSubheadline: v.optional(v.string()),

            // Legacy / Deprecated (Keep optional if needed for migration, otherwise remove)
            backgroundPattern: v.optional(v.string()),
            patternIds: v.optional(v.array(v.string())),
        }),
        createdAt: v.float64(),
        updatedAt: v.optional(v.float64()),
    }).index("by_slug", ["slug"]),


    musicTracks: defineTable({
        name: v.string(),
        artist: v.string(),
        duration: v.number(),
        url: v.optional(v.string()),
        storageId: v.optional(v.id("_storage")),
        isPremium: v.optional(v.boolean()),
        price: v.optional(v.number()),
        isDefault: v.optional(v.boolean()),
    }),

    celebrations: defineTable({
        eventId: v.id("events"),
        slug: v.string(),
        email: v.string(),
        pages: v.array(StoryPageValidator),
        musicTrackId: v.optional(v.id("musicTracks")),
        removeWatermark: v.boolean(),
        hasMusic: v.boolean(),
        customLink: v.boolean(),
        customSlug: v.optional(v.string()),
        hdDownload: v.boolean(),
        totalPaid: v.number(),
        currency: v.optional(v.string()),        // "NGN", "GHS", "USD", etc.
        gateway: v.optional(v.string()),          // "paystack" or "stripe"
        paymentReference: v.optional(v.string()), // Gateway transaction reference
        paymentStatus: v.union(v.literal("pending"), v.literal("paid"), v.literal("failed")),
        userId: v.optional(v.string()),           // Links to user account if created
        expiresAt: v.optional(v.number()),        // Timestamp — 365 days from creation
        deletedAt: v.optional(v.number()),        // Soft-delete timestamp
        views: v.number(),
        createdAt: v.number(),
    }).index("by_slug", ["slug"]),

    globalThemes: defineTable({
        name: v.string(),
        // Simplified Model
        baseColor: v.string(),
        glowColor: v.string(),
        type: v.union(v.literal("light"), v.literal("dark")),
        isPremium: v.optional(v.boolean()),
        price: v.optional(v.number()),
        isDefault: v.optional(v.boolean()),
        createdAt: v.number(),
    }),

    globalFonts: defineTable({
        name: v.string(),
        fontFamily: v.string(), // CSS font stack e.g. "Caveat, cursive"
        isCustom: v.boolean(),
        storageId: v.optional(v.id("_storage")), // If uploaded
        isPremium: v.optional(v.boolean()),
        price: v.optional(v.number()),
        isDefault: v.optional(v.boolean()),
        createdAt: v.number(),
    }),

    globalPatterns: defineTable({
        id: v.string(), // e.g. "floral"
        name: v.string(), // e.g. "Floral"
        emojis: v.array(v.string()),
        type: v.union(
            v.literal("falling"),
            v.literal("rising"),
            v.literal("static"),
            v.literal("burst"),
            v.literal("drift")
        ),
        isPremium: v.optional(v.boolean()),
        price: v.optional(v.number()),
        isDefault: v.optional(v.boolean()),
        createdAt: v.number(),
    }),

    globalCharacters: defineTable({
        name: v.string(),
        storageId: v.optional(v.id("_storage")),
        url: v.optional(v.string()),
        isPremium: v.optional(v.boolean()),
        price: v.optional(v.number()),
        isDefault: v.optional(v.boolean()),
        createdAt: v.number(),
    }).index("by_url", ["url"]),

    globalPricing: defineTable({
        category: v.string(), // "fonts", "music", "patterns", "characters", "themes", "base"
        prices: v.object({
            ngn: v.number(),
            usd: v.number(),
        }),
    }).index("by_category", ["category"]),

    templates: defineTable({
        eventId: v.id("events"),
        name: v.string(),
        thumbnail: v.string(),
        outputType: v.string(),
        mediaSlots: v.array(MediaSlotValidator),
        textSlots: v.array(TextSlotValidator),
        layers: v.array(v.any()), // Layers are still highly dynamic, keeping any for now but wrapped in array
        popularity: v.number(),
        createdAt: v.number(),
    }).index("by_event", ["eventId"]),

    exchangeRates: defineTable({
        fromCurrency: v.string(),   // Always "USD"
        toCurrency: v.string(),     // "GHS", "KES", "ZAR", "XOF", "NGN", etc.
        rate: v.number(),           // e.g. 1 USD = 15.5 GHS → rate = 15.5
        updatedAt: v.optional(v.float64()),
    }).index("by_pair", ["fromCurrency", "toCurrency"]),

    gatewayConfig: defineTable({
        paystackEnabled: v.boolean(),
        stripeEnabled: v.boolean(),
        paystackTestMode: v.optional(v.boolean()),
        stripeTestMode: v.optional(v.boolean()),
        // API keys (stored in DB, managed from admin/payments)
        paystackPublicKey: v.optional(v.string()),
        paystackSecretKey: v.optional(v.string()),
        stripePublishableKey: v.optional(v.string()),
        stripeSecretKey: v.optional(v.string()),
        // Per-event overrides: [{eventId, gateway: "paystack" | "stripe" | "auto"}]
        eventOverrides: v.optional(v.array(v.object({
            eventId: v.id("events"),
            gateway: v.union(v.literal("paystack"), v.literal("stripe"), v.literal("auto")),
        }))),
        updatedAt: v.number(),
    }),

    users: defineTable({
        email: v.string(),
        username: v.optional(v.string()),
        name: v.optional(v.string()),
        role: v.union(v.literal("admin"), v.literal("user")),
        passwordHash: v.optional(v.string()),
        salt: v.optional(v.string()),
        isSubscriber: v.boolean(), // For Newsletter/Notify Me
        createdAt: v.float64(),
        updatedAt: v.optional(v.float64()),
    }).index("by_email", ["email"]),

    sessions: defineTable({
        userId: v.union(v.id("users"), v.literal("admin")),
        token: v.string(),
        role: v.union(v.literal("admin"), v.literal("user")),
        expiresAt: v.number(),
        createdAt: v.number(),
    }).index("by_token", ["token"]),

    mailConfig: defineTable({
        zeptomailApiKey: v.string(),
        fromEmail: v.string(),
        fromName: v.string(),
        bounceAddress: v.optional(v.string()),
        updatedAt: v.number(),
    }),

    mailTemplates: defineTable({
        category: v.union(v.literal("welcome"), v.literal("reminder"), v.literal("newsletter"), v.literal("new_event"), v.literal("forgot_password"), v.literal("post_payment"), v.literal("expiry_warning"), v.literal("event_launch")),
        templateId: v.string(),
        subject: v.string(),
        updatedAt: v.number(),
    }).index("by_category", ["category"]),

    eventNotifications: defineTable({
        eventId: v.id("events"),
        email: v.string(),
        userId: v.optional(v.id("users")),
        status: v.union(v.literal("pending"), v.literal("notified"), v.literal("unsubscribed")),
        createdAt: v.number(),
    }).index("by_event", ["eventId"])
        .index("by_email_event", ["email", "eventId"])
        .index("by_user", ["userId"]),

    rateLimits: defineTable({
        identifier: v.string(), // IP address, email, or session token
        action: v.string(),     // "login", "payment_init", etc.
        count: v.number(),
        resetAt: v.number(),    // Timestamp when the window resets
    }).index("by_identifier_action", ["identifier", "action"]),

    securityAudits: defineTable({
        event: v.string(),          // "debugger_detected", "domain_mismatch", "timing_anomaly"
        metadata: v.optional(v.any()), // Extra context (user agent, hostname, etc.)
        timestamp: v.number(),
    }).index("by_event", ["event"]),
});
