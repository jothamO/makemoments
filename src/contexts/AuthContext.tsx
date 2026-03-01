import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

interface AuthContextType {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    user: any;
    isLoggedIn: boolean;
    isAdmin: boolean;
    isLoading: boolean;
    token: string | null;
    login: (newToken: string) => void;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [token, setToken] = useState<string | null>(() => localStorage.getItem("mm_auth_token"));

    const viewer = useQuery(api.auth.getViewer, { token: token || undefined });
    const logoutMutation = useMutation(api.auth.logout);

    const login = useCallback((newToken: string) => {
        localStorage.setItem("mm_auth_token", newToken);
        setToken(newToken);
    }, []);

    const logout = useCallback(async () => {
        if (token) {
            try {
                await logoutMutation({ token });
            } catch (e) {
                console.error("Logout failed", e);
            }
        }
        localStorage.removeItem("mm_auth_token");
        setToken(null);
    }, [token, logoutMutation]);

    const value = {
        user: viewer,
        isLoggedIn: !!viewer,
        isAdmin: viewer?.role === "admin",
        isLoading: viewer === undefined,
        token,
        login,
        logout
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuthContext() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuthContext must be used within an AuthProvider");
    }
    return context;
}
