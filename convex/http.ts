import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

const http = httpRouter();

// ── Paystack Webhook ──
http.route({
    path: "/webhooks/paystack",
    method: "POST",
    handler: httpAction(async (ctx, request) => {
        try {
            const bodyText = await request.text();
            const signature = request.headers.get("x-paystack-signature");

            // 1. Get Secret Key (Priority: Env Var > DB)
            const config = await ctx.runQuery(internal.gatewayConfig.getInternal);
            const secretKey = process.env.PAYSTACK_SECRET_KEY || config?.paystackSecretKey;

            if (!secretKey) {
                console.error("Paystack secret key missing");
                return new Response("Unauthorized", { status: 401 });
            }

            // 2. Verify Signature
            const encoder = new TextEncoder();
            const keyData = encoder.encode(secretKey);
            const bodyData = encoder.encode(bodyText);

            const cryptoKey = await crypto.subtle.importKey(
                "raw",
                keyData,
                { name: "HMAC", hash: "SHA-512" },
                false,
                ["verify", "sign"]
            );

            const signatureBytes = new Uint8Array(
                signature?.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []
            );

            const isValid = await crypto.subtle.verify(
                "HMAC",
                cryptoKey,
                signatureBytes,
                bodyData
            );

            if (!isValid) {
                console.error("Invalid Paystack signature");
                return new Response("Invalid signature", { status: 401 });
            }

            const body = JSON.parse(bodyText);
            const event = body.event;

            if (event !== "charge.success") {
                return new Response("Ignored", { status: 200 });
            }

            const reference = body.data?.reference;
            if (!reference) {
                return new Response("No reference", { status: 400 });
            }

            // Find celebration by reference
            const celebration = await ctx.runQuery(internal.payments.getByReference, { reference });
            if (!celebration) {
                return new Response("Celebration not found", { status: 404 });
            }

            // Mark as paid
            await ctx.runMutation(internal.payments.markAsPaid, {
                celebrationId: celebration._id as Id<"celebrations">,
            });

            return new Response("OK", { status: 200 });
        } catch (error) {
            console.error("Paystack webhook error:", error);
            return new Response("Internal error", { status: 500 });
        }
    }),
});

// ── Stripe Webhook ──
http.route({
    path: "/webhooks/stripe",
    method: "POST",
    handler: httpAction(async (ctx, request) => {
        try {
            const bodyText = await request.text();
            const sigHeader = request.headers.get("stripe-signature");

            // 1. Get Secret Key (Priority: Env Var > DB)
            const config = await ctx.runQuery(internal.gatewayConfig.getInternal);
            const secretKey = process.env.STRIPE_WEBHOOK_SECRET || config?.stripeSecretKey;

            if (!secretKey || !sigHeader) {
                console.error("Stripe secret key or signature missing");
                return new Response("Unauthorized", { status: 401 });
            }

            // 2. Verify Signature (t=...,v1=...)
            const parts = sigHeader.split(",");
            const timestamp = parts.find(p => p.startsWith("t="))?.split("=")[1];
            const signature = parts.find(p => p.startsWith("v1="))?.split("=")[1];

            if (!timestamp || !signature) {
                return new Response("Invalid signature format", { status: 400 });
            }

            // Prevent replay attacks (5 minute window)
            const tolerance = 300;
            if (Math.abs(Date.now() / 1000 - parseInt(timestamp)) > tolerance) {
                return new Response("Timestamp out of range", { status: 400 });
            }

            const signedPayload = `${timestamp}.${bodyText}`;
            const encoder = new TextEncoder();
            const keyData = encoder.encode(secretKey);
            const payloadData = encoder.encode(signedPayload);

            const cryptoKey = await crypto.subtle.importKey(
                "raw",
                keyData,
                { name: "HMAC", hash: "SHA-256" },
                false,
                ["verify", "sign"]
            );

            // Convert hex signature to bytes
            const signatureBytes = new Uint8Array(
                signature.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []
            );

            const isValid = await crypto.subtle.verify(
                "HMAC",
                cryptoKey,
                signatureBytes,
                payloadData
            );

            if (!isValid) {
                console.error("Invalid Stripe signature");
                return new Response("Invalid signature", { status: 401 });
            }

            const body = JSON.parse(bodyText);

            if (body.type !== "checkout.session.completed" && body.type !== "payment_intent.succeeded") {
                return new Response("Ignored", { status: 200 });
            }

            const reference = body.data?.object?.client_reference_id || body.data?.object?.metadata?.reference;
            if (!reference) {
                return new Response("No reference", { status: 400 });
            }

            const celebration = await ctx.runQuery(internal.payments.getByReference, { reference });
            if (!celebration) {
                return new Response("Celebration not found", { status: 404 });
            }

            await ctx.runMutation(internal.payments.markAsPaid, {
                celebrationId: celebration._id as Id<"celebrations">,
            });

            return new Response("OK", { status: 200 });
        } catch (error) {
            console.error("Stripe webhook error:", error);
            return new Response("Internal error", { status: 500 });
        }
    }),
});

export default http;
