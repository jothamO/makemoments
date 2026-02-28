import { format } from "date-fns";

/**
 * Replaces placeholders in the format {placeholder} with actual values.
 */
function resolvePlaceholders(text: string, placeholders: Record<string, string>): string {
    let resolved = text;
    Object.entries(placeholders).forEach(([key, value]) => {
        resolved = resolved.replace(new RegExp(`\\{${key}\\}`, "g"), value);
    });
    return resolved;
}

/**
 * Determines the "Wise-Ass" message to display based on the current time and event status.
 * Window 1: 30 days before launchDate -> Upcoming message
 * Window 2: 30 days after endDate -> Expired message
 * Fallback: Default "Wise-Ass" message
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getWiseAssMessage(event: any, now: number = Date.now()) {
    const ONE_MONTH_MS = 1000 * 60 * 60 * 24 * 30;
    const { launchDate, endDate, theme } = event;

    const placeholders = {
        launchDate: format(new Date(launchDate), "MMM do"),
        endDate: format(new Date(endDate), "MMM do"),
        eventDate: format(new Date(event.date), "MMM do"),
        eventYear: format(new Date(event.date), "yyyy"),
        eventNextYear: (parseInt(format(new Date(event.date), "yyyy")) + 1).toString(),
    };

    // Window 1: Upcoming (30 days before launch)
    if (now < launchDate && now >= launchDate - ONE_MONTH_MS) {
        const headline = theme.upcomingHeadline || "Easy there, Wise-Ass. ⏳";
        const subheadline = theme.upcomingSubheadline || "The magic timing hasn't started yet.";
        return {
            headline: resolvePlaceholders(headline, placeholders),
            subheadline: resolvePlaceholders(subheadline, placeholders),
        };
    }

    // Window 2: Expired (30 days after end)
    if (now > endDate && now <= endDate + ONE_MONTH_MS) {
        const headline = theme.expiredHeadline || "Sorry, Wise-Ass. 😝";
        const subheadline = theme.expiredSubheadline || "You missed the magic timing!";
        return {
            headline: resolvePlaceholders(headline, placeholders),
            subheadline: resolvePlaceholders(subheadline, placeholders),
        };
    }

    // Default Fallback (Outside 30-day windows)
    return {
        headline: "Sorry, Wise-Ass. 😝",
        subheadline: "This celebration is no longer accepting new creations. You missed the magic timing!",
    };
}
