import { useEffect } from "react";

/**
 * Injects a JSON-LD structured data script into the document head.
 * Cleans up on unmount to avoid stale data across SPA navigations.
 */
export function useJsonLd(data: Record<string, unknown> | null) {
    const jsonString = data ? JSON.stringify(data) : null;

    useEffect(() => {
        if (!jsonString) return;

        const script = document.createElement("script");
        script.type = "application/ld+json";
        script.textContent = jsonString;
        document.head.appendChild(script);

        return () => {
            script.remove();
        };
    }, [jsonString]);
}
