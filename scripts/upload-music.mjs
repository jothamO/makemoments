import { ConvexHttpClient } from "convex/browser";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { api } from "../convex/_generated/api.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env.local manually
const envFile = path.resolve(__dirname, "../.env.local");
if (fs.existsSync(envFile)) {
    console.log(`Loading env from ${envFile}`);
    const content = fs.readFileSync(envFile, "utf-8");
    content.split(/\r?\n/).forEach(line => {
        const match = line.match(/^\s*([^#\s][^=]*)\s*=\s*(.*)$/);
        if (match) {
            const key = match[1].trim();
            let value = match[2].trim();
            // Remove optional quotes
            if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                value = value.slice(1, -1);
            }
            process.env[key] = value;
        }
    });
}

const convexUrl = process.env.VITE_CONVEX_URL || process.env.NEXT_PUBLIC_CONVEX_URL;
console.log(`Convex URL: ${convexUrl}`);

if (!convexUrl) {
    console.error("VITE_CONVEX_URL not found in .env.local or environment");
    process.exit(1);
}

const client = new ConvexHttpClient(convexUrl);

async function main() {
    console.log("Starting music upload...");

    // 1. Get all music tracks
    const tracks = await client.query(api.music.list);
    console.log(`Found ${tracks.length} tracks in database.`);

    for (const track of tracks) {
        if (track.storageId) {
            console.log(`Track "${track.name}" already has storageId: ${track.storageId}`);
            continue;
        }

        if (!track.url || !track.url.startsWith("/music/")) {
            console.warn(`Track "${track.name}" has invalid URL for local lookup: ${track.url}`);
            continue;
        }

        // 2. Resolve local file path
        // track.url is like "/music/filename.mp3"
        const localPath = track.url.startsWith("/") ? track.url.slice(1) : track.url;
        const filePath = path.resolve(__dirname, "../public", localPath);

        if (!fs.existsSync(filePath)) {
            console.error(`File not found: ${filePath}`);
            continue;
        }

        console.log(`Uploading ${track.name} from ${filePath}...`);

        // 3. Generate upload URL
        const uploadUrl = await client.mutation(api.music.generateUploadUrl);

        // 4. Upload file
        const fileContent = fs.readFileSync(filePath);
        const response = await fetch(uploadUrl, {
            method: "POST",
            headers: { "Content-Type": "audio/mpeg" },
            body: fileContent,
        });

        if (!response.ok) {
            console.error(`Failed to upload ${track.name}: ${response.statusText}`);
            continue;
        }

        const { storageId } = await response.json();
        console.log(`Uploaded! storageId: ${storageId}`);

        // 5. Update track record
        await client.mutation(api.music.updateStorageId, {
            id: track._id,
            storageId: storageId,
        });

        console.log(`Updated track ${track.name} in database.`);
    }

    console.log("Finished uploads.");
}

main().catch(console.error);
