import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { GlobalLoader } from "@/components/ui/GlobalLoader";

interface ProtectedRouteProps {
    children: ReactNode;
    requireAdmin?: boolean;
}

export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
    const { isLoggedIn, isAdmin, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return <GlobalLoader />;
    }

    if (!isLoggedIn) {
        // Redirect to login but save the attempted location
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (requireAdmin && !isAdmin) {
        // Not an admin, send to homepage or a forbidden page
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
}
