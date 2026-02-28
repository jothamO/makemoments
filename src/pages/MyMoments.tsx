import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { GlobalLoader } from "@/components/ui/GlobalLoader";
import { ExternalLink, Calendar, Eye, Download, Repeat, Clock, Trash2, Copy, Check, LayoutGrid, List, MoreVertical } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { formatPlatformDate, getBrandRadialGradient } from "@/lib/utils";
import { useMutation } from "convex/react";
import React, { useState, useEffect } from "react";
import { PublicHeader } from "@/components/public/Header";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function MyMoments() {
    const { user, isLoading: authLoading } = useAuth();
    const navigate = useNavigate();

    // Load persisted view mode or default to grid
    const [viewMode, setViewMode] = useState<"grid" | "list">(() => {
        const saved = localStorage.getItem("momentsViewMode");
        return (saved === "grid" || saved === "list") ? saved : "grid";
    });

    // Save view mode on change
    useEffect(() => {
        localStorage.setItem("momentsViewMode", viewMode);
    }, [viewMode]);

    const celebrations = useQuery(api.celebrations.listByUser,
        user && "_id" in user ? { userId: user._id as any } : "skip"
    );

    if (authLoading || celebrations === undefined) {
        return <GlobalLoader />;
    }

    return (
        <div className="min-h-screen bg-white text-zinc-900 relative overflow-hidden">
            <PublicHeader />

            <div className="p-6 md:p-12 mt-16 md:mt-24 relative overflow-hidden">
                {/* Soft Apple-style radial glow */}
                <div
                    className="absolute inset-0 pointer-events-none opacity-30"
                    style={{ background: "radial-gradient(circle at 50% 0%, rgba(0, 0, 0, 0.05), transparent 70%)" }}
                />

                <div className="max-w-6xl mx-auto relative z-10">
                    <header className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <h1 className="text-4xl font-bold tracking-tight mb-2 text-black">My Moments</h1>
                            <p className="text-zinc-500 text-lg font-medium">Manage your creations and see how they're doing.</p>
                        </div>

                        {/* Single Button View Switcher */}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
                            className="bg-zinc-100 border-black/[0.03] hover:bg-zinc-200/50 rounded-2xl h-11 px-5 flex items-center gap-2 group transition-all active:scale-95"
                        >
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={viewMode}
                                    initial={{ opacity: 0, y: 4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -4 }}
                                    transition={{ duration: 0.15, ease: "easeOut" }}
                                    className="flex items-center gap-2"
                                >
                                    {viewMode === "grid" ? (
                                        <>
                                            <List className="w-4 h-4 text-zinc-500 group-hover:text-black transition-colors" />
                                            <span className="text-sm font-bold text-zinc-600 group-hover:text-black">Switch to List</span>
                                        </>
                                    ) : (
                                        <>
                                            <LayoutGrid className="w-4 h-4 text-zinc-500 group-hover:text-black transition-colors" />
                                            <span className="text-sm font-bold text-zinc-600 group-hover:text-black">Switch to Grid</span>
                                        </>
                                    )}
                                </motion.div>
                            </AnimatePresence>
                        </Button>
                    </header>

                    {!celebrations || celebrations.length === 0 ? (
                        <div className="text-center py-24 bg-zinc-50 rounded-[40px] border border-black/5 border-dashed">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white border border-black/5 mb-6 shadow-sm">
                                <Repeat className="w-8 h-8 text-zinc-300" />
                            </div>
                            <h2 className="text-xl font-semibold text-zinc-800">No moments yet</h2>
                            <p className="text-zinc-500 mt-2 mb-8 mx-auto max-w-sm">Your creations will appear here after they're published to the world.</p>
                            <Button asChild variant="outline" className="rounded-2xl px-8 h-12 border-black/10 hover:bg-black/5 transition-colors font-bold">
                                <Link to="/">Explore Templates</Link>
                            </Button>
                        </div>
                    ) : (
                        <motion.div
                            layout
                            className={viewMode === "grid"
                                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10"
                                : "flex flex-col gap-4"
                            }
                        >
                            <AnimatePresence mode="popLayout">
                                {celebrations.map((c: any) => (
                                    viewMode === "grid" ? (
                                        <MomentCard key={c._id} celebration={c} />
                                    ) : (
                                        <MomentListItem key={c._id} celebration={c} />
                                    )
                                ))}
                            </AnimatePresence>
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
}

const MomentCard = React.forwardRef<HTMLDivElement, { celebration: any }>(({ celebration }, ref) => {
    const navigate = useNavigate();
    const removeCelebration = useMutation(api.celebrations.remove);
    const [copied, setCopied] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const expiresAt = celebration.expiresAt;
    const daysLeft = expiresAt ? Math.ceil((expiresAt - Date.now()) / (1000 * 60 * 60 * 24)) : null;
    const isExpiringSoon = daysLeft !== null && daysLeft <= 7;

    const handleReorder = () => {
        navigate(`/${celebration.eventSlug}/create`, {
            state: { prefillPages: celebration.pages }
        });
    };

    const handleCopy = (e: React.MouseEvent) => {
        e.stopPropagation();
        const url = `${window.location.origin}/${celebration.slug}`;
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDelete = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.confirm("Are you sure you want to delete this moment? This cannot be undone.")) {
            setIsDeleting(true);
            try {
                await removeCelebration({ id: celebration._id });
            } catch (err) {
                console.error("Failed to delete:", err);
                setIsDeleting(false);
            }
        }
    };

    const firstPage = celebration.pages?.[0];
    const backdropUrl = firstPage?.bgImage;
    const baseColor = firstPage?.baseColor || celebration.eventTheme?.baseColor || "#F4F4F5";
    const glowColor = firstPage?.glowColor || celebration.eventTheme?.glowColor || baseColor;
    const isDark = firstPage?.type === "dark";

    return (
        <motion.div
            ref={ref}
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            whileHover={{ y: -8 }}
            className={`group cursor-pointer ${isDeleting ? "pointer-events-none opacity-50" : ""}`}
            onClick={() => window.open(`/${celebration.slug}`, '_blank')}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
            <div className="relative aspect-square rounded-[40px] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] group-hover:shadow-[0_40px_80px_rgb(0,0,0,0.12)] transition-all duration-700 border border-black/[0.03]">
                {/* Backdrop Image */}
                {backdropUrl ? (
                    <img
                        src={backdropUrl}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                    />
                ) : (
                    <div
                        className="absolute inset-0"
                        style={{ backgroundColor: baseColor }}
                    />
                )}

                {/* Soft Brand Glow */}
                <div
                    className="absolute inset-0 opacity-40 group-hover:opacity-60 transition-opacity duration-700 pointer-events-none"
                    style={{ background: getBrandRadialGradient(baseColor, glowColor, isDark) }}
                />

                {/* Vignette Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-80" />

                {/* Status Badge */}
                <div className="absolute top-6 left-6 z-30">
                    <span className="px-4 py-1.5 bg-white/10 text-white text-[10px] font-bold uppercase tracking-widest rounded-full backdrop-blur-xl border border-white/20">
                        {celebration.paymentStatus === "paid" ? "Active" : celebration.paymentStatus}
                    </span>
                </div>

                {/* Views Badge */}
                <div className="absolute top-6 right-6 z-30">
                    <span className="flex items-center px-3 py-1.5 bg-white/10 text-white text-[10px] font-bold rounded-full backdrop-blur-xl border border-white/20">
                        <Eye className="w-3 h-3 mr-1.5 text-white" />
                        {celebration.views || 0}
                    </span>
                </div>

                {/* Center Content */}
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-8 text-center -translate-y-10 transition-transform duration-500">
                    <p className="text-white/60 text-[10px] font-bold uppercase tracking-[0.2em] mb-3 drop-shadow-md">
                        {celebration.eventName}
                    </p>
                    <div
                        className="flex items-center group/slug cursor-pointer active:scale-95 transition-transform"
                        onClick={handleCopy}
                    >
                        <h3 className="font-bold text-3xl text-white drop-shadow-xl leading-tight">
                            /{celebration.slug}
                        </h3>
                        <div className="ml-2 p-1.5 rounded-full bg-white/10 opacity-0 group-hover/slug:opacity-100 transition-opacity backdrop-blur-md border border-white/20">
                            {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5 text-white/70" />}
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="absolute bottom-0 left-0 right-0 z-30 p-6 flex flex-col gap-3 transition-all duration-500">
                    <div className="grid grid-cols-2 gap-3 text-white">
                        <Button
                            size="sm"
                            className="w-full rounded-2xl h-11 font-bold shadow-lg border-0"
                            style={{ backgroundColor: glowColor, color: "white" }}
                            onClick={(e) => { e.stopPropagation(); window.open(`/${celebration.slug}`, '_blank'); }}
                        >
                            <ExternalLink className="w-4 h-4 mr-2" /> View
                        </Button>
                        <Button
                            size="sm"
                            className="w-full rounded-2xl h-11 font-bold shadow-lg border-0"
                            style={{ backgroundColor: glowColor, color: "white" }}
                            onClick={(e) => { e.stopPropagation(); handleReorder(); }}
                        >
                            <Repeat className="w-4 h-4 mr-2" /> Reorder
                        </Button>
                        <Button
                            size="sm"
                            className="w-full rounded-2xl h-11 font-bold shadow-lg border-0"
                            style={{ backgroundColor: glowColor, color: "white" }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <Download className="w-4 h-4 mr-2" /> Save
                        </Button>
                        <Button
                            size="sm"
                            className="w-full bg-[#FF3B30] hover:bg-[#D70015] text-white rounded-2xl h-11 font-bold shadow-lg border-0"
                            onClick={handleDelete}
                        >
                            <Trash2 className="w-4 h-4 mr-2" /> Delete
                        </Button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
});

const MomentListItem = React.forwardRef<HTMLDivElement, { celebration: any }>(({ celebration }, ref) => {
    const navigate = useNavigate();
    const removeCelebration = useMutation(api.celebrations.remove);
    const [copied, setCopied] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleCopy = (e: React.MouseEvent) => {
        e.stopPropagation();
        const url = `${window.location.origin}/${celebration.slug}`;
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDelete = async () => {
        if (window.confirm("Are you sure you want to delete this moment?")) {
            setIsDeleting(true);
            try {
                await removeCelebration({ id: celebration._id });
            } catch (err) {
                console.error("Failed to delete:", err);
                setIsDeleting(false);
            }
        }
    };

    const handleReorder = () => {
        navigate(`/${celebration.eventSlug}/create`, {
            state: { prefillPages: celebration.pages }
        });
    };

    const firstPage = celebration.pages?.[0];
    const backdropUrl = firstPage?.bgImage;
    const baseColor = firstPage?.baseColor || celebration.eventTheme?.baseColor || "#F4F4F5";

    return (
        <motion.div
            ref={ref}
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className={`group relative flex items-center gap-4 p-4 bg-white hover:bg-zinc-50 rounded-[24px] border border-black/[0.03] transition-colors ${isDeleting ? "opacity-50 pointer-events-none" : ""}`}
            onClick={() => window.open(`/${celebration.slug}`, '_blank')}
        >
            {/* Small Thumbnail */}
            <div className="w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0 relative border border-black/[0.05]">
                {backdropUrl ? (
                    <img src={backdropUrl} className="w-full h-full object-cover" alt="" />
                ) : (
                    <div className="w-full h-full" style={{ backgroundColor: baseColor }} />
                )}
                <div className="absolute inset-0 bg-black/5" />
            </div>

            {/* Info */}
            <div className="flex-grow min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="font-bold text-zinc-900 truncate">/{celebration.slug}</h3>
                    {celebration.paymentStatus === "paid" && (
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500" title="Active" />
                    )}
                </div>
                <div className="flex items-center gap-3 text-xs font-medium text-zinc-400">
                    <span className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        {formatPlatformDate(celebration.createdAt)}
                    </span>
                    <span className="flex items-center">
                        <Eye className="w-3 h-3 mr-1" />
                        {celebration.views || 0}
                    </span>
                </div>
            </div>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-1">
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-zinc-200/50" onClick={(e) => { e.stopPropagation(); handleReorder(); }}>
                    <Repeat className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className={`rounded-full hover:bg-zinc-200/50 ${copied ? "text-green-500" : ""}`} onClick={handleCopy}>
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-red-50 text-red-500" onClick={(e) => { e.stopPropagation(); handleDelete(); }}>
                    <Trash2 className="w-4 h-4" />
                </Button>
            </div>

            {/* Mobile / Compact Menu */}
            <div className="md:hidden">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <MoreVertical className="w-5 h-5 text-zinc-400" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40 rounded-2xl p-2 shadow-xl border-black/5">
                        <DropdownMenuItem className="rounded-xl gap-2 font-bold" onClick={() => window.open(`/${celebration.slug}`, '_blank')}>
                            <ExternalLink className="w-4 h-4" /> View
                        </DropdownMenuItem>
                        <DropdownMenuItem className="rounded-xl gap-2 font-bold" onClick={handleReorder}>
                            <Repeat className="w-4 h-4" /> Reorder
                        </DropdownMenuItem>
                        <DropdownMenuItem className="rounded-xl gap-2 font-bold" onClick={handleCopy}>
                            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />} {copied ? "Copied" : "Copy Link"}
                        </DropdownMenuItem>
                        <DropdownMenuItem className="rounded-xl gap-2 font-bold text-red-500 focus:text-red-600 focus:bg-red-50" onClick={handleDelete}>
                            <Trash2 className="w-4 h-4" /> Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </motion.div>
    );
});
