import { query, mutation, action, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { checkAdmin } from "./auth";

// Internal version that returns the actual API key for use in actions
export const getConfigInternal = internalQuery({
    handler: async (ctx) => {
        return await ctx.db.query("mailConfig").first();
    },
});

// ── Configuration ──

export const getConfig = query({
    handler: async (ctx) => {
        const config = await ctx.db.query("mailConfig").first();
        if (!config) return null;

        // Mask the API key if it exists
        return {
            ...config,
            zeptomailApiKey: config.zeptomailApiKey ? "••••••••" : "",
        };
    },
});

export const upsertConfig = mutation({
    args: {
        token: v.optional(v.string()),
        zeptomailApiKey: v.string(),
        fromEmail: v.string(),
        fromName: v.string(),
        bounceAddress: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        if (!(await checkAdmin(ctx, args.token))) {
            throw new Error("Unauthorized");
        }

        const { token, ...dataArgs } = args;
        const existing = await ctx.db.query("mailConfig").first();

        const data = { ...dataArgs, updatedAt: Date.now() };

        if (existing) {
            // If the incoming key is the masked value, don't overwrite the existing real key
            if (data.zeptomailApiKey === "••••••••") {
                data.zeptomailApiKey = existing.zeptomailApiKey;
            }
            await ctx.db.patch(existing._id, data);
            return existing._id;
        }
        return await ctx.db.insert("mailConfig", data);
    },
});

// ── Templates ──

export const getTemplates = query({
    handler: async (ctx) => {
        return await ctx.db.query("mailTemplates").collect();
    },
});

export const upsertTemplate = mutation({
    args: {
        category: v.union(v.literal("welcome"), v.literal("reminder"), v.literal("newsletter"), v.literal("new_event"), v.literal("forgot_password"), v.literal("post_payment"), v.literal("expiry_warning"), v.literal("event_launch")),
        templateId: v.string(),
        subject: v.string(),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("mailTemplates")
            .withIndex("by_category", (q) => q.eq("category", args.category))
            .first();

        const data = { ...args, updatedAt: Date.now() };

        if (existing) {
            await ctx.db.patch(existing._id, data);
            return existing._id;
        }
        return await ctx.db.insert("mailTemplates", data);
    },
});

// ── Action: Send Test Email ──

const ZEPTOMAIL_API = "https://api.zeptomail.com/v1.1/email";

export const sendTestEmail = action({
    args: {
        to: v.string(),
        category: v.union(v.literal("welcome"), v.literal("reminder"), v.literal("newsletter"), v.literal("new_event"), v.literal("forgot_password"), v.literal("post_payment"), v.literal("expiry_warning"), v.literal("event_launch")),
    },
    handler: async (ctx, args) => {
        const config = await ctx.runQuery(api.mail.getConfigInternal);
        const templates = await ctx.runQuery(api.mail.getTemplates);
        const template = templates.find((t: Record<string, unknown>) => t.category === args.category);

        const apiKey = process.env.ZEPTOMAIL_API_KEY || config?.zeptomailApiKey;

        if (!apiKey) {
            throw new Error("Mail service configuration missing");
        }

        if (!template || !template.templateId) {
            throw new Error("Mail template error");
        }

        const res = await fetch(ZEPTOMAIL_API, {
            method: "POST",
            headers: {
                "Authorization": config.zeptomailApiKey,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                from: { address: config.fromEmail, name: config.fromName },
                to: [{ email_address: { address: args.to, name: "Test User" } }],
                subject: `[TEST] ${template.subject}`,
                mail_template_key: template.templateId,
                merge_info: {
                    user_name: "Test User",
                    app_name: "MakeMoments",
                },
            }),
        });

        if (!res.ok) {
            const error = await res.text();
            console.error("ZeptoMail Test Error:", error);
            throw new Error("Email delivery failed");
        }

        return { success: true };
    },
});

export const sendExpiryWarning = action({
    args: {
        email: v.string(),
        daysLeft: v.number(),
        slug: v.string(),
    },
    handler: async (ctx, args) => {
        const config = await ctx.runQuery(api.mail.getConfigInternal);
        const templates = await ctx.runQuery(api.mail.getTemplates);
        const template = templates.find((t: Record<string, unknown>) => t.category === "expiry_warning");

        const apiKey = process.env.ZEPTOMAIL_API_KEY || config?.zeptomailApiKey;

        if (!apiKey || !template || !template.templateId) {
            console.warn("Skipping expiry warning: ZeptoMail config or template missing");
            return;
        }

        await fetch(ZEPTOMAIL_API, {
            method: "POST",
            headers: {
                "Authorization": apiKey,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                from: { address: config.fromEmail, name: config.fromName },
                to: [{ email_address: { address: args.email } }],
                subject: template.subject,
                mail_template_key: template.templateId,
                merge_info: {
                    days_left: args.daysLeft.toString(),
                    celebration_url: `https://makemoments.xyz/${args.slug}`,
                    app_name: "MakeMoments",
                },
            }),
        });
    },
});

export const sendEventLaunchNotification = action({
    args: {
        eventId: v.id("events"),
    },
    handler: async (ctx, args) => {
        const config = await ctx.runQuery(api.mail.getConfig);
        const templates = await ctx.runQuery(api.mail.getTemplates);
        const template = templates.find((t: Record<string, unknown>) => t.category === "event_launch");
        const event = await ctx.runQuery(api.events.getById, { id: args.eventId });
        const subscribers = await ctx.runQuery(api.notifications.listByEvent, { eventId: args.eventId });

        if (!config || !config.zeptomailApiKey || !template || !template.templateId || !event) {
            console.warn("Skipping launch notification: Config, template, or event missing");
            return;
        }

        const pendingSubs = subscribers.filter((s: Record<string, unknown>) => s.status === "pending");
        if (pendingSubs.length === 0) return;

        for (const sub of pendingSubs) {
            try {
                const apiKey = process.env.ZEPTOMAIL_API_KEY || config?.zeptomailApiKey;
                const res = await fetch(ZEPTOMAIL_API, {
                    method: "POST",
                    headers: {
                        "Authorization": apiKey as string,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        from: { address: config.fromEmail, name: config.fromName },
                        to: [{ email_address: { address: sub.email } }],
                        subject: template.subject.replace("{{event_name}}", event.name),
                        mail_template_key: template.templateId,
                        merge_info: {
                            event_name: event.name,
                            event_url: `https://makemoments.xyz/${event.slug}`,
                            app_name: "MakeMoments",
                        },
                    }),
                });

                if (res.ok) {
                    await ctx.runMutation(api.notifications.unsubscribe, {
                        email: sub.email,
                        eventId: args.eventId,
                        status: "notified"
                    });
                }
            } catch (error) {
                console.error(`Failed to notify ${sub.email}:`, error);
            }
        }
    },
});
