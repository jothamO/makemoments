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
    const MOCK_ID = "j977547tchwspar3hk98cjn4qn81gy8k";

    for (const event of events) {
        if (event._id !== MOCK_ID) {
            console.log(`Deleting: ${event.name}`);
            await client.mutation("events:remove", { id: event._id });
        }
    }
    console.log("Cleanup complete.");
}

main().catch(console.error);
