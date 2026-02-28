import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

// ZeptoMail API base
const ZEPTOMAIL_API = "https://api.zeptomail.com/v1.1/email";

// Send post-payment email (HD download link + optional account credentials)
export const sendPostPaymentEmail = internalAction({
    args: {
        email: v.string(),
        slug: v.string(),
        hdDownload: v.boolean(),
        accountCreated: v.optional(v.boolean()),
        username: v.optional(v.string()),
        password: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const config = await ctx.runQuery(api.mail.getConfig) as Record<string, any>;
        const apiKey = config?.zeptomailApiKey || process.env.ZEPTOMAIL_API_KEY;

        if (!apiKey) {
            console.warn("ZEPTOMAIL_API_KEY not set — skipping email");
            return;
        }

        const from = config ? { address: config.fromEmail, name: config.fromName } : { address: "noreply@makemoments.xyz", name: "MakeMoments" };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const templates = await ctx.runQuery(api.mail.getTemplates) as Record<string, any>[];
        const template = templates?.find((t: Record<string, unknown>) => t.category === "post_payment");

        const momentUrl = `https://makemoments.xyz/${args.slug}`;
        const downloadUrl = args.hdDownload ? `${momentUrl}?download=hd` : null;

        // If we have a Template ID, use it. Otherwise fallback to the legacy HTML body.
        const useTemplate = !!template?.templateId;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const payload: Record<string, any> = {
            from,
            to: [{ email_address: { address: args.email, name: "" } }],
        };

        if (useTemplate) {
            payload.subject = template.subject;
            payload.mail_template_key = template.templateId;
            payload.merge_info = {
                moment_url: momentUrl,
                download_url: downloadUrl || "",
                has_download: !!downloadUrl,
                username: args.username || "",
                password: args.password || "",
                has_account: !!args.accountCreated,
            };
        } else {
            // Legacy / Fallback HTML Body
            let htmlBody = `
                <div style="font-family: Inter, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px;">
                    <h1 style="text-align: center; font-size: 24px; color: #18181b;">Your Moment is Live! 🎉</h1>
                    <p style="text-align: center; color: #71717a;">Your creation has been published and is ready to share.</p>
                    
                    <div style="background: #f4f4f5; border-radius: 12px; padding: 16px; margin: 20px 0; text-align: center;">
                        <p style="margin: 0; font-size: 14px; color: #71717a;">Your link</p>
                        <a href="${momentUrl}" style="font-size: 18px; color: #6366f1; font-weight: 600; text-decoration: none;">
                            makemoments.xyz/${args.slug}
                        </a>
                    </div>
            `;

            if (downloadUrl) {
                htmlBody += `
                    <div style="background: #ede9fe; border-radius: 12px; padding: 16px; margin: 20px 0; text-align: center;">
                        <p style="margin: 0 0 8px; font-size: 14px; color: #6d28d9;">HD Download Available</p>
                        <a href="${downloadUrl}" style="display: inline-block; background: #7c3aed; color: white; padding: 10px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                            Download HD ↓
                        </a>
                    </div>
                `;
            }

            if (args.accountCreated && args.username && args.password) {
                htmlBody += `
                    <div style="background: #ecfdf5; border-radius: 12px; padding: 16px; margin: 20px 0;">
                        <p style="margin: 0 0 8px; font-size: 14px; color: #059669; font-weight: 600;">Your Account</p>
                        <p style="margin: 4px 0; font-size: 14px; color: #18181b;">Username: <strong>${args.username}</strong></p>
                        <p style="margin: 4px 0; font-size: 14px; color: #18181b;">Password: <strong>${args.password}</strong></p>
                        <p style="margin: 8px 0 0; font-size: 12px; color: #71717a;">You can log in at makemoments.xyz/login</p>
                    </div>
                `;
            }

            htmlBody += `
                    <p style="text-align: center; font-size: 12px; color: #a1a1aa; margin-top: 32px;">
                        Made with ❤️ by MakeMoments
                    </p>
                </div>
            `;

            payload.subject = args.hdDownload
                ? "Your Moment is Live + HD Download 🎬"
                : "Your Moment is Live! 🎉";
            payload.htmlbody = htmlBody;
        }

        try {
            const res = await fetch(ZEPTOMAIL_API, {
                method: "POST",
                headers: {
                    "Authorization": apiKey,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                console.error("ZeptoMail error:", await res.text());
            } else {
                console.log(`✅ Email sent to ${args.email}`);
            }
        } catch (error) {
            console.error("Failed to send email:", error);
        }
    },
});
