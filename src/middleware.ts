// This file is intended for Vercel Edge Middleware
// Since this is not a Next.js project, we use the standard Web API Response/Request
// Reference: https://vercel.com/docs/functions/edge-middleware/middleware-api

export default function middleware(request: Request) {
    const country = request.headers.get('x-vercel-ip-country') || 'NG';

    // Create a new response so we can set cookies
    const response = new Response(null, {
        status: 200,
        headers: {
            'x-middleware-next': '1', // Instruction for Vercel to continue the request
        }
    });

    // Set cookie (manually for standard Response objects)
    response.headers.append('Set-Cookie', `mx-country=${country}; Path=/; Max-Age=2592000; SameSite=Lax`);

    return response;
}
