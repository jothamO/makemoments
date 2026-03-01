import { v } from "convex/values";
import { internalMutation, internalQuery, query, action } from "./_generated/server";
import { internal } from "./_generated/api";
import { checkAdmin } from "./auth";
import { Doc, Id, TableNames } from "./_generated/dataModel";

const BACKUP_TABLES: TableNames[] = [
    // ── Configuration & Content (Migrate to Production) ──
    "events",
    "exchangeRates",
    "gatewayConfig",
    "globalFonts",
    "globalPatterns",
    "globalPricing",
    "globalThemes",
    "mailConfig",
    "mailTemplates",
    "musicTracks",
    "sitePages",
    "users",

    // ── User-Generated & Transient Data (Usually skipped for Production Sync) ──
    "celebrations",
    "eventNotifications",
    "globalCharacters",
    "rateLimits",
    "securityAudits",
    "sessions",
    "templates",
];

export const exportAll = query({
    args: { token: v.optional(v.string()) },
    handler: async (ctx, args) => {
        if (!(await checkAdmin(ctx, args.token))) {
            throw new Error("Unauthorized");
        }
        const data: Record<string, unknown[]> = {};
        for (const table of BACKUP_TABLES) {
            // eslint-disable-next-line security/detect-object-injection
            data[table] = await ctx.db.query(table as TableNames).collect();
        }
        return data;
    },
});

// Internal version for automated backups
export const exportAllInternal = internalQuery({
    args: {},
    handler: async (ctx) => {
        const data: Record<string, unknown[]> = {};
        for (const table of BACKUP_TABLES) {
            // eslint-disable-next-line security/detect-object-injection
            data[table] = await ctx.db.query(table as TableNames).collect();
        }
        return data;
    },
});

/**
 * Perform an automated backup to Backblaze B2.
 */
export const runBackupAction = action({
    args: {},
    handler: async (ctx) => {
        const b2KeyId = process.env.B2_APPLICATION_KEY_ID;
        const b2Key = process.env.B2_APPLICATION_KEY;
        const b2Bucket = process.env.B2_BUCKET_NAME;
        const b2Endpoint = process.env.B2_ENDPOINT;

        if (!b2KeyId || !b2Key || !b2Bucket || !b2Endpoint) {
            console.error("Backblaze B2 configuration missing");
            return;
        }

        const data = await ctx.runQuery(internal.backup.exportAllInternal);
        const backupJson = JSON.stringify(data, null, 2);
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const filename = `backups/makemoments-backup-${timestamp}.json`;

        try {
            const authResponse = await fetch("https://api.backblazeb2.com/b2api/v2/b2_authorize_account", {
                headers: {
                    Authorization: `Basic ${btoa(`${b2KeyId}:${b2Key}`)}`
                }
            });

            if (!authResponse.ok) throw new Error("B2 Authorization failed");
            const authData = (await authResponse.json()) as any; // eslint-disable-line @typescript-eslint/no-explicit-any

            const getUploadUrlResponse = await fetch(`${authData.apiUrl}/b2api/v3/b2_get_upload_url`, {
                method: "POST",
                headers: { Authorization: authData.authorizationToken },
                body: JSON.stringify({ bucketId: authData.allowed.bucketId })
            });

            if (!getUploadUrlResponse.ok) throw new Error("B2 Get Upload URL failed");
            const uploadUrlData = (await getUploadUrlResponse.json()) as any; // eslint-disable-line @typescript-eslint/no-explicit-any

            const uploadResponse = await fetch(uploadUrlData.uploadUrl, {
                method: "POST",
                headers: {
                    Authorization: uploadUrlData.authorizationToken,
                    "X-Bz-File-Name": encodeURIComponent(filename),
                    "Content-Type": "application/json",
                    "X-Bz-Content-Sha1": "do_not_verify"
                },
                body: backupJson
            });

            if (!uploadResponse.ok) throw new Error("B2 Upload failed");

            console.log(`Successfully backed up to B2: ${filename}`);
        } catch (error) {
            console.error("Backup failed:", error);
            throw error;
        }
    }
});

/**
 * Restores data from a JSON dump.
 * CAUTION: This overwrites/merges existing data.
 */
export const restoreFromBackup = internalMutation({
    args: { data: v.any() },
    handler: async (ctx, args) => {
        const data = args.data;
        for (const table of BACKUP_TABLES) {
            // eslint-disable-next-line security/detect-object-injection
            const items = data[table];
            if (!items || !Array.isArray(items)) continue;

            for (const item of items) {
                const { _id, _creationTime, ...fields } = item as { _id: Id<TableNames>, _creationTime: number };

                // Optimized restoration: upsert based on original ID
                const existing = await ctx.db.get(_id);
                if (existing) {
                    await ctx.db.patch(_id, fields as any); // eslint-disable-line @typescript-eslint/no-explicit-any
                } else {
                    await ctx.db.insert(table, { ...fields, _id } as any); // eslint-disable-line @typescript-eslint/no-explicit-any
                }
            }
        }
    }
});
