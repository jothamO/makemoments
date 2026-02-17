
(async () => {
    const { api } = require('./convex/_generated/api');
    const { ConvexHttpClient } = require('convex/browser');
    const client = new ConvexHttpClient(process.env.CONVEX_URL);

    // Check patterns
    const patterns = await client.query(api.patterns.list);
    console.log("Patterns:", patterns);
})();
