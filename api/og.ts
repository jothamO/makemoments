import type { VercelRequest, VercelResponse } from "@vercel/node";

/**
 * Vercel Serverless Function: /api/og
 *
 * Returns privacy-safe, bot-friendly HTML with proper OG meta tags
 * for celebration links. Social crawlers that hit this endpoint
 * will receive a well-structured preview card.
 *
 * Usage: /api/og?slug=my-celebration-slug
 *
 * This function exists as a dedicated OG endpoint. For the primary
 * celebration URLs (/:slug), bots will see the default index.html
 * OG tags (which are also privacy-safe and generic).
 */
export default function handler(req: VercelRequest, res: VercelResponse) {
    const slug = (req.query.slug as string) || "";
    const canonicalUrl = `https://makemoments.xyz/${slug}`;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <title>Someone made a Moment for you ❤️ — MakeMoments</title>
    <meta name="description" content="Open to see your special Moment" />
    <meta name="robots" content="noindex, nofollow" />

    <!-- Open Graph -->
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${canonicalUrl}" />
    <meta property="og:title" content="Someone made a Moment for you ❤️ — MakeMoments" />
    <meta property="og:description" content="Open to see your special Moment" />
    <meta property="og:image" content="https://makemoments.xyz/og-card.png" />

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:site" content="@MakeMoments" />
    <meta name="twitter:title" content="Someone made a Moment for you ❤️ — MakeMoments" />
    <meta name="twitter:description" content="Open to see your special Moment" />
    <meta name="twitter:image" content="https://makemoments.xyz/og-card.png" />

    <!-- Redirect real users to the SPA -->
    <meta http-equiv="refresh" content="0;url=${canonicalUrl}" />
    <link rel="canonical" href="${canonicalUrl}" />
</head>
<body>
    <p>Redirecting to <a href="${canonicalUrl}">your Moment</a>...</p>
</body>
</html>`;

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=3600");
    res.status(200).send(html);
}
