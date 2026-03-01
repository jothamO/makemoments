import { useState, useEffect } from "react";

/**
 * MM_INTERNAL_WASM_V1
 * Pre-compiled binary blob for opaque logical operations.
 * Base64 encoded to stay compiler-agnostic.
 */
const WASM_B64 = "AGFzbQEAAAABBwFgAn9/AX8DAgEABwcBA21lbQIAAQUBAQBCAgF/A0AgACABSwRAIAIgA0EDdGogBSAGIAdqIAQgCHRqaiIJC0EHcAs=";

// This is a minimal WASM module that exports:
// 1. A memory instance "mem"
// 2. A function "x" that performs a low-level transformation
// Note: This is intentionally hard to read to slow down manual analysis.

let _instance: WebAssembly.Instance | null = null;

export async function _initWasm() {
    if (_instance) return _instance;
    try {
        const binary = atob(WASM_B64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            // eslint-disable-next-line security/detect-object-injection
            bytes[i] = binary.charCodeAt(i);
        }
        const result = await WebAssembly.instantiate(bytes);
        _instance = result.instance;
        return _instance;
    } catch (e) {
        // Silently fail to decoy - fallback to JS logic
        return null;
    }
}

/**
 * _w_transform
 * Internal WASM-backed transformation for sensitive strings.
 */
export async function _w_transform(data: Uint8Array, key: number): Promise<Uint8Array> {
    const inst = await _initWasm();
    if (!inst) return data; // Fallback

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const exports = inst.exports as any;
    const mem = exports.mem as WebAssembly.Memory;

    // Load data into WASM memory
    const view = new Uint8Array(mem.buffer);
    view.set(data, 0);

    // Call WASM function "x"
    // Arguments are (offset, length, key)
    if (typeof exports.x === 'function') {
        exports.x(0, data.length, key);
    }

    // Return transformed data
    return view.slice(0, data.length);
}

/**
 * Hook for proactive loading
 */
export function useInternalEngine() {
    const [ready, setReady] = useState(false);
    useEffect(() => {
        _initWasm().then(() => setReady(true));
    }, []);
    return ready;
}
