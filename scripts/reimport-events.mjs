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

const EVENTS_DATA_PATH = path.resolve(__dirname, "../events_extracted.json");

// Helper to generate slug
function generateSlug(name) {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

// Map month name to date (2026)
const MONTH_MAP = {
    "January": 0, "February": 1, "March": 2, "April": 3, "May": 4, "June": 5,
    "July": 6, "August": 7, "September": 8, "October": 9, "November": 10, "December": 11
};

async function main() {
    try {
        if (!fs.existsSync(EVENTS_DATA_PATH)) {
            console.error("events_extracted.json not found. Run extraction first.");
            process.exit(1);
        }

        const eventsToImport = JSON.parse(fs.readFileSync(EVENTS_DATA_PATH, "utf-8"));
        console.log(`Loaded ${eventsToImport.length} events from extracted data.`);

        const now = Date.now();

        for (const event of eventsToImport) {
            // Skip "International Women's Day" as per user instruction (mock already exists)
            if (event.name === "International Women's Day") {
                console.log(`Skipping ${event.name} (exists as mock)`);
                continue;
            }

            const slug = generateSlug(event.name);

            // Calculate Dates for 2026
            let eventDate;
            let launchDate;
            let endDate;

            if (event.kind === "evergreen") {
                eventDate = now;
                launchDate = now - (1000 * 60 * 60 * 24 * 365); // Far in the past
                endDate = now + (1000 * 60 * 60 * 24 * 365 * 10); // Far in the future
            } else {
                const monthIdx = MONTH_MAP[event.monthName];
                // Most events are 1st of month unless specified (we'll use 1st for now or extract if possible)
                // For this batch, many have specific days in HTML like 'Jan 19', 'Feb 14'
                // However, our extraction script was simplified. Let's look at the HTML again if needed or use defaults.
                // Re-calculating dates properly:
                const year = 2026;
                // Default day to 1st if not known
                let day = 1;

                // Manual overrides for known specific dates from HTML source
                const specificDays = {
                    "New Year's Day": 1,
                    "MLK Day": 19,
                    "Valentine's Day": 14,
                    "Intl. Women's Day": 8,
                    "Eid al-Fitr": 30,
                    "St. Patrick's Day": 17,
                    "Easter": 5,
                    "Earth Day": 22,
                    "Mother's Day": 10,
                    "Graduation Season": 15,
                    "Memorial Day": 25,
                    "Independence Day": 4,
                    "Labor Day": 7,
                    "World Gratitude Day": 21,
                    "Nigeria Independence Day": 1,
                    "Halloween": 31,
                    "Thanksgiving": 26,
                    "Christmas": 25,
                    "New Year's Eve · Year in Review": 31
                };

                day = specificDays[event.name] || 1;
                eventDate = new Date(year, monthIdx, day).getTime();

                // Launch window usually 7-14 days before
                launchDate = eventDate - (1000 * 60 * 60 * 24 * 10);
                // End date usually 7 days after
                endDate = eventDate + (1000 * 60 * 60 * 24 * 7);

                // Adjust for months like Black History Month or Pride Month (whole month)
                if (event.name === "Black History Month" || event.name === "Pride Month" || event.name === "Summer Vacation") {
                    launchDate = new Date(year, monthIdx, 1).getTime();
                    endDate = new Date(year, monthIdx + 1, 0, 23, 59, 59).getTime();
                    eventDate = launchDate;
                }
            }

            // Status logic
            let status = "upcoming";
            if (now > endDate) status = "ended";
            else if (now >= launchDate) status = "active";

            const EVENT_MESSAGES = {
                "New Year's Day": {
                    upcoming: ["Put the champagne down. 🥂", "The countdown hasn't started yet. Come back {launchDate} when the party's actually close."],
                    expired: ["The ball already dropped. 🎆", "{eventDate} came, celebrated, and sobered up. Catch the next one in {eventNextYear}."]
                },
                "MLK Day": {
                    upcoming: ["The dream isn't ready yet. ✊", "Honor season opens {launchDate}. Come back when it's time to celebrate right."],
                    expired: ["The march moved on without you. ✊🏿", "MLK Day wrapped up and kept it moving. The legacy doesn't wait for late arrivals."]
                },
                "Valentine's Day": {
                    upcoming: ["Calm down, lover. 💘", "The Love Lab doesn't open until {launchDate}. Go touch some grass and come back then."],
                    expired: ["The romance ship has sailed. 💔", "{eventDate} came and went. Whoever you were making this for — good luck explaining."]
                },
                "Black History Month": {
                    expired: ["You snooze, you lose. ✊🏿", "BHM wrapped up and left without you. February doesn't wait for late arrivals."]
                },
                "International Women's Day": {
                    upcoming: ["She's not accepting tributes yet. ♀️", "HerStory Maker opens {launchDate}. Use the time to actually think about what you want to say."],
                    expired: ["She didn't wait for you. 💜", "{eventDate} celebrated without you. The women in your life noticed — we're just saying."]
                },
                "Eid al-Fitr": {
                    upcoming: ["The crescent moon hasn't spoken yet. 🌙", "Eid Mubarak cards open {launchDate}. The celebration is coming — be ready."],
                    expired: ["Eid Mubarak already left the group chat. 🌙", "The lanterns are packed and the dates are finished. Eid moved on. Ramadan Kareem next year."]
                },
                "St. Patrick's Day": {
                    upcoming: ["The luck hasn't arrived yet. 🍀", "Lucky Moments opens {launchDate}. Sober up and come back then."],
                    expired: ["The pub closed and you missed last orders. 🍺", "{eventDate} came, danced a jig, and left. The green is back in the drawer until next year."]
                },
                "Easter": {
                    upcoming: ["The eggs aren't hidden yet. 🐣", "Easter Memory Maker opens {launchDate}. The bunny is still on his way."],
                    expired: ["The Easter basket has been picked clean. 🐣", "{eventDate} hopped away without you. The eggs are found, the brunch is done, the family went home."]
                },
                "Earth Day": {
                    upcoming: ["The planet isn't ready for your pledge yet. 🌍", "Planet Hero opens {launchDate}. Maybe use the wait time to recycle something."],
                    expired: ["Earth Day composted your late entry. 🌱", "{eventDate} saved the planet and left. Your eco-pledge will have to wait 365 days."]
                },
                "Mother's Day": {
                    expired: ["Too late, champ. 🌸", "Mom already got someone else's card. The window closed {endDate}."]
                },
                "Graduation Season": {
                    upcoming: ["The caps haven't been thrown yet. 🎓", "Class of {eventYear} Yearbook opens {launchDate}. Study up and come back."],
                    expired: ["The graduation gown is back in the bag. 🎓", "Graduation season packed up and moved on to real life. No late submissions — just like your professors said."]
                },
                "Memorial Day": {
                    upcoming: ["The flags aren't out yet. 🇺🇸", "Honor & Remember opens {launchDate}. Come back when it's time to pay proper respect."],
                    expired: ["The tribute window has closed. 🎖️", "Memorial Day honored its heroes and stood down. Some moments you just can't be late for."]
                },
                "Pride Month": {
                    upcoming: ["The rainbow isn't deployed yet. 🏳️‍🌈", "Pride Story opens {launchDate}. The flags are being ironed. Come back ready."],
                    expired: ["Pride packed the glitter up for the year. 🏳️‍🌈", "June celebrated loud and left. The love is still there — the creation window isn't."]
                },
                "Father's Day": {
                    upcoming: ["Dad's not accepting appreciation yet. 👨‍👦", "Dad's Playbook opens {launchDate}. Spend the wait actually calling him."],
                    expired: ["Dad already got someone else's card. 👨‍👦", "{eventDate} came and went. Whoever's dad you were celebrating — hope they didn't notice."]
                },
                "Independence Day": {
                    upcoming: ["The fireworks are still in the box. 🎇", "Stars & Stripes Creator opens {launchDate}. The BBQ can wait a little longer."],
                    expired: ["The fireworks already fired. 🎆", "{eventDate} celebrated, exploded, and went to bed. The patriotism window closed with the last sparkler."]
                },
                "Summer Vacation": {
                    upcoming: ["The beach isn't open for business yet. 🏖️", "Summer Bucket List opens {launchDate}. Finish packing and come back."],
                    expired: ["Summer packed its bags and left. 🌅", "The vacation is over, the tan is fading, and the bucket list is back in the drawer. See you next July."]
                },
                "Back to School": {
                    upcoming: ["The classroom isn't ready for you yet. 🎒", "First Day of School opens {launchDate}. Enjoy the last of your freedom."],
                    expired: ["The school bell rang without you. 🎒", "Back to School season is in third period already. Late pass expired {endDate}."]
                },
                "International Youth Day": {
                    upcoming: ["Your era hasn't started yet. 🔥", "Youth Voice opens {launchDate}. Charge your phone and come back ready."],
                    expired: ["Gen Z moved on without you. 🔥", "{eventDate} spoke its truth and kept it moving. The youth don't do late — that's a whole other generation's problem."]
                },
                "Labor Day": {
                    upcoming: ["The work milestone clock isn't running yet. 🔨", "Work Anniversary opens {launchDate}. Clock back in on time."],
                    expired: ["The career celebration clocked out. 🔨", "Labor Day punched out and went home. Your work anniversary card will have to wait until next year."]
                },
                "World Gratitude Day": {
                    upcoming: ["The thank-yous aren't ready to send yet. 🙏", "Thank You Cards open {launchDate}. Think about who actually deserves one while you wait."],
                    expired: ["The gratitude window quietly closed. 🙏", "{eventDate} said thank you and moved on. Some things you just have to catch in the moment."]
                },
                "Nigeria Independence Day": {
                    expired: ["Naija didn't wait. 🇳🇬", "October 1st came, celebrated, and left. The green-white-green has been folded."]
                },
                "Breast Cancer Awareness Month": {
                    upcoming: ["The pink ribbon isn't pinned yet. 🎀", "Pink Ribbon Stories opens {launchDate}. Come back ready to show up for someone."],
                    expired: ["October folded the ribbon and filed it away. 🎀", "The awareness window closed {endDate}. The fight continues — the creation window doesn't."]
                },
                "Halloween": {
                    upcoming: ["Easy there, ghost hunter. 👻", "The haunting hasn't started yet. Come back {launchDate} when the spirits clock in."],
                    expired: ["The ghosts have gone home. 🎃", "Spooky season is over. The costume stays in the bag until next October."]
                },
                "Thanksgiving": {
                    upcoming: ["The turkey isn't in the oven yet. 🦃", "Grateful Hearts opens {launchDate}. Go practice being thankful in the meantime."],
                    expired: ["The leftovers are gone and so is the window. 🦃", "Thanksgiving ate, napped, and closed the kitchen. The gratitude cards went with the dirty dishes."]
                },
                "Black Friday · Cyber Monday": {
                    upcoming: ["The deals aren't live yet. 🛍️", "Deal Hunter Badge opens {launchDate}. Save your energy — and your money — for when it counts."],
                    expired: ["You missed the drop and the window. 🛍️", "Black Friday came, conquered, and closed out. Cyber Monday didn't save you either."]
                },
                "Detty December": {
                    expired: ["The owambe ended without you. 🎉", "Detty December packed up and went home. Same time next year — don't sleep."]
                },
                "Hanukkah": {
                    upcoming: ["The menorah isn't lit yet. 🕎", "Festival of Lights opens {launchDate}. Eight nights of magic are almost here."],
                    expired: ["The eighth candle burned out. 🕎", "All eight nights celebrated without your card. The menorah is back on the shelf until next December."]
                },
                "Christmas": {
                    upcoming: ["Slow down, Santa. 🎅", "The elves aren't on shift yet. Christmas magic opens {launchDate} — put it in your phone."],
                    expired: ["Santa already left your zone. 🎄", "Christmas creation closed Dec 24th. You had 24 days. 24 whole days."]
                },
                "New Year's Eve · Year in Review": {
                    expired: ["Fumbled the bag AND dropped the phone. 🏈", "The Year in Review window closed. You're reviewing {eventYear} in {eventNextYear}? Bold move."]
                }
            };

            const msgs = EVENT_MESSAGES[event.name] || {};

            const theme = {
                baseColor: event.baseColor || "#0a0a0a",
                glowColor: event.glowColor || "#ffffff",
                type: "dark", // Most were dark in HTML
                headline: event.name,
                subheadline: `Celebrate ${event.name} with a personalized memory.`,
                ctaText: "Create Now",
                urgencyText: `${event.name} is here!`,
                textColor: "#FFFFFF", // Default for dark themes
                textMode: "dark",
                upcomingHeadline: msgs.upcoming?.[0],
                upcomingSubheadline: msgs.upcoming?.[1],
                expiredHeadline: msgs.expired?.[0],
                expiredSubheadline: msgs.expired?.[1],
            };

            // Custom Tier Overrides (Approved Plan: Seasonal T1 > Evergreen T2)
            let tier = event.tier || 4;
            if (event.name === "Birthday" || event.name === "Anniversary") {
                tier = 2; // Evergreen Fallback
            } else if (event.name === "Mother's Day" || event.name === "New Year's Eve · Year in Review") {
                tier = 1; // High Priority Seasonal
            }

            const payload = {
                name: event.name,
                slug: slug,
                date: eventDate,
                launchDate: launchDate,
                endDate: endDate,
                status: status,
                tier: tier,
                kind: event.kind || "one-time",
                theme: theme
            };

            console.log(`Importing ${event.name} (Slug: ${slug}, Tier: ${payload.tier}, Status: ${status})...`);

            try {
                await client.mutation("events:create", payload);
            } catch (err) {
                console.error(`Failed to create ${event.name}:`, err.message);
            }
        }

        console.log("Import process completed!");

    } catch (error) {
        console.error("Process failed:", error);
        process.exit(1);
    }
}

main();
