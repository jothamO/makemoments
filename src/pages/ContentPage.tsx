import { Link, useLocation } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { PublicHeader } from "@/components/public/Header";
import { PublicFooter } from "@/components/public/Footer";
import { GlobalLoader } from "@/components/ui/GlobalLoader";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";
import { useJsonLd } from "@/hooks/useJsonLd";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

/**
 * Renders a CMS-managed content page (e.g. /about, /help-center, /privacy, /terms).
 * Content is stored as markdown in the Convex `sitePages` table.
 */
export default function ContentPage() {
    const location = useLocation();
    const slug = location.pathname.replace(/^\//, ""); // "/about" → "about"
    const page = useQuery(api.sitePages.getBySlug, slug ? { slug } : "skip");

    useDocumentMeta({
        title: page ? `${page.title} — MakeMoments` : "MakeMoments",
        description: page ? page.title : undefined,
    });

    useJsonLd(page ? {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": page.title,
        "url": `https://makemoments.xyz/${slug}`,
        "publisher": {
            "@type": "Organization",
            "name": "MakeMoments",
            "url": "https://makemoments.xyz",
        },
    } : null);

    // Loading
    if (page === undefined) return <GlobalLoader />;

    // Not found / unpublished
    if (page === null) {
        return (
            <div className="min-h-screen flex flex-col bg-white">
                <PublicHeader />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center space-y-4">
                        <p className="text-6xl">📄</p>
                        <h1 className="text-2xl font-bold text-zinc-900">Page not found</h1>
                        <p className="text-zinc-500">This page doesn't exist or hasn't been published yet.</p>
                        <Link to="/" className="inline-block text-sm font-semibold text-zinc-600 hover:text-zinc-900 transition-colors">
                            ← Back to Home
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-white">
            <PublicHeader />

            <motion.main
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="flex-1 w-full max-w-3xl mx-auto px-6 py-12 md:py-20"
            >
                {/* Back link */}
                <Link
                    to="/"
                    className="inline-flex items-center gap-2 text-sm font-medium text-zinc-400 hover:text-zinc-700 transition-colors mb-8"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Home
                </Link>

                {/* Title */}
                <h1 className="text-4xl md:text-5xl font-black tracking-tight text-zinc-900 mb-2" style={{ fontFamily: "var(--font-headline)" }}>
                    {page.title}
                </h1>
                <p className="text-sm text-zinc-400 mb-10">
                    Last updated {new Date(page.updatedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                </p>

                {/* Markdown content rendered as prose */}
                <article
                    className="prose prose-zinc prose-lg max-w-none
                        prose-headings:font-bold prose-headings:tracking-tight
                        prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
                        prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
                        prose-p:leading-relaxed prose-p:text-zinc-600
                        prose-li:text-zinc-600
                        prose-strong:text-zinc-900
                        prose-a:text-zinc-900 prose-a:underline prose-a:underline-offset-4
                    "
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(page.content) }}
                />
            </motion.main>

            <PublicFooter />
        </div>
    );
}

/**
 * Minimal markdown-to-HTML renderer.
 * Handles: headings, bold, italic, links, lists, paragraphs, line breaks, horizontal rules.
 */
function renderMarkdown(md: string): string {
    let html = md
        // Escape HTML
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        // Headings (### > ## > #)
        .replace(/^### (.+)$/gm, "<h3>$1</h3>")
        .replace(/^## (.+)$/gm, "<h2>$1</h2>")
        .replace(/^# (.+)$/gm, "<h1>$1</h1>")
        // Bold and italic
        .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.+?)\*/g, "<em>$1</em>")
        // Links
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
        // Horizontal rules
        .replace(/^---$/gm, "<hr />")
        // Unordered lists
        .replace(/^- (.+)$/gm, "<li>$1</li>")
        // Line breaks
        .replace(/\n\n/g, "</p><p>")
        .replace(/\n/g, "<br />");

    // Wrap in paragraph tags
    html = `<p>${html}</p>`;

    // Clean up list items into proper <ul>
    html = html.replace(/(<li>.*?<\/li>)/gs, (match) => {
        return `<ul>${match}</ul>`;
    });

    // Clean empty paragraphs
    html = html.replace(/<p>\s*<\/p>/g, "");

    return html;
}
