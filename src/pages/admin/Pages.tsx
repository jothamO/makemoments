import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { FileText, Plus, Trash2, Eye, EyeOff, Loader2, Save, ExternalLink } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogClose } from "@/components/ui/dialog";

const DEFAULT_PAGES = [
    { slug: "about", title: "About MakeMoments", content: "# About MakeMoments\n\nWe craft moments that matter.\n\nMakeMoments is a platform for creating beautiful, personalized digital celebrations for your loved ones. Whether it's Valentine's Day, a birthday, or any special occasion — we help you express what words alone can't.\n\n## Our Mission\n\nTo make heartfelt digital gifting accessible, beautiful, and personal.\n\n## Contact\n\nReach us at hello@makemoments.xyz" },
    { slug: "help-center", title: "Help Center", content: "# Help Center\n\nFind answers to common questions about using MakeMoments.\n\n## Getting Started\n\n**How do I create a celebration?**\nTap the + button on the home screen, choose your event, and start designing with photos, text, music, and characters.\n\n**How do I share my creation?**\nAfter payment, you'll receive a unique link that you can share via WhatsApp, SMS, or any messaging app.\n\n## Payments\n\n**What payment methods do you accept?**\nWe accept card payments via Paystack (for African currencies) and Stripe (for international payments).\n\n**Can I get a refund?**\nSince celebrations are digital and instantly delivered, refunds are handled on a case-by-case basis. Contact us at hello@makemoments.xyz.\n\n## Technical\n\n**My celebration won't load. What should I do?**\nTry refreshing the page or clearing your browser cache. If the issue persists, contact us.\n\n**How long is my celebration available?**\nCelebrations are available for 365 days from the date of creation." },
    { slug: "privacy", title: "Privacy Policy", content: "# Privacy Policy\n\nLast updated: February 2026\n\n## Information We Collect\n\nWe collect the information you provide when creating an account or celebration, including your email address, uploaded photos, and text content.\n\n## How We Use Your Information\n\n- To deliver and display your celebrations\n- To process payments\n- To send transactional emails (receipts, reminders)\n- To improve our service\n\n## Data Storage\n\nYour data is stored securely using Convex (database) and Vercel (hosting). Photos are stored in encrypted cloud storage.\n\n## Your Rights\n\nYou can request deletion of your account and all associated data by contacting hello@makemoments.xyz.\n\n## Contact\n\nFor privacy inquiries, contact hello@makemoments.xyz." },
    { slug: "terms", title: "Terms of Service", content: "# Terms of Service\n\nLast updated: February 2026\n\n## Acceptance of Terms\n\nBy using MakeMoments, you agree to these terms.\n\n## Service Description\n\nMakeMoments provides a platform for creating and sharing digital celebrations.\n\n## User Content\n\nYou retain ownership of all content you upload. By uploading content, you grant MakeMoments a license to display it within your celebrations.\n\n## Payments\n\nAll prices are displayed in your local currency. Payments are processed securely through our payment partners.\n\n## Prohibited Use\n\nYou may not use MakeMoments for any illegal, harmful, or abusive purpose.\n\n## Limitation of Liability\n\nMakeMoments is provided \"as is\" without warranties. We are not liable for any damages arising from your use of the service.\n\n## Contact\n\nQuestions? Contact hello@makemoments.xyz." },
];

