import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { checkAdmin } from "./auth";

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
        const { id, token, ...data } = args;
        if (id) {
            await ctx.db.patch(id, {
                ...data,
                updatedAt: Date.now(),
            });
            return id;
        }

        const existing = await ctx.db.query("users").withIndex("by_email", q => q.eq("email", args.email)).first();
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
