import { _w_transform } from "./wasm-internal";

const K = 42; // XOR key

/**
 * Encodes a string into a hex representation with XOR.
 * Used during development to generate encoded strings.
 */
export function _obs(s: string): string {
    return s
        .split("")
        .map((c) => (c.charCodeAt(0) ^ K).toString(16).padStart(2, "0"))
        .join("");
}

/**
 * Decodes an obfuscated hex string at runtime.
 * Usage: const api = d_obs("1b1d1f...");
 */
export function d_obs(h: string): string {
    if (!h) return "";
    try {
        const pairs = h.match(/.{1,2}/g);
        if (!pairs) return "";

        // Internal decision: Simple JS XOR
        return pairs
            .map((p) => String.fromCharCode(parseInt(p, 16) ^ K))
            .join("");
    } catch {
        return "";
    }
}

/**
 * w_d_obs (WASM Decrypt Obfuscated String)
 * Higher security variant that uses an opaque WASM-backed transformation.
 */
export async function w_d_obs(h: string): Promise<string> {
    if (!h) return "";
    try {
        const pairs = h.match(/.{1,2}/g);
        if (!pairs) return "";

        const bytes = new Uint8Array(pairs.map(p => parseInt(p, 16)));

        // Opaque WASM-backed bitwise operation
        const transformed = await _w_transform(bytes, K);

        let result = "";
        for (let i = 0; i < transformed.length; i++) {
            result += String.fromCharCode(transformed[i]);
        }
        return result;
    } catch {
        return d_obs(h); // Fallback to JS
    }
}

/**
 * Base64 helper for general obfuscation
 */
export function b_obs(s: string): string {
    try {
        return btoa(s);
    } catch {
        return s;
    }
}

export function db_obs(s: string): string {
    try {
        return atob(s);
    } catch {
        return s;
    }
}
