import type { VercelRequest, VercelResponse } from "@vercel/node";

/**
 * Vercel Serverless Function: /api/csp-report
 * 
 * Digital forensics endpoint for security monitoring.
 * Receives Content-Security-Policy-Report-Only and CSP reports.
 * 
 * This allows us to monitor for potential XSS attempts or misconfigured 
 * third-party script loads in production without blocking the user.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).end('Method Not Allowed');
    }

    try {
        const report = req.body;

        // Log to Vercel console for monitoring
        console.warn('CSP Violation Reported:', JSON.stringify(report, null, 2));

        // Return 204 No Content (Standard for beacon/reporting endpoints)
        return res.status(204).end();
    } catch (error) {
        console.error('CSP Report Handler Error:', error);
        return res.status(500).end('Internal Server Error');
    }
}
