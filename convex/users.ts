import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { checkAdmin, getUserIdByToken, createPasswordHash, hashPassword } from "./auth";
import { Id } from "./_generated/dataModel";

export const list = query({
    args: { token: v.optional(v.string()) },
    handler: async (ctx, args) => {
        if (!(await checkAdmin(ctx, args.token))) {
            throw new Error("Unauthorized");
        }
        return await ctx.db.query("users").order("desc").collect();
    },
});

export const upsert = mutation({
    args: {
        token: v.optional(v.string()),
        id: v.optional(v.id("users")),
        email: v.string(),
        name: v.optional(v.string()),
        role: v.union(v.literal("admin"), v.literal("user")),
        isSubscriber: v.boolean(),
    },
    handler: async (ctx, args) => {
        if (!(await checkAdmin(ctx, args.token))) {
            throw new Error("Unauthorized");
        }
        const normalizedEmail = args.email.toLowerCase().trim();
        const { id, token, ...data } = args;
        data.email = normalizedEmail;

        if (id) {
            await ctx.db.patch(id, {
                ...data,
                updatedAt: Date.now(),
            });
            return id;
        }

        const existing = await ctx.db.query("users").withIndex("by_email", q => q.eq("email", normalizedEmail)).first();
        if (existing) {
            await ctx.db.patch(existing._id, {
                ...data,
                updatedAt: Date.now(),
            });
            return existing._id;
        }

        return await ctx.db.insert("users", {
            ...data,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });
    },
});

export const remove = mutation({
    args: { id: v.id("users"), token: v.optional(v.string()) },
    handler: async (ctx, args) => {
        if (!(await checkAdmin(ctx, args.token))) {
            throw new Error("Unauthorized");
        }
        await ctx.db.delete(args.id);
    },
});

export const updateName = mutation({
    args: { token: v.string(), name: v.string() },
    handler: async (ctx, args) => {
        const userId = await getUserIdByToken(ctx, args.token);
        if (!userId || userId === "admin") {
            throw new Error("Unauthorized");
        }

        await ctx.db.patch(userId as Id<"users">, {
            name: args.name,
            updatedAt: Date.now(),
        });
    },
});

export const updatePassword = mutation({
    args: {
        token: v.string(),
        oldPassword: v.string(),
        newPassword: v.string()
    },
    handler: async (ctx, args) => {
        const userId = await getUserIdByToken(ctx, args.token);
        if (!userId || userId === "admin") {
            throw new Error("Unauthorized");
        }

        const user = await ctx.db.get(userId as Id<"users">);
        if (!user || !user.passwordHash || !user.salt) {
            throw new Error("User not found");
        }

        const oldHash = await hashPassword(args.oldPassword, user.salt);
        if (oldHash !== user.passwordHash) {
            throw new Error("Incorrect current password");
        }

        const { hash, salt } = await createPasswordHash(args.newPassword);
        await ctx.db.patch(userId as Id<"users">, {
            passwordHash: hash,
            salt: salt,
            updatedAt: Date.now(),
        });
    },
});
