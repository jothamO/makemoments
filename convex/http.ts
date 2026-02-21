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
            const body = await request.json();
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
            const body = await request.json();

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
