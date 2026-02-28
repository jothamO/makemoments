import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { checkAdmin } from "./auth";

/** Public: get a published page by slug */
export const getBySlug = query({
    args: { slug: v.string() },
    handler: async (ctx, args) => {
        const page = await ctx.db
            .query("sitePages")
            .withIndex("by_slug", (q) => q.eq("slug", args.slug))
            .first();
        if (!page || !page.isPublished) return null;
        return page;
    },
});

/** Admin: list all pages */
export const list = query({
    handler: async (ctx) => {
        return await ctx.db.query("sitePages").collect();
    },
});

/** Admin: create or update a page (upsert by slug) */
export const upsert = mutation({
    args: {
        token: v.optional(v.string()),
        slug: v.string(),
        title: v.string(),
        content: v.string(),
        isPublished: v.boolean(),
    },
    handler: async (ctx, args) => {
        if (!(await checkAdmin(ctx, args.token))) {
            throw new Error("Unauthorized");
        }

        const existing = await ctx.db
            .query("sitePages")
            .withIndex("by_slug", (q) => q.eq("slug", args.slug))
            .first();

        if (existing) {
            await ctx.db.patch(existing._id, {
                title: args.title,
                content: args.content,
                isPublished: args.isPublished,
                updatedAt: Date.now(),
            });
            return existing._id;
        }

        return await ctx.db.insert("sitePages", {
            slug: args.slug,
            title: args.title,
            content: args.content,
            isPublished: args.isPublished,
            updatedAt: Date.now(),
            createdAt: Date.now(),
        });
    },
});

/** Admin: delete a page */
export const remove = mutation({
    args: {
        token: v.optional(v.string()),
        id: v.id("sitePages"),
    },
    handler: async (ctx, args) => {
        if (!(await checkAdmin(ctx, args.token))) {
            throw new Error("Unauthorized");
        }
        await ctx.db.delete(args.id);
    },
});