export default function PagesAdmin() {
    const { toast } = useToast();
    const { token } = useAuth();
    const pages = useQuery(api.sitePages.list) || [];
    const upsertPage = useMutation(api.sitePages.upsert);
    const removePage = useMutation(api.sitePages.remove);

    const [editSlug, setEditSlug] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState("");
    const [editContent, setEditContent] = useState("");
    const [isPublished, setIsPublished] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const editingPage = pages.find((p) => p.slug === editSlug);

    const openEditor = (slug: string, title: string, content: string, published: boolean) => {
        setEditSlug(slug);
        setEditTitle(title);
        setEditContent(content);
        setIsPublished(published);
    };

    const handleSave = async () => {
        if (!editSlug || !editTitle.trim()) return;
        setIsSaving(true);
        try {
            await upsertPage({
                token: token || undefined,
                slug: editSlug,
                title: editTitle.trim(),
                content: editContent,
                isPublished,
            });
            toast({ title: "Page saved" });
            setEditSlug(null);
        } catch {
            toast({ title: "Failed to save", variant: "destructive" });
        }
        setIsSaving(false);
    };

    const handleSeedDefaults = async () => {
        setIsSaving(true);
        try {
            for (const page of DEFAULT_PAGES) {
                const existing = pages.find((p) => p.slug === page.slug);
                if (!existing) {
                    await upsertPage({
                        token: token || undefined,
                        slug: page.slug,
                        title: page.title,
                        content: page.content,
                        isPublished: true,
                    });
                }
            }
            toast({ title: "Default pages created" });
        } catch {
            toast({ title: "Failed to seed pages", variant: "destructive" });
        }
        setIsSaving(false);
    };

    // Editor view
    if (editSlug) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-zinc-900 tracking-tight">Edit Page</h2>
                        <p className="text-zinc-500 text-sm">/{editSlug}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" onClick={() => setEditSlug(null)}>Cancel</Button>
                        <Button
                            className="bg-zinc-900 text-white hover:bg-zinc-800 gap-2"
                            onClick={handleSave}
                            disabled={isSaving}
                        >
                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            Save
                        </Button>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>Page Title</Label>
                        <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="h-10" />
                    </div>

                    <div className="flex items-center gap-3 py-1">
                        <input
                            type="checkbox"
                            id="page-published"
                            checked={isPublished}
                            onChange={(e) => setIsPublished(e.target.checked)}
                            className="h-4 w-4 rounded border-zinc-300 accent-zinc-900"
                        />
                        <Label htmlFor="page-published" className="flex items-center gap-2 cursor-pointer">
                            {isPublished ? <Eye className="h-4 w-4 text-emerald-500" /> : <EyeOff className="h-4 w-4 text-zinc-400" />}
                            {isPublished ? "Published" : "Draft"}
                        </Label>
                    </div>

                    <div className="space-y-2">
                        <Label>Content (Markdown)</Label>
                        <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="w-full min-h-[400px] rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-300 transition-all"
                            placeholder="Write your page content in Markdown..."
                        />
                    </div>
                </div>
            </div>
        );
    }

    // List view
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-zinc-900 tracking-tight">Site Pages</h2>
                    <p className="text-zinc-500 text-sm">Manage your about, help, privacy, and terms pages.</p>
                </div>
                {pages.length === 0 && (
                    <Button
                        className="bg-zinc-900 text-white hover:bg-zinc-800 gap-2"
                        onClick={handleSeedDefaults}
                        disabled={isSaving}
                    >
                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                        Create Default Pages
                    </Button>
                )}
            </div>

            {pages.length === 0 ? (
                <Card className="bg-white border-zinc-200 shadow-sm">
                    <CardContent className="py-16 text-center">
                        <FileText className="h-10 w-10 text-zinc-300 mx-auto mb-4" />
                        <p className="text-zinc-500">No pages created yet.</p>
                        <p className="text-zinc-400 text-sm mt-1">Click "Create Default Pages" to get started with About, Help Center, Privacy Policy, and Terms of Service.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-3">
                    {pages.map((page) => (
                        <Card key={page._id} className="bg-white border-zinc-200 shadow-sm hover:border-zinc-300 transition-colors">
                            <CardContent className="flex items-center justify-between p-4">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${page.isPublished ? "bg-emerald-500" : "bg-zinc-300"}`} />
                                    <div className="min-w-0">
                                        <p className="font-semibold text-zinc-900 truncate">{page.title}</p>
                                        <p className="text-xs text-zinc-400">/{page.slug} · Updated {new Date(page.updatedAt).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-zinc-500 hover:text-zinc-900 gap-1.5"
                                        onClick={() => window.open(`/${page.slug}`, "_blank")}
                                    >
                                        <ExternalLink className="h-3.5 w-3.5" />
                                        <span className="hidden sm:inline">View</span>
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-zinc-500 hover:text-zinc-900"
                                        onClick={() => openEditor(page.slug, page.title, page.content, page.isPublished)}
                                    >
                                        Edit
                                    </Button>
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-600">
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-sm p-6">
                                            <DialogHeader>
                                                <DialogTitle>Delete "{page.title}"?</DialogTitle>
                                                <DialogDescription>This will permanently remove this page.</DialogDescription>
                                            </DialogHeader>
                                            <div className="flex flex-col gap-2 mt-4">
                                                <Button
                                                    variant="destructive"
                                                    className="w-full"
                                                    onClick={async () => {
                                                        try {
                                                            await removePage({ id: page._id, token: token || undefined });
                                                            toast({ title: "Page deleted" });
                                                        } catch {
                                                            toast({ title: "Failed to delete", variant: "destructive" });
                                                        }
                                                    }}
                                                >
                                                    Delete Permanently
                                                </Button>
                                                <DialogClose asChild>
                                                    <Button variant="ghost" className="w-full">Cancel</Button>
                                                </DialogClose>
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
