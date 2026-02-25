import * as React from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Home, User, Shield, Plus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { ProfileDrawer } from "./ProfileDrawer";
import { cn } from "@/lib/utils";

export function BottomNavigation() {
    const location = useLocation();
    const { isLoggedIn, isAdmin, user } = useAuth();
    const activeEvent = useQuery(api.events.getActive);
    const [drawerOpen, setDrawerOpen] = React.useState(false);

    // Only show dock on primary application pages
    const isRootPage = ["/", "/my-moments", "/login"].includes(location.pathname);
    if (!isRootPage) return null;

    const theme = activeEvent?.theme;
    const primaryColor = theme?.primary || "hsl(var(--primary))";

    // Auth state icon logic
    const AccountIcon = isAdmin ? Shield : User;
    const isAccountActive = drawerOpen;
    const isHomeActive = location.pathname === "/";

    return (
        <>
            <div className="md:hidden fixed bottom-0 left-0 right-0 z-[60] pb-[env(safe-area-inset-bottom)] pointer-events-none">
                <div className="relative h-20 w-full flex items-end justify-center pointer-events-auto">
                    {/* Custom Notched Background SVG */}
                    <div className="absolute inset-0 z-0">
                        <svg
                            viewBox="0 0 400 100"
                            className="w-full h-full drop-shadow-[0_-5px_15px_rgba(0,0,0,0.08)]"
                            preserveAspectRatio="none"
                            style={{ filter: "drop-shadow(0 -1px 2px rgba(0,0,0,0.05))" }}
                        >
                            <path
                                d="M0,40 Q0,40 20,40 L140,40 C160,40 165,100 200,100 C235,100 240,40 260,40 L380,40 Q400,40 400,40 V100 H0 Z"
                                fill="white"
                                className="transition-colors duration-500"
                            />
                        </svg>
                    </div>

                    {/* Navigation Links (Wings) */}
                    <div className="relative z-10 w-full flex justify-between px-8 pb-3">
                        {/* Home Link */}
                        <Link
                            to="/"
                            className={cn(
                                "flex flex-col items-center gap-1 transition-all duration-300",
                                isHomeActive ? "opacity-100 scale-110" : "opacity-50"
                            )}
                            style={{ color: isHomeActive ? primaryColor : "zinc-500" }}
                        >
                            <Home className="h-6 w-6" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Home</span>
                        </Link>

                        {/* Empty space for the center FAB */}
                        <div className="w-16" />

                        {/* Account Link */}
                        <button
                            onClick={() => setDrawerOpen(true)}
                            className={cn(
                                "flex flex-col items-center gap-1 transition-all duration-300",
                                isAccountActive ? "opacity-100 scale-110" : "opacity-50"
                            )}
                            style={{
                                color: (isLoggedIn && !isAdmin) ? (isAccountActive ? primaryColor : primaryColor) : (isAccountActive ? primaryColor : "zinc-500")
                            }}
                        >
                            <AccountIcon className={cn("h-6 w-6", isLoggedIn && !isAdmin && "stroke-[2.5px]")} />
                            <span className="text-[10px] font-bold uppercase tracking-wider">
                                {isLoggedIn ? (isAdmin ? "Admin" : (user?.name?.split(' ')[0] || "Account")) : "Login"}
                            </span>
                        </button>
                    </div>

                    {/* Elevated FAB (Center Action) */}
                    <div className="absolute left-1/2 -translate-x-1/2 top-0 -translate-y-2 z-20">
                        <Link to={activeEvent ? `/${activeEvent.slug}/create` : "/"}>
                            <motion.div
                                whileTap={{ scale: 0.9 }}
                                className="flex flex-col items-center gap-2"
                            >
                                <div
                                    className="w-16 h-16 rounded-full shadow-xl flex items-center justify-center text-white"
                                    style={{ backgroundColor: primaryColor }}
                                >
                                    <Plus className="h-8 w-8" />
                                </div>
                                <span className="text-[11px] font-black uppercase tracking-[0.1em] text-zinc-800">
                                    Create
                                </span>
                            </motion.div>
                        </Link>
                    </div>
                </div>
            </div>

            <ProfileDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />
        </>
    );
}
