import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Fetch exchange rates daily at 09:00 UTC (10:00 GMT+1)
crons.cron(
    "fetch exchange rates",
    "0 9 * * *",
    internal.exchangeRates.fetchLiveRates
);

// Process celebration expirations daily at 01:00 UTC
crons.cron(
    "process expirations",
    "0 1 * * *",
    internal.celebrationExpiry.processExpirations
);

// Daily database backup to Backblaze B2 at 03:00 UTC
crons.cron(
    "daily backup",
    "0 3 * * *",
    internal.backup.runBackupAction
);

export default crons;
