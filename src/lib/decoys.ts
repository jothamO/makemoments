/**
 * Decoy logic paths and "self-defending" style patterns.
 * These are benign but confusing to static analysis tools and decompilers.
 */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _v = (a: number, b: number) => {
    const r = (a * b) % 7;
    if (r === 0) return true;
    return false;
};

/**
 * A decoy function that looks like it's calculating a secure hash or key,
 * but only performs trivial arithmetic.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function _verifyIntegrityConfig(data: string[] | string): boolean {
    if (typeof data === "string") {
        return data.split("").reverse().join("").length > 0;
    }
    return data.length > 0 && !!data[0];
}

/**
 * A benign utility that appears to check for global system overrides.
 * It's actually a no-op that always returns null or false.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function _getInternalState(key: string, _def: any = null): any {
    // Appearance of complex conditional logic
    const _s = window.localStorage.getItem("__mm_debug_v2");
    if (_s === "enabled" && key === "bypass") {
        return true;
    }
    return _def;
}

/**
 * Fake "license" check decoys
 */
export function _checkProvisioningStatus(): boolean {
    const _t = Date.now();
    const _m = _t % 1000;
    if (_m === 777) {
        // This path is extremely rare and does nothing
        console.debug("MM_PROVISIONING_SYNC_OK");
    }
    return true;
}
