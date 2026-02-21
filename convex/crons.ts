import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Fetch exchange rates daily at 09:00 UTC (10:00 GMT+1)
crons.cron(
    "fetch exchange rates",
    "0 9 * * *",
    internal.exchangeRates.fetchLiveRates
);

export default crons;
