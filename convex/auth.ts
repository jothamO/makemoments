import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";
import { GenericActionCtx, GenericMutationCtx, GenericQueryCtx } from "convex/server";

// --- Helpers ---

// Simple session token generator
function generateToken() {
    return Array.from(crypto.getRandomValues(new Uint8Array(20)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

// Password hashing using Web Crypto (PBKDF2)
async function hashPassword(password: string, salt: string) {
    const encoder = new TextEncoder();
    const passwordKey = await crypto.subtle.importKey(
        "raw",
        encoder.encode(password),
        "PBKDF2",
        false,
        ["deriveBits", "deriveKey"]
    );

    const key = await crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: encoder.encode(salt),
            iterations: 100000,
            hash: "SHA-256",
        },
        passwordKey,
        { name: "AES-GCM", length: 256 },
        true,
        ["encrypt", "decrypt"]
    );

    const exportedKey = await crypto.subtle.exportKey("raw", key);
    return btoa(String.fromCharCode(...new Uint8Array(exportedKey)));
}

// --- Internal Auth Logic ---

export const getViewer = query({
    args: { token: v.optional(v.string()) },
    handler: async (ctx, args) => {
        if (!args.token) return null;

        const session = await ctx.db
            .query("sessions")
            .withIndex("by_token", q => q.eq("token", args.token))
            .first();

        if (!session || session.expiresAt < Date.now()) {
            return null;
        }

        if (session.userId === "admin") {
            return { role: "admin", name: "Administrator" };
        }

        const user = await ctx.db.get(session.userId as Id<"users">);
        if (!user) return null;

        // Explicitly narrow type for TS
        const userData = user as Doc<"users">;

        return {
            _id: userData._id,
            email: userData.email,
            name: userData.username || userData.name || "User",
            role: userData.role,
        };
    },
});

export const loginAdmin = mutation({
    args: { password: v.string() },
    handler: async (ctx, args) => {
        const adminPassword = process.env.ADMIN_PASSWORD;
        if (!adminPassword) {
            throw new Error("Admin password not configured in environment");
        }

        if (args.password !== adminPassword) {
            throw new Error("Invalid admin password");
        }

        const token = generateToken();
        const expiresAt = Date.now() + (30 * 24 * 60 * 60 * 1000); // 30 days

        await ctx.db.insert("sessions", {
            userId: "admin",
            token,
            role: "admin",
            expiresAt,
            createdAt: Date.now(),
        });

        return { token };
    },
});

export const loginUser = mutation({
    args: { email: v.string(), password: v.string() },
    handler: async (ctx, args) => {
        const user = await ctx.db
            .query("users")
            .withIndex("by_email", q => q.eq("email", args.email))
            .first();

        if (!user || !user.passwordHash || !user.salt) {
            throw new Error("Invalid email or password");
        }

        const hash = await hashPassword(args.password, user.salt);
        if (hash !== user.passwordHash) {
            throw new Error("Invalid email or password");
        }

        const token = generateToken();
        const expiresAt = Date.now() + (30 * 24 * 60 * 60 * 1000); // 30 days

        await ctx.db.insert("sessions", {
            userId: user._id,
            token,
            role: "user",
            expiresAt,
            createdAt: Date.now(),
        });

        return { token };
    },
});

export const logout = mutation({
    args: { token: v.string() },
    handler: async (ctx, args) => {
        const session = await ctx.db
            .query("sessions")
            .withIndex("by_token", q => q.eq("token", args.token))
            .first();

        if (session) {
            await ctx.db.delete(session._id);
        }
    },
});

// Helper for other mutations to check admin status
export async function checkAdmin(ctx: GenericMutationCtx<any> | GenericQueryCtx<any>, token?: string) {
    if (!token) return false;
    const session = await ctx.db
        .query("sessions")
        .withIndex("by_token", q => q.eq("token", token))
        .first();
    return session?.role === "admin" && session.expiresAt > Date.now();
}

// Export for use in other mutations e.g. register during payment
export async function createPasswordHash(password: string) {
    const salt = Array.from(crypto.getRandomValues(new Uint8Array(16)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    const hash = await hashPassword(password, salt);
    return { hash, salt };
}
