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
            {/* iOS Floating Dock for Mobile */}
            <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] pointer-events-auto">
                <div className="relative flex items-center gap-6 px-8 py-4 rounded-full backdrop-blur-3xl bg-white/80 border border-black/5 shadow-2xl">

                    {/* Home Link */}
                    <Link
                        to="/"
                        className={cn(
                            "flex flex-col items-center gap-1 transition-all duration-300",
                            isHomeActive ? "opacity-100 scale-110" : "opacity-60 hover:opacity-100"
                        )}
                        style={{ color: isHomeActive ? primaryColor : "var(--zinc-500)" }}
                    >
                        <Home className="h-6 w-6" strokeWidth={isHomeActive ? 2.5 : 2} />
                    </Link>

                    {/* Elevated FAB (Center Action) */}
                    <Link to={activeEvent ? `/${activeEvent.slug}/create` : "/"}>
                        <motion.div
                            whileTap={{ scale: 0.9 }}
                            className="relative -mt-8 flex flex-col items-center"
                        >
                            <div
                                className="w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white border-4 border-white transform transition-transform duration-300 hover:scale-105"
                                style={{ backgroundColor: primaryColor }}
                            >
                                <Plus className="h-6 w-6" strokeWidth={3} />
                            </div>
                        </motion.div>
                    </Link>

                    {/* Account/Drawer Link */}
                    <button
                        onClick={() => setDrawerOpen((prev) => !prev)}
                        className={cn(
                            "flex flex-col items-center gap-1 transition-all duration-300",
                            isAccountActive ? "opacity-100 scale-110" : "opacity-60 hover:opacity-100"
                        )}
                        style={{
                            color: isAccountActive ? primaryColor : "var(--zinc-500)"
                        }}
                    >
                        <AccountIcon className="h-6 w-6" strokeWidth={isAccountActive ? 2.5 : 2} />
                    </button>
                </div>
            </div>

            <ProfileDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />
        </>
    );
}
