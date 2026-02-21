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

const client = new ConvexHttpClient(convexUrl);

async function main() {
    const events = await client.query("events:getAll");

    console.log(`Total Events: ${events.length}`);
    console.log(`Tier 1 Events: ${events.filter(e => e.tier === 1).map(e => e.name).join(", ")}`);
    console.log(`Tier 2 Events: ${events.filter(e => e.tier === 2).map(e => e.name).join(", ")}`);
    console.log(`Status Active: ${events.filter(e => e.status === "active").map(e => e.name).join(", ")}`);
}

main().catch(console.error);
