/**
 * Runtime Integrity & Passive Auditing
 * - Domain locking: ensures the app runs only on verified origins.
 * - Passive debugger detection: logs suspicious activity without disruption.
 */

// Allowed origins (production + development)
const ALLOWED_HOSTS = [
    "makemoments.xyz",
    "www.makemoments.xyz",
    "localhost",
    "127.0.0.1",
];

type AuditReporter = (event: string, metadata?: Record<string, unknown>) => void;

let _reporter: AuditReporter | null = null;
let _initialized = false;

/**
 * Set the reporting function (connected to Convex mutation).
 */
export function setAuditReporter(fn: AuditReporter) {
    _reporter = fn;
}

function report(event: string, metadata?: Record<string, unknown>) {
    if (_reporter) {
        try {
            _reporter(event, metadata);
        } catch {
            // Silently fail — never disrupt UX
        }
    }
}

/**
 * Domain Lock Check
 * Verifies the current hostname is in the allowed list.
 */
function checkDomainLock() {
    if (typeof window === "undefined") return;
    const host = window.location.hostname;
    const isAllowed = ALLOWED_HOSTS.some(
        (h) => host === h || host.endsWith(`.${h}`)
    );
    if (!isAllowed) {
        report("domain_mismatch", {
            hostname: host,
            href: window.location.href,
            ua: navigator.userAgent,
        });
    }
}

/**
 * Passive Debugger Detection
 * Uses a performance-timing heuristic: if a debugger breakpoint pauses
 * execution, the time between two `performance.now()` calls will spike.
 * This does NOT crash or block the app — it only reports.
 */
let _devtoolsCheckInterval: ReturnType<typeof setInterval> | null = null;

function startDebuggerWatch() {
    if (typeof window === "undefined") return;
    // Only run in production
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") return;

    _devtoolsCheckInterval = setInterval(() => {
        const t0 = performance.now();
        // This is intentionally a no-op that a debugger breakpoint would pause
        // eslint-disable-next-line no-debugger
        (function () { })();
        const t1 = performance.now();
        // Normal execution: < 5ms. Debugger paused: >> 50ms.
        if (t1 - t0 > 100) {
            report("debugger_detected", {
                delta: Math.round(t1 - t0),
                ua: navigator.userAgent,
                ts: Date.now(),
            });
            // Stop checking after first detection to avoid spamming
            if (_devtoolsCheckInterval) {
                clearInterval(_devtoolsCheckInterval);
                _devtoolsCheckInterval = null;
            }
        }
    }, 3000); // Check every 3 seconds
}

/**
 * Console override detection
 * Checks if console methods have been tampered with (common in cloning tools).
 */
function checkConsoleIntegrity() {
    if (typeof window === "undefined") return;
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") return;

    try {
        const nativeToString = Function.prototype.toString;
        const logStr = nativeToString.call(console.log);
        // Native functions contain "native code" in their toString
        if (!logStr.includes("native code")) {
            report("console_tampered", {
                ua: navigator.userAgent,
            });
        }
    } catch {
        // Silently fail
    }
}

/**
 * Initialize all passive integrity checks.
 * Should be called once during app startup.
 */
export function initIntegrityChecks() {
    if (_initialized) return;
    _initialized = true;

    // Run immediately
    checkDomainLock();
    checkConsoleIntegrity();

    // Start background monitoring
    startDebuggerWatch();
}

/**
 * Cleanup (for unmount safety)
 */
export function teardownIntegrityChecks() {
    if (_devtoolsCheckInterval) {
        clearInterval(_devtoolsCheckInterval);
        _devtoolsCheckInterval = null;
    }
    _initialized = false;
}
