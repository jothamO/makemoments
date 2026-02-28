import { useEffect } from "react";

/**
 * Injects a JSON-LD structured data script into the document head.
 * Cleans up on unmount to avoid stale data across SPA navigations.
 */
export function useJsonLd(data: Record<string, unknown> | null) {
    useEffect(() => {
        if (!data) return;

        const script = document.createElement("script");
        script.type = "application/ld+json";
        script.textContent = JSON.stringify(data);
        document.head.appendChild(script);

        return () => {
            script.remove();
        };
    }, [JSON.stringify(data)]);
}
