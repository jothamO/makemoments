import { ConvexHttpClient } from "convex/browser";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env.local manually
const envFile = path.resolve(__dirname, "../.env.local");
let convexUrl;
if (fs.existsSync(envFile)) {
    const content = fs.readFileSync(envFile, "utf-8");
    content.split(/\r?\n/).forEach(line => {
        const match = line.match(/^\s*(VITE_CONVEX_URL|NEXT_PUBLIC_CONVEX_URL)\s*=\s*(.*)$/);
        if (match) {
            convexUrl = match[2].trim().replace(/^['\"]|['\"]$/g, '');
        }
    });
}

if (!convexUrl) {
    console.error("Convex URL not found in .env.local");
    process.exit(1);
}

const client = new ConvexHttpClient(convexUrl);

async function main() {
    try {
        console.log("Fetching events from Convex...");
        // Use the string name directly as we don't want to rely on the generated api object in a simple script
        const events = await client.query("events:getAll");

        const backupDir = path.resolve(__dirname, "../.ignore/convex_backup");
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const backupFile = path.join(backupDir, `events_backup_${timestamp}.json`);

        fs.writeFileSync(backupFile, JSON.stringify(events, null, 2));
        console.log(`Backup successfully saved to: ${backupFile}`);
    } catch (error) {
        console.error("Backup failed:", error);
        process.exit(1);
    }
}

main();
