import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ExternalLink, Calendar, Eye, Download, Repeat, Clock, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";

export default function MyMoments() {
    const { user, isLoading: authLoading } = useAuth();
    const navigate = useNavigate();

    // Explicitly cast user._id since the types might be tricky if not updated
    const celebrations = useQuery(api.celebrations.listByUser,
        user && "_id" in user ? { userId: user._id as any } : "skip"
    );

    if (authLoading || celebrations === undefined) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-950">
                <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-950 text-white p-6 md:p-12">
            <div className="max-w-6xl mx-auto">
                <header className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-4xl font-bold tracking-tight mb-2">My Moments</h1>
                        <p className="text-zinc-500 text-lg">Manage your creations and see how they're doing.</p>
                    </div>
                    <Button
                        asChild
                        className="bg-indigo-600 hover:bg-indigo-700 text-white h-12 px-6 rounded-xl font-bold shadow-lg shadow-indigo-600/20"
                    >
                        <Link to="/">Create New Moment</Link>
                    </Button>
                </header>

                {!celebrations || celebrations.length === 0 ? (
                    <div className="text-center py-24 bg-zinc-900/30 rounded-3xl border border-white/5 border-dashed">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-zinc-900 border border-white/5 mb-6">
                            <Repeat className="w-8 h-8 text-zinc-600" />
                        </div>
                        <h2 className="text-xl font-medium text-zinc-300">No moments yet</h2>
                        <p className="text-zinc-500 mt-2 mb-8">Your creations will appear here after they're published.</p>
                        <Button asChild variant="outline" className="border-white/10 text-zinc-400 hover:text-white hover:bg-white/5">
                            <Link to="/">Explore Templates</Link>
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {celebrations.map((c: any) => (
                            <MomentCard key={c._id} celebration={c} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function MomentCard({ celebration }: { celebration: any }) {
    const navigate = useNavigate();
    const expiresAt = celebration.expiresAt;
    const daysLeft = expiresAt ? Math.ceil((expiresAt - Date.now()) / (1000 * 60 * 60 * 24)) : null;
    const isExpiringSoon = daysLeft !== null && daysLeft <= 7;

    const handleReorder = () => {
        // Find the event to check status (this info should ideally be in the celebration object or fetched)
        // For now, we assume if we have the celebration, we can try to reorder
        navigate(`/${celebration.eventSlug}/create`, {
            state: { prefillPages: celebration.pages }
        });
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ y: -4 }}
            className="group"
        >
            <Card className="bg-zinc-900/40 border-white/5 hover:border-white/10 backdrop-blur-xl rounded-3xl overflow-hidden transition-all duration-300 h-full flex flex-col">
                <CardContent className="p-0 flex-1 flex flex-col">
                    {/* Thumbnail Placeholder */}
                    <div className="aspect-video bg-zinc-950 relative overflow-hidden flex items-center justify-center">
                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/80 to-transparent z-10" />
                        <span className="text-zinc-800 font-bold text-4xl select-none group-hover:scale-110 transition-transform duration-500 uppercase tracking-widest">
                            {celebration.slug.slice(0, 2)}
                        </span>

                        {/* Status Badges */}
                        <div className="absolute top-4 left-4 z-20 flex flex-wrap gap-2">
                            {celebration.paymentStatus === "paid" ? (
                                <span className="px-2 py-1 bg-green-500/20 text-green-400 text-[10px] font-bold uppercase tracking-wider rounded-lg border border-green-500/20 backdrop-blur-md">
                                    Active
                                </span>
                            ) : (
                                <span className="px-2 py-1 bg-amber-500/20 text-amber-400 text-[10px] font-bold uppercase tracking-wider rounded-lg border border-amber-500/20 backdrop-blur-md">
                                    {celebration.paymentStatus}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="p-5 flex-1 flex flex-col">
                        <div className="flex items-start justify-between mb-2">
                            <h3 className="font-bold text-lg text-white truncate pr-2">/{celebration.slug}</h3>
                            <div className="flex items-center text-zinc-500 text-xs">
                                <Eye className="w-3 h-3 mr-1" />
                                {celebration.views || 0}
                            </div>
                        </div>

                        <div className="flex items-center text-zinc-500 text-xs mb-6 gap-3">
                            <span className="flex items-center">
                                <Calendar className="w-3 h-3 mr-1" />
                                {new Date(celebration.createdAt).toLocaleDateString()}
                            </span>
                            {daysLeft !== null && (
                                <span className={`flex items-center ${isExpiringSoon ? "text-red-400 font-medium" : ""}`}>
                                    <Clock className="w-3 h-3 mr-1" />
                                    {daysLeft}d left
                                </span>
                            )}
                        </div>

                        <div className="mt-auto space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    className="bg-white/5 hover:bg-white/10 text-zinc-300 border-none rounded-xl h-10"
                                    onClick={() => window.open(`/${celebration.slug}`, '_blank')}
                                >
                                    <ExternalLink className="w-3.5 h-3.5 mr-2" /> View
                                </Button>
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    className="bg-white/5 hover:bg-white/10 text-zinc-300 border-none rounded-xl h-10"
                                    onClick={handleReorder}
                                >
                                    <Repeat className="w-3.5 h-3.5 mr-2" /> Reorder
                                </Button>
                            </div>
                            <Button
                                variant="ghost"
                                className="w-full text-xs text-zinc-500 hover:text-white hover:bg-white/5 rounded-xl h-9"
                            >
                                <Download className="w-3.5 h-3.5 mr-2" /> Download HD
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}
