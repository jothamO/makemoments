import { useEffect } from "react";

interface DocumentMetaOptions {
    title?: string;
    description?: string;
    noindex?: boolean;
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
}

/**
 * Dynamically update document meta tags per route.
 * Safely injects/removes meta tags on mount/unmount.
 */
export function useDocumentMeta(options: DocumentMetaOptions) {
    useEffect(() => {
        const previousTitle = document.title;
        const injectedTags: HTMLElement[] = [];

        // Title
        if (options.title) {
            document.title = options.title;
        }

        // Helper: inject or update a meta tag
        const setMeta = (attr: string, key: string, content: string) => {
            let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
            if (el) {
                el.setAttribute("content", content);
            } else {
                el = document.createElement("meta");
                el.setAttribute(attr, key);
                el.setAttribute("content", content);
                document.head.appendChild(el);
                injectedTags.push(el);
            }
        };

        // Description
        if (options.description) {
            setMeta("name", "description", options.description);
        }

        // Robots (noindex)
        if (options.noindex) {
            setMeta("name", "robots", "noindex, nofollow");
        }

        // Open Graph
        if (options.ogTitle) {
            setMeta("property", "og:title", options.ogTitle);
        }
        if (options.ogDescription) {
            setMeta("property", "og:description", options.ogDescription);
        }
        if (options.ogImage) {
            setMeta("property", "og:image", options.ogImage);
        }

        // Cleanup: restore previous title and remove injected tags
        return () => {
            document.title = previousTitle;
            injectedTags.forEach((tag) => tag.remove());
        };
    }, [options.title, options.description, options.noindex, options.ogTitle, options.ogDescription, options.ogImage]);
}
