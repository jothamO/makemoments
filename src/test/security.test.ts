import { describe, it, expect, vi, beforeEach } from "vitest";
import { checkRateLimit } from "../../convex/rateLimit";
import { checkAdmin } from "../../convex/auth";

describe("checkRateLimit", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let mockCtx: any;

    beforeEach(() => {
        mockCtx = {
            db: {
                query: vi.fn().mockReturnValue({
                    withIndex: vi.fn().mockReturnThis(),
                    first: vi.fn(),
                }),
                patch: vi.fn().mockResolvedValue(undefined),
                insert: vi.fn().mockResolvedValue(undefined),
            },
        };
    });

    it("should allow a request if no record exists", async () => {
        mockCtx.db.query().first.mockResolvedValue(null);

        await expect(checkRateLimit(mockCtx, {
            identifier: "test-user",
            action: "login",
            limit: 5,
            windowMs: 60000,
        })).resolves.not.toThrow();

        expect(mockCtx.db.insert).toHaveBeenCalledWith("rateLimits", {
            identifier: "test-user",
            action: "login",
            count: 1,
            resetAt: expect.any(Number),
        });
    });

    it("should increment count if within window and under limit", async () => {
        const resetAt = Date.now() + 30000;
        mockCtx.db.query().first.mockResolvedValue({
            _id: "id1",
            identifier: "test-user",
            action: "login",
            count: 2,
            resetAt: resetAt,
        });

        await expect(checkRateLimit(mockCtx, {
            identifier: "test-user",
            action: "login",
            limit: 5,
            windowMs: 60000,
        })).resolves.not.toThrow();

        expect(mockCtx.db.patch).toHaveBeenCalledWith("id1", {
            count: 3,
        });
    });

    it("should throw error if limit is exceeded within window", async () => {
        const resetAt = Date.now() + 30000;
        mockCtx.db.query().first.mockResolvedValue({
            _id: "id1",
            identifier: "test-user",
            action: "login",
            count: 5,
            resetAt: resetAt,
        });

        await expect(checkRateLimit(mockCtx, {
            identifier: "test-user",
            action: "login",
            limit: 5,
            windowMs: 60000,
        })).rejects.toThrow("Too many requests");
    });

    it("should reset count if window has expired", async () => {
        const resetAt = Date.now() - 1000; // Expired 1 second ago
        mockCtx.db.query().first.mockResolvedValue({
            _id: "id1",
            identifier: "test-user",
            action: "login",
            count: 5,
            resetAt: resetAt,
        });

        await expect(checkRateLimit(mockCtx, {
            identifier: "test-user",
            action: "login",
            limit: 5,
            windowMs: 60000,
        })).resolves.not.toThrow();

        expect(mockCtx.db.patch).toHaveBeenCalledWith("id1", {
            count: 1,
            resetAt: expect.any(Number),
        });
    });
});

describe("checkAdmin", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let mockCtx: any;

    beforeEach(() => {
        mockCtx = {
            db: {
                query: vi.fn().mockReturnValue({
                    withIndex: vi.fn().mockReturnThis(),
                    first: vi.fn(),
                }),
            },
        };
    });

    it("should return false if no token is provided", async () => {
        const result = await checkAdmin(mockCtx);
        expect(result).toBe(false);
    });

    it("should return false if session is not found", async () => {
        mockCtx.db.query().first.mockResolvedValue(null);
        const result = await checkAdmin(mockCtx, "invalid-token");
        expect(result).toBe(false);
    });

    it("should return true if session is valid admin", async () => {
        mockCtx.db.query().first.mockResolvedValue({
            role: "admin",
            expiresAt: Date.now() + 10000,
        });
        const result = await checkAdmin(mockCtx, "valid-token");
        expect(result).toBe(true);
    });

    it("should return false if session has expired", async () => {
        mockCtx.db.query().first.mockResolvedValue({
            role: "admin",
            expiresAt: Date.now() - 10000,
        });
        const result = await checkAdmin(mockCtx, "expired-token");
        expect(result).toBe(false);
    });

    it("should return false if role is not admin", async () => {
        mockCtx.db.query().first.mockResolvedValue({
            role: "user",
            expiresAt: Date.now() + 10000,
        });
        const result = await checkAdmin(mockCtx, "user-token");
        expect(result).toBe(false);
    });
});
