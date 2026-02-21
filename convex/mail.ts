import { query, mutation, action } from "./_generated/server";
import { v } from "convex/values";

// ── Configuration ──

export const getConfig = query({
    handler: async (ctx) => {
        return await ctx.db.query("mailConfig").first();
    },
});

export const upsertConfig = mutation({
    args: {
        zeptomailApiKey: v.string(),
        fromEmail: v.string(),
        fromName: v.string(),
        bounceAddress: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db.query("mailConfig").first();
        const data = { ...args, updatedAt: Date.now() };

        if (existing) {
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
        category: v.union(v.literal("welcome"), v.literal("reminder"), v.literal("newsletter"), v.literal("new_event"), v.literal("forgot_password"), v.literal("post_payment")),
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
        category: v.union(v.literal("welcome"), v.literal("reminder"), v.literal("newsletter"), v.literal("new_event"), v.literal("forgot_password"), v.literal("post_payment")),
    },
    handler: async (ctx, args) => {
        const config = await ctx.runQuery("api.mail.getConfig" as any);
        const templates = await ctx.runQuery("api.mail.getTemplates" as any);
        const template = templates.find((t: any) => t.category === args.category);

        if (!config || !config.zeptomailApiKey) {
            throw new Error("ZeptoMail configuration missing");
        }

        if (!template || !template.templateId) {
            throw new Error(`Template ID missing for category: ${args.category}`);
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
            throw new Error(`ZeptoMail Error: ${error}`);
        }

        return { success: true };
    },
});
