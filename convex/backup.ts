import { v } from "convex/values";
import { internalMutation, internalQuery, query, action } from "./_generated/server";
import { internal } from "./_generated/api";
import { checkAdmin } from "./auth";
import { Doc, Id, TableNames } from "./_generated/dataModel";

const BACKUP_TABLES: TableNames[] = [
    "events",
    "musicTracks",
    "celebrations",
    "globalThemes",
    "globalFonts",
    "globalPatterns",
    "globalCharacters",
    "globalPricing",
    "templates",
    "exchangeRates",
    "gatewayConfig",
    "users",
    "sessions",
    "mailConfig",
    "mailTemplates",
    "eventNotifications",
    "rateLimits",
];

export const exportAll = query({
    args: { token: v.optional(v.string()) },
    handler: async (ctx, args) => {
        if (!(await checkAdmin(ctx, args.token))) {
            throw new Error("Unauthorized");
        }
        const data: Record<string, any[]> = {}; // eslint-disable-line @typescript-eslint/no-explicit-any
        for (const table of BACKUP_TABLES) {
            // eslint-disable-next-line security/detect-object-injection
            data[table] = await ctx.db.query(table as any).collect(); // eslint-disable-line @typescript-eslint/no-explicit-any
        }
        return data;
    },
});

// Internal version for automated backups
export const exportAllInternal = internalQuery({
    args: {},
    handler: async (ctx) => {
        const data: Record<string, any[]> = {}; // eslint-disable-line @typescript-eslint/no-explicit-any
        for (const table of BACKUP_TABLES) {
            // eslint-disable-next-line security/detect-object-injection
            data[table] = await ctx.db.query(table).collect();
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
        const b2Endpoint = process.env.B2_ENDPOINT; // e.g., bucket-name.s3.us-west-004.backblazeb2.com

        if (!b2KeyId || !b2Key || !b2Bucket || !b2Endpoint) {
            console.error("Backblaze B2 configuration missing");
            return;
        }

        const data = await ctx.runQuery(internal.backup.exportAllInternal);
        const backupJson = JSON.stringify(data, null, 2);
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const filename = `backups/makemoments-backup-${timestamp}.json`;

        try {
            // Using B2 Native API Flow: 1. Authorize 2. Get Upload URL 3. Upload
            // Note: For 2026 best practices, we use the easiest reliable method available in the environment.
            // B2 S3-compatible API is often preferred, but requires SigV4 signing.
            // Let's use a simpler Fetch approach for this environment.

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
                    "X-Bz-Content-Sha1": "do_not_verify" // Simplified for now, best practice would be to compute SHA
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
                const { _id, _creationTime, ...fields } = item as any; // eslint-disable-line @typescript-eslint/no-explicit-any

                // Optimized restoration: upsert based on original ID
                const existing = await ctx.db.get(_id);
                if (existing) {
                    await ctx.db.patch(_id, fields);
                } else {
                    await ctx.db.insert(table, { ...fields, _id } as any); // eslint-disable-line @typescript-eslint/no-explicit-any
                }
            }
        }
    }
});
