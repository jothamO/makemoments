import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const prodUrl = process.env.VITE_CONVEX_URL;
// Check if we are targeting prod. If the user ran with --prod, we need to be careful.
// Actually, the user can provide the URL.

async function main() {
    const data = JSON.parse(fs.readFileSync("dev_data.json", "utf-8"));

    // We'll use the URL from the environment, but let's make sure it's the right one.
    // For this task, I'll assume the user wants to use the prod URL if available.
    if (!prodUrl) {
        console.error("VITE_CONVEX_URL not found in .env.local");
        process.exit(1);
    }

    console.log(`Mirroring data to ${prodUrl}...`);
    const client = new ConvexHttpClient(prodUrl);

    try {
        const result = await client.mutation(api.mirror.importAll, { data });
        console.log(result);
    } catch (err) {
        console.error("Import failed:", err);
        process.exit(1);
    }
}

main();
